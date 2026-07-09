import { Request, Response, NextFunction } from "express";
import { User } from "../models/User";
import { DoctorProfile } from "../models/DoctorProfile";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../utils/errors";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "../validators/auth.validator";
import crypto from "crypto";
import speakeasy from "speakeasy";
import {
  setAccessTokenCookie,
  setRefreshTokenCookie,
  clearAuthCookies,
} from "../utils/cookies";

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = registerSchema.parse(req.body);

    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new ConflictError("A user with this email already exists");
    }

    const user = await User.create(data);

    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");
    user.verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    if (data.role === "Doctor") {
      try {
        await DoctorProfile.create({
          userId: user._id,
          verificationStatus: "pending",
        });
      } catch (error) {
        await User.findByIdAndDelete(user._id);
        throw error;
      }
    }

    const tokenPayload = { userId: user._id.toString(), role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    user.refreshTokens.push(refreshToken);
    await user.save();

    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        user: {
          id: user._id,
          customId: user.customId,
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

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = loginSchema.parse(req.body);

    const user = await User.findOne({ email: data.email }).select(
      "+password +refreshTokens",
    );
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    if (!user.isActive) {
      throw new UnauthorizedError(
        "Account has been deactivated. Contact support.",
      );
    }

    const isPasswordValid = await user.comparePassword(data.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const tokenPayload = { userId: user._id.toString(), role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    user.refreshTokens.push(refreshToken);
    await user.save();

    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          customId: user.customId,
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

export async function logout(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      const decoded = verifyRefreshToken(refreshToken);
      await User.findByIdAndUpdate(decoded.userId, {
        $pull: { refreshTokens: refreshToken },
      });
    }

    clearAuthCookies(res);
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch {
    clearAuthCookies(res);
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  }
}

export async function refreshTokenHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const incomingToken = req.cookies?.refreshToken;
    if (!incomingToken) {
      throw new UnauthorizedError("Refresh token required");
    }

    const decoded = verifyRefreshToken(incomingToken);

    const user = await User.findById(decoded.userId).select("+refreshTokens");
    if (!user || !user.refreshTokens.includes(incomingToken)) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    user.refreshTokens = user.refreshTokens.filter((t) => t !== incomingToken);

    const tokenPayload = { userId: user._id.toString(), role: user.role };
    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    user.refreshTokens.push(newRefreshToken);
    await user.save();

    setAccessTokenCookie(res, newAccessToken);
    setRefreshTokenCookie(res, newRefreshToken);

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
    });
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = forgotPasswordSchema.parse(req.body);

    const user = await User.findOne({ email: data.email });
    if (!user) {
      // Return success even if email not found (security best practice)
      res.status(200).json({
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.passwordResetExpires = resetExpiry;
    await user.save();

    res.status(200).json({
      success: true,
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = resetPasswordSchema.parse(req.body);

    const hashedToken = crypto
      .createHash("sha256")
      .update(data.token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestError("Invalid or expired reset token");
    }

    user.password = data.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshTokens = [];
    await user.save();

    clearAuthCookies(res);

    res.status(200).json({
      success: true,
      message:
        "Password reset successful. Please login with your new password.",
    });
  } catch (error) {
    next(error);
  }
}

export async function changePassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError("Authentication required");
    }

    const data = changePasswordSchema.parse(req.body);

    const user = await User.findById(req.user.userId).select("+password");
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const isPasswordValid = await user.comparePassword(data.currentPassword);
    if (!isPasswordValid) {
      throw new BadRequestError("Current password is incorrect");
    }

    user.password = data.newPassword;
    user.refreshTokens = [];
    await user.save();

    clearAuthCookies(res);

    res.status(200).json({
      success: true,
      message: "Password changed successfully. Please login again.",
    });
  } catch (error) {
    next(error);
  }
}

export async function me(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError("Authentication required");
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          customId: user.customId,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          isVerified: user.isVerified,
          profilePicture: user.profilePicture,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyEmail(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { token } = req.query;
    if (!token || typeof token !== "string") {
      throw new BadRequestError("Verification token is required");
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestError("Invalid or expired verification token");
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    next(error);
  }
}

export async function resendVerification(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email } = req.body;
    if (!email) {
      throw new BadRequestError("Email is required");
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Return success even if email not found (security best practice)
      res.status(200).json({
        success: true,
        message:
          "If an account with that email exists, a verification email has been sent.",
      });
      return;
    }

    if (user.isVerified) {
      res.status(200).json({
        success: true,
        message: "Email is already verified.",
      });
      return;
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");
    user.verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await user.save();

    // In production, send email with verificationToken
    // For MVP, log the token
    console.log(
      `Resent email verification token for ${user.email}: ${verificationToken}`,
    );

    res.status(200).json({
      success: true,
      message:
        "If an account with that email exists, a verification email has been sent.",
    });
  } catch (error) {
    next(error);
  }
}

export async function generateTwoFactorSecret(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError("Authentication required");
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const secret = speakeasy.generateSecret({
      name: `ViazoTechnologies:${user.email}`,
    });

    user.twoFactorSecret = secret.base32;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        secret: secret.base32,
        otpauth_url: secret.otpauth_url,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyTwoFactor(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError("Authentication required");
    }

    const { token } = req.body;
    if (!token) {
      throw new BadRequestError("Token is required");
    }

    const user = await User.findById(req.user.userId).select(
      "+twoFactorSecret",
    );
    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (!user.twoFactorSecret) {
      throw new BadRequestError(
        "Two-factor authentication has not been set up",
      );
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token,
    });

    if (verified) {
      user.twoFactorEnabled = true;
      await user.save();
    }

    res.status(200).json({
      success: true,
      data: { verified },
    });
  } catch (error) {
    next(error);
  }
}
