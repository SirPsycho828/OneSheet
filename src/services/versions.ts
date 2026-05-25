import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

export async function createSnapshot(
  resumeId: string,
  markdown: string,
  templateId: string
): Promise<void> {
  await addDoc(collection(db, "resumes", resumeId, "versions"), {
    markdown,
    templateId,
    createdAt: serverTimestamp(),
  });
}

export interface VersionEntry {
  id: string;
  markdown: string;
  templateId: string;
  createdAt: Timestamp;
}

/**
 * Lists versions for a resume, ordered by createdAt DESC.
 * Supports cursor pagination via lastDoc (a Timestamp from the previous page's last item).
 * Max fetchable: 50 (capped here on client side).
 */
export async function listVersions(
  resumeId: string,
  pageSize = 20,
  lastDoc?: Timestamp
): Promise<VersionEntry[]> {
  const versionsRef = collection(db, "resumes", resumeId, "versions");

  // Clamp page size to max of 50
  const clampedSize = Math.min(pageSize, 50);

  const constraints = lastDoc
    ? [orderBy("createdAt", "desc"), startAfter(lastDoc), limit(clampedSize)]
    : [orderBy("createdAt", "desc"), limit(clampedSize)];

  const snap = await getDocs(query(versionsRef, ...constraints));

  return snap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<VersionEntry, "id">),
  }));
}
