import { useEffect, useState } from "react";
import { api } from "../../services/api";
import styles from "./Patient.module.css";

interface Bill {
  _id: string;
  invoiceNumber: string;
  appointmentId: { _id: string; date: string; startTime: string };
  consultationFee: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  paidAt: string | null;
  createdAt: string;
}

export function PaymentHistory() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<{
          success: boolean;
          data: { bills: Bill[] };
        }>("/patient/bills");
        if (res.success) setBills(res.data.bills);
      } catch {
        // Bill endpoint not implemented yet — show example
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading)
    return (
      <div className={styles.pageContainer}>
        <p className={styles.loadingText}>Loading bills...</p>
      </div>
    );

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Payment History</h1>
      <p className={styles.pageSubtitle}>Your invoices and payment records</p>

      {bills.length === 0 ? (
        <div>
          <p className={styles.loadingText}>
            No payment history available yet.
          </p>
          <p
            style={{ color: "#666", fontSize: "0.85rem", marginTop: "0.5rem" }}
          >
            After booking and paying for appointments, your bills will appear
            here. The billing feature will be available in a future update.
          </p>
        </div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Payment Method</th>
              <th>Status</th>
              <th>Paid At</th>
            </tr>
          </thead>
          <tbody>
            {bills.map((b) => (
              <tr key={b._id}>
                <td>{b.invoiceNumber}</td>
                <td>
                  {b.createdAt
                    ? new Date(b.createdAt).toLocaleDateString()
                    : "-"}
                </td>
                <td>₹{b.totalAmount}</td>
                <td>{b.paymentMethod || "Pending"}</td>
                <td>
                  <span
                    style={{
                      background:
                        b.paymentStatus === "Paid" ? "#e8f5e9" : "#fde8e8",
                      color: b.paymentStatus === "Paid" ? "#2e7d32" : "#c62828",
                      padding: "0.2rem 0.5rem",
                      borderRadius: "0.5rem",
                      fontWeight: 600,
                      fontSize: "0.8rem",
                    }}
                  >
                    {b.paymentStatus}
                  </span>
                </td>
                <td>
                  {b.paidAt ? new Date(b.paidAt).toLocaleDateString() : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
