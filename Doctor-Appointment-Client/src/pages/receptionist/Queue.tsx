import { useEffect, useState } from "react";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import { api, getErrorMessage } from "../../services/api";
import { statusLabel } from "../../utils/statusLabels";
import styles from "./Receptionist.module.css";

interface QueueItem {
  _id: string;
  patientId: {
    _id: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  doctorId: { firstName: string; lastName: string };
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  reason: string;
}

const STATUSES = [
  "Pending",
  "Confirmed",
  "CheckedIn",
  "InProgress",
  "Completed",
  "Cancelled",
  "NoShow",
];

export function Queue() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalError, setModalError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [period, setPeriod] = useState<"today" | "all">("today");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (statusFilter) params.set("status", statusFilter);
        if (period === "all") params.set("period", "all");
        const res = await api.get<{
          success: boolean;
          data: { queue: QueueItem[] };
        }>(`/receptionist/queue?${params}`);
        if (res.success) setQueue(res.data.queue);
      } catch {
        /* */
      } finally {
        setLoading(false);
      }
    })();
  }, [statusFilter, period]);

  async function handleCheckIn(id: string) {
    try {
      const res = await api.patch<{ success: boolean }>(
        `/receptionist/check-in/${id}`,
        {},
      );
      if (res.success) {
        const params = new URLSearchParams();
        if (statusFilter) params.set("status", statusFilter);
        if (period === "all") params.set("period", "all");
        const res2 = await api.get<{
          success: boolean;
          data: { queue: QueueItem[] };
        }>(`/receptionist/queue?${params}`);
        if (res2.success) setQueue(res2.data.queue);
      }
    } catch (err) {
      setModalError(getErrorMessage(err));
    }
  }

  const filterBtn = (active: boolean) => ({
    padding: "0.4rem 0.7rem",
    border: "2px solid #cbd5e1",
    borderRadius: "0.5rem",
    background: active ? "#0284c7" : "#fff",
    color: active ? "#fff" : "#0f172a",
    cursor: "pointer",
    fontSize: "0.8rem",
    fontWeight: 600,
  });

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Patient Queue</h1>
      <p className={styles.pageSubtitle}>Filter by status and date</p>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          marginBottom: "0.75rem",
        }}
      >
        <button
          style={filterBtn(period === "today")}
          onClick={() => setPeriod("today")}
        >
          Today
        </button>
        <button
          style={filterBtn(period === "all")}
          onClick={() => setPeriod("all")}
        >
          All Dates
        </button>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          marginBottom: "1.25rem",
        }}
      >
        <button
          style={filterBtn(statusFilter === "")}
          onClick={() => setStatusFilter("")}
        >
          All Statuses
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            style={filterBtn(statusFilter === s)}
            onClick={() => setStatusFilter((prev) => (prev === s ? "" : s))}
          >
            {statusLabel(s)}
          </button>
        ))}
      </div>

      {loading ? (
        <p className={styles.loadingText}>Loading queue...</p>
      ) : queue.length === 0 ? (
        <p className={styles.loadingText}>
          No patients match the current filter
        </p>
      ) : (
        queue.map((item) => (
          <div key={item._id} className={styles.card}>
            <div className={styles.cardInfo}>
              <strong>
                {item.patientId?.firstName} {item.patientId?.lastName}
              </strong>
              <p
                style={{
                  margin: "0.25rem 0",
                  fontSize: "0.85rem",
                  color: "#555",
                }}
              >
                Dr. {item.doctorId?.firstName} {item.doctorId?.lastName} |{" "}
                {item.startTime} | {item.reason}
              </p>
              <span className={styles.statusBadge}>{statusLabel(item.status)}</span>
            </div>
            {item.status === "Confirmed" && (
              <Button variant="primary" onClick={() => handleCheckIn(item._id)}>
                Check In
              </Button>
            )}
          </div>
        ))
      )}

      <Modal
        open={modalError !== ""}
        title="Check-in Failed"
        onClose={() => setModalError("")}
        footer={
          <Button variant="primary" onClick={() => setModalError("")}>
            OK
          </Button>
        }
      >
        <p style={{ margin: 0 }}>{modalError}</p>
      </Modal>
    </div>
  );
}
