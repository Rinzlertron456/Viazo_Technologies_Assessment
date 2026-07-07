import React, { useEffect, useState, useCallback } from 'react';
import Button from '../../components/Button';
import api, { ApiResponse } from '../../services/api';
import styles from './Receptionist.module.css';

interface QueuePatient {
  _id: string;
  patientName: string;
  patientId?: {
    _id: string;
    name: string;
  };
  doctorName?: string;
  doctorId?: {
    _id: string;
    name: string;
  };
  appointmentTime?: string;
  time?: string;
  status: 'waiting' | 'checkedIn' | 'inProgress' | 'completed';
}

const Queue: React.FC = () => {
  const [queue, setQueue] = useState<QueuePatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchQueue = useCallback(async () => {
    try {
      setError('');
      const res: ApiResponse<QueuePatient[]> = await api.get<QueuePatient[]>('/receptionist/queue');
      if (res.success && res.data) {
        setQueue(res.data);
      } else {
        setError(res.message || 'Failed to load queue');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleCheckIn = async (id: string) => {
    try {
      const res = await api.patch<QueuePatient>(`/receptionist/check-in/${id}`);
      if (res.success) {
        setQueue((prev) =>
          prev.map((item) =>
            item._id === id ? { ...item, status: 'checkedIn' as const } : item
          )
        );
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Check-in failed');
    }
  };

  const getStatusClass = (status: string): string => {
    switch (status) {
      case 'waiting':
        return styles.statusWaiting;
      case 'checkedIn':
        return styles.statusCheckedIn;
      case 'inProgress':
        return styles.statusInProgress;
      case 'completed':
        return styles.statusCompleted;
      default:
        return '';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'checkedIn':
        return 'Checked In';
      case 'inProgress':
        return 'In Progress';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingMessage}>Loading queue...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Patient Queue</h1>

      {error && <div className={styles.errorMessage}>{error}</div>}

      {queue.length === 0 && !error ? (
        <div className={styles.loadingMessage}>No patients in queue</div>
      ) : (
        <div className={styles.queueGrid}>
          {queue.map((item) => (
            <div key={item._id} className={styles.queueCard}>
              <div className={styles.queueCardName}>
                {item.patientName ||
                  (item.patientId && typeof item.patientId === 'object'
                    ? (item.patientId as { name: string }).name
                    : 'Unknown Patient')}
              </div>
              <div className={styles.queueCardDetail}>
                Doctor:{' '}
                {item.doctorName ||
                  (item.doctorId && typeof item.doctorId === 'object'
                    ? (item.doctorId as { name: string }).name
                    : 'Not assigned')}
              </div>
              <div className={styles.queueCardDetail}>
                Time: {item.appointmentTime || item.time || 'N/A'}
              </div>
              <div className={styles.queueCardDetail}>
                <span className={`${styles.statusBadge} ${getStatusClass(item.status)}`}>
                  {getStatusLabel(item.status)}
                </span>
              </div>
              {item.status === 'waiting' && (
                <div className={styles.queueCardActions}>
                  <Button variant="primary" onClick={() => handleCheckIn(item._id)}>
                    Check In
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Queue;