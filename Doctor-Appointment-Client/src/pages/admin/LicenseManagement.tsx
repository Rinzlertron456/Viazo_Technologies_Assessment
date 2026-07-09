import { useEffect, useState } from "react";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import { api, getErrorMessage } from "../../services/api";
import styles from "./Admin.module.css";

interface PendingDoctor {
  _id: string;
  userId: { firstName: string; lastName: string; email: string; phone: string };
  specialization: string;
  registrationNumber: string;
  experience: number;
}

export function LicenseManagement() {
  const [doctors, setDoctors] = useState<PendingDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [rejecting, setRejecting] = useState(false);

  async function loadPending() {
    setLoading(true);
    try {
      const res = await api.get<{
        success: boolean;
        data: { doctors: PendingDoctor[] };
      }>("/admin/license/pending");
      if (res.success) setDoctors(res.data.doctors);
    } catch {
      setMessage("Failed to load pending verifications");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPending();
  }, []);

  async function handleApprove(doctorId: string) {
    try {
      const res = await api.patch<{ success: boolean; message: string }>(
        `/admin/license/${doctorId}/approve`,
        {},
      );
      if (res.success) {
        setMessage("License approved");
        loadPending();
      } else setMessage(res.message || "Failed");
    } catch {
      setMessage("Failed to approve");
    }
  }

  function openReject(doctorId: string) {
    setRejectId(doctorId);
    setRejectReason("");
    setRejectError("");
  }

  function closeReject() {
    if (rejecting) return;
    setRejectId(null);
    setRejectReason("");
    setRejectError("");
  }

  async function confirmReject() {
    if (!rejectId) return;
    setRejecting(true);
    setRejectError("");
    try {
      const res = await api.patch<{ success: boolean; message: string }>(
        `/admin/license/${rejectId}/reject`,
        { reason: rejectReason.trim() || undefined },
      );
      if (res.success) {
        setMessage("License rejected");
        setRejectId(null);
        loadPending();
      } else setRejectError(res.message || "Failed to reject");
    } catch (err) {
      setRejectError(getErrorMessage(err));
    } finally {
      setRejecting(false);
    }
  }

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>License Management</h1>
      <p className={styles.pageSubtitle}>Pending doctor verifications</p>

      {message && (
        <div
          style={{
            background: message.includes("Failed") ? "#fde8e8" : "#e8f5e9",
            border:
              "2px solid " +
              (message.includes("Failed") ? "#c62828" : "#2e7d32"),
            borderRadius: "0.5rem",
            padding: "0.75rem 1rem",
            marginBottom: "1rem",
            fontWeight: 600,
            fontSize: "0.9rem",
            color: message.includes("Failed") ? "#c62828" : "#2e7d32",
          }}
        >
          {message}
        </div>
      )}

      {loading ? (
        <p className={styles.loadingText}>Loading pending verifications...</p>
      ) : doctors.length === 0 ? (
        <p className={styles.loadingText}>
          No pending verifications. All doctors have been verified.
        </p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Registration #</th>
              <th>Specialization</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map((d) => (
              <tr key={d._id}>
                <td>
                  {d.userId?.firstName} {d.userId?.lastName}
                </td>
                <td>{d.userId?.email}</td>
                <td>{d.userId?.phone}</td>
                <td>{d.registrationNumber || "N/A"}</td>
                <td>{d.specialization || "N/A"}</td>
                <td>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <Button
                      variant="primary"
                      onClick={() => handleApprove(d._id)}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => openReject(d._id)}
                    >
                      Reject
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Modal
        open={rejectId !== null}
        title="Reject License"
        onClose={closeReject}
        footer={
          <>
            <Button variant="default" onClick={closeReject} disabled={rejecting}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmReject}
              disabled={rejecting}
            >
              {rejecting ? "Rejecting..." : "Confirm Reject"}
            </Button>
          </>
        }
      >
        <p style={{ margin: "0 0 0.75rem" }}>
          Provide an optional reason for rejecting this doctor's license.
        </p>
        <textarea
          className={styles.textarea}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Reason (optional)"
          rows={4}
        />
        {rejectError && (
          <p
            style={{
              color: "#c62828",
              fontSize: "0.85rem",
              fontWeight: 600,
              margin: "0.5rem 0 0",
            }}
          >
            {rejectError}
          </p>
        )}
      </Modal>
    </div>
  );
}
