import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from '../utils/errors';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema } from '../validators/auth.validator';
import crypto from 'crypto';

function setRefreshTokenCookie(res: Response, token: string): void {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = registerSchema.parse(req.body);

    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new ConflictError('A user with this email already exists');
    }

    const user = await User.create(data);

    const tokenPayload = { userId: user._id.toString(), role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    user.refreshTokens.push(refreshToken);
    await user.save();

    setRefreshTokenCookie(res, refreshToken);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
        },
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = loginSchema.parse(req.body);

    const user = await User.findOne({ email: data.email }).select('+password +refreshTokens');
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account has been deactivated. Contact support.');
    }

    const isPasswordValid = await user.comparePassword(data.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const tokenPayload = { userId: user._id.toString(), role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    user.refreshTokens.push(refreshToken);
    await user.save();

    setRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
        },
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, _next: NextFunction): Promise<void> {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      const decoded = verifyRefreshToken(refreshToken);
      await User.findByIdAndUpdate(decoded.userId, {
        $pull: { refreshTokens: refreshToken },
      });
    }

    res.clearCookie('refreshToken', { path: '/' });
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch {
    res.clearCookie('refreshToken', { path: '/' });
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  }
}

export async function refreshTokenHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const incomingToken = req.cookies?.refreshToken;
    if (!incomingToken) {
      throw new UnauthorizedError('Refresh token required');
    }

    const decoded = verifyRefreshToken(incomingToken);

    const user = await User.findById(decoded.userId).select('+refreshTokens');
    if (!user || !user.refreshTokens.includes(incomingToken)) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    user.refreshTokens = user.refreshTokens.filter((t) => t !== incomingToken);

    const tokenPayload = { userId: user._id.toString(), role: user.role };
    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    user.refreshTokens.push(newRefreshToken);
    await user.save();

    setRefreshTokenCookie(res, newRefreshToken);

    res.status(200).json({
      success: true,
      data: { accessToken: newAccessToken },
    });
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = forgotPasswordSchema.parse(req.body);

    const user = await User.findOne({ email: data.email });
    if (!user) {
      // Return success even if email not found (security best practice)
      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = resetExpiry;
    await user.save();

    // In production, send email with resetToken
    // For MVP, return the token in development mode
    const responseData = process.env.NODE_ENV === 'development'
      ? { resetToken }
      : {};

    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
      ...responseData,
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = resetPasswordSchema.parse(req.body);

    const hashedToken = crypto.createHash('sha256').update(data.token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestError('Invalid or expired reset token');
    }

    user.password = data.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshTokens = [];
    await user.save();

    res.clearCookie('refreshToken', { path: '/' });

    res.status(200).json({
      success: true,
      message: 'Password reset successful. Please login with your new password.',
    });
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const data = changePasswordSchema.parse(req.body);

    const user = await User.findById(req.user.userId).select('+password');
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isPasswordValid = await user.comparePassword(data.currentPassword);
    if (!isPasswordValid) {
      throw new BadRequestError('Current password is incorrect');
    }

    user.password = data.newPassword;
    user.refreshTokens = [];
    await user.save();

    res.clearCookie('refreshToken', { path: '/' });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please login again.',
    });
  } catch (error) {
    next(error);
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
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
