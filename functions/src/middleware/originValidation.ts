import { Request, Response, NextFunction } from "express";

const ALLOWED_ORIGINS = [
  "https://onesheet.cv",
  "https://www.onesheet.cv",
  "https://bragsheet-mvp.web.app",
  "https://bragsheet-mvp.firebaseapp.com",
];

/**
 * Validates the Origin header on state-changing requests (POST/PUT/DELETE).
 * Allows localhost in development and all allowed production origins.
 * GET/HEAD/OPTIONS are always allowed (safe methods).
 */
export function validateOrigin(req: Request, res: Response, next: NextFunction): void {
  // Safe methods don't need origin validation
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    next();
    return;
  }

  const origin = req.headers.origin;

  // API key requests (agent API) don't come from browsers -- skip origin check
  if (req.headers["x-api-key"]) {
    next();
    return;
  }

  // No origin header can happen with non-browser clients; allow if no origin
  if (!origin) {
    next();
    return;
  }

  // Allow localhost for development
  if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) {
    next();
    return;
  }

  if (ALLOWED_ORIGINS.includes(origin)) {
    next();
    return;
  }

  res.status(403).json({
    error: { code: "FORBIDDEN_ORIGIN", message: "Request origin not allowed" },
  });
}
