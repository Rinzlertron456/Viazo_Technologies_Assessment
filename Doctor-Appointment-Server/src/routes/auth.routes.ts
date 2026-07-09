import { Router } from "express";
import {
  register,
  login,
  logout,
  refreshTokenHandler,
  forgotPassword,
  resetPassword,
  changePassword,
  me,
  verifyEmail,
  resendVerification,
  generateTwoFactorSecret,
  verifyTwoFactor,
} from "../controllers/auth.controller";
import { googleLogin } from "../controllers/social.controller";
import { validateRecaptcha } from "../middleware/Recaptcha";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post("/register", validateRecaptcha, register);
router.post("/login", validateRecaptcha, login);
router.post("/logout", logout);
router.post("/refresh-token", refreshTokenHandler);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/change-password", authenticate, changePassword);
router.get("/me", authenticate, me);
router.post("/google", googleLogin);
router.post("/2fa/generate", authenticate, generateTwoFactorSecret);
router.post("/2fa/verify", authenticate, verifyTwoFactor);

export default router;
