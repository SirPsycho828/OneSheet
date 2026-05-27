import * as admin from "firebase-admin";
import * as crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { logger } from "firebase-functions";

export interface AuthenticatedRequest extends Request {
  userId?: string;
  authMethod?: "bearer" | "apikey";
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Check Bearer token first
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.split("Bearer ")[1];
      const decoded = await admin.auth().verifyIdToken(token);
      req.userId = decoded.uid;
      req.authMethod = "bearer";
      return next();
    } catch {
      res.status(401).json({ error: { code: "INVALID_TOKEN", message: "Invalid or expired auth token" } });
      return;
    }
  }

  // Check API key
  const apiKey = req.headers["x-api-key"] as string;
  if (apiKey) {
    try {
      const db = admin.firestore();

      // Try salted keys first (new format), then fall back to unsalted (legacy)
      let keyDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;

      // Look up by key prefix for efficient querying
      const prefix = apiKey.substring(0, 12);
      const candidateSnap = await db
        .collection("apiKeys")
        .where("keyPrefix", "==", prefix)
        .where("isActive", "==", true)
        .get();

      for (const doc of candidateSnap.docs) {
        const data = doc.data();
        const storedHash = data.keyHash as string;
        const salt = data.salt as string | undefined;

        const computedHash = salt
          ? crypto.createHash("sha256").update(apiKey + salt).digest("hex")
          : crypto.createHash("sha256").update(apiKey).digest("hex");

        // Timing-safe comparison
        try {
          if (crypto.timingSafeEqual(Buffer.from(computedHash, "hex"), Buffer.from(storedHash, "hex"))) {
            keyDoc = doc;
            break;
          }
        } catch {
          // Length mismatch, skip
        }
      }

      if (!keyDoc) {
        res.status(401).json({
          error: { code: "INVALID_API_KEY", message: "Invalid or revoked API key" },
        });
        return;
      }

      const keyData = keyDoc.data();
      const userId: string = keyData.userId;

      // Load users/{userId} to check subscription
      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists) {
        res.status(403).json({
          error: { code: "USER_NOT_FOUND", message: "User not found" },
        });
        return;
      }

      const userData = userDoc.data()!; // safe: exists check above
      const subscriptionStatus: string = userData?.subscription?.status ?? "free";

      if (subscriptionStatus !== "active") {
        res.status(403).json({
          error: {
            code: "SUBSCRIPTION_REQUIRED",
            message: "API key access requires an active Pro subscription",
          },
        });
        return;
      }

      // Fire-and-forget: update lastUsedAt
      keyDoc.ref
        .update({ lastUsedAt: admin.firestore.FieldValue.serverTimestamp() })
        .catch((err: unknown) => {
          logger.error("auth: failed to update lastUsedAt", err);
        });

      req.userId = userId;
      req.authMethod = "apikey";
      return next();
    } catch (err) {
      logger.error("auth: API key verification error", err);
      res.status(401).json({
        error: { code: "INVALID_API_KEY", message: "API key verification failed" },
      });
      return;
    }
  }

  // No auth provided
  res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } });
}
