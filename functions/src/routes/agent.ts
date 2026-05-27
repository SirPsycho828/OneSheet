import { Router, Response } from "express";
import * as admin from "firebase-admin";
import * as crypto from "crypto";
import { logger } from "firebase-functions";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { checkRateLimit } from "../middleware/rateLimit";
import { renderMarkdown } from "../lib/markdown";
import { buildHtmlDocument, generatePdf } from "../lib/pdf";
import { deriveStyles } from "../lib/styleUtils";
import { postProcessHtml } from "../lib/postProcess";
import { getAdminTierStatus } from "../lib/adminUtils";

const router = Router();

// ---------------------------------------------------------------------------
// Template list (hardcoded)
// ---------------------------------------------------------------------------
const TEMPLATES = [
  { id: "classic", name: "Classic" },
  { id: "modern", name: "Modern" },
  { id: "minimal", name: "Minimal" },
  { id: "technical", name: "Technical" },
  { id: "compact", name: "Compact" },
];

// ---------------------------------------------------------------------------
// Subscription limits
// ---------------------------------------------------------------------------
const VARIANT_LIMITS: Record<string, number> = {
  free: 1,
  active: 3,
};

// ---------------------------------------------------------------------------
// Rate limit middleware (applied to all /api/agent/* routes that use apikey)
// ---------------------------------------------------------------------------
async function applyRateLimit(
  req: AuthenticatedRequest,
  res: Response,
  next: () => void
): Promise<void> {
  // Only rate-limit API key requests
  if (req.authMethod !== "apikey") {
    next();
    return;
  }

  const apiKey = req.headers["x-api-key"] as string;
  if (!apiKey) {
    next();
    return;
  }

  const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
  const result = await checkRateLimit(keyHash);

  if (!result.allowed) {
    res.setHeader("Retry-After", String(result.retryAfterSeconds ?? 60));
    res.status(429).json({
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests. Please slow down.",
        retryAfterSeconds: result.retryAfterSeconds ?? 60,
      },
    });
    return;
  }

  next();
}

/**
 * Stricter per-user rate limit for sensitive operations (key generation).
 * Applies regardless of auth method (bearer or apikey).
 */
async function applySensitiveRateLimit(
  req: AuthenticatedRequest,
  res: Response,
  next: () => void
): Promise<void> {
  if (!req.userId) {
    next();
    return;
  }

  const result = await checkRateLimit(`user:${req.userId}:sensitive`);
  if (!result.allowed) {
    res.setHeader("Retry-After", String(result.retryAfterSeconds ?? 60));
    res.status(429).json({
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests. Please slow down.",
        retryAfterSeconds: result.retryAfterSeconds ?? 60,
      },
    });
    return;
  }

  next();
}

// ---------------------------------------------------------------------------
// Helper: require paid subscription (used inside route handlers)
// ---------------------------------------------------------------------------
async function requirePaidUser(
  userId: string,
  res: Response
): Promise<FirebaseFirestore.DocumentData | null> {
  const db = admin.firestore();
  const [userDoc, adminTier] = await Promise.all([
    db.collection("users").doc(userId).get(),
    getAdminTierStatus(userId),
  ]);

  if (!userDoc.exists) {
    res.status(403).json({
      error: { code: "USER_NOT_FOUND", message: "User not found" },
    });
    return null;
  }

  const userData = userDoc.data()!; // safe: exists check above
  const subscriptionStatus: string = userData?.subscription?.status ?? "free";
  const isPro = adminTier.isAdmin ? adminTier.isPro : subscriptionStatus === "active";

  if (!isPro) {
    res.status(403).json({
      error: {
        code: "SUBSCRIPTION_REQUIRED",
        message: "This endpoint requires an active Pro subscription",
      },
    });
    return null;
  }

  return userData;
}

// ---------------------------------------------------------------------------
// API Key Management
// ---------------------------------------------------------------------------

/**
 * POST /api/agent/keys/generate
 *
 * Creates a new API key for the authenticated user.
 * Body: { name: string }
 * Returns: { keyId, key (plaintext, shown once), prefix, name, createdAt }
 */
