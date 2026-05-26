import { Router } from "express";
import * as admin from "firebase-admin";
import { logger } from "firebase-functions";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { renderMarkdown } from "../lib/markdown";
import { buildHtmlDocument, generatePdf } from "../lib/pdf";
import { deriveStyles } from "../lib/styleUtils";
import { postProcessHtml } from "../lib/postProcess";
import { ADMIN_EMAIL } from "../lib/constants";
import { Response } from "express";

const router = Router();

/**
 * POST /api/pdf/generate
 *
 * Generates a PDF for the authenticated user's resume.
 *
 * Body: { resumeId: string }
 *
 * Returns: PDF binary (application/pdf)
 */
router.post(
  "/generate",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.userId!;

    // ------------------------------------------------------------------
    // 1. Validate request body
    // ------------------------------------------------------------------
    const { resumeId } = req.body as { resumeId?: string };
    if (!resumeId || typeof resumeId !== "string") {
      res.status(400).json({
        error: { code: "MISSING_RESUME_ID", message: "resumeId is required" },
      });
      return;
    }

    const db = admin.firestore();

    // ------------------------------------------------------------------
    // 2. Check subscription status
    // ------------------------------------------------------------------
    let username = "resume";
    try {
      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists) {
        res.status(403).json({
          error: { code: "USER_NOT_FOUND", message: "User not found" },
        });
        return;
      }

      const userData = userDoc.data()!; // safe: exists check above
      const subscriptionStatus: string = userData?.subscription?.status ?? "free";

      let isPro = subscriptionStatus === "active";
      try {
        const authUser = await admin.auth().getUser(userId);
        if (authUser.email === ADMIN_EMAIL) {
          const adminDoc = await db.collection("config").doc("admin").get();
          const tierOverride = adminDoc.data()?.tierOverride as string | undefined;
          isPro = tierOverride !== "free";
        }
      } catch {
        // fall through to normal subscription check
      }

      if (!isPro) {
        res.status(403).json({
          error: {
            code: "SUBSCRIPTION_REQUIRED",
            message: "PDF export requires an active subscription",
          },
        });
        return;
      }

      username = userData?.username ?? "resume";
    } catch (err) {
      logger.error("pdf/generate: error fetching user doc", err);
      res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "PDF generation failed. Please try again." },
      });
      return;
    }

    // ------------------------------------------------------------------
    // 3. Fetch resume, verify ownership
    // ------------------------------------------------------------------
    let resumeData: FirebaseFirestore.DocumentData;
    try {
      const resumeDoc = await db.collection("resumes").doc(resumeId).get();
      if (!resumeDoc.exists) {
        res.status(404).json({
          error: { code: "RESUME_NOT_FOUND", message: "Resume not found" },
        });
        return;
      }

      resumeData = resumeDoc.data()!; // safe: exists check above

      if (resumeData.userId !== userId) {
        res.status(403).json({
          error: { code: "FORBIDDEN", message: "You do not own this resume" },
        });
        return;
      }
    } catch (err) {
      logger.error("pdf/generate: error fetching resume doc", err);
      res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "PDF generation failed. Please try again." },
      });
      return;
    }

    // ------------------------------------------------------------------
    // 4. Build HTML and generate PDF
    // ------------------------------------------------------------------
    try {
      const markdown: string = resumeData.markdown ?? "";
      const paperSize: "us-letter" | "a4" =
        resumeData.paperSize === "a4" ? "a4" : "us-letter";
      const scaleFactor: number = resumeData.overflow?.scaleFactor ?? 1;

      // Derive styles: use stored styles if present, otherwise fall back
      const styles = resumeData.styles
        ?? deriveStyles(resumeData.templateId ?? "classic", paperSize);

      let renderedHtml = await renderMarkdown(markdown);
      renderedHtml = postProcessHtml(renderedHtml, styles);

      const html = buildHtmlDocument({
        renderedHtml,
        styles,
        scaleFactor,
      });

      const pdfBuffer = await generatePdf(html, styles.pageSize);

      // ------------------------------------------------------------------
      // 5. Increment analytics.pdfDownloads (fire-and-forget)
      // ------------------------------------------------------------------
      db.collection("resumes")
        .doc(resumeId)
        .update({
          "analytics.pdfDownloads": admin.firestore.FieldValue.increment(1),
        })
        .catch((err: unknown) => {
          logger.error("pdf/generate: failed to increment pdfDownloads", err);
        });

      // ------------------------------------------------------------------
      // 6. Send PDF response
      // ------------------------------------------------------------------
      const safeUsername = username.replace(/[^a-z0-9_-]/gi, "").toLowerCase() || "resume";
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${safeUsername}-resume.pdf"`
      );
      res.setHeader("Cache-Control", "no-store");
      res.send(pdfBuffer);
    } catch (err) {
      logger.error("pdf/generate: Puppeteer error", err);
      res.status(500).json({
        error: { code: "PDF_GENERATION_FAILED", message: "PDF generation failed. Please try again." },
      });
    }
  }
);

export default router;
