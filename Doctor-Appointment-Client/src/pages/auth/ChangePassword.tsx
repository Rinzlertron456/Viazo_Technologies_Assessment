import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button';
import { ApiError } from '../../services/api';
import styles from './Auth.module.css';

export function ChangePassword() {
  const { changePassword } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Failed to change password');
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Password Changed</h1>
          <p style={{ marginBottom: '1.5rem', color: '#2e7d32', fontWeight: 600 }}>Your password has been updated. Please login again.</p>
          <Button variant="primary" fullWidth onClick={() => navigate('/login')}>Go to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Change Password</h1>
        <p className={styles.subtitle}>Update your account password</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.globalError}>{error}</div>}

          <div className={styles.field}>
            <label className={styles.label}>Current Password</label>
            <input className={styles.input} type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required autoComplete="current-password" />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>New Password</label>
            <input className={styles.input} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required autoComplete="new-password" />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Confirm New Password</label>
            <input className={styles.input} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
          </div>

          <Button type="submit" variant="primary" fullWidth isLoading={isLoading}>Update Password</Button>
        </form>

        <div className={styles.link}>
          <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate(-1)}>Go back</span>
        </div>
      </div>
    </div>
  );
}
