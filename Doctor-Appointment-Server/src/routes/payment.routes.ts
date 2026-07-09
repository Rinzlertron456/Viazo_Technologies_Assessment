import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { createPaymentOrder, verifyPayment } from '../controllers/payment.controller';

const router = Router();
router.post('/create-order', authenticate, createPaymentOrder);
router.post('/verify', authenticate, verifyPayment);

export default router;
