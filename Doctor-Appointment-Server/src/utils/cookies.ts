import { Response } from "express";
import { env } from "../config/env";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
  // CHIPS: partitioned cookies are allowed by Chrome even when third-party
  // cookies are blocked, so cross-site auth works in every browser (Edge,
  // Chrome, Safari) without relying on the third-party cookie exception.
  // Partitioned requires Secure, so only enable it in production (HTTPS).
  partitioned: env.NODE_ENV === "production",
} as const;

export function setAccessTokenCookie(res: Response, token: string): void {
  res.cookie("accessToken", token, {
    ...COOKIE_OPTIONS,
    maxAge: 15 * 60 * 1000,
  });
}

export function setRefreshTokenCookie(res: Response, token: string): void {
  res.cookie("refreshToken", token, {
    ...COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie("accessToken", {
    ...COOKIE_OPTIONS,
    maxAge: 0,
  });
  res.clearCookie("refreshToken", {
    ...COOKIE_OPTIONS,
    maxAge: 0,
  });
}
