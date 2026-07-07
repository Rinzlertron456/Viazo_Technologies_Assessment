import { useEffect, useState } from 'react';
import { Button } from '../../components/Button';
import { api } from '../../services/api';
import styles from './Receptionist.module.css';

interface Doctor {
  _id: string;
  firstName: string;
  lastName: string;
}

export function WalkIn() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadDoctors() {
      try {
        const res = await api.get<{ success: boolean; data: { doctors: Doctor[] } }>('/patient/search-doctors?limit=50');
        if (res.success) setDoctors(res.data.doctors);
      } catch { /* */ }
    }
    loadDoctors();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientId || !doctorId || !reason) { setMessage('Fill all fields'); return; }
    setSubmitting(true);
    setMessage('');
    try {
      const res = await api.post<{ success: boolean; message: string }>('/receptionist/walk-in', { patientId, doctorId, reason });
      if (res.success) {
        setMessage('Walk-in registered!');
        setPatientId(''); setDoctorId(''); setReason('');
      } else setMessage(res.message || 'Failed');
    } catch { setMessage('Registration failed'); } finally { setSubmitting(false); }
  }

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Walk-in Registration</h1>
      <p className={styles.pageSubtitle}>Register a walk-in patient</p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Patient ID *</label>
          <input className={styles.formInput} value={patientId} onChange={(e) => setPatientId(e.target.value)} placeholder="Enter patient user ID" />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Doctor *</label>
          <select className={styles.formSelect} value={doctorId} onChange={(e) => setDoctorId(e.target.value)} required>
            <option value="">Select doctor...</option>
            {doctors.map((d) => (
              <option key={d._id} value={d._id}>Dr. {d.firstName} {d.lastName}</option>
            ))}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Reason *</label>
          <textarea className={styles.textarea} value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        {message && <p style={{ color: message.includes('registered') ? '#2e7d32' : '#c62828' }}>{message}</p>}
        <Button variant="primary" type="submit" disabled={submitting}>{submitting ? 'Registering...' : 'Register Walk-in'}</Button>
      </form>
    </div>
  );
}
