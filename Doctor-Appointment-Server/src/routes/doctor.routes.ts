import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { getDoctorAppointments, getPatientDetailsForDoctor, createPrescription, getSchedule, createSlots, deleteDoctorAppointments } from '../controllers/doctor.controller';

const router = Router();
router.get('/appointments', authenticate, authorize('Doctor'), getDoctorAppointments);
router.delete('/appointments', authenticate, authorize('Doctor'), deleteDoctorAppointments);
router.get('/patients/:patientId', authenticate, authorize('Doctor'), getPatientDetailsForDoctor);
router.post('/prescriptions', authenticate, authorize('Doctor'), createPrescription);
router.get('/schedule', authenticate, authorize('Doctor'), getSchedule);
router.post('/schedule', authenticate, authorize('Doctor'), createSlots);

export default router;
