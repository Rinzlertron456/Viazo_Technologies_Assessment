import { useEffect, useState } from "react";
import { Button } from "../../components/Button";
import { api } from "../../services/api";
import styles from "./Admin.module.css";

interface Doctor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isActive: boolean;
  profile?: {
    specialization: string;
    qualification: string;
    consultationFee: number;
    clinicCity: string;
  } | null;
}

export function ManageDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    specialization: "",
    qualification: "",
    experience: "",
    registrationNumber: "",
    consultationFee: "",
    clinicAddress: "",
    clinicCity: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function loadDoctors() {
    setLoading(true);
    try {
      const res = await api.get<{
        success: boolean;
        data: { doctors: Doctor[] };
      }>("/admin/doctors");
      if (res.success) setDoctors(res.data.doctors);
    } catch {
      /* */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDoctors();
  }, []);

  async function toggleStatus(id: string) {
    try {
      await api.patch(`/admin/doctors/${id}/toggle-status`, {});
      loadDoctors();
    } catch {
      alert("Failed to toggle");
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const res = await api.post<{ success: boolean; message: string }>(
        "/admin/doctors",
        form,
      );
      if (res.success) {
        setMessage("Doctor added!");
        setShowForm(false);
        loadDoctors();
      } else setMessage(res.message || "Failed");
    } catch {
      setMessage("Failed to add doctor");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Manage Doctors</h1>
      <p className={styles.pageSubtitle}>{doctors.length} doctors registered</p>

      <Button variant="primary" onClick={() => setShowForm(!showForm)}>
        {showForm ? "Cancel" : "Add Doctor"}
      </Button>

      {showForm && (
        <form
          className={styles.form}
          onSubmit={handleAdd}
          style={{ marginTop: "1rem" }}
        >
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>First Name *</label>
              <input
                className={styles.formInput}
                value={form.firstName}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Last Name *</label>
              <input
                className={styles.formInput}
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                required
              />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Email *</label>
              <input
                className={styles.formInput}
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Password *</label>
              <input
                className={styles.formInput}
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Specialization *</label>
              <input
                className={styles.formInput}
                value={form.specialization}
                onChange={(e) =>
                  setForm({ ...form, specialization: e.target.value })
                }
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Phone Number *</label>
              <input
                className={styles.formInput}
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Experience (yrs)</label>
              <input
                className={styles.formInput}
                type="number"
                value={form.experience}
                onChange={(e) =>
                  setForm({ ...form, experience: e.target.value })
                }
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Qualification</label>
              <input
                className={styles.formInput}
                value={form.qualification}
                onChange={(e) =>
                  setForm({ ...form, qualification: e.target.value })
                }
              />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Fee (₹)</label>
            <input
              className={styles.formInput}
              type="number"
              value={form.consultationFee}
              onChange={(e) =>
                setForm({ ...form, consultationFee: e.target.value })
              }
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Clinic City</label>
            <input
              className={styles.formInput}
              value={form.clinicCity}
              onChange={(e) => setForm({ ...form, clinicCity: e.target.value })}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Clinic Address</label>
            <input
              className={styles.formInput}
              value={form.clinicAddress}
              onChange={(e) =>
                setForm({ ...form, clinicAddress: e.target.value })
              }
            />
          </div>
          {message && (
            <p
              style={{
                color: message.includes("added") ? "#2e7d32" : "#c62828",
              }}
            >
              {message}
            </p>
          )}
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting ? "Adding..." : "Add Doctor"}
          </Button>
        </form>
      )}

      {loading ? (
        <p className={styles.loadingText}>Loading...</p>
      ) : (
        <table className={styles.table} style={{ marginTop: "1rem" }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Specialization</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map((d) => (
              <tr key={d._id}>
                <td>
                  Dr. {d.firstName} {d.lastName}
                </td>
                <td>{d.email}</td>
                <td>{d.profile?.specialization || "-"}</td>
                <td>
                  <span
                    className={`${styles.badge} ${d.isActive ? styles.badgeActive : styles.badgeInactive}`}
                  >
                    {d.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  <Button
                    variant={d.isActive ? "danger" : "primary"}
                    onClick={() => toggleStatus(d._id)}
                  >
                    {d.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
