import React, { useState, useEffect, useCallback } from 'react';
import Button from '../../components/Button';
import api, { ApiResponse } from '../../services/api';
import styles from './Admin.module.css';

interface Doctor {
  _id: string;
  name: string;
  email: string;
  specialization?: string;
  status: 'active' | 'inactive';
}

const ManageDoctors: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', specialization: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchDoctors = useCallback(async () => {
    try {
      setError('');
      const res: ApiResponse<Doctor[]> = await api.get<Doctor[]>('/admin/doctors');
      if (res.success && res.data) {
        setDoctors(res.data);
      } else {
        setError(res.message || 'Failed to load doctors');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const handleToggleStatus = async (id: string) => {
    try {
      const res = await api.patch<Doctor>(`/admin/doctors/${id}/toggle-status`);
      if (res.success && res.data) {
        setDoctors((prev) =>
          prev.map((d) => (d._id === id ? res.data! : d))
        );
        setSuccess('Doctor status updated');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle status');
    }
  };

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError('Name, email, and password are required');
      return;
    }

    setSubmitting(true);
    try {
      const res: ApiResponse<Doctor> = await api.post<Doctor>('/admin/doctors', {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        specialization: form.specialization.trim(),
      });
      if (res.success && res.data) {
        setDoctors((prev) => [...prev, res.data!]);
        setForm({ name: '', email: '', password: '', specialization: '' });
        setShowForm(false);
        setSuccess('Doctor added successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(res.message || 'Failed to add doctor');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add doctor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingMessage}>Loading doctors...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Manage Doctors</h1>

      {error && <div className={styles.errorMessage}>{error}</div>}
      {success && <div className={styles.successMessage}>{success}</div>}

      <div className={styles.toolbar}>
        <Button
          variant="primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'Add Doctor'}
        </Button>
      </div>

      {showForm && (
        <div className={styles.formCard}>
          <form onSubmit={handleAddDoctor}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Name</label>
              <input
                className={styles.formInput}
                type="text"
                placeholder="Doctor name"
                value={form.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Email</label>
              <input
                className={styles.formInput}
                type="email"
                placeholder="doctor@example.com"
                value={form.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Password</label>
              <input
                className={styles.formInput}
                type="password"
                placeholder="Set password"
                value={form.password}
                onChange={(e) => handleFormChange('password', e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Specialization</label>
              <input
                className={styles.formInput}
                type="text"
                placeholder="e.g. Cardiology"
                value={form.specialization}
                onChange={(e) => handleFormChange('specialization', e.target.value)}
              />
            </div>
            <div className={styles.formActions}>
              <Button variant="primary" type="submit" disabled={submitting}>
                {submitting ? 'Adding...' : 'Add Doctor'}
              </Button>
              <Button variant="default" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Specialization</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {doctors.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                  No doctors found
                </td>
              </tr>
            ) : (
              doctors.map((doctor) => (
                <tr key={doctor._id}>
                  <td>{doctor.name}</td>
                  <td>{doctor.email}</td>
                  <td>{doctor.specialization || 'N/A'}</td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${
                        doctor.status === 'active' ? styles.statusActive : styles.statusInactive
                      }`}
                    >
                      {doctor.status}
                    </span>
                  </td>
                  <td>
                    <Button
                      variant={doctor.status === 'active' ? 'danger' : 'primary'}
                      onClick={() => handleToggleStatus(doctor._id)}
                    >
                      {doctor.status === 'active' ? 'Deactivate' : 'Activate'}
                    </Button>
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

export default ManageDoctors;