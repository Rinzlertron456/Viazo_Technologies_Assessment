import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import styles from './Patient.module.css';

interface Prescription {
  _id: string;
  appointmentId: string;
  doctorId: { firstName: string; lastName: string };
  symptoms: string[];
  diagnosis: string[];
  observations?: string;
  medicines: Array<{ name: string; dose: string; frequency: string; duration: string; instructions?: string }>;
  labTests?: string[];
  advice?: string;
  followUpDate?: string;
  createdAt: string;
}

export function MedicalRecords() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<{ success: boolean; data: { prescriptions: Prescription[] } }>('/patient/records');
        if (res.success) setPrescriptions(res.data.prescriptions);
      } catch { /* */ } finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return <div className={styles.pageContainer}><p className={styles.loadingText}>Loading medical records...</p></div>;

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Medical Records</h1>
      <p className={styles.pageSubtitle}>Your prescriptions and medical history</p>

      {prescriptions.length === 0 ? (
        <p className={styles.loadingText}>No medical records found</p>
      ) : (
        prescriptions.map((p) => (
          <div key={p._id} className={styles.profileDetails}>
            <div className={styles.profileInfo}>
              <div><strong>Date:</strong> {new Date(p.createdAt).toLocaleDateString()}</div>
              <div><strong>Doctor:</strong> Dr. {p.doctorId?.firstName} {p.doctorId?.lastName}</div>
              <div><strong>Symptoms:</strong> {p.symptoms?.join(', ') || '-'}</div>
              <div><strong>Diagnosis:</strong> {p.diagnosis?.join(', ') || '-'}</div>
              {p.observations && <div><strong>Observations:</strong> {p.observations}</div>}
            </div>

            {p.medicines && p.medicines.length > 0 && (
              <>
                <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Prescribed Medicines</h4>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Medicine</th>
                      <th>Dose</th>
                      <th>Frequency</th>
                      <th>Duration</th>
                      <th>Instructions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.medicines.map((m, i) => (
                      <tr key={i}>
                        <td>{m.name}</td>
                        <td>{m.dose}</td>
                        <td>{m.frequency}</td>
                        <td>{m.duration}</td>
                        <td>{m.instructions || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {p.labTests && p.labTests.length > 0 && (
              <p style={{ marginTop: '0.5rem' }}><strong>Lab Tests:</strong> {p.labTests.join(', ')}</p>
            )}
            {p.advice && <p style={{ marginTop: '0.25rem' }}><strong>Advice:</strong> {p.advice}</p>}
            {p.followUpDate && <p style={{ marginTop: '0.25rem' }}><strong>Follow-up:</strong> {new Date(p.followUpDate).toLocaleDateString()}</p>}
          </div>
        ))
      )}
    </div>
  );
}
