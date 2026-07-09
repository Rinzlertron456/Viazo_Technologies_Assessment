import { useEffect, useState } from "react";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import { FieldError } from "../../components/FieldError";
import { api, getErrorMessage } from "../../services/api";
import { PhoneInput } from "../../components/PhoneInput";
import { isEmail, isPhone, isPasswordStrong, isNonEmpty, isPositiveNumber } from "../../utils/validation";
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [modalError, setModalError] = useState("");

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
    } catch (err) {
      setModalError(getErrorMessage(err));
    }
  }

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => (e[field] ? { ...e, [field]: "" } : e));
  }

  function validateAdd(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!isNonEmpty(form.firstName)) e.firstName = "First name is required.";
    if (!isNonEmpty(form.lastName)) e.lastName = "Last name is required.";
    if (!isEmail(form.email)) e.email = "Enter a valid email address.";
    if (!isPasswordStrong(form.password))
      e.password =
        "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character (no repeated characters).";
    if (!isNonEmpty(form.specialization))
      e.specialization = "Specialization is required.";
    if (!isPhone(form.phone)) e.phone = "Enter a valid phone number.";
    if (form.consultationFee && !isPositiveNumber(form.consultationFee))
      e.consultationFee = "Fee must be a valid number.";
    return e;
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    const validation = validateAdd();
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    try {
      const res = await api.post<{ success: boolean; message: string }>(
        "/admin/doctors",
        form,
      );
      if (res.success) {
        setMessage("Doctor added!");
        setShowForm(false);
        loadDoctors();
      } else setMessage(res.message || "Failed to add doctor");
    } catch (err) {
      setMessage(getErrorMessage(err));
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
          noValidate
        >
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>First Name *</label>
              <input
                id="firstName"
                className={styles.formInput}
                value={form.firstName}
                onChange={(e) => update("firstName", e.target.value)}
                aria-invalid={!!errors.firstName}
              />
              <FieldError message={errors.firstName} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Last Name *</label>
              <input
                id="lastName"
                className={styles.formInput}
                value={form.lastName}
                onChange={(e) => update("lastName", e.target.value)}
                aria-invalid={!!errors.lastName}
              />
              <FieldError message={errors.lastName} />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Email *</label>
              <input
                id="email"
                className={styles.formInput}
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                aria-invalid={!!errors.email}
              />
              <FieldError message={errors.email} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Password *</label>
              <input
                id="password"
                className={styles.formInput}
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                aria-invalid={!!errors.password}
              />
              <FieldError message={errors.password} />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Specialization *</label>
              <input
                id="specialization"
                className={styles.formInput}
                value={form.specialization}
                onChange={(e) => update("specialization", e.target.value)}
                aria-invalid={!!errors.specialization}
              />
              <FieldError message={errors.specialization} />
            </div>
            <PhoneInput
              id="phone"
              label="Phone Number"
              value={form.phone}
              onChange={(v) => update("phone", v)}
              error={errors.phone}
              required
            />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Experience (yrs)</label>
              <input
                id="clinicAddress"
                className={styles.formInput}
                value={form.clinicAddress}
                onChange={(e) => update("clinicAddress", e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Qualification</label>
              <input
                id="qualification"
                className={styles.formInput}
                value={form.qualification}
                onChange={(e) => update("qualification", e.target.value)}
              />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Fee (₹)</label>
              <input
                id="consultationFee"
                className={styles.formInput}
                type="number"
                value={form.consultationFee}
                onChange={(e) => update("consultationFee", e.target.value)}
                aria-invalid={!!errors.consultationFee}
              />
            <FieldError message={errors.consultationFee} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Clinic City</label>
              <input
                id="experience"
                className={styles.formInput}
                value={form.experience}
                onChange={(e) => update("experience", e.target.value)}
              />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Clinic Address</label>
              <input
                id="clinicCity"
                className={styles.formInput}
                value={form.clinicCity}
                onChange={(e) => update("clinicCity", e.target.value)}
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

      <Modal
        open={modalError !== ""}
        title="Action Failed"
        onClose={() => setModalError("")}
        footer={
          <Button variant="primary" onClick={() => setModalError("")}>
            OK
          </Button>
        }
      >
        <p style={{ margin: 0 }}>{modalError}</p>
      </Modal>

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
