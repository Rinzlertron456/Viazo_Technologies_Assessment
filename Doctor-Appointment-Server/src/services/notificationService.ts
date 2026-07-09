import { sendEmail } from './emailService';

export async function sendBookingConfirmation(patientEmail: string, doctorName: string, date: string, time: string): Promise<void> {
  await sendEmail(
    patientEmail,
    'Appointment Confirmed - MediBook',
    `Your appointment with Dr. ${doctorName} on ${date} at ${time} has been confirmed. Thank you for choosing MediBook.`
  );
}

export async function sendCancellationNotice(patientEmail: string, doctorName: string, date: string): Promise<void> {
  await sendEmail(
    patientEmail,
    'Appointment Cancelled - MediBook',
    `Your appointment with Dr. ${doctorName} on ${date} has been cancelled. If this was a mistake, please book a new appointment.`
  );
}

export async function sendPrescriptionReady(patientEmail: string, doctorName: string): Promise<void> {
  await sendEmail(
    patientEmail,
    'Prescription Ready - MediBook',
    `Dr. ${doctorName} has uploaded a new prescription for you. Please login to MediBook to view it.`
  );
}
