import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button';
import { FieldError } from '../../components/FieldError';
import { getErrorMessage } from '../../services/api';
import { isNonEmpty, isPasswordStrong } from '../../utils/validation';
import styles from './Auth.module.css';

export function ResetPassword() {
  const { resetPassword, isAuthenticated, isLoading: authLoading } = useAuth();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
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
    const newErrors: Record<string, string> = {};
    if (!isNonEmpty(token)) newErrors.token = 'Reset token is required.';
    if (!isPasswordStrong(password))
      newErrors.password =
        'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character (no repeated characters).';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsLoading(true);
    try {
      await resetPassword({ token, password });
      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err));
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
              onChange={(e) => {
                setToken(e.target.value);
                if (errors.token) setErrors((x) => ({ ...x, token: '' }));
              }}
              placeholder="Paste reset token here"
              aria-invalid={!!errors.token}
            />
            <FieldError message={errors.token} />
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>New Password</label>
            <input
              id="password"
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((x) => ({ ...x, password: '' }));
              }}
              placeholder="Min 8 chars, uppercase, lowercase, number"
              aria-invalid={!!errors.password}
            />
            <FieldError message={errors.password} />
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
