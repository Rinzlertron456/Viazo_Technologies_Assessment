import React, { useState, useEffect, useCallback } from 'react';
import Button from '../../components/Button';
import api, { ApiResponse } from '../../services/api';
import styles from './Receptionist.module.css';

interface Doctor {
  _id: string;
  name: string;
}

interface Patient {
  _id: string;
  name: string;
}

const WalkIn: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fetchDoctors = useCallback(async () => {
    try {
      const res: ApiResponse<Doctor[]> = await api.get<Doctor[]>('/admin/doctors');
      if (res.success && res.data) {
        setDoctors(res.data);
      }
    } catch {
      // Silently handle - doctors may not be loaded
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const handlePatientSearch = useCallback(async () => {
    if (patientSearch.trim().length < 2) return;
    try {
      const res: ApiResponse<Patient[]> = await api.get<Patient[]>(
        `/admin/patients?search=${encodeURIComponent(patientSearch)}`
      );
      if (res.success && res.data) {
        setPatients(res.data);
      }
    } catch {
      setError('Failed to search patients');
    }
  }, [patientSearch]);

  useEffect(() => {
    if (patientSearch.trim().length >= 2) {
      const timer = setTimeout(() => {
        handlePatientSearch();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setPatients([]);
    }
  }, [patientSearch, handlePatientSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedPatient || !selectedDoctor || !reason.trim()) {
      setError('All fields are required');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/receptionist/walk-in', {
        patientId: selectedPatient,
        doctorId: selectedDoctor,
        reason: reason.trim(),
      });
      if (res.success) {
        setSuccess('Walk-in registered successfully!');
        setSelectedPatient('');
        setSelectedDoctor('');
        setReason('');
        setPatientSearch('');
        setPatients([]);
      } else {
        setError(res.message || 'Failed to register walk-in');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register walk-in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Walk-In Registration</h1>

      {error && <div className={styles.errorMessage}>{error}</div>}

      <div className={styles.formCard}>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Patient Search</label>
            <input
              className={styles.formInput}
              type="text"
              placeholder="Type patient name to search..."
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
            />
          </div>

          {patients.length > 0 && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Select Patient</label>
              <select
                className={styles.formSelect}
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
              >
                <option value="">-- Select Patient --</option>
                {patients.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedPatient && (
            <>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Doctor</label>
                <select
                  className={styles.formSelect}
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                >
                  <option value="">-- Select Doctor --</option>
                  {doctors.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Reason for Visit</label>
                <textarea
                  className={styles.formTextarea}
                  placeholder="Describe the reason for the walk-in visit..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <Button variant="primary" type="submit" fullWidth disabled={loading}>
                {loading ? 'Submitting...' : 'Register Walk-In'}
              </Button>
            </>
          )}
        </form>

        {success && <div className={styles.successMessage}>{success}</div>}
      </div>
    </div>
  );
};

export default WalkIn;