import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/Button";
import { GoogleSignIn } from "../../components/GoogleSignIn";
import { getErrorMessage } from "../../services/api";
import { isEmail, isNonEmpty } from "../../utils/validation";
import styles from "./Auth.module.css";

export function Login() {
  const navigate = useNavigate();
  const { login, googleLogin, isAuthenticated, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (authLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <p style={{ textAlign: "center", color: "#666" }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!isEmail(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    if (!isNonEmpty(password)) {
      setError("Please enter your password.");
      return;
    }
    setIsLoading(true);
    try {
      await login({ email, password });
      navigate("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 0.75rem",
              boxShadow: "0 4px 12px rgba(14,165,233,0.3)",
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <h1 className={styles.title}>MediBook</h1>
          <p className={styles.subtitle}>Doctor Appointment System</p>
        </div>

        <h2
          style={{
            fontSize: "1.125rem",
            fontWeight: 600,
            color: "#0f172a",
            marginBottom: "0.25rem",
          }}
        >
          Welcome back
        </h2>
        <p
          style={{
            color: "#64748b",
            fontSize: "0.875rem",
            marginBottom: "1.25rem",
          }}
        >
          Sign in to your account
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.globalError}>{error}</div>}

          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError("");
              }}
              className={
                emailError ? `${styles.input} input-error` : styles.input
              }
              placeholder="you@example.com"
              autoComplete="email"
            />
            {emailError && (
              <p
                style={{
                  color: "#ef4444",
                  fontSize: "0.75rem",
                  marginTop: "0.25rem",
                }}
              >
                {emailError}
              </p>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isLoading}
          >
            Sign In
          </Button>
        </form>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            margin: "1.25rem 0",
          }}
        >
          <hr
            style={{ flex: 1, border: "none", borderTop: "1px solid #e2e8f0" }}
          />
          <span
            style={{ color: "#94a3b8", fontSize: "0.75rem", fontWeight: 500 }}
          >
            OR
          </span>
          <hr
            style={{ flex: 1, border: "none", borderTop: "1px solid #e2e8f0" }}
          />
        </div>

        <GoogleSignIn
          onCredential={googleLogin}
          onSuccess={() => navigate("/dashboard")}
          onError={(msg) => setError(msg)}
        />

        <div className={styles.link} style={{ marginTop: "1rem" }}>
          <Link
            to="/forgot-password"
            style={{ color: "#0284c7", fontWeight: 500 }}
          >
            Forgot password?
          </Link>
        </div>
        <div className={styles.link}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "#0284c7", fontWeight: 500 }}>
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
