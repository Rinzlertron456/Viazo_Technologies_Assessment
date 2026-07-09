import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/Button";
import { FieldError } from "../../components/FieldError";
import { PhoneInput } from "../../components/PhoneInput";
import { getErrorMessage } from "../../services/api";
import {
  isEmail,
  isPhone,
  isPasswordStrong,
  isNonEmpty,
  getPhoneError,
} from "../../utils/validation";
import type { UserRole } from "../../types/auth";
import styles from "./Auth.module.css";

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "Patient", label: "Patient" },
  { value: "Doctor", label: "Doctor" },
  { value: "Receptionist", label: "Receptionist" },
  { value: "Admin", label: "Admin" },
  { value: "SuperAdmin", label: "Super Admin" },
];

export function Register() {
  const { register, isAuthenticated, isLoading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    role: "Patient" as UserRole,
  });
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  function update(field: keyof typeof formData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((e) => (e[field] ? { ...e, [field]: "" } : e));
  }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!isNonEmpty(formData.firstName)) e.firstName = "First name is required.";
    if (!isNonEmpty(formData.lastName)) e.lastName = "Last name is required.";
    if (!isEmail(formData.email)) e.email = "Enter a valid email address.";
    if (!isPhone(formData.phone)) e.phone = getPhoneError(formData.phone) || "Enter a valid phone number.";
    if (!isPasswordStrong(formData.password))
      e.password =
        "Password must be at least 8 characters and include uppercase, lowercase, and a number.";
    return e;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setIsLoading(true);
    try {
      await register(formData);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.card} style={{ maxWidth: "515px", width: "100%" }}>
        <h1 className={styles.title}>Register</h1>
        <p className={styles.subtitle}>Create your account</p>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          {error && <div className={styles.globalError}>{error}</div>}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
            }}
          >
            <div className={styles.field}>
              <label htmlFor="firstName" className={styles.label}>
                First Name
              </label>
              <input
                id="firstName"
                name="firstName"
                className={styles.input}
                type="text"
                value={formData.firstName}
                onChange={(e) => update("firstName", e.target.value)}
                aria-invalid={!!errors.firstName}
              />
              <FieldError message={errors.firstName} />
            </div>

            <div className={styles.field}>
              <label htmlFor="lastName" className={styles.label}>
                Last Name
              </label>
              <input
                id="lastName"
                name="lastName"
                className={styles.input}
                type="text"
                value={formData.lastName}
                onChange={(e) => update("lastName", e.target.value)}
                aria-invalid={!!errors.lastName}
              />
              <FieldError message={errors.lastName} />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <input
              id="email"
              name="email"
              className={styles.input}
              type="email"
              value={formData.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="you@example.com"
              aria-invalid={!!errors.email}
            />
            <FieldError message={errors.email} />
          </div>

          <PhoneInput
            id="phone"
            label="Phone"
            value={formData.phone}
            onChange={(v) => update("phone", v)}
            error={errors.phone}
            placeholder="9876543210"
            required
          />

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <input
              id="password"
              name="password"
              className={styles.input}
              type="password"
              value={formData.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="Min 8 chars, uppercase, lowercase, number"
              aria-invalid={!!errors.password}
            />
            <FieldError message={errors.password} />
          </div>

          <div className={styles.field}>
            <label htmlFor="role" className={styles.label}>
              Role
            </label>
            <select
              id="role"
              name="role"
              className={styles.select}
              value={formData.role}
              onChange={(e) => update("role", e.target.value)}
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isLoading}
          >
            Create Account
          </Button>
        </form>

        <div className={styles.link}>
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}
