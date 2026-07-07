import { Request, Response, NextFunction } from 'express';
import { AuditLog } from '../models/AuditLog';

export function auditLogger(action: string, resource: string) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.user) {
        await AuditLog.create({
          userId: req.user.userId,
          role: req.user.role,
          action,
          resource,
          details: `${req.method} ${req.originalUrl}`,
          ip: req.ip || req.socket.remoteAddress,
        });
      }
    } catch {
      // Logging failure should never break the request
    }
    next();
  };
}
