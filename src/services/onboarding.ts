import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";

/**
 * Mark the setup wizard as completed for a user.
 */
export async function markWizardCompleted(uid: string): Promise<void> {
  await updateDoc(doc(db, "users", uid), {
    wizardCompleted: true,
    wizardCompletedAt: serverTimestamp(),
  });
}

/**
 * Reset wizard state so the user can re-run it.
 */
export async function resetWizard(uid: string): Promise<void> {
  await updateDoc(doc(db, "users", uid), {
    wizardCompleted: false,
    wizardCompletedAt: null,
  });
}
