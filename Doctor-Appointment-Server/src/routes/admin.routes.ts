import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { getAllDoctors, addDoctor, toggleDoctorStatus, getAllPatients, getAllAppointments } from '../controllers/admin.controller';

const router = Router();
router.get('/doctors', authenticate, authorize('Admin', 'SuperAdmin'), getAllDoctors);
router.post('/doctors', authenticate, authorize('Admin', 'SuperAdmin'), addDoctor);
router.patch('/doctors/:doctorId/toggle-status', authenticate, authorize('Admin', 'SuperAdmin'), toggleDoctorStatus);
router.get('/patients', authenticate, authorize('Admin', 'SuperAdmin'), getAllPatients);
router.get('/appointments', authenticate, authorize('Admin', 'SuperAdmin'), getAllAppointments);

export default router;
