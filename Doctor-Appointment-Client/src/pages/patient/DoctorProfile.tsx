import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../../components/Button";
import { api } from "../../services/api";
import styles from "./Patient.module.css";

export function DoctorProfile() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<{
    doctor: Record<string, unknown>;
    profile: Record<string, unknown> | null;
    availableSlots: unknown[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<{
          success: boolean;
          data: {
            doctor: Record<string, unknown>;
            profile: Record<string, unknown> | null;
            availableSlots: unknown[];
          };
        }>(`/patient/doctors/${doctorId}`);
        if (res.success) setData(res.data);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [doctorId]);

  if (loading)
    return (
      <div className={styles.pageContainer}>
        <p className={styles.loadingText}>Loading doctor profile...</p>
      </div>
    );
  if (!data)
    return (
      <div className={styles.pageContainer}>
        <p className={styles.loadingText}>Doctor not found</p>
      </div>
    );

  const { doctor, profile, availableSlots } = data;

  return (
    <div className={styles.pageContainer}>
      <span
        className={styles.backLink}
        onClick={() => navigate("/patient/search")}
      >
        &larr; Back to search
      </span>
      <h1 className={styles.pageTitle}>
        Dr. {String(doctor.firstName)} {String(doctor.lastName)}
      </h1>

      <div className={styles.profileDetails}>
        <div className={styles.profileInfo}>
          <div>
            <strong>Email:</strong> {String(doctor.email)}
          </div>
          <div>
            <strong>Phone:</strong> {String(doctor.phone)}
          </div>
          {profile && (
            <>
              <div>
                <strong>Specialty:</strong> {String(profile.specialization)}
              </div>
              <div>
                <strong>Qualification:</strong> {String(profile.qualification)}
              </div>
              <div>
                <strong>Experience:</strong> {String(profile.experience)} years
              </div>
              <div>
                <strong>Fee:</strong> ₹{String(profile.consultationFee)}
              </div>
              <div>
                <strong>Clinic:</strong> {String(profile.clinicAddress)}
              </div>
              <div>
                <strong>City:</strong> {String(profile.clinicCity)}
              </div>
              {profile.languages && (
                <div>
                  <strong>Languages:</strong>{" "}
                  {(profile.languages as string[]).join(", ")}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <h3 className={styles.sectionTitle}>Available Slots</h3>
      {availableSlots.length === 0 ? (
        <p className={styles.loadingText}>No slots available</p>
      ) : (
        <div className={styles.slotsGrid}>
          {(
            availableSlots as Array<{
              _id: string;
              date: string;
              startTime: string;
              endTime: string;
            }>
          ).map((slot) => (
            <div key={slot._id} className={styles.slotChip}>
              {new Date(slot.date).toLocaleDateString()} {slot.startTime}-
              {slot.endTime}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: "1.5rem" }}>
        <Button
          variant="primary"
          onClick={() => navigate(`/patient/book/${doctorId}`)}
          disabled={availableSlots.length === 0}
        >
          {availableSlots.length === 0
            ? "No Slots Available"
            : "Book Appointment"}
        </Button>
      </div>
    </div>
  );
}
