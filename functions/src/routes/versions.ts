import { Router, Response } from "express";
import * as admin from "firebase-admin";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

const router = Router({ mergeParams: true });

// ---------------------------------------------------------------------------
// GET /api/resumes/:resumeId/versions
// ---------------------------------------------------------------------------
/**
 * List versions for a resume with cursor pagination.
 *
 * Query params:
 *   - pageSize: number (default 20, max 50)
 *   - startAfter: ISO timestamp string — cursor for the next page
 *
 * Returns: { versions: VersionEntry[], hasMore: boolean }
 */
router.get(
  "/",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const resumeId = String(req.params.resumeId ?? "");
    const db = admin.firestore();

    // Validate resumeId
    if (!resumeId) {
      res
        .status(400)
        .json({ error: { code: "MISSING_RESUME_ID", message: "resumeId is required" } });
      return;
    }

    try {
      // 1. Verify ownership
      const resumeDoc = await db.collection("resumes").doc(resumeId).get();
      if (!resumeDoc.exists) {
        res
          .status(404)
          .json({ error: { code: "RESUME_NOT_FOUND", message: "Resume not found" } });
        return;
      }
      if (resumeDoc.data()!.userId !== userId) {
        res
          .status(403)
          .json({ error: { code: "FORBIDDEN", message: "You do not own this resume" } });
        return;
      }

      // 2. Parse pagination params
      const rawPageSize = parseInt(String(req.query.pageSize ?? "20"), 10);
      const pageSize = Math.min(isNaN(rawPageSize) ? 20 : rawPageSize, 50);

      const startAfterParam =
      typeof req.query.startAfter === "string" ? req.query.startAfter : undefined;

      // 3. Build query
      let q = db
        .collection("resumes")
        .doc(resumeId)
        .collection("versions")
        .orderBy("createdAt", "desc")
        .limit(pageSize);

      if (startAfterParam) {
        const cursorDate = new Date(startAfterParam);
        if (!isNaN(cursorDate.getTime())) {
          const cursorTimestamp = admin.firestore.Timestamp.fromDate(cursorDate);
          q = q.startAfter(cursorTimestamp);
        }
      }

      const snap = await q.get();

      const versions = snap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          markdown: data.markdown as string,
          templateId: data.templateId as string,
          createdAt: (data.createdAt as admin.firestore.Timestamp)?.toDate?.().toISOString() ?? null,
        };
      });

      res.json({ versions, hasMore: versions.length === pageSize });
    } catch (err) {
      console.error("versions/list: unexpected error", err);
      res
        .status(500)
        .json({ error: { code: "INTERNAL_ERROR", message: "Failed to list versions" } });
    }
  }
);

// ---------------------------------------------------------------------------
// POST /api/resumes/:resumeId/versions/restore
// ---------------------------------------------------------------------------
/**
 * Restore a specific version.
 *
 * Body: { versionId: string }
 *
 * Steps:
 *   1. Verify ownership
 *   2. Fetch target version
 *   3. Snapshot the current resume state (so restore is reversible)
 *   4. Copy version's markdown + templateId onto the resume doc
 *
 * Returns: { success: true }
 */
router.post(
  "/restore",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.userId!;
    const resumeId = String(req.params.resumeId ?? "");
    const { versionId } = req.body as { versionId?: string };
    const db = admin.firestore();

    if (!resumeId) {
      res
        .status(400)
        .json({ error: { code: "MISSING_RESUME_ID", message: "resumeId is required" } });
      return;
    }
    if (!versionId || typeof versionId !== "string") {
      res
        .status(400)
        .json({ error: { code: "MISSING_VERSION_ID", message: "versionId is required" } });
      return;
    }

    try {
      // 1. Verify ownership
      const resumeRef = db.collection("resumes").doc(resumeId);
      const resumeDoc = await resumeRef.get();

      if (!resumeDoc.exists) {
        res
          .status(404)
          .json({ error: { code: "RESUME_NOT_FOUND", message: "Resume not found" } });
        return;
      }

      const resumeData = resumeDoc.data()!;
      if (resumeData.userId !== userId) {
        res
          .status(403)
          .json({ error: { code: "FORBIDDEN", message: "You do not own this resume" } });
        return;
      }

      // 2. Fetch the target version
      const versionRef = resumeRef.collection("versions").doc(versionId);
      const versionDoc = await versionRef.get();

      if (!versionDoc.exists) {
        res
          .status(404)
          .json({ error: { code: "VERSION_NOT_FOUND", message: "Version not found" } });
        return;
      }

      const versionData = versionDoc.data()!;

      // 3. Snapshot current state before overwriting (makes restore reversible)
      const versionsRef = resumeRef.collection("versions");
      await versionsRef.add({
        markdown: resumeData.markdown ?? "",
        templateId: resumeData.templateId ?? "classic",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 4. Apply the version onto the resume doc
      await resumeRef.update({
        markdown: versionData.markdown ?? "",
        templateId: versionData.templateId ?? "classic",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.json({ success: true });
    } catch (err) {
      console.error("versions/restore: unexpected error", err);
      res
        .status(500)
        .json({ error: { code: "INTERNAL_ERROR", message: "Failed to restore version" } });
    }
  }
);

export default router;
