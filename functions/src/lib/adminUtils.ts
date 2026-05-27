import * as admin from "firebase-admin";
import { ADMIN_EMAIL } from "./constants";

interface AdminTierStatus {
  isAdmin: boolean;
  isPro: boolean;
  tierOverride?: string;
}

/**
 * Single source of truth for admin tier checking.
 * All routes must use this instead of inline admin checks.
 *
 * Logic:
 *   - If user email !== ADMIN_EMAIL → { isAdmin: false, isPro: false }
 *   - If admin with tierOverride === "free" → isPro = false
 *   - Otherwise (including undefined tierOverride) → isPro = true
 */
export async function getAdminTierStatus(userId: string): Promise<AdminTierStatus> {
  try {
    const authUser = await admin.auth().getUser(userId);
    if (authUser.email !== ADMIN_EMAIL) {
      return { isAdmin: false, isPro: false };
    }

    const adminDoc = await admin
      .firestore()
      .collection("config")
      .doc("admin")
      .get();
    const tierOverride = adminDoc.data()?.tierOverride as string | undefined;
    const isPro = tierOverride !== "free";

    return { isAdmin: true, isPro, tierOverride };
  } catch {
    return { isAdmin: false, isPro: false };
  }
}
