import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import { api, getErrorMessage } from "../../services/api";
import { statusLabel } from "../../utils/statusLabels";
import styles from "./Patient.module.css";

interface Appointment {
  _id: string;
  doctorId: { firstName: string; lastName: string; email: string };
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  type: string;
  reason: string;
  totalAmount: number;
}

export function MyAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  async function loadAppointments() {
    setLoading(true);
    try {
      const res = await api.get<{
        success: boolean;
        data: { appointments: Appointment[] };
      }>("/patient/appointments");
      if (res.success) setAppointments(res.data.appointments);
    } catch {
      /* */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAppointments();
  }, []);

  function askCancel(id: string) {
    setCancelId(id);
    setCancelError("");
  }

  function closeCancel() {
    if (cancelling) return;
    setCancelId(null);
    setCancelError("");
  }

  async function confirmCancel() {
    if (!cancelId) return;
    setCancelling(true);
    setCancelError("");
    try {
      const res = await api.patch<{ success: boolean; message?: string }>(
        `/patient/appointments/${cancelId}/cancel`,
        {},
      );
      if (res.success) {
        setCancelId(null);
        loadAppointments();
      } else setCancelError(res.message || "Failed to cancel");
    } catch (err) {
      setCancelError(getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  }

  function statusClass(s: string) {
    const map: Record<string, string> = {
      Pending: styles.statusPending,
      Confirmed: styles.statusConfirmed,
      CheckedIn: styles.statusCheckedIn,
      InProgress: styles.statusInProgress,
      Completed: styles.statusCompleted,
      Cancelled: styles.statusCancelled,
      Rescheduled: styles.statusRescheduled,
      NoShow: styles.statusNoShow,
    };
    return map[s] || "";
  }

  if (loading)
    return (
      <div className={styles.pageContainer}>
        <p className={styles.loadingText}>Loading appointments...</p>
      </div>
    );

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>My Appointments</h1>
      <p className={styles.pageSubtitle}>
        {appointments.length} appointment(s)
      </p>

      {appointments.length === 0 ? (
        <p className={styles.loadingText}>
          No appointments yet.{" "}
          <Button variant="primary" onClick={() => navigate("/patient/search")}>
            Find a Doctor
          </Button>
        </p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Doctor</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a._id}>
                <td>
                  Dr. {a.doctorId?.firstName} {a.doctorId?.lastName}
                </td>
                <td>{new Date(a.date).toLocaleDateString()}</td>
                <td>
                  {a.startTime} - {a.endTime}
                </td>
                <td>
                  <span
                    className={`${styles.statusBadge} ${statusClass(a.status)}`}
                  >
                    {statusLabel(a.status)}
                  </span>
                </td>
                <td>
                  <div className={styles.buttonRow}>
                    {a.status !== "Cancelled" && a.status !== "Completed" && (
                      <>
                         <Button
                          variant="danger"
                          onClick={() => askCancel(a._id)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          onClick={() =>
                            navigate(`/patient/reschedule/${a._id}`)
                          }
                        >
                          Reschedule
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Modal
        open={cancelId !== null}
        title="Cancel Appointment"
        onClose={closeCancel}
        footer={
          <>
            <Button variant="default" onClick={closeCancel} disabled={cancelling}>
              Keep Appointment
            </Button>
            <Button
              variant="danger"
              onClick={confirmCancel}
              disabled={cancelling}
            >
              {cancelling ? "Cancelling..." : "Cancel Appointment"}
            </Button>
          </>
        }
      >
        <p style={{ margin: 0 }}>
          Are you sure you want to cancel this appointment? This action cannot
          be undone.
        </p>
        {cancelError && (
          <p
            style={{
              color: "#c62828",
              fontSize: "0.85rem",
              fontWeight: 600,
              margin: "0.75rem 0 0",
            }}
          >
            {cancelError}
          </p>
        )}
      </Modal>
    </div>
  );
}
