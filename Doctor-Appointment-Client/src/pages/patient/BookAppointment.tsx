import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../../components/Button";
import { FieldError } from "../../components/FieldError";
import { api, getErrorMessage } from "../../services/api";
import { isNonEmpty, maxLength, isFutureOrTodayDate } from "../../utils/validation";
import styles from "./Patient.module.css";

export function BookAppointment() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<{
    firstName: string;
    lastName: string;
  } | null>(null);
  const [doctorFee, setDoctorFee] = useState(0);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [reason, setReason] = useState("");
  const [type, setType] = useState("Clinic");
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"form" | "payment" | "success">("form");
  const [appointmentId, setAppointmentId] = useState("");
  const [error, setError] = useState("");
  const [reasonError, setReasonError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<{
          success: boolean;
          data: {
            doctor: { firstName: string; lastName: string };
            profile: { consultationFee: number } | null;
          };
        }>(`/patient/doctors/${doctorId}`);
        if (res.success) {
          setDoctor(res.data.doctor);
          if (res.data.profile) setDoctorFee(res.data.profile.consultationFee);
        }
      } catch {
        /* */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [doctorId]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/", "application/pdf"];
    if (!allowed.some((t) => file.type.startsWith(t))) {
      setError("Only image or PDF files are allowed.");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be under 5 MB.");
      e.target.value = "";
      return;
    }
    setError("");
    setReportFile(file);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const json = await res.json();
      if (json.success) setUploadedUrl(json.data.url);
    } catch {
      setError("Upload failed");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!date || !startTime) {
      setError("Please select a date and time.");
      return;
    }
    if (!isFutureOrTodayDate(date)) {
      setError("Please choose a date that is today or in the future.");
      return;
    }
    if (!isNonEmpty(reason)) {
      setReasonError("Please provide a reason for the visit.");
      return;
    }
    if (!maxLength(reason, 500)) {
      setReasonError("Reason must be under 500 characters.");
      return;
    }
    setReasonError("");
    setSubmitting(true);
    setError("");
    try {
      const endHour = parseInt(startTime.split(":")[0], 10) + 1;
      const endTime = `${String(endHour).padStart(2, "0")}:${startTime.split(":")[1] || "00"}`;
      const res = await api.post<{
        success: boolean;
        message: string;
        data?: { appointment: { _id: string } };
      }>("/patient/book", {
        doctorId,
        date,
        startTime,
        endTime,
        type,
        reason,
        notes: uploadedUrl || undefined,
      });
      if (res.success && res.data) {
        setAppointmentId(res.data.appointment._id);
        setStep("payment");
      } else setError(res.message || "Booking failed");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePayment() {
    setSubmitting(true);
    setError("");
    try {
      const orderRes = await api.post<{
        success: boolean;
        data: { orderId: string; amount: number };
      }>("/payment/create-order", { appointmentId });
      if (!orderRes.success) {
        setError("Payment failed");
        setSubmitting(false);
        return;
      }
      const verifyRes = await api.post<{ success: boolean; message: string }>(
        "/payment/verify",
        {
          appointmentId,
          paymentId: "pay_" + Math.random().toString(36).slice(2),
        },
      );
      if (verifyRes.success) setStep("success");
      else setError("Payment verification failed");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function skipPayment() {
    setStep("success");
  }

  if (loading)
    return (
      <div className={styles.pageContainer}>
        <p className={styles.loadingText}>Loading...</p>
      </div>
    );

  if (step === "success")
    return (
      <div className={styles.pageContainer}>
        <div className={styles.successMessage}>
          Appointment booked successfully!
        </div>
        <Button
          variant="primary"
          onClick={() => navigate("/patient/appointments")}
        >
          View My Appointments
        </Button>
      </div>
    );

  if (step === "payment")
    return (
      <div className={styles.pageContainer}>
        <h1 className={styles.pageTitle}>Complete Payment</h1>
        <div className={styles.profileDetails}>
          <p>
            <strong>Amount:</strong> ₹{doctorFee}
          </p>
          <p style={{ fontSize: "0.85rem", color: "#666" }}>
            Payment method: UPI / Card / Net Banking
          </p>
        </div>
        {error && <p className={styles.errorText}>{error}</p>}
        <div style={{ display: "flex", gap: "1rem" }}>
          <Button
            variant="primary"
            onClick={handlePayment}
            disabled={submitting}
          >
            {submitting ? "Processing..." : `Pay ₹${doctorFee}`}
          </Button>
          <Button variant="default" onClick={skipPayment}>
            Skip Payment
          </Button>
        </div>
      </div>
    );

  return (
    <div className={styles.pageContainer}>
      <span className={styles.backLink} onClick={() => navigate(-1)}>
        &larr; Back
      </span>
      <h1 className={styles.pageTitle}>Book Appointment</h1>
      {doctor && (
        <p className={styles.pageSubtitle}>
          with Dr. {doctor.firstName} {doctor.lastName} | Fee: ₹{doctorFee}
        </p>
      )}

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Date *</label>
          <input
            id="date"
            className={styles.formInput}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Time *</label>
          <input
            id="time"
            className={styles.formInput}
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Type</label>
          <select
            id="type"
            className={styles.formSelect}
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="Clinic">Clinic Visit</option>
            <option value="Video">Video Consultation</option>
            <option value="Phone">Phone Consultation</option>
            <option value="Home">Home Visit</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Reason *</label>
            <textarea
              id="reason"
              className={styles.formTextarea}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (reasonError) setReasonError("");
              }}
              placeholder="Brief reason for visit..."
              aria-invalid={!!reasonError}
            />
            <FieldError message={reasonError} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Upload Reports (optional)</label>
          <input
            className={styles.formInput}
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileUpload}
          />
          {reportFile && (
            <span style={{ fontSize: "0.8rem", color: "#2e7d32" }}>
              {reportFile.name} uploaded
            </span>
          )}
        </div>
        {error && <p className={styles.errorText}>{error}</p>}
        <Button variant="primary" type="submit" disabled={submitting}>
          {submitting ? "Booking..." : "Continue to Payment"}
        </Button>
      </form>
    </div>
  );
}
