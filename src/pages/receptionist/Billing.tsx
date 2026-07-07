import React, { useState } from 'react';
import Button from '../../components/Button';
import api from '../../services/api';
import styles from './Receptionist.module.css';

const Billing: React.FC = () => {
  const [appointmentId, setAppointmentId] = useState('');
  const [consultationFee, setConsultationFee] = useState('');
  const [discount, setDiscount] = useState('0');
  const [tax, setTax] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!appointmentId.trim() || !consultationFee.trim() || !paymentMethod) {
      setError('Appointment ID, consultation fee, and payment method are required');
      return;
    }

    const fee = parseFloat(consultationFee);
    if (isNaN(fee) || fee < 0) {
      setError('Consultation fee must be a valid positive number');
      return;
    }

    const disc = parseFloat(discount) || 0;
    if (disc < 0) {
      setError('Discount cannot be negative');
      return;
    }

    const tx = parseFloat(tax) || 0;
    if (tx < 0) {
      setError('Tax cannot be negative');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/receptionist/bills', {
        appointmentId: appointmentId.trim(),
        consultationFee: fee,
        discount: disc,
        tax: tx,
        paymentMethod,
      });
      if (res.success) {
        setSuccess('Bill created successfully!');
        setAppointmentId('');
        setConsultationFee('');
        setDiscount('0');
        setTax('0');
        setPaymentMethod('');
      } else {
        setError(res.message || 'Failed to create bill');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create bill');
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals for preview
  const fee = parseFloat(consultationFee) || 0;
  const disc = parseFloat(discount) || 0;
  const tx = parseFloat(tax) || 0;
  const subtotal = fee - disc;
  const taxAmount = subtotal * (tx / 100);
  const total = subtotal + taxAmount;

  const hasValues = consultationFee.trim() !== '';

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Create Bill</h1>

      {error && <div className={styles.errorMessage}>{error}</div>}

      <div className={styles.formCard}>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Appointment ID</label>
            <input
              className={styles.formInput}
              type="text"
              placeholder="Enter appointment ID"
              value={appointmentId}
              onChange={(e) => setAppointmentId(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Consultation Fee ($)</label>
            <input
              className={styles.formInput}
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={consultationFee}
              onChange={(e) => setConsultationFee(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Discount ($)</label>
            <input
              className={styles.formInput}
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Tax (%)</label>
            <input
              className={styles.formInput}
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              value={tax}
              onChange={(e) => setTax(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Payment Method</label>
            <select
              className={styles.formSelect}
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="">-- Select Payment Method --</option>
              <option value="cash">Cash</option>
              <option value="creditCard">Credit Card</option>
              <option value="debitCard">Debit Card</option>
              <option value="insurance">Insurance</option>
              <option value="upi">UPI</option>
              <option value="other">Other</option>
            </select>
          </div>

          {hasValues && (
            <div
              style={{
                background: '#fff',
                border: '3px solid #000',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1.5rem',
                boxShadow: '4px 4px 0 #000',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 600,
                  marginBottom: '0.3rem',
                  textTransform: 'uppercase',
                  fontSize: '0.85rem',
                }}
              >
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 600,
                  marginBottom: '0.3rem',
                  textTransform: 'uppercase',
                  fontSize: '0.85rem',
                  color: '#555',
                }}
              >
                <span>Tax ({tx}%)</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  textTransform: 'uppercase',
                  borderTop: '2px solid #000',
                  paddingTop: '0.5rem',
                  marginTop: '0.25rem',
                }}
              >
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          )}

          <Button variant="primary" type="submit" fullWidth disabled={loading}>
            {loading ? 'Creating Bill...' : 'Create Bill'}
          </Button>
        </form>

        {success && <div className={styles.successMessage}>{success}</div>}
      </div>
    </div>
  );
};

export default Billing;