import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { api, getErrorMessage } from '../../services/api';
import { statusLabel } from '../../utils/statusLabels';
import styles from './Doctor.module.css';

interface Appointment {
  _id: string;
  patientId: { _id: string; firstName: string; lastName: string; phone: string; email: string };
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  type: string;
  reason: string;
}

export function DoctorAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmClear, setConfirmClear] = useState<'selected' | 'all' | null>(null);
  const [clearing, setClearing] = useState(false);
  const [clearError, setClearError] = useState('');

  async function loadAppointments(statusFilter = '') {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      params.set('limit', '50');
      const res = await api.get<{ success: boolean; data: { appointments: Appointment[] } }>(`/doctor/appointments?${params}`);
      if (res.success) setAppointments(res.data.appointments);
    } catch { /* */ } finally { setLoading(false); }
  }

  useEffect(() => { loadAppointments(); }, []);

  function handleFilter(status: string) {
    setFilter(status);
    loadAppointments(status === filter ? '' : status);
  }

  const filters = ['Today', 'Pending', 'Confirmed', 'CheckedIn', 'InProgress', 'Completed'];

  const cancelledInView = appointments.filter((a) => a.status === 'Cancelled');
  const allCancelledSelected =
    cancelledInView.length > 0 &&
    cancelledInView.every((a) => selectedIds.includes(a._id));

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function toggleSelectAll() {
    if (allCancelledSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !cancelledInView.some((a) => a._id === id)),
      );
    } else {
      setSelectedIds((prev) =>
        Array.from(new Set([...prev, ...cancelledInView.map((a) => a._id)])),
      );
    }
  }

  async function clearAppointments(ids: string[]) {
    if (ids.length === 0) {
      setConfirmClear(null);
      return;
    }
    setClearing(true);
    setClearError('');
    try {
      const res = await api.delete<{
        success: boolean;
        message?: string;
        data: { deletedCount: number };
      }>('/doctor/appointments', { ids });
      if (res.success) {
        setAppointments((prev) => prev.filter((a) => !ids.includes(a._id)));
        setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
      } else {
        setClearError(res.message || 'Failed to clear appointments');
      }
    } catch (err) {
      setClearError(getErrorMessage(err));
    } finally {
      setClearing(false);
      setConfirmClear(null);
    }
  }

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>My Appointments</h1>
      <p className={styles.pageSubtitle}>Manage your patient appointments</p>

      <div className={styles.filterRow}>
        {filters.map((f) => (
          <button
            key={f}
            className={`${styles.filterBtn} ${filter === f ? styles.filterBtnActive : ''}`}
            onClick={() => handleFilter(f)}
          >
            {statusLabel(f)}
          </button>
        ))}
      </div>

      {cancelledInView.length > 0 && (
        <div className={styles.clearToolbar}>
          <label className={styles.selectAllLabel}>
            <input
              type="checkbox"
              checked={allCancelledSelected}
              onChange={toggleSelectAll}
            />
            Select all cancelled
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button
              variant="default"
              onClick={() => setConfirmClear('selected')}
              disabled={selectedIds.length === 0 || clearing}
            >
              Clear Selected{selectedIds.length ? ` (${selectedIds.length})` : ''}
            </Button>
            <Button
              variant="danger"
              onClick={() => setConfirmClear('all')}
              disabled={clearing}
            >
              Clear All Cancelled
            </Button>
          </div>
        </div>
      )}

      {clearError && (
        <p className={styles.errorText} style={{ marginBottom: '1rem' }}>
          {clearError}
        </p>
      )}

      {loading ? (
        <p className={styles.loadingText}>Loading appointments...</p>
      ) : appointments.length === 0 ? (
        <p className={styles.loadingText}>No appointments found</p>
      ) : (
        appointments.map((a) => (
          <div key={a._id} className={styles.appointmentCard}>
            {a.status === 'Cancelled' && (
              <input
                type="checkbox"
                className={styles.cardCheckbox}
                checked={selectedIds.includes(a._id)}
                onChange={() => toggleSelect(a._id)}
                aria-label={`Select appointment for ${a.patientId?.firstName} ${a.patientId?.lastName}`}
              />
            )}
            <div className={styles.appointmentInfo}>
              <strong>{a.patientId?.firstName} {a.patientId?.lastName}</strong>
              <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: '#555' }}>
                {new Date(a.date).toLocaleDateString()} | {a.startTime} - {a.endTime} | {a.type}
              </p>
              <span className={`${styles.statusBadge} ${styles[`status${a.status}` as keyof typeof styles] || ''}`}>
                {statusLabel(a.status)}
              </span>
            </div>
            <Button variant="primary" onClick={() => navigate(`/doctor/patients/${a.patientId?._id}`)}>
              View Patient
            </Button>
          </div>
        ))
      )}

      <Modal
        open={confirmClear !== null}
        title="Clear Appointments"
        onClose={() => setConfirmClear(null)}
        footer={
          <>
            <Button variant="default" onClick={() => setConfirmClear(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() =>
                clearAppointments(
                  confirmClear === 'all'
                    ? cancelledInView.map((a) => a._id)
                    : selectedIds,
                )
              }
              disabled={clearing}
            >
              {clearing ? 'Clearing...' : 'Clear'}
            </Button>
          </>
        }
      >
        <p style={{ margin: 0 }}>
          {confirmClear === 'all'
            ? `Clear all ${cancelledInView.length} cancelled appointment(s) from this list?`
            : `Clear ${selectedIds.length} selected cancelled appointment(s) from this list?`}
        </p>
      </Modal>
    </div>
  );
}
