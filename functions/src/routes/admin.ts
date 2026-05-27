import { Router, Response } from "express";
import * as admin from "firebase-admin";
import { logger } from "firebase-functions";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { checkRateLimit } from "../middleware/rateLimit";
import { ADMIN_EMAIL } from "../lib/constants";

const router = Router();

async function applySensitiveRateLimit(
  req: AuthenticatedRequest,
  res: Response,
  next: () => void
): Promise<void> {
  if (!req.userId) { next(); return; }
  const result = await checkRateLimit(`user:${req.userId}:sensitive`);
  if (!result.allowed) {
    res.setHeader("Retry-After", String(result.retryAfterSeconds ?? 60));
    res.status(429).json({
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests. Please slow down.",
        retryAfterSeconds: result.retryAfterSeconds ?? 60,
      },
    });
    return;
  }
  next();
}

/**
 * POST /api/admin/bootstrap-claims
 *
 * One-time bootstrap: sets { admin: true } custom claim on the calling user
 * if their email matches the server-side ADMIN_EMAIL constant.
 *
 * After calling this, the user must refresh their ID token
 * (sign out / sign in, or call getIdToken(true)).
 */
router.post(
  "/bootstrap-claims",
  requireAuth,
  applySensitiveRateLimit,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.userId!;

    try {
      const authUser = await admin.auth().getUser(userId);

      if (authUser.email !== ADMIN_EMAIL) {
        res.status(403).json({
          error: { code: "FORBIDDEN", message: "Not authorized" },
        });
        return;
      }

      // Set custom claims
      await admin.auth().setCustomUserClaims(userId, {
        ...(authUser.customClaims ?? {}),
        admin: true,
      });

      logger.info("Admin custom claims set for user", { userId });
      res.json({ success: true, message: "Admin claims set. Refresh your token." });
    } catch (err) {
      logger.error("admin/bootstrap-claims: error", err);
      res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "Failed to set admin claims" },
      });
    }
  }
);

export default router;
