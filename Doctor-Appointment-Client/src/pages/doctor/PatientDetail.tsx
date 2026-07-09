import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { api } from '../../services/api';
import styles from './Doctor.module.css';

interface Medicine {
  name: string;
  dose: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export function PatientDetail() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<{ appointments: unknown[]; prescriptions: unknown[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPrescription, setShowPrescription] = useState(false);

  // Prescription form
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [observations, setObservations] = useState('');
  const [medicines, setMedicines] = useState<Medicine[]>([{ name: '', dose: '', frequency: '', duration: '', instructions: '' }]);
  const [advice, setAdvice] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<{ success: boolean; data: { appointments: unknown[]; prescriptions: unknown[] } }>(`/doctor/patients/${patientId}`);
        if (res.success) setData(res.data);
      } catch { /* */ } finally { setLoading(false); }
    }
    load();
  }, [patientId]);

  function addMedicine() {
    setMedicines([...medicines, { name: '', dose: '', frequency: '', duration: '', instructions: '' }]);
  }

  function updateMedicine(i: number, field: keyof Medicine, value: string) {
    const updated = [...medicines];
    updated[i] = { ...updated[i], [field]: value };
    setMedicines(updated);
  }

  function removeMedicine(i: number) {
    if (medicines.length === 1) return;
    setMedicines(medicines.filter((_, idx) => idx !== i));
  }

  async function handlePrescriptionSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAppointmentId) { setError('Select an appointment'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post<{ success: boolean; message: string }>('/doctor/prescriptions', {
        appointmentId: selectedAppointmentId,
        symptoms: symptoms.split(',').map(s => s.trim()).filter(Boolean),
        diagnosis: diagnosis.split(',').map(d => d.trim()).filter(Boolean),
        observations: observations || undefined,
        medicines: medicines.filter(m => m.name),
        labTests: [],
        advice: advice || undefined,
        followUpDate: followUpDate || undefined,
      });
      if (res.success) {
        setSuccess('Prescription created!');
        setShowPrescription(false);
        // Reload
        const res2 = await api.get<{ success: boolean; data: { appointments: unknown[]; prescriptions: unknown[] } }>(`/doctor/patients/${patientId}`);
        if (res2.success) setData(res2.data);
      } else setError(res.message || 'Failed');
    } catch { setError('Failed to create prescription'); } finally { setSubmitting(false); }
  }

  if (loading) return <div className={styles.pageContainer}><p className={styles.loadingText}>Loading patient details...</p></div>;
  if (!data) return <div className={styles.pageContainer}><p className={styles.loadingText}>Patient not found</p></div>;

  return (
    <div className={styles.pageContainer}>
      <span className={styles.backLink} onClick={() => navigate('/doctor/appointments')}>&larr; Back to Appointments</span>
      <h1 className={styles.pageTitle}>Patient Details</h1>

      {success && <div style={{ background: '#e8f5e9', border: '2px solid #2e7d32', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1rem', color: '#2e7d32', fontWeight: 600 }}>{success}</div>}

      {!showPrescription ? (
        <Button variant="primary" onClick={() => setShowPrescription(true)}>Write Prescription</Button>
      ) : (
        <form className={styles.form} onSubmit={handlePrescriptionSubmit} style={{ marginTop: '1rem' }}>
          <h3>New Prescription</h3>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Appointment *</label>
            <select className={styles.formSelect} value={selectedAppointmentId} onChange={(e) => setSelectedAppointmentId(e.target.value)} required>
              <option value="">Select appointment...</option>
              {(data.appointments as Array<{ _id: string; date: string; startTime: string }>).map((a) => (
                <option key={a._id} value={a._id}>{new Date(a.date).toLocaleDateString()} {a.startTime}</option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Symptoms (comma-separated)</label>
            <input className={styles.formInput} value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="Fever, Cough" />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Diagnosis (comma-separated)</label>
            <input className={styles.formInput} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Viral Fever" />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Observations</label>
            <textarea className={styles.formTextarea} value={observations} onChange={(e) => setObservations(e.target.value)} />
          </div>

          <h4>Medicines</h4>
          {medicines.map((m, i) => (
            <div key={i} className={styles.medicineRow}>
              <div><label className={styles.formLabel}>Name</label><input className={styles.formInput} value={m.name} onChange={(e) => updateMedicine(i, 'name', e.target.value)} /></div>
              <div><label className={styles.formLabel}>Dose</label><input className={styles.formInput} value={m.dose} onChange={(e) => updateMedicine(i, 'dose', e.target.value)} /></div>
              <div><label className={styles.formLabel}>Freq</label><input className={styles.formInput} value={m.frequency} onChange={(e) => updateMedicine(i, 'frequency', e.target.value)} /></div>
              <div><label className={styles.formLabel}>Duration</label><input className={styles.formInput} value={m.duration} onChange={(e) => updateMedicine(i, 'duration', e.target.value)} /></div>
              <Button variant="danger" onClick={() => removeMedicine(i)} style={{ marginTop: '1.3rem' }}>X</Button>
            </div>
          ))}
          <Button variant="default" onClick={addMedicine}>+ Add Medicine</Button>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Advice</label>
            <textarea className={styles.formTextarea} value={advice} onChange={(e) => setAdvice(e.target.value)} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Follow-up Date</label>
            <input className={styles.formInput} type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
          </div>
          {error && <p className={styles.errorText}>{error}</p>}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button variant="primary" type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Prescription'}</Button>
            <Button variant="default" onClick={() => setShowPrescription(false)}>Cancel</Button>
          </div>
        </form>
      )}

      <h3 style={{ marginTop: '2rem' }}>Previous Prescriptions</h3>
      {(data.prescriptions as Array<{ _id: string; createdAt: string; diagnosis: string[]; medicines: Medicine[] }>).length === 0 ? (
        <p className={styles.loadingText}>No previous prescriptions</p>
      ) : (
        (data.prescriptions as Array<{ _id: string; createdAt: string; diagnosis: string[]; medicines: Medicine[] }>).map((p) => (
          <div key={p._id} className={styles.prescriptionHistory}>
            <small>{new Date(p.createdAt).toLocaleDateString()}</small>
            <p><strong>Diagnosis:</strong> {p.diagnosis?.join(', ')}</p>
            {p.medicines?.map((m, i) => (
              <p key={i}>{m.name} - {m.dose}, {m.frequency}, {m.duration}</p>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
