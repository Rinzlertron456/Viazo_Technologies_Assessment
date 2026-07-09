import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { getTodayQueue, walkInRegistration, checkInPatient, createBill, getReceptionistPatients, getReceptionistAppointments } from '../controllers/receptionist.controller';

const router = Router();
router.get('/queue', authenticate, authorize('Receptionist'), getTodayQueue);
router.get('/patients', authenticate, authorize('Receptionist'), getReceptionistPatients);
router.get('/appointments', authenticate, authorize('Receptionist'), getReceptionistAppointments);
router.post('/walk-in', authenticate, authorize('Receptionist'), walkInRegistration);
router.patch('/check-in/:id', authenticate, authorize('Receptionist'), checkInPatient);
router.post('/bills', authenticate, authorize('Receptionist'), createBill);

export default router;
