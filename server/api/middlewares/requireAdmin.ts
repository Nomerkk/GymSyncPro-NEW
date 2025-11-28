import type { Request, Response, NextFunction } from "express";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const userRole = (req.user as any)?.role;
  if (req.isAuthenticated && req.isAuthenticated() && (userRole === 'admin' || userRole === 'super_admin')) {
    return next();
  }
  res.status(403).json({ message: "Admin access required" });
}
