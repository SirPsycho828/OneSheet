import { Router, Request, Response } from "express";
import * as admin from "firebase-admin";
import { renderMarkdown } from "../lib/markdown";

const router = Router();

/**
 * GET /api/profile/:username
 *
 * Public profile data — no auth required.
 * Returns rendered resume HTML and metadata for the user's default resume.
 */
router.get("/:username", async (req: Request, res: Response): Promise<void> => {
  const username = String(req.params.username);
  const db = admin.firestore();

  try {
    // 1. Resolve username → uid
    const usernameDoc = await db
      .collection("usernames")
      .doc(username.toLowerCase())
      .get();

    if (!usernameDoc.exists) {
      // Check for a redirect from an old username
      const redirectDoc = await db
        .collection("usernameRedirects")
        .doc(username.toLowerCase())
        .get();

      if (redirectDoc.exists) {
        const newUsername = redirectDoc.data()!.redirectTo;
        res.redirect(301, `/api/profile/${newUsername}`);
        return;
      }

      res.status(404).json({
        error: { code: "NOT_FOUND", message: "Profile not found" },
      });
      return;
    }

    const uid = usernameDoc.data()!.uid;

    // 2. Get user doc for display name + subscription
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      res.status(404).json({
        error: { code: "NOT_FOUND", message: "Profile not found" },
      });
      return;
    }

    const userData = userDoc.data()!;

    // 3. Get default resume
    const resumesSnap = await db
      .collection("resumes")
      .where("userId", "==", uid)
      .where("isDefault", "==", true)
      .limit(1)
      .get();

    if (resumesSnap.empty) {
      res.status(404).json({
        error: { code: "NO_RESUME", message: "No resume found" },
      });
      return;
    }

    const resumeDoc = resumesSnap.docs[0];
    const resumeData = resumeDoc.data();

    // 4. Render markdown to HTML
    const resumeHtml = await renderMarkdown(resumeData.markdown ?? "");

    // 5. Increment analytics (fire-and-forget)
    db.collection("analytics")
      .doc(resumeDoc.id)
      .set(
        { profileViews: admin.firestore.FieldValue.increment(1) },
        { merge: true }
      )
      .catch(() => {});

    // 6. Return response
    const showBranding = userData.subscription?.status !== "active";

    res.setHeader("Cache-Control", "public, max-age=300");
    res.json({
      displayName: userData.displayName ?? username,
      resumeHtml,
      templateId: resumeData.templateId ?? "classic",
      paperSize: resumeData.paperSize ?? "us-letter",
      scaleFactor: resumeData.overflow?.scaleFactor ?? 1,
      lastUpdated:
        resumeData.updatedAt?.toDate?.()?.toISOString?.() ?? null,
      showBranding,
    });
  } catch (err) {
    console.error("profile/get: unexpected error", err);
    res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Failed to load profile" },
    });
  }
});

/**
 * GET /api/profile/:username/meta
 *
 * OG / social meta data for the profile page — no auth required.
 */
router.get(
  "/:username/meta",
  async (req: Request, res: Response): Promise<void> => {
    const username = String(req.params.username);
    const db = admin.firestore();

    try {
      const usernameDoc = await db
        .collection("usernames")
        .doc(username.toLowerCase())
        .get();

      if (!usernameDoc.exists) {
        res.status(404).json({
          error: { code: "NOT_FOUND", message: "Profile not found" },
        });
        return;
      }

      const uid = usernameDoc.data()!.uid;
      const userDoc = await db.collection("users").doc(uid).get();
      const displayName = userDoc.exists
        ? (userDoc.data()!.displayName ?? username)
        : username;

      res.setHeader("Cache-Control", "public, max-age=3600");
      res.json({
        title: `${displayName} — Resume | BragSheet`,
        description: `View ${displayName}'s one-page resume`,
        url: `https://bragsheet.io/${username}`,
        image: "https://bragsheet.io/og-default.png",
      });
    } catch (err) {
      console.error("profile/meta: unexpected error", err);
      res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "Failed to load profile meta" },
      });
    }
  }
);

export default router;
