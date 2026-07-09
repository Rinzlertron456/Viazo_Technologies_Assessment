import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../utils/errors";

export async function checkSession(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Session expired");
    res.json({
      success: true,
      data: { valid: true, userId: req.user.userId, role: req.user.role },
    });
  } catch (error) {
    next(error);
  }
}
