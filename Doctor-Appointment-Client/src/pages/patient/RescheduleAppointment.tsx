import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { api } from '../../services/api';
import styles from './Patient.module.css';

export function RescheduleAppointment() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<{ _id: string; doctorId: { firstName: string; lastName: string }; date: string; startTime: string; endTime: string; reason: string; status: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<{ success: boolean; data: { appointments: Array<{ _id: string; doctorId: { firstName: string; lastName: string }; date: string; startTime: string; endTime: string; reason: string; status: string }> } }>('/patient/appointments');
        if (res.success) {
          const a = res.data.appointments.find((a) => a._id === appointmentId);
          if (a) {
            setAppointment(a);
            setDate(a.date.split('T')[0]);
            setStartTime(a.startTime);
          }
        }
      } catch { /* */ } finally { setLoading(false); }
    }
    load();
  }, [appointmentId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !startTime) { setError('Date and time required'); return; }
    setSubmitting(true); setError('');
    try {
      const endHour = parseInt(startTime.split(':')[0], 10) + 1;
      const endTime = `${String(endHour).padStart(2, '0')}:${startTime.split(':')[1] || '00'}`;
      const res = await api.patch<{ success: boolean; message: string }>(`/patient/appointments/${appointmentId}/reschedule`, { date, startTime, endTime });
      if (res.success) navigate('/patient/appointments');
      else setError(res.message || 'Failed');
    } catch { setError('Failed to reschedule'); } finally { setSubmitting(false); }
  }

  if (loading) return <div className={styles.pageContainer}><p className={styles.loadingText}>Loading appointment...</p></div>;
  if (!appointment) return <div className={styles.pageContainer}><p className={styles.loadingText}>Appointment not found</p></div>;

  return (
    <div className={styles.pageContainer}>
      <span className={styles.backLink} onClick={() => navigate('/patient/appointments')}>&larr; Back to Appointments</span>
      <h1 className={styles.pageTitle}>Reschedule Appointment</h1>

      <div className={styles.profileDetails}>
        <p><strong>Doctor:</strong> Dr. {appointment.doctorId?.firstName} {appointment.doctorId?.lastName}</p>
        <p><strong>Current:</strong> {new Date(appointment.date).toLocaleDateString()} at {appointment.startTime}</p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>New Date *</label>
          <input className={styles.formInput} type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>New Time *</label>
          <input className={styles.formInput} type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>
        {error && <p className={styles.errorText}>{error}</p>}
        <Button variant="primary" type="submit" disabled={submitting}>{submitting ? 'Rescheduling...' : 'Confirm Reschedule'}</Button>
      </form>
    </div>
  );
}
