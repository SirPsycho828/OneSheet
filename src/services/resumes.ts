import {
  doc,
  getDoc,
  getDocs,
  updateDoc,
  addDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import type { Resume } from "../types/resume";

/**
 * Fetch a single resume by its Firestore document ID.
 */
export async function getResume(resumeId: string): Promise<Resume | null> {
  const ref = doc(db, "resumes", resumeId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Resume;
}

/**
 * Fetch the user's default resume (isDefault === true).
 * Returns null if none found.
 */
export async function getDefaultResume(userId: string): Promise<Resume | null> {
  const q = query(
    collection(db, "resumes"),
    where("userId", "==", userId),
    where("isDefault", "==", true)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as Resume;
}

/**
 * Fetch all resumes belonging to a user, ordered by creation date descending.
 */
export async function getUserResumes(userId: string): Promise<Resume[]> {
  const q = query(
    collection(db, "resumes"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Resume));
}

/**
 * Partial update of a resume document. Always refreshes updatedAt via
 * serverTimestamp() so the UI save status reflects the server write time.
 */
export async function updateResume(
  resumeId: string,
  data: Partial<Pick<Resume, "markdown" | "title" | "templateId" | "overflow" | "paperSize" | "showQrCode" | "qrCodeUrl" | "styles">>
): Promise<void> {
  const ref = doc(db, "resumes", resumeId);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Create a new resume document and return its generated ID.
 */
export async function createResume(
  data: Omit<Resume, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = await addDoc(collection(db, "resumes"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/**
 * Permanently delete a resume document.
 */
export async function deleteResume(resumeId: string): Promise<void> {
  await deleteDoc(doc(db, "resumes", resumeId));
}
