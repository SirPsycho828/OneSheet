import {
  doc,
  getDoc,
  writeBatch,
  serverTimestamp,
  collection,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { RESERVED_WORDS } from "../constants/reserved-words";
import { PRESET_DEFAULTS } from "../constants/presets";

const USERNAME_REGEX = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$|^[a-z0-9]{3}$/;

export type UsernameAvailabilityResult =
  | { available: true }
  | { available: false; reason: string };

export async function checkUsernameAvailability(
  username: string
): Promise<UsernameAvailabilityResult> {
  // Length check
  if (username.length < 3 || username.length > 30) {
    return { available: false, reason: "Username must be between 3 and 30 characters." };
  }

  // Format check: lowercase alphanumeric + hyphens, start/end with alphanumeric
  if (!USERNAME_REGEX.test(username)) {
    return {
      available: false,
      reason:
        "Username may only contain lowercase letters, numbers, and hyphens, and must start and end with a letter or number.",
    };
  }

  // Reserved words check
  if (RESERVED_WORDS.has(username)) {
    return { available: false, reason: "This username is reserved." };
  }

  // Firestore uniqueness check
  const usernameDoc = await getDoc(doc(db, "usernames", username));
  if (usernameDoc.exists()) {
    return { available: false, reason: "This username is already taken." };
  }

  return { available: true };
}

export async function claimUsername(
  uid: string,
  username: string,
  displayName: string,
  email: string
): Promise<void> {
  const batch = writeBatch(db);

  // 1. Claim username document
  batch.set(doc(db, "usernames", username), { uid });

  // 2. Create or update users document
  batch.set(doc(db, "users", uid), {
    username,
    displayName,
    email,
    onboardingComplete: true,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  // 3. Create initial default resume
  const resumeRef = doc(collection(db, "resumes"));
  batch.set(resumeRef, {
    id: resumeRef.id,
    userId: uid,
    title: "My Resume",
    markdown: `# ${displayName}\n\n${email}\n\n## Experience\n\n## Education\n\n## Skills\n`,
    templateId: "classic",
    styles: PRESET_DEFAULTS.classic,
    isDefault: true,
    paperSize: "us-letter",
    overflow: { isOverflowing: false, scaleFactor: 1 },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // 4. Create analytics document
  const analyticsRef = doc(db, "analytics", uid);
  batch.set(analyticsRef, {
    uid,
    profileViews: 0,
    resumeDownloads: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
}

/**
 * Change a user's username. Creates a redirect from the old username
 * so existing links continue to work.
 */
export async function changeUsername(
  uid: string,
  oldUsername: string,
  newUsername: string
): Promise<void> {
  const batch = writeBatch(db);

  // 1. Claim new username
  batch.set(doc(db, "usernames", newUsername), { uid });

  // 2. Delete old username claim
  batch.delete(doc(db, "usernames", oldUsername));

  // 3. Create redirect from old → new
  batch.set(doc(db, "usernameRedirects", oldUsername), {
    redirectTo: newUsername,
    uid,
    createdAt: serverTimestamp(),
  });

  // 4. Update user doc
  batch.update(doc(db, "users", uid), {
    username: newUsername,
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
}
