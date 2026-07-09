import { useEffect, useState } from 'react';
import { Button } from '../../components/Button';
import { Select } from '../../components/Select';
import { PatientSelect, type SelectablePatient } from '../../components/PatientSelect';
import { api } from '../../services/api';
import { statusLabel } from '../../utils/statusLabels';
import styles from './Receptionist.module.css';

interface ApptOption {
  _id: string;
  patientName: string;
  patientCustomId: string;
  doctorName: string;
  startTime: string;
  status: string;
}

export function Billing() {
  const [appointmentId, setAppointmentId] = useState('');
  const [patientId, setPatientId] = useState('');
  const [patients, setPatients] = useState<SelectablePatient[]>([]);
  const [appointments, setAppointments] = useState<ApptOption[]>([]);
  const [consultationFee, setConsultationFee] = useState('');
  const [discount, setDiscount] = useState('0');
  const [tax, setTax] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadPatients() {
      try {
        const res = await api.get<{ success: boolean; data: { patients: SelectablePatient[] } }>('/receptionist/patients?limit=100');
        if (res.success) setPatients(res.data.patients);
      } catch { /* */ }
    }
    async function loadAppointments() {
      try {
        const res = await api.get<{ success: boolean; data: { appointments: ApptOption[] } }>('/receptionist/appointments?period=all&limit=100');
        if (res.success) setAppointments(res.data.appointments);
      } catch { /* */ }
    }
    loadPatients();
    loadAppointments();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!appointmentId || !patientId || !consultationFee) { setMessage('Fill required fields'); return; }
    setSubmitting(true); setMessage('');
    try {
      const res = await api.post<{ success: boolean; message: string }>('/receptionist/bills', {
        appointmentId, patientId,
        consultationFee: parseFloat(consultationFee),
        discount: parseFloat(numOrZero(discount)),
        tax: parseFloat(numOrZero(tax)),
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
        <PatientSelect
          id="patientId"
          label="Patient"
          patients={patients}
          value={patientId}
          onChange={setPatientId}
          required
        />

        <Select
          id="appointmentId"
          label="Appointment"
          placeholder="Select appointment..."
          searchable
          required
          options={appointments.map((a) => ({
            value: a._id,
            label: `${a.patientName} (${a.patientCustomId}) · ${a.doctorName} · ${a.startTime}`,
            sublabel: statusLabel(a.status),
          }))}
          value={appointmentId}
          onChange={setAppointmentId}
        />

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
        <Select
          id="paymentMethod"
          label="Payment Method"
          placeholder="Select payment method"
          searchable={false}
          options={[
            { value: 'Cash', label: 'Cash' },
            { value: 'Card', label: 'Card' },
            { value: 'UPI', label: 'UPI' },
            { value: 'Insurance', label: 'Insurance' },
          ]}
          value={paymentMethod}
          onChange={setPaymentMethod}
        />
        {message && <p style={{ color: message.includes('created') ? '#2e7d32' : '#c62828' }}>{message}</p>}
        <Button variant="primary" type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create Bill'}</Button>
      </form>
    </div>
  );
}

function numOrZero(v: string): string {
  const n = parseFloat(v);
  return Number.isFinite(n) ? String(n) : '0';
}