router.post(
  "/keys/generate",
  requireAuth,
  applyRateLimit,
  applySensitiveRateLimit,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const db = admin.firestore();

    const { name } = req.body as { name?: string };
    if (!name || typeof name !== "string" || name.trim() === "") {
      res.status(400).json({
        error: { code: "MISSING_NAME", message: "name is required" },
      });
      return;
    }

    try {
      // Check paid subscription
      const userData = await requirePaidUser(userId, res);
      if (!userData) return;

      // Enforce max 3 keys per user
      const existingSnap = await db
        .collection("apiKeys")
        .where("userId", "==", userId)
        .where("isActive", "==", true)
        .get();

      if (existingSnap.size >= 3) {
        res.status(403).json({
          error: {
            code: "KEY_LIMIT_REACHED",
            message: "You can have at most 3 active API keys",
          },
        });
        return;
      }

      // Generate key: os_sk_live_{32 hex chars}
      const randomHex = crypto.randomBytes(16).toString("hex"); // 32 hex chars
      const plainKey = `os_sk_live_${randomHex}`;
      const salt = crypto.randomBytes(16).toString("hex");
      const keyHash = crypto.createHash("sha256").update(plainKey + salt).digest("hex");
      const keyPrefix = plainKey.substring(0, 12); // "os_sk_live_x"

      const now = admin.firestore.FieldValue.serverTimestamp();
      const keyRef = db.collection("apiKeys").doc();

      await keyRef.set({
        keyHash,
        salt,
        keyPrefix,
        userId,
        name: name.trim(),
        createdAt: now,
        lastUsedAt: null,
        isActive: true,
      });

      res.status(201).json({
        keyId: keyRef.id,
        key: plainKey,
        prefix: keyPrefix,
        name: name.trim(),
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      logger.error("agent/keys/generate: error", err);
      res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "Failed to generate API key" },
      });
    }
  }
);

/**
 * GET /api/agent/keys
 *
 * List all API keys for the authenticated user (no secrets, just metadata).
 */
router.get(
  "/keys",
  requireAuth,
  applyRateLimit,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const db = admin.firestore();

    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const snap = await db
        .collection("apiKeys")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

      const keys = snap.docs.map((doc) => {
        const data = doc.data();
        return {
          keyId: doc.id,
          name: data.name,
          prefix: data.keyPrefix,
          createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? null,
          lastUsedAt: data.lastUsedAt?.toDate?.()?.toISOString?.() ?? null,
          isActive: data.isActive,
        };
      });

      res.json({ keys });
    } catch (err) {
      logger.error("agent/keys: error", err);
      res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "Failed to list API keys" },
      });
    }
  }
);

/**
 * DELETE /api/agent/keys/:keyId
 *
 * Permanently deletes an API key.
 */
router.delete(
  "/keys/:keyId",
  requireAuth,
  applyRateLimit,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const keyId = String(req.params.keyId);
    const db = admin.firestore();

    try {
      const keyDoc = await db.collection("apiKeys").doc(keyId).get();
      if (!keyDoc.exists) {
        res.status(404).json({
          error: { code: "KEY_NOT_FOUND", message: "API key not found" },
        });
        return;
      }

      if (keyDoc.data()!.userId !== userId) {
        res.status(403).json({
          error: { code: "FORBIDDEN", message: "You do not own this API key" },
        });
        return;
      }

      await keyDoc.ref.delete();
      res.json({ success: true });
    } catch (err) {
      logger.error("agent/keys/delete: error", err);
      res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "Failed to delete API key" },
      });
    }
  }
);

/**
 * POST /api/agent/keys/:keyId/revoke
 *
 * Sets isActive to false (soft delete / revoke).
 */
router.post(
  "/keys/:keyId/revoke",
  requireAuth,
  applyRateLimit,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const keyId = String(req.params.keyId);
    const db = admin.firestore();

    try {
      const keyDoc = await db.collection("apiKeys").doc(keyId).get();
      if (!keyDoc.exists) {
        res.status(404).json({
          error: { code: "KEY_NOT_FOUND", message: "API key not found" },
        });
        return;
      }

      if (keyDoc.data()!.userId !== userId) {
        res.status(403).json({
          error: { code: "FORBIDDEN", message: "You do not own this API key" },
        });
        return;
      }

      await keyDoc.ref.update({ isActive: false });
      res.json({ success: true });
    } catch (err) {
      logger.error("agent/keys/revoke: error", err);
      res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "Failed to revoke API key" },
      });
    }
  }
);

// ---------------------------------------------------------------------------
// Resume Endpoints
// ---------------------------------------------------------------------------

/**
 * GET /api/agent/resumes
 *
 * List all resumes for the authenticated user (without markdown content).
 */
router.get(
  "/resumes",
  requireAuth,
  applyRateLimit,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const db = admin.firestore();

    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const snap = await db
        .collection("resumes")
        .where("userId", "==", userId)
        .orderBy("updatedAt", "desc")
        .limit(limit)
        .get();

      const resumes = snap.docs.map((doc) => {
        const data = doc.data();
        return {
          resumeId: doc.id,
          title: data.title,
          templateId: data.templateId,
          paperSize: data.paperSize,
          isDefault: data.isDefault,
          createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? null,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() ?? null,
        };
      });

      res.json({ resumes });
    } catch (err) {
      logger.error("agent/resumes: error", err);
      res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "Failed to list resumes" },
      });
    }
  }
);

/**
 * GET /api/agent/resumes/:resumeId
 *
 * Get a single resume including markdown content.
 */
router.get(
  "/resumes/:resumeId",
  requireAuth,
  applyRateLimit,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const resumeId = String(req.params.resumeId);
    const db = admin.firestore();

    try {
      const resumeDoc = await db.collection("resumes").doc(resumeId).get();
      if (!resumeDoc.exists) {
        res.status(404).json({
          error: { code: "RESUME_NOT_FOUND", message: "Resume not found" },
        });
        return;
      }

      const data = resumeDoc.data()! // safe: exists check above;
      if (data.userId !== userId) {
        res.status(403).json({
          error: { code: "FORBIDDEN", message: "You do not own this resume" },
        });
        return;
      }

      res.json({
        resumeId: resumeDoc.id,
        title: data.title,
        markdown: data.markdown ?? "",
        templateId: data.templateId,
        paperSize: data.paperSize,
        isDefault: data.isDefault,
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() ?? null,
      });
    } catch (err) {
      logger.error("agent/resumes/:resumeId: error", err);
      res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "Failed to fetch resume" },
      });
    }
  }
);

/**
 * POST /api/agent/resumes
 *
 * Create a new resume (same logic as /api/resumes/create).
 * Body: { title, templateId?, markdown?, paperSize? }
 */
router.post(
  "/resumes",
  requireAuth,
  applyRateLimit,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const db = admin.firestore();

    const { title, templateId, markdown, paperSize } = req.body as {
      title?: string;
      templateId?: string;
      markdown?: string;
      paperSize?: string;
    };

    if (!title || typeof title !== "string" || title.trim() === "") {
      res.status(400).json({
        error: { code: "MISSING_TITLE", message: "title is required" },
      });
      return;
    }

    try {
      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists) {
        res.status(403).json({
          error: { code: "USER_NOT_FOUND", message: "User not found" },
        });
        return;
      }

      const userData = userDoc.data()!; // safe: exists check above
      let subscriptionStatus: string = userData?.subscription?.status ?? "free";

      // Admin tier override for resume limits
      const adminTier = await getAdminTierStatus(userId);
      if (adminTier.isAdmin && adminTier.isPro) {
        subscriptionStatus = "active";
      }

      const limit = VARIANT_LIMITS[subscriptionStatus] ?? VARIANT_LIMITS["free"];

      const existingSnap = await db
        .collection("resumes")
        .where("userId", "==", userId)
        .get();

      if (existingSnap.size >= limit) {
        res.status(403).json({
          error: {
            code: "VARIANT_LIMIT_REACHED",
            message: `You have reached the maximum number of resume variants (${limit}) for your plan`,
          },
        });
        return;
      }

      const defaultPaperSize: string = userData?.defaultPaperSize ?? "us-letter";
      const resumeRef = db.collection("resumes").doc();
      const analyticsRef = db.collection("analytics").doc(resumeRef.id);
      const now = admin.firestore.FieldValue.serverTimestamp();

      const resumeData = {
        userId,
        title: title.trim(),
        markdown: markdown ?? "",
        templateId: templateId ?? "classic",
        isDefault: false,
        paperSize: paperSize ?? defaultPaperSize,
        overflow: { isOverflowing: false, scaleFactor: 1 },
        createdAt: now,
        updatedAt: now,
      };

      const analyticsData = {
        userId,
        profileViews: 0,
        pdfDownloads: 0,
        lastViewedAt: null,
      };

      const batch = db.batch();
      batch.set(resumeRef, resumeData);
      batch.set(analyticsRef, analyticsData);
      await batch.commit();

      res.status(201).json({ resumeId: resumeRef.id });
    } catch (err) {
      logger.error("agent/resumes/create: error", err);
      res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "Failed to create resume" },
      });
    }
  }
);

/**
 * PUT /api/agent/resumes/:resumeId
 *
 * Partial update: title, markdown, templateId.
 */
router.put(
  "/resumes/:resumeId",
  requireAuth,
  applyRateLimit,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const resumeId = String(req.params.resumeId);
    const db = admin.firestore();

    const { title, markdown, templateId } = req.body as {
      title?: string;
      markdown?: string;
      templateId?: string;
    };

    const updates: Record<string, unknown> = {};
    if (title !== undefined) {
      if (typeof title !== "string" || title.trim() === "") {
        res.status(400).json({
          error: { code: "INVALID_TITLE", message: "title must be a non-empty string" },
        });
        return;
      }
      updates.title = title.trim();
    }
    if (markdown !== undefined) {
      if (typeof markdown !== "string" || markdown.length > 1_048_576) {
        res.status(400).json({
          error: { code: "INVALID_MARKDOWN", message: "Markdown must be a string under 1MB" },
        });
        return;
      }
      updates.markdown = markdown;
    }
    if (templateId !== undefined) updates.templateId = templateId;

    if (Object.keys(updates).length === 0) {
      res.status(400).json({
        error: {
          code: "NO_FIELDS",
          message: "Provide at least one field to update: title, markdown, templateId",
        },
      });
      return;
    }

    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    try {
      const resumeDoc = await db.collection("resumes").doc(resumeId).get();
      if (!resumeDoc.exists) {
        res.status(404).json({
          error: { code: "RESUME_NOT_FOUND", message: "Resume not found" },
        });
        return;
      }

      if (resumeDoc.data()!.userId !== userId) {
        res.status(403).json({
          error: { code: "FORBIDDEN", message: "You do not own this resume" },
        });
        return;
      }

      await resumeDoc.ref.update(updates);
      res.json({ success: true });
    } catch (err) {
      logger.error("agent/resumes/update: error", err);
      res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "Failed to update resume" },
      });
    }
  }
);

/**
 * DELETE /api/agent/resumes/:resumeId
 *
 * Delete a resume (same rules as /api/resumes/:resumeId).
 */
router.delete(
  "/resumes/:resumeId",
  requireAuth,
  applyRateLimit,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const resumeId = String(req.params.resumeId);
    const db = admin.firestore();

    try {
      const resumeDoc = await db.collection("resumes").doc(resumeId).get();
      if (!resumeDoc.exists) {
        res.status(404).json({
          error: { code: "RESUME_NOT_FOUND", message: "Resume not found" },
        });
        return;
      }

      const resumeData = resumeDoc.data()! // safe: exists check above;
      if (resumeData.userId !== userId) {
        res.status(403).json({
          error: { code: "FORBIDDEN", message: "You do not own this resume" },
        });
        return;
      }

      const allResumesSnap = await db
        .collection("resumes")
        .where("userId", "==", userId)
        .get();

      if (allResumesSnap.size <= 1) {
        res.status(400).json({
          error: {
            code: "CANNOT_DELETE_LAST",
            message: "Cannot delete your only resume",
          },
        });
        return;
      }

      const isDefault = resumeData.isDefault === true;
      let newDefaultId: string | undefined;

      if (isDefault) {
        const remaining = allResumesSnap.docs
          .filter((doc) => doc.id !== resumeId)
          .sort((a, b) => {
            const aTs = a.data().updatedAt?.toMillis?.() ?? 0;
            const bTs = b.data().updatedAt?.toMillis?.() ?? 0;
            return bTs - aTs;
          });
        if (remaining.length > 0) {
          newDefaultId = remaining[0].id;
        }
      }

      const versionsSnap = await db
        .collection("resumes")
        .doc(resumeId)
        .collection("versions")
        .get();

      const batch = db.batch();
      versionsSnap.docs.forEach((doc) => batch.delete(doc.ref));
      batch.delete(db.collection("analytics").doc(resumeId));
      if (newDefaultId) {
        batch.update(db.collection("resumes").doc(newDefaultId), { isDefault: true });
      }
      batch.delete(resumeDoc.ref);
      await batch.commit();

      const response: { success: boolean; newDefaultId?: string } = { success: true };
      if (newDefaultId) response.newDefaultId = newDefaultId;
      res.json(response);
    } catch (err) {
      logger.error("agent/resumes/delete: error", err);
      res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "Failed to delete resume" },
      });
    }
  }
);

/**
 * POST /api/agent/resumes/:resumeId/set-default
 *
 * Set a resume as the user's default.
 */
router.post(
  "/resumes/:resumeId/set-default",
  requireAuth,
  applyRateLimit,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const resumeId = String(req.params.resumeId);
    const db = admin.firestore();

    try {
      const resumeDoc = await db.collection("resumes").doc(resumeId).get();
      if (!resumeDoc.exists) {
        res.status(404).json({
          error: { code: "RESUME_NOT_FOUND", message: "Resume not found" },
        });
        return;
      }

      const resumeData = resumeDoc.data()! // safe: exists check above;
      if (resumeData.userId !== userId) {
        res.status(403).json({
          error: { code: "FORBIDDEN", message: "You do not own this resume" },
        });
        return;
      }

      if (resumeData.isDefault === true) {
        res.json({ success: true });
        return;
      }

      const currentDefaultSnap = await db
        .collection("resumes")
        .where("userId", "==", userId)
        .where("isDefault", "==", true)
        .get();

      const batch = db.batch();
      currentDefaultSnap.docs.forEach((doc) => batch.update(doc.ref, { isDefault: false }));
      batch.update(resumeDoc.ref, { isDefault: true });
      await batch.commit();

      res.json({ success: true });
    } catch (err) {
      logger.error("agent/resumes/set-default: error", err);
      res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "Failed to set default resume" },
      });
    }
  }
);

/**
 * POST /api/agent/resumes/:resumeId/export
 *
 * Generate a PDF for the given resume (returns binary).
 * Requires paid subscription.
 */
router.post(
  "/resumes/:resumeId/export",
  requireAuth,
  applyRateLimit,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const resumeId = String(req.params.resumeId);
    const db = admin.firestore();

    try {
      // Check paid subscription
      const userData = await requirePaidUser(userId, res);
      if (!userData) return;

      const username: string = userData?.username ?? "resume";

      const resumeDoc = await db.collection("resumes").doc(resumeId).get();
      if (!resumeDoc.exists) {
        res.status(404).json({
          error: { code: "RESUME_NOT_FOUND", message: "Resume not found" },
        });
        return;
      }

      const resumeData = resumeDoc.data()! // safe: exists check above;
      if (resumeData.userId !== userId) {
        res.status(403).json({
          error: { code: "FORBIDDEN", message: "You do not own this resume" },
        });
        return;
      }

      const markdown: string = resumeData.markdown ?? "";
      const paperSize: "us-letter" | "a4" = resumeData.paperSize === "a4" ? "a4" : "us-letter";
      const scaleFactor: number = resumeData.overflow?.scaleFactor ?? 1;

      const styles = resumeData.styles
        ?? deriveStyles(resumeData.templateId ?? "classic", paperSize);

      let renderedHtml = await renderMarkdown(markdown);
      renderedHtml = postProcessHtml(renderedHtml, styles);

      const html = buildHtmlDocument({ renderedHtml, styles, scaleFactor });
      const pdfBuffer = await generatePdf(html, styles.pageSize);

      // Fire-and-forget analytics increment
      db.collection("analytics")
        .doc(resumeId)
        .update({ pdfDownloads: admin.firestore.FieldValue.increment(1) })
        .catch((err: unknown) => {
          logger.error("agent/export: failed to increment pdfDownloads", err);
        });

      const safeUsername = username.replace(/[^a-z0-9_-]/gi, "").toLowerCase() || "resume";
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${safeUsername}-resume.pdf"`);
      res.setHeader("Cache-Control", "no-store");
      res.send(pdfBuffer);
    } catch (err) {
      logger.error("agent/resumes/export: error", err);
      res.status(500).json({
        error: { code: "PDF_GENERATION_FAILED", message: "PDF generation failed. Please try again." },
      });
    }
  }
);

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

/**
 * GET /api/agent/analytics
 *
 * Return analytics for all of the user's resumes.
 */
router.get(
  "/analytics",
  requireAuth,
  applyRateLimit,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const db = admin.firestore();

    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const snap = await db
        .collection("analytics")
        .where("userId", "==", userId)
        .limit(limit)
        .get();

      const analytics = snap.docs.map((doc) => {
        const data = doc.data();
        return {
          resumeId: doc.id,
          profileViews: data.profileViews ?? 0,
          pdfDownloads: data.pdfDownloads ?? 0,
          lastViewedAt: data.lastViewedAt?.toDate?.()?.toISOString?.() ?? null,
        };
      });

      res.json({ analytics });
    } catch (err) {
      logger.error("agent/analytics: error", err);
      res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "Failed to fetch analytics" },
      });
    }
  }
);

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

/**
 * GET /api/agent/templates
 *
 * List all available template IDs and names.
 */
router.get(
  "/templates",
  requireAuth,
  applyRateLimit,
  async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    res.json({ templates: TEMPLATES });
  }
);

export default router;
