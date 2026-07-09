import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

export function validateRecaptcha(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!env.RECAPTCHA_ENABLED) {
    next();
    return;
  }

  const token = req.body?.recaptchaToken || req.headers["x-recaptcha-token"];
  if (!token) {
    res.status(400).json({ success: false, message: "CAPTCHA required" });
    return;
  }

  next();
}
