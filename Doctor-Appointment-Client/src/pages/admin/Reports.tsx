import { useEffect, useState } from "react";
import { api } from "../../services/api";
import styles from "./Admin.module.css";

export function Reports() {
  const [revenue, setRevenue] = useState<
    Array<{ month: string; totalRevenue: number; count: number }>
  >([]);
  const [doctorPerf, setDoctorPerf] = useState<
    Array<{
      doctorName: string;
      totalAppointments: number;
      completedCount: number;
      cancelledCount: number;
    }>
  >([]);
  const [growth, setGrowth] = useState<Array<{ month: string; count: number }>>(
    [],
  );
  const [noShow, setNoShow] = useState<
    Array<{ doctorName: string; count: number }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [revRes, perfRes, growthRes, noShowRes] = await Promise.all([
          api.get<{ success: boolean; data: { report: typeof revenue } }>(
            "/admin/reports/revenue",
          ),
          api.get<{ success: boolean; data: { report: typeof doctorPerf } }>(
            "/admin/reports/doctor-performance",
          ),
          api.get<{ success: boolean; data: { report: typeof growth } }>(
            "/admin/reports/patient-growth",
          ),
          api.get<{ success: boolean; data: { report: typeof noShow } }>(
            "/admin/reports/no-show",
          ),
        ]);
        if (revRes.success) setRevenue(revRes.data.report);
        if (perfRes.success) setDoctorPerf(perfRes.data.report);
        if (growthRes.success) setGrowth(growthRes.data.report);
        if (noShowRes.success) setNoShow(noShowRes.data.report);
      } catch {
        /* */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading)
    return (
      <div className={styles.pageContainer}>
        <p className={styles.loadingText}>Loading reports...</p>
      </div>
    );

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Reports</h1>
      <p className={styles.pageSubtitle}>Admin analytics and insights</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1.5rem",
        }}
      >
        <div>
          <h3>Revenue</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Month</th>
                <th>Revenue</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {revenue.map((r) => (
                <tr key={r.month}>
                  <td>{r.month}</td>
                  <td>₹{r.totalRevenue}</td>
                  <td>{r.count}</td>
                </tr>
              ))}
              {revenue.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    style={{
                      textAlign: "center",
                      padding: "1rem",
                      color: "#666",
                    }}
                  >
                    No data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div>
          <h3>Patient Growth</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Month</th>
                <th>New Patients</th>
              </tr>
            </thead>
            <tbody>
              {growth.map((g) => (
                <tr key={g.month}>
                  <td>{g.month}</td>
                  <td>{g.count}</td>
                </tr>
              ))}
              {growth.length === 0 && (
                <tr>
                  <td
                    colSpan={2}
                    style={{
                      textAlign: "center",
                      padding: "1rem",
                      color: "#666",
                    }}
                  >
                    No data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h3>Doctor Performance</h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Doctor</th>
              <th>Total</th>
              <th>Completed</th>
              <th>Cancelled</th>
            </tr>
          </thead>
          <tbody>
            {doctorPerf.map((d, i) => (
              <tr key={i}>
                <td>{d.doctorName}</td>
                <td>{d.totalAppointments}</td>
                <td>{d.completedCount}</td>
                <td>{d.cancelledCount}</td>
              </tr>
            ))}
            {doctorPerf.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    textAlign: "center",
                    padding: "1rem",
                    color: "#666",
                  }}
                >
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h3>No-Show Report</h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Doctor</th>
              <th>No-Shows</th>
            </tr>
          </thead>
          <tbody>
            {noShow.map((d, i) => (
              <tr key={i}>
                <td>{d.doctorName}</td>
                <td>{d.count}</td>
              </tr>
            ))}
            {noShow.length === 0 && (
              <tr>
                <td
                  colSpan={2}
                  style={{
                    textAlign: "center",
                    padding: "1rem",
                    color: "#666",
                  }}
                >
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
