import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, TokenPayload } from "../utils/jwt";
import { UnauthorizedError } from "../utils/errors";
import mongoose from "mongoose";

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const token = req.cookies?.accessToken;

  if (!token) {
    next(new UnauthorizedError("Access token required"));
    return;
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired access token"));
  }
}

/**
 * Validates that a string is a valid MongoDB ObjectId.
 * Throws UnauthorizedError if invalid (since missing params shouldn't 500).
 */
export function validateObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}
