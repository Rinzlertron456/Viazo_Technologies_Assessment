import { useEffect, useState } from 'react';
import { Button } from '../../components/Button';
import { FieldError } from '../../components/FieldError';
import { PatientSelect, type SelectablePatient } from '../../components/PatientSelect';
import { Select } from '../../components/Select';
import { api, getErrorMessage } from '../../services/api';
import { isNonEmpty, maxLength } from '../../utils/validation';
import styles from './Receptionist.module.css';

interface Doctor {
  _id: string;
  firstName: string;
  lastName: string;
}

export function WalkIn() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<SelectablePatient[]>([]);
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadDoctors() {
      try {
        const res = await api.get<{ success: boolean; data: { doctors: Doctor[] } }>('/patient/search-doctors?limit=50');
        if (res.success) setDoctors(res.data.doctors);
      } catch { /* */ }
    }
    async function loadPatients() {
      try {
        const res = await api.get<{ success: boolean; data: { patients: SelectablePatient[] } }>('/receptionist/patients?limit=100');
        if (res.success) setPatients(res.data.patients);
      } catch { /* */ }
    }
    loadDoctors();
    loadPatients();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!isNonEmpty(patientId)) newErrors.patientId = 'Patient is required.';
    if (!isNonEmpty(doctorId)) newErrors.doctorId = 'Please select a doctor.';
    if (!isNonEmpty(reason)) newErrors.reason = 'Reason is required.';
    else if (!maxLength(reason, 500)) newErrors.reason = 'Reason must be under 500 characters.';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    setMessage('');
    try {
      const res = await api.post<{ success: boolean; message: string }>('/receptionist/walk-in', { patientId, doctorId, reason });
      if (res.success) {
        setMessage('Walk-in registered!');
        setPatientId(''); setDoctorId(''); setReason('');
        setErrors({});
      } else setMessage(res.message || 'Failed to register walk-in');
    } catch (err) { setMessage(getErrorMessage(err)); } finally { setSubmitting(false); }
  }

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Walk-in Registration</h1>
      <p className={styles.pageSubtitle}>Register a walk-in patient</p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <PatientSelect
          id="patientId"
          label="Patient"
          patients={patients}
          value={patientId}
          onChange={(id) => { setPatientId(id); if (errors.patientId) setErrors((x) => ({ ...x, patientId: '' })); }}
          error={errors.patientId}
          required
        />

        <Select
          id="doctorId"
          label="Doctor"
          placeholder="Select doctor..."
          searchable
          required
          options={doctors.map((d) => ({ value: d._id, label: `Dr. ${d.firstName} ${d.lastName}` }))}
          value={doctorId}
          onChange={(id) => { setDoctorId(id); if (errors.doctorId) setErrors((x) => ({ ...x, doctorId: '' })); }}
          error={errors.doctorId}
        />

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Reason *</label>
          <textarea className={styles.textarea} value={reason} onChange={(e) => { setReason(e.target.value); if (errors.reason) setErrors((x) => ({ ...x, reason: '' })); }} aria-invalid={!!errors.reason} />
          <FieldError message={errors.reason} />
        </div>
        {message && <p style={{ color: message.includes('registered') ? '#2e7d32' : '#c62828' }}>{message}</p>}
        <Button variant="primary" type="submit" disabled={submitting}>{submitting ? 'Registering...' : 'Register Walk-in'}</Button>
      </form>
    </div>
  );
}
