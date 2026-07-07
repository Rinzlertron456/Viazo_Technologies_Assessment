import { useEffect, useState } from 'react';
import { api } from '../../services/api';
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
        <input className={styles.searchInput} style={{ margin: 0 }} placeholder="Search by name, email or phone..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
        <button style={{ padding: '0.6rem 1rem', border: '2px solid #1a1a1a', borderRadius: '0.5rem', background: '#1a1a1a', color: '#fff', fontWeight: 700, cursor: 'pointer', boxShadow: '3px 3px 0 #1a1a1a' }} onClick={handleSearch}>Search</button>
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
