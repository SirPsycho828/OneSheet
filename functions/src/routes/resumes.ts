import { Router, Response } from "express";
import * as admin from "firebase-admin";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// Subscription limits
const VARIANT_LIMITS: Record<string, number> = {
  free: 1,
  active: 3,
};

/**
 * POST /api/resumes/create
 *
 * Creates a new resume variant for the authenticated user.
 *
 * Body: { title, templateId?, markdown?, paperSize? }
 * Returns: { resumeId: string }
 */
router.post(
  "/create",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const db = admin.firestore();

    const {
      title,
      templateId,
      markdown,
      paperSize,
    } = req.body as {
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
      // 1. Fetch user doc for subscription status and default paper size
      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists) {
        res.status(403).json({
          error: { code: "USER_NOT_FOUND", message: "User not found" },
        });
        return;
      }

      const userData = userDoc.data()!;
      const subscriptionStatus: string =
        userData?.subscription?.status ?? "free";

      const limit = VARIANT_LIMITS[subscriptionStatus] ?? VARIANT_LIMITS["free"];

      // 2. Count existing resumes
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

      // 3. Determine default paper size from user doc
      const defaultPaperSize: string =
        userData?.defaultPaperSize ?? "us-letter";

      // 4. Create resume doc
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
        overflow: {
          isOverflowing: false,
          scaleFactor: 1,
        },
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
      console.error("resumes/create: unexpected error", err);
      res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "Failed to create resume" },
      });
    }
  }
);

/**
 * POST /api/resumes/set-default
 *
 * Sets a resume as the user's default, clearing the previous default.
 *
 * Body: { resumeId }
 * Returns: { success: true }
 */
router.post(
  "/set-default",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const db = admin.firestore();

    const { resumeId } = req.body as { resumeId?: string };

    if (!resumeId || typeof resumeId !== "string") {
      res.status(400).json({
        error: { code: "MISSING_RESUME_ID", message: "resumeId is required" },
      });
      return;
    }

    try {
      // 1. Verify ownership
      const resumeDoc = await db.collection("resumes").doc(resumeId).get();
      if (!resumeDoc.exists) {
        res.status(404).json({
          error: { code: "RESUME_NOT_FOUND", message: "Resume not found" },
        });
        return;
      }

      const resumeData = resumeDoc.data()!;
      if (resumeData.userId !== userId) {
        res.status(403).json({
          error: { code: "FORBIDDEN", message: "You do not own this resume" },
        });
        return;
      }

      // Already default — nothing to do
      if (resumeData.isDefault === true) {
        res.json({ success: true });
        return;
      }

      // 2. Find current default resume(s)
      const currentDefaultSnap = await db
        .collection("resumes")
        .where("userId", "==", userId)
        .where("isDefault", "==", true)
        .get();

      // 3. Batched write
      const batch = db.batch();

      currentDefaultSnap.docs.forEach((doc) => {
        batch.update(doc.ref, { isDefault: false });
      });

      batch.update(resumeDoc.ref, { isDefault: true });

      await batch.commit();

      res.json({ success: true });
    } catch (err) {
      console.error("resumes/set-default: unexpected error", err);
      res.status(500).json({
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to set default resume",
        },
      });
    }
  }
);

/**
 * DELETE /api/resumes/:resumeId
 *
 * Deletes a resume variant and its subcollections/analytics.
 * Cannot delete the user's only resume.
 * If the deleted resume was the default, promotes the most recently updated
 * remaining resume to default.
 *
 * Returns: { success: true, newDefaultId?: string }
 */
router.delete(
  "/:resumeId",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const resumeId = String(req.params.resumeId);
    const db = admin.firestore();

    try {
      // 1. Verify ownership
      const resumeDoc = await db.collection("resumes").doc(resumeId).get();
      if (!resumeDoc.exists) {
        res.status(404).json({
          error: { code: "RESUME_NOT_FOUND", message: "Resume not found" },
        });
        return;
      }

      const resumeData = resumeDoc.data()!;
      if (resumeData.userId !== userId) {
        res.status(403).json({
          error: { code: "FORBIDDEN", message: "You do not own this resume" },
        });
        return;
      }

      // 2. Fetch all user resumes to enforce "cannot delete last" rule
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

      // 3. Determine new default if needed
      let newDefaultId: string | undefined;
      if (isDefault) {
        const remaining = allResumesSnap.docs
          .filter((doc) => doc.id !== resumeId)
          .sort((a, b) => {
            const aTs = a.data().updatedAt?.toMillis?.() ?? 0;
            const bTs = b.data().updatedAt?.toMillis?.() ?? 0;
            return bTs - aTs; // most recently updated first
          });

        if (remaining.length > 0) {
          newDefaultId = remaining[0].id;
        }
      }

      // 4. Delete versions subcollection docs
      const versionsSnap = await db
        .collection("resumes")
        .doc(resumeId)
        .collection("versions")
        .get();

      // 5. Batched delete
      const batch = db.batch();

      versionsSnap.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Delete analytics doc
      batch.delete(db.collection("analytics").doc(resumeId));

      // Promote new default if applicable
      if (newDefaultId) {
        batch.update(db.collection("resumes").doc(newDefaultId), {
          isDefault: true,
        });
      }

      // Delete resume doc itself
      batch.delete(resumeDoc.ref);

      await batch.commit();

      const response: { success: boolean; newDefaultId?: string } = {
        success: true,
      };
      if (newDefaultId) {
        response.newDefaultId = newDefaultId;
      }

      res.json(response);
    } catch (err) {
      console.error("resumes/delete: unexpected error", err);
      res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "Failed to delete resume" },
      });
    }
  }
);

export default router;
