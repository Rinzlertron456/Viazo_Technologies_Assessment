import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../../components/Button';
import { FieldError } from '../../components/FieldError';
import { api, getErrorMessage } from '../../services/api';
import { isNonEmpty, maxLength } from '../../utils/validation';
import styles from './Patient.module.css';

export function Reviews() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const [reviews, setReviews] = useState<Array<{ _id: string; patientId: { firstName: string; lastName: string }; rating: number; comment: string; reply?: string; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [appointmentId, setAppointmentId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function loadReviews() {
    try {
      const res = await api.get<{ success: boolean; data: { reviews: typeof reviews } }>(`/reviews/doctor/${doctorId}`);
      if (res.success) setReviews(res.data.reviews);
    } catch { /* */ } finally { setLoading(false); }
  }

  useEffect(() => { loadReviews(); }, [doctorId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!isNonEmpty(appointmentId)) newErrors.appointmentId = 'Appointment ID is required.';
    if (!rating || rating < 1) newErrors.rating = 'Please select a rating.';
    if (!isNonEmpty(comment)) newErrors.comment = 'Comment is required.';
    else if (!maxLength(comment, 1000)) newErrors.comment = 'Comment must be under 1000 characters.';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true); setMessage('');
    try {
      const res = await api.post<{ success: boolean; message: string }>('/reviews', { appointmentId, rating, comment });
      if (res.success) { setMessage('Review submitted!'); setRating(0); setComment(''); setAppointmentId(''); setErrors({}); loadReviews(); }
      else setMessage(res.message || 'Failed to submit review');
    } catch (err) { setMessage(getErrorMessage(err)); } finally { setSubmitting(false); }
  }

  const starLabels = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Reviews</h1>
      <p className={styles.pageSubtitle}>Rate your appointment experience</p>

      {message && <div style={{ background: message.includes('submitted') ? '#e8f5e9' : '#fde8e8', border: '2px solid ' + (message.includes('submitted') ? '#2e7d32' : '#c62828'), borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1rem', fontWeight: 600, fontSize: '0.9rem', color: message.includes('submitted') ? '#2e7d32' : '#c62828' }}>{message}</div>}

      <form className={styles.form} onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Appointment ID *</label>
            <input className={styles.formInput} value={appointmentId} onChange={(e) => { setAppointmentId(e.target.value); if (errors.appointmentId) setErrors((x) => ({ ...x, appointmentId: '' })); }} placeholder="Paste appointment ID" aria-invalid={!!errors.appointmentId} />
            <FieldError message={errors.appointmentId} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Rating *</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => { setRating(n); if (errors.rating) setErrors((x) => ({ ...x, rating: '' })); }} style={{
                  width: '3rem', height: '3rem', borderRadius: '0.5rem', border: '2px solid #0284c7',
                  background: rating >= n ? '#0284c7' : '#fff', color: rating >= n ? '#fff' : '#0284c7',
                  fontSize: '1.2rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s ease'
                }}>{n}</button>
              ))}
            </div>
            <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>{rating > 0 ? starLabels[rating - 1] : ''}</p>
            <FieldError message={errors.rating} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Comment *</label>
            <textarea className={styles.formTextarea} value={comment} onChange={(e) => { setComment(e.target.value); if (errors.comment) setErrors((x) => ({ ...x, comment: '' })); }} aria-invalid={!!errors.comment} />
            <FieldError message={errors.comment} />
          </div>
        <Button variant="primary" type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Review'}</Button>
      </form>

      <h3>Doctor Reviews</h3>
      {loading ? <p className={styles.loadingText}>Loading reviews...</p> : reviews.length === 0 ? (
        <p className={styles.loadingText}>No reviews yet</p>
      ) : (
        reviews.map((r) => (
          <div key={r._id} className={styles.profileDetails}>
            <div><strong>{r.patientId?.firstName} {r.patientId?.lastName}</strong> {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
            <p style={{ margin: '0.5rem 0' }}>{r.comment}</p>
            {r.reply && <p style={{ background: '#f5f5f5', padding: '0.5rem', borderRadius: '0.5rem', fontSize: '0.85rem' }}><strong>Doctor's reply:</strong> {r.reply}</p>}
            <small style={{ color: '#999' }}>{new Date(r.createdAt).toLocaleDateString()}</small>
          </div>
        ))
      )}
    </div>
  );
}
