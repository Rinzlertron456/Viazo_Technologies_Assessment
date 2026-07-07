import { Router } from 'express';
import { register, login, logout, refreshTokenHandler, forgotPassword, resetPassword, changePassword, me } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh-token', refreshTokenHandler);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/change-password', authenticate, changePassword);
router.get('/me', authenticate, me);

export default router;
