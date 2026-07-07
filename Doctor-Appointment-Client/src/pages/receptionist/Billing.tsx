import { useState } from 'react';
import { Button } from '../../components/Button';
import { api } from '../../services/api';
import styles from './Receptionist.module.css';

export function Billing() {
  const [appointmentId, setAppointmentId] = useState('');
  const [patientId, setPatientId] = useState('');
  const [consultationFee, setConsultationFee] = useState('');
  const [discount, setDiscount] = useState('0');
  const [tax, setTax] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!appointmentId || !patientId || !consultationFee) { setMessage('Fill required fields'); return; }
    setSubmitting(true); setMessage('');
    try {
      const res = await api.post<{ success: boolean; message: string }>('/receptionist/bills', {
        appointmentId, patientId,
        consultationFee: parseFloat(consultationFee),
        discount: parseFloat(discount),
        tax: parseFloat(tax),
        paymentMethod: paymentMethod || undefined,
      });
      if (res.success) {
        setMessage('Bill created!');
        setAppointmentId(''); setPatientId(''); setConsultationFee(''); setDiscount('0'); setTax('0'); setPaymentMethod('');
      } else setMessage(res.message || 'Failed');
    } catch { setMessage('Failed to create bill'); } finally { setSubmitting(false); }
  }

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Billing</h1>
      <p className={styles.pageSubtitle}>Create invoice for appointment</p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Appointment ID *</label>
          <input className={styles.formInput} value={appointmentId} onChange={(e) => setAppointmentId(e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Patient ID *</label>
          <input className={styles.formInput} value={patientId} onChange={(e) => setPatientId(e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Consultation Fee *</label>
          <input className={styles.formInput} type="number" min="0" value={consultationFee} onChange={(e) => setConsultationFee(e.target.value)} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Discount</label>
            <input className={styles.formInput} type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Tax</label>
            <input className={styles.formInput} type="number" min="0" value={tax} onChange={(e) => setTax(e.target.value)} />
          </div>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Payment Method</label>
          <select className={styles.formSelect} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="">Select...</option>
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="UPI">UPI</option>
            <option value="Insurance">Insurance</option>
          </select>
        </div>
        {message && <p style={{ color: message.includes('created') ? '#2e7d32' : '#c62828' }}>{message}</p>}
        <Button variant="primary" type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create Bill'}</Button>
      </form>
    </div>
  );
}
