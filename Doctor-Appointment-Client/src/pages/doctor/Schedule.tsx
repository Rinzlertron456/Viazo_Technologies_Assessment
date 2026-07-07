import { useEffect, useState } from 'react';
import { Button } from '../../components/Button';
import { api } from '../../services/api';
import styles from './Doctor.module.css';

export function Schedule() {
  const [slots, setSlots] = useState<Array<{ _id: string; date: string; startTime: string; endTime: string; isBooked: boolean; maxPatients: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [maxPatients, setMaxPatients] = useState('1');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  async function loadSlots() {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: { slots: typeof slots } }>('/doctor/schedule');
      if (res.success) setSlots(res.data.slots);
    } catch { /* */ } finally { setLoading(false); }
  }

  useEffect(() => { loadSlots(); }, []);

  async function handleCreateSlot(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !startTime || !endTime) { setMessage('Fill all fields'); return; }
    setSubmitting(true);
    setMessage('');
    try {
      const res = await api.post<{ success: boolean; message: string }>('/doctor/schedule', {
        slots: [{ date, startTime, endTime, maxPatients: parseInt(maxPatients, 10) }],
      });
      if (res.success) {
        setMessage('Slot created!');
        setDate(''); setStartTime(''); setEndTime(''); setMaxPatients('1');
        loadSlots();
      } else setMessage(res.message || 'Failed');
    } catch { setMessage('Failed to create slot'); } finally { setSubmitting(false); }
  }

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>My Schedule</h1>
      <p className={styles.pageSubtitle}>Manage your available slots</p>

      <form className={styles.form} onSubmit={handleCreateSlot}>
        <h3>Create New Slot</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 80px', gap: '0.75rem' }}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Date</label>
            <input className={styles.formInput} type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Start</label>
            <input className={styles.formInput} type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>End</label>
            <input className={styles.formInput} type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Patients</label>
            <input className={styles.formInput} type="number" min="1" value={maxPatients} onChange={(e) => setMaxPatients(e.target.value)} />
          </div>
        </div>
        {message && <p style={{ color: message.includes('created') ? '#2e7d32' : '#c62828', fontSize: '0.85rem' }}>{message}</p>}
        <Button variant="primary" type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Add Slot'}</Button>
      </form>

      <h3 style={{ marginTop: '2rem' }}>Your Slots (Next 7 Days)</h3>
      {loading ? (
        <p className={styles.loadingText}>Loading...</p>
      ) : slots.length === 0 ? (
        <p className={styles.loadingText}>No slots created yet</p>
      ) : (
        <div className={styles.slotsGrid}>
          {slots.map((slot) => (
            <div key={slot._id} className={styles.slotCard}>
              <strong>{new Date(slot.date).toLocaleDateString()}</strong>
              <p style={{ margin: '0.25rem 0', fontSize: '0.85rem' }}>{slot.startTime} - {slot.endTime}</p>
              <span style={{ fontSize: '0.8rem', color: slot.isBooked ? '#c62828' : '#2e7d32' }}>
                {slot.isBooked ? 'Booked' : `Available (${slot.maxPatients} max)`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
