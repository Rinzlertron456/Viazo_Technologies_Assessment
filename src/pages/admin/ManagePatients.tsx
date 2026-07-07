import React, { useState, useEffect, useCallback } from 'react';
import Button from '../../components/Button';
import api, { ApiResponse } from '../../services/api';
import styles from './Admin.module.css';

interface Patient {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive';
}

const ManagePatients: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchPatients = useCallback(async (searchQuery?: string) => {
    try {
      setError('');
      let path = '/admin/patients';
      if (searchQuery && searchQuery.trim()) {
        path += `?search=${encodeURIComponent(searchQuery.trim())}`;
      }
      const res: ApiResponse<Patient[]> = await api.get<Patient[]>(path);
      if (res.success && res.data) {
        setPatients(res.data);
      } else {
        setError(res.message || 'Failed to load patients');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    fetchPatients(search);
  };

  const handleClear = () => {
    setSearch('');
    setLoading(true);
    fetchPatients('');
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingMessage}>Loading patients...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Manage Patients</h1>

      {error && <div className={styles.errorMessage}>{error}</div>}

      <div className={styles.toolbar}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search patients by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button variant="primary" type="submit">
            Search
          </Button>
          {search && (
            <Button variant="default" onClick={handleClear}>
              Clear
            </Button>
          )}
        </form>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {patients.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>
                  No patients found
                </td>
              </tr>
            ) : (
              patients.map((patient) => (
                <tr key={patient._id}>
                  <td>{patient.name}</td>
                  <td>{patient.email}</td>
                  <td>{patient.phone || 'N/A'}</td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${
                        patient.status === 'active' ? styles.statusActive : styles.statusInactive
                      }`}
                    >
                      {patient.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManagePatients;