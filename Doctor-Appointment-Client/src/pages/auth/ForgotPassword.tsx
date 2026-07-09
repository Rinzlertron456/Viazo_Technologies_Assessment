import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button';
import { FieldError } from '../../components/FieldError';
import { getErrorMessage } from '../../services/api';
import { isEmail } from '../../utils/validation';
import styles from './Auth.module.css';

export function ForgotPassword() {
  const { forgotPassword, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (authLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}><p>Loading...</p></div>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!isEmail(email)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    setIsLoading(true);

    try {
      const resetToken = await forgotPassword({ email });
      setSuccess('If an account with that email exists, a password reset link has been sent.');
      if (resetToken) {
        setSuccess(`(DEV MODE) Reset token: ${resetToken}`);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Forgot Password</h1>
        <p className={styles.subtitle}>Enter your email to receive a reset link</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.globalError}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}

          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input
              id="email"
              className={styles.input}
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError('');
              }}
              placeholder="you@example.com"
              aria-invalid={!!emailError}
            />
            <FieldError message={emailError} />
          </div>

          <Button type="submit" variant="primary" fullWidth isLoading={isLoading}>
            Send Reset Link
          </Button>
        </form>

        <div className={styles.link}>
          <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
