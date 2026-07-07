import { useEffect, useState } from 'react';
import { Button } from '../../components/Button';
import { api } from '../../services/api';
import styles from './Receptionist.module.css';

interface QueueItem {
  _id: string;
  patientId: { _id: string; firstName: string; lastName: string; phone: string };
  doctorId: { firstName: string; lastName: string };
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  reason: string;
}

export function Queue() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadQueue() {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: { queue: QueueItem[] } }>('/receptionist/queue');
      if (res.success) setQueue(res.data.queue);
    } catch { /* */ } finally { setLoading(false); }
  }

  useEffect(() => { loadQueue(); }, []);

  async function handleCheckIn(id: string) {
    try {
      const res = await api.patch<{ success: boolean }>(`/receptionist/check-in/${id}`, {});
      if (res.success) loadQueue();
    } catch { alert('Check-in failed'); }
  }

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Patient Queue</h1>
      <p className={styles.pageSubtitle}>Today's appointments</p>

      {loading ? (
        <p className={styles.loadingText}>Loading queue...</p>
      ) : queue.length === 0 ? (
        <p className={styles.loadingText}>No patients in queue today</p>
      ) : (
        queue.map((item) => (
          <div key={item._id} className={styles.card}>
            <div className={styles.cardInfo}>
              <strong>{item.patientId?.firstName} {item.patientId?.lastName}</strong>
              <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: '#555' }}>
                Dr. {item.doctorId?.firstName} {item.doctorId?.lastName} | {item.startTime} | {item.reason}
              </p>
              <span className={styles.statusBadge}>{item.status}</span>
            </div>
            {item.status === 'Confirmed' && (
              <Button variant="primary" onClick={() => handleCheckIn(item._id)}>Check In</Button>
            )}
          </div>
        ))
      )}
    </div>
  );
}
