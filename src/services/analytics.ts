import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import type { Analytics } from "../types/analytics";

export async function getAnalytics(resumeId: string): Promise<Analytics | null> {
  const snap = await getDoc(doc(db, "analytics", resumeId));
  if (!snap.exists()) return null;
  return snap.data() as Analytics;
}

export async function getAnalyticsForResumes(
  resumeIds: string[]
): Promise<Record<string, Analytics>> {
  const results: Record<string, Analytics> = {};
  // With max 3 resumes, parallel individual fetches are fine
  await Promise.all(
    resumeIds.map(async (id) => {
      const analytics = await getAnalytics(id);
      if (analytics) results[id] = analytics;
    })
  );
  return results;
}
