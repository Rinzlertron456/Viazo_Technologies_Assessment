import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/Button";
import { api } from "../../services/api";
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

  async function handleCancel(id: string) {
    if (!confirm("Cancel this appointment?")) return;
    try {
      const res = await api.patch<{ success: boolean }>(
        `/patient/appointments/${id}/cancel`,
        {},
      );
      if (res.success) loadAppointments();
    } catch {
      alert("Failed to cancel");
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
                    {a.status}
                  </span>
                </td>
                <td>
                  <div className={styles.buttonRow}>
                    {a.status !== "Cancelled" && a.status !== "Completed" && (
                      <>
                        <Button
                          variant="danger"
                          onClick={() => handleCancel(a._id)}
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
    </div>
  );
}
