import { auth, db } from "../config/firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";

const API_BASE =
  import.meta.env.VITE_FUNCTIONS_URL ??
  `https://us-central1-${import.meta.env.VITE_FIREBASE_PROJECT_ID}.cloudfunctions.net/api`;

async function getAuthHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const token = await user.getIdToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Polish resume bullet points with AI.
 */
export async function polishBullets(bullets: string[]): Promise<string[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/ai/polish`, {
    method: "POST",
    headers,
    body: JSON.stringify({ bullets }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      (data as { error?: { message?: string } })?.error?.message ?? "Failed to polish bullets"
    );
  }

  const data = (await res.json()) as { polished: string[] };
  return data.polished;
}

/**
 * Score a resume against a job description.
 */
export async function scoreResume(
  markdown: string,
  jobDescription: string
): Promise<{
  score: number;
  matches: string[];
  gaps: string[];
  suggestions: string[];
}> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/ai/score`, {
    method: "POST",
    headers,
    body: JSON.stringify({ markdown, jobDescription }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      (data as { error?: { message?: string } })?.error?.message ?? "Failed to score resume"
    );
  }

  return res.json();
}

/**
 * Extract job description text from a URL.
 */
export async function extractJobFromUrl(url: string): Promise<string> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/ai/extract-job`, {
    method: "POST",
    headers,
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      (data as { error?: { message?: string } })?.error?.message ??
        "Could not fetch job listing. Try copying and pasting instead."
    );
  }

  const data = (await res.json()) as { text: string };
  return data.text;
}

// ---------------------------------------------------------------------------
// Score History
// ---------------------------------------------------------------------------

export interface SavedScore {
  id: string;
  score: number;
  matches: string[];
  gaps: string[];
  suggestions: string[];
  jobSnippet: string;
  createdAt: Date;
}

export async function saveScore(
  resumeId: string,
  result: { score: number; matches: string[]; gaps: string[]; suggestions: string[] },
  jobDescription: string
): Promise<void> {
  const ref = collection(db, "resumes", resumeId, "scores");
  await addDoc(ref, {
    ...result,
    jobSnippet: jobDescription.slice(0, 200),
    createdAt: serverTimestamp(),
  });
}

export async function getScoreHistory(
  resumeId: string,
  maxResults = 10
): Promise<SavedScore[]> {
  const ref = collection(db, "resumes", resumeId, "scores");
  const q = query(ref, orderBy("createdAt", "desc"), limit(maxResults));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      score: data.score,
      matches: data.matches,
      gaps: data.gaps,
      suggestions: data.suggestions,
      jobSnippet: data.jobSnippet ?? "",
      createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
    };
  });
}

/**
 * Import resume from pasted text — converts to structured markdown.
 */
export async function importResumeText(text: string): Promise<string> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/ai/import-text`, {
    method: "POST",
    headers,
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      (data as { error?: { message?: string } })?.error?.message ?? "Failed to import resume"
    );
  }

  const data = (await res.json()) as { markdown: string };
  return data.markdown;
}
