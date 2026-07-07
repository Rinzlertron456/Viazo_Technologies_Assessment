import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../utils/errors';
import { UserRole } from '../models/User';

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    if (!roles.includes(req.user.role as UserRole)) {
      throw new ForbiddenError(
        `Access denied. Required role: ${roles.join(' or ')}`
      );
    }

    next();
  };
}
