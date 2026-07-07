import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { getRevenueReport, getDoctorPerformance, getPatientGrowth, getNoShowReport } from '../controllers/reports.controller';

const router = Router();
router.get('/revenue', authenticate, authorize('Admin', 'SuperAdmin'), getRevenueReport);
router.get('/doctor-performance', authenticate, authorize('Admin', 'SuperAdmin'), getDoctorPerformance);
router.get('/patient-growth', authenticate, authorize('Admin', 'SuperAdmin'), getPatientGrowth);
router.get('/no-show', authenticate, authorize('Admin', 'SuperAdmin'), getNoShowReport);

export default router;
