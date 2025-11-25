import type { Request, Response, NextFunction } from "express";
import { env } from "../../config";

const authDebug = Boolean(env.auth.debugFlag) || env.isDevelopment;

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }

  if (authDebug) {
    const cookieHeader = req.headers?.cookie;
    console.warn('[AUTH] Unauthorized request:', {
      path: req.path,
      method: req.method,
      hasSession: Boolean((req as any).session),
      sessionID: (req as any).sessionID,
      cookiePresent: Boolean(cookieHeader),
      cookieHeader,
    });
  }

  res.status(401).json({ message: "Unauthorized" });
}
