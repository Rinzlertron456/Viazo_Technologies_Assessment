import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { auditLogger } from '../middleware/auditLogger';
import { searchDoctors, getDoctorProfile, bookAppointment, getMyAppointments, cancelAppointment, rescheduleAppointment, getPatientProfile, updatePatientProfile, getExtendedProfile, updateMedicalProfile, getMedicalRecords } from '../controllers/patient.controller';

const router = Router();
router.get('/search-doctors', searchDoctors);
router.get('/doctors/:doctorId', getDoctorProfile);
router.post('/book', authenticate, auditLogger('BOOK_APPOINTMENT', 'appointment'), bookAppointment);
router.get('/appointments', authenticate, getMyAppointments);
router.patch('/appointments/:id/cancel', authenticate, auditLogger('CANCEL_APPOINTMENT', 'appointment'), cancelAppointment);
router.patch('/appointments/:id/reschedule', authenticate, auditLogger('RESCHEDULE_APPOINTMENT', 'appointment'), rescheduleAppointment);
router.get('/profile', authenticate, getPatientProfile);
router.patch('/profile', authenticate, updatePatientProfile);
router.get('/profile/extended', authenticate, getExtendedProfile);
router.post('/profile/medical', authenticate, auditLogger('UPDATE_MEDICAL_PROFILE', 'patient'), updateMedicalProfile);
router.get('/records', authenticate, getMedicalRecords);

export default router;
