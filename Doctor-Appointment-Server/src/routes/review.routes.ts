import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { createReview, getDoctorReviews, replyToReview } from '../controllers/review.controller';

const router = Router();
router.post('/', authenticate, authorize('Patient'), createReview);
router.get('/doctor/:doctorId', getDoctorReviews);
router.post('/:id/reply', authenticate, authorize('Doctor'), replyToReview);

export default router;
