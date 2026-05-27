import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions";
import * as admin from "firebase-admin";

const MAX_VERSIONS_PER_RESUME = 50;

/**
 * Daily cleanup: for each resume with more than 50 versions, delete the oldest
 * beyond the 50-version cap.
 *
 * Schedule: 03:00 UTC every day
 * Region:   us-central1
 * Memory:   256MiB
 * Timeout:  120s
 */
export const cleanupVersions = onSchedule(
  {
    schedule: "0 3 * * *", // Daily at 03:00 UTC
    region: "us-central1",
    memory: "256MiB",
    timeoutSeconds: 120,
  },
  async () => {
    const db = admin.firestore();

    // 1. List all resume documents
    const resumesSnap = await db.collection("resumes").get();
    logger.info(`cleanupVersions: processing ${resumesSnap.size} resumes`);

    let totalDeleted = 0;

    for (const resumeDoc of resumesSnap.docs) {
      const resumeId = resumeDoc.id;

      try {
        // 2. Fetch all versions ordered by createdAt DESC
        const versionsSnap = await db
          .collection("resumes")
          .doc(resumeId)
          .collection("versions")
          .orderBy("createdAt", "desc")
          .get();

        if (versionsSnap.size <= MAX_VERSIONS_PER_RESUME) {
          continue; // Nothing to clean up
        }

        // 3. Delete oldest versions beyond the cap
        const toDelete = versionsSnap.docs.slice(MAX_VERSIONS_PER_RESUME);
        logger.info(
          `cleanupVersions: resume ${resumeId} has ${versionsSnap.size} versions - deleting ${toDelete.length}`
        );

        // Batch deletes in groups of 500 (Firestore batch limit)
        const BATCH_SIZE = 500;
        for (let i = 0; i < toDelete.length; i += BATCH_SIZE) {
          const batch = db.batch();
          toDelete.slice(i, i + BATCH_SIZE).forEach((doc) => batch.delete(doc.ref));
          await batch.commit();
          totalDeleted += Math.min(BATCH_SIZE, toDelete.length - i);
        }
      } catch (err) {
        logger.error(`cleanupVersions: error processing resume ${resumeId}`, err);
        // Continue to next resume rather than aborting the whole job
      }
    }

    logger.info(`cleanupVersions: complete - deleted ${totalDeleted} old version(s)`);
  }
);
