import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/Button";
import { ApiError } from "../../services/api";
import type { UserRole } from "../../types/auth";
import styles from "./Auth.module.css";

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "Patient", label: "Patient" },
  { value: "Doctor", label: "Doctor" },
  { value: "Receptionist", label: "Receptionist" },
  { value: "Admin", label: "Admin" },
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
  const [isLoading, setIsLoading] = useState(false);

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

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await register(formData);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card} style={{ maxWidth: "515px", width: "100%" }}>
        <h1 className={styles.title}>Register</h1>
        <p className={styles.subtitle}>Create your account</p>

        <form onSubmit={handleSubmit} className={styles.form}>
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
                onChange={handleChange}
                required
              />
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
                onChange={handleChange}
                required
              />
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
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="phone" className={styles.label}>
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              className={styles.input}
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+919876543210"
              required
            />
          </div>

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
              onChange={handleChange}
              placeholder="Min 8 chars, uppercase, lowercase, number"
              required
              minLength={8}
            />
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
              onChange={handleChange}
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
