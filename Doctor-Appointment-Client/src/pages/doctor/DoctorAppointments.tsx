import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { api } from '../../services/api';
import styles from './Doctor.module.css';

interface Appointment {
  _id: string;
  patientId: { _id: string; firstName: string; lastName: string; phone: string; email: string };
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  type: string;
  reason: string;
}

export function DoctorAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  async function loadAppointments(statusFilter = '') {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      params.set('limit', '50');
      const res = await api.get<{ success: boolean; data: { appointments: Appointment[] } }>(`/doctor/appointments?${params}`);
      if (res.success) setAppointments(res.data.appointments);
    } catch { /* */ } finally { setLoading(false); }
  }

  useEffect(() => { loadAppointments(); }, []);

  function handleFilter(status: string) {
    setFilter(status);
    loadAppointments(status === filter ? '' : status);
  }

  const filters = ['Today', 'Pending', 'Confirmed', 'CheckedIn', 'InProgress', 'Completed'];

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>My Appointments</h1>
      <p className={styles.pageSubtitle}>Manage your patient appointments</p>

      <div className={styles.filterRow}>
        {filters.map((f) => (
          <button
            key={f}
            className={`${styles.filterBtn} ${filter === f ? styles.filterBtnActive : ''}`}
            onClick={() => handleFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <p className={styles.loadingText}>Loading appointments...</p>
      ) : appointments.length === 0 ? (
        <p className={styles.loadingText}>No appointments found</p>
      ) : (
        appointments.map((a) => (
          <div key={a._id} className={styles.appointmentCard}>
            <div className={styles.appointmentInfo}>
              <strong>{a.patientId?.firstName} {a.patientId?.lastName}</strong>
              <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: '#555' }}>
                {new Date(a.date).toLocaleDateString()} | {a.startTime} - {a.endTime} | {a.type}
              </p>
              <span className={`${styles.statusBadge} ${styles[`status${a.status}` as keyof typeof styles] || ''}`}>
                {a.status}
              </span>
            </div>
            <Button variant="primary" onClick={() => navigate(`/doctor/patients/${a.patientId?._id}`)}>
              View Patient
            </Button>
          </div>
        ))
      )}
    </div>
  );
}
