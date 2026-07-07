import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button';
import { ApiError } from '../../services/api';
import styles from './Auth.module.css';

export function ResetPassword() {
  const { resetPassword, isAuthenticated, isLoading: authLoading } = useAuth();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (authLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}><p>Loading...</p></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await resetPassword({ token, password });
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Password Reset</h1>
          <div className={styles.success}>
            Your password has been reset successfully.
          </div>
          <div className={styles.link}>
            <Link to="/login">Go to Login</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Reset Password</h1>
        <p className={styles.subtitle}>Enter your reset token and new password</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.globalError}>{error}</div>}

          <div className={styles.field}>
            <label htmlFor="token" className={styles.label}>Reset Token</label>
            <input
              id="token"
              className={styles.input}
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste reset token here"
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>New Password</label>
            <input
              id="password"
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 chars, uppercase, lowercase, number"
              required
              minLength={8}
            />
          </div>

          <Button type="submit" variant="primary" fullWidth isLoading={isLoading}>
            Reset Password
          </Button>
        </form>

        <div className={styles.link}>
          <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
