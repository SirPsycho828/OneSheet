import { Router, Response } from "express";
import * as admin from "firebase-admin";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

router.get("/:resumeId", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const resumeId = String(req.params.resumeId);
  const db = admin.firestore();

  try {
    const analyticsDoc = await db.collection("analytics").doc(resumeId).get();
    if (!analyticsDoc.exists) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Analytics not found" } });
      return;
    }

    const data = analyticsDoc.data()!;
    if (data.userId !== userId) {
      res.status(403).json({ error: { code: "FORBIDDEN", message: "Not authorized" } });
      return;
    }

    res.json({
      profileViews: data.profileViews ?? 0,
      pdfDownloads: data.pdfDownloads ?? 0,
      lastViewedAt: data.lastViewedAt?.toDate?.()?.toISOString?.() ?? null,
    });
  } catch (err) {
    console.error("analytics: error", err);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to fetch analytics" } });
  }
});

export default router;
