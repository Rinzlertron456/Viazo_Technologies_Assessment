import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Button } from '../../components/Button';
import styles from './Admin.module.css';

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isActive: boolean;
}

export function ManagePatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  async function loadPatients(s: string = '') {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (s) params.set('search', s);
      const res = await api.get<{ success: boolean; data: { patients: Patient[] } }>(`/admin/patients?${params}`);
      if (res.success) setPatients(res.data.patients);
    } catch { /* */ } finally { setLoading(false); }
  }

  useEffect(() => { loadPatients(); }, []);

  function handleSearch() { loadPatients(search); }

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Manage Patients</h1>
      <p className={styles.pageSubtitle}>{patients.length} patients</p>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input className={styles.formInput} placeholder="Search by name, email or phone..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
        <Button variant="primary" onClick={handleSearch}>Search</Button>
      </div>

      {loading ? <p className={styles.loadingText}>Loading...</p> : (
        <table className={styles.table}>
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Status</th></tr></thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p._id}>
                <td>{p.firstName} {p.lastName}</td>
                <td>{p.email}</td>
                <td>{p.phone}</td>
                <td><span className={`${styles.badge} ${p.isActive ? styles.badgeActive : styles.badgeInactive}`}>{p.isActive ? 'Active' : 'Inactive'}</span></td>
              </tr>
            ))}
            {patients.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>No patients found</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
}
