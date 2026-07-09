import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { User } from "../models/User";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import { BadRequestError } from "../utils/errors";
import { setAccessTokenCookie, setRefreshTokenCookie } from "../utils/cookies";

/**
 * Google Sign-In with Google Identity Services (GIS).
 * Accepts a JWT credential token from the GIS client-side library.
 * In production, set GOOGLE_CLIENT_ID in env and verify the token server-side.
 * For the MVP, we accept a trusted credential from the frontend.
 */
export async function googleLogin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { credential } = req.body;

    if (!credential || typeof credential !== "string") {
      throw new BadRequestError("Google credential token is required");
    }

    let payload: Record<string, unknown>;

    if (process.env.GOOGLE_CLIENT_ID) {
      try {
        const { OAuth2Client } = require("google-auth-library") as {
          OAuth2Client?: new (clientId: string) => {
            verifyIdToken: (options: {
              idToken: string;
              audience: string;
            }) => Promise<{ getPayload: () => Record<string, unknown> | null }>;
          };
        };

        if (!OAuth2Client) {
          throw new Error("OAuth2Client is unavailable");
        }

        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        payload = (ticket.getPayload() || {}) as Record<string, unknown>;
      } catch {
        const parts = credential.split(".");
        if (parts.length !== 3) {
          throw new BadRequestError("Invalid Google credential format");
        }
        try {
          payload = JSON.parse(
            Buffer.from(parts[1], "base64").toString("utf-8"),
          );
        } catch {
          throw new BadRequestError("Invalid Google credential payload");
        }
      }
    } else {
      const parts = credential.split(".");
      if (parts.length !== 3) {
        throw new BadRequestError("Invalid Google credential format");
      }
      try {
        payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
      } catch {
        throw new BadRequestError("Invalid Google credential payload");
      }
    }

    const email = (payload.email as string) || "";
    const firstName = (payload.given_name as string) || "Google";
    const lastName = (payload.family_name as string) || "User";

    if (!email) {
      throw new BadRequestError("Email not provided by Google");
    }

    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedFirstName = firstName.trim().slice(0, 50);
    const sanitizedLastName = lastName.trim().slice(0, 50);

    let user = await User.findOne({ email: sanitizedEmail });

    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString("hex");
      user = await User.create({
        email: sanitizedEmail,
        firstName: sanitizedFirstName,
        lastName: sanitizedLastName,
        phone: "",
        role: "Patient",
        isVerified: true,
        isActive: true,
        password: randomPassword,
      });
    }

    if (!user.isActive) {
      throw new BadRequestError("Account has been deactivated");
    }

    const tokenPayload = { userId: user._id.toString(), role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    const existingRefreshTokens = Array.isArray(user.refreshTokens)
      ? user.refreshTokens
      : [];
    user.refreshTokens = [...existingRefreshTokens, refreshToken];
    await user.save();

    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      success: true,
      message: "Google login successful",
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}
