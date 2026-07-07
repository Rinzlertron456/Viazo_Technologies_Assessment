import React, { useState, useEffect, useCallback } from 'react';
import api, { ApiResponse } from '../../services/api';
import styles from './Admin.module.css';

interface Appointment {
  _id: string;
  patient?: {
    _id: string;
    name: string;
  };
  patientName?: string;
  doctor?: {
    _id: string;
    name: string;
  };
  doctorName?: string;
  date?: string;
  appointmentDate?: string;
  time?: string;
  appointmentTime?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  paymentStatus?: 'paid' | 'unpaid' | 'pending';
  payment?: {
    status: 'paid' | 'unpaid' | 'pending';
  };
}

const getPatientName = (appt: Appointment): string => {
  if (appt.patient && typeof appt.patient === 'object') return appt.patient.name;
  return appt.patientName || 'N/A';
};

const getDoctorName = (appt: Appointment): string => {
  if (appt.doctor && typeof appt.doctor === 'object') return appt.doctor.name;
  return appt.doctorName || 'N/A';
};

const getDate = (appt: Appointment): string => {
  const raw = appt.date || appt.appointmentDate || '';
  if (!raw) return 'N/A';
  try {
    return new Date(raw).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return raw;
  }
};

const getTime = (appt: Appointment): string => {
  return appt.time || appt.appointmentTime || 'N/A';
};

const getPaymentStatus = (appt: Appointment): string => {
  if (appt.payment && appt.payment.status) return appt.payment.status;
  return appt.paymentStatus || 'unpaid';
};

const getStatusClass = (status: string): string => {
  switch (status) {
    case 'scheduled':
      return styles.statusScheduled;
    case 'completed':
      return styles.statusCompleted;
    case 'cancelled':
      return styles.statusCancelled;
    case 'paid':
      return styles.statusPaid;
    case 'unpaid':
      return styles.statusUnpaid;
    case 'pending':
      return styles.statusPending;
    default:
      return '';
  }
};

const AllAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAppointments = useCallback(async () => {
    try {
      setError('');
      const res: ApiResponse<Appointment[]> = await api.get<Appointment[]>('/admin/appointments');
      if (res.success && res.data) {
        setAppointments(res.data);
      } else {
        setError(res.message || 'Failed to load appointments');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingMessage}>Loading appointments...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>All Appointments</h1>

      {error && <div className={styles.errorMessage}>{error}</div>}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
              <th>Payment</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                  No appointments found
                </td>
              </tr>
            ) : (
              appointments.map((appt) => {
                const payStatus = getPaymentStatus(appt);
                return (
                  <tr key={appt._id}>
                    <td>{getPatientName(appt)}</td>
                    <td>{getDoctorName(appt)}</td>
                    <td>{getDate(appt)}</td>
                    <td>{getTime(appt)}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${getStatusClass(appt.status)}`}>
                        {appt.status}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${getStatusClass(payStatus)}`}>
                        {payStatus}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AllAppointments;