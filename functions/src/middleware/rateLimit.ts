import * as admin from "firebase-admin";

/**
 * Firestore-based rate limiter for API keys.
 *
 * Limits:
 *   - 30 requests per minute (general)
 *
 * Document path: rateLimits/{keyHash}_{minuteWindow}
 */

interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

/**
 * Check and increment the rate limit counter for the given key hash.
 * Returns { allowed: true } when under the limit, or { allowed: false, retryAfterSeconds } when exceeded.
 */
export async function checkRateLimit(keyHash: string): Promise<RateLimitResult> {
  const db = admin.firestore();

  const nowMs = Date.now();
  const minuteWindow = Math.floor(nowMs / 60_000); // floor to current minute epoch
  const docId = `${keyHash}_${minuteWindow}`;
  const docRef = db.collection("rateLimits").doc(docId);

  const LIMIT = 30;

  try {
    let allowed = false;

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(docRef);
      const count: number = snap.exists ? (snap.data()!.count as number) : 0;

      if (count < LIMIT) {
        const expireAt = new Date((minuteWindow + 1) * 60_000 + 5_000); // window end + 5s buffer
        tx.set(
          docRef,
          {
            count: count + 1,
            keyHash,
            window: minuteWindow,
            expireAt: admin.firestore.Timestamp.fromDate(expireAt),
          },
          { merge: true }
        );
        allowed = true;
      } else {
        allowed = false;
      }
    });

    if (allowed) {
      return { allowed: true };
    }

    // Calculate seconds until the next minute window opens
    const windowEndMs = (minuteWindow + 1) * 60_000;
    const retryAfterSeconds = Math.ceil((windowEndMs - nowMs) / 1_000);
    return { allowed: false, retryAfterSeconds };
  } catch (err) {
    // On error, allow the request to avoid blocking legitimate traffic
    console.error("rateLimit: Firestore error, allowing request", err);
    return { allowed: true };
  }
}
