import * as admin from "firebase-admin";
import { Request, Response, NextFunction } from "express";

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
    // API key verification will be implemented in Task 19 (Agent API)
    // For now, return 401
    res.status(401).json({ error: { code: "API_KEY_NOT_IMPLEMENTED", message: "API key auth not yet available" } });
    return;
  }

  // No auth provided
  res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } });
}
