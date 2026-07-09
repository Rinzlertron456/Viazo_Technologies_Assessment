import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { statusLabel } from '../../utils/statusLabels';
import styles from './Admin.module.css';

interface Appointment {
  _id: string;
  patientId: { firstName: string; lastName: string; email: string; phone: string };
  doctorId: { firstName: string; lastName: string };
  date: string;
  startTime: string;
  status: string;
  type: string;
  paymentStatus: string;
  totalAmount: number;
}

export function AllAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<{ success: boolean; data: { appointments: Appointment[] } }>('/admin/appointments?limit=50');
        if (res.success) setAppointments(res.data.appointments);
      } catch { /* */ } finally { setLoading(false); }
    }
    load();
  }, []);

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>All Appointments</h1>
      <p className={styles.pageSubtitle}>{appointments.length} appointments</p>

      {loading ? <p className={styles.loadingText}>Loading...</p> : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a._id}>
                <td>{a.patientId?.firstName} {a.patientId?.lastName}</td>
                <td>Dr. {a.doctorId?.firstName} {a.doctorId?.lastName}</td>
                <td>{new Date(a.date).toLocaleDateString()}</td>
                <td>{a.startTime}</td>
                 <td><span className={`${styles.badge} ${a.status === 'Completed' ? styles.badgeActive : styles.badgeInactive}`}>{statusLabel(a.status)}</span></td>
                <td>{a.paymentStatus}</td>
                <td>₹{a.totalAmount}</td>
              </tr>
            ))}
            {appointments.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>No appointments</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
}
