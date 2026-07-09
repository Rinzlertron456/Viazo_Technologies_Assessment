import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/Button";
import { api } from "../../services/api";
import styles from "./Patient.module.css";

interface DoctorProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profilePicture?: string;
  profile: {
    specialization: string;
    consultationFee: number;
    clinicCity: string;
    experience: number;
    qualification: string;
    clinicAddress: string;
  } | null;
}

export function DoctorSearch() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [city, setCity] = useState("");
  const [minExperience, setMinExperience] = useState("");
  const [maxFee, setMaxFee] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const search = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (name.trim()) params.set("name", name.trim());
      if (specialty.trim()) params.set("specialty", specialty.trim());
      if (city.trim()) params.set("city", city.trim());
      params.set("limit", "50");
      const res = await api.get<{
        success: boolean;
        data: { doctors: DoctorProfile[]; total: number };
      }>(`/patient/search-doctors?${params}`);
      if (res.success) {
        let filtered = res.data.doctors;
        if (minExperience) {
          filtered = filtered.filter(
            (d) =>
              d.profile && d.profile.experience >= parseInt(minExperience, 10),
          );
        }
        if (maxFee) {
          filtered = filtered.filter(
            (d) =>
              d.profile && d.profile.consultationFee <= parseInt(maxFee, 10),
          );
        }
        setDoctors(filtered);
      }
    } catch {
      /* */
    } finally {
      setLoading(false);
    }
  }, [name, specialty, city, minExperience, maxFee]);

  useEffect(() => {
    search();
  }, [search]);

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Find a Doctor</h1>
      <p className={styles.pageSubtitle}>
        Search by name, specialty, city, experience, or fee
      </p>

      <div className={styles.searchForm}>
        <input
          className={styles.searchInput}
          placeholder="Doctor name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className={styles.searchInput}
          placeholder="Specialty (e.g. Cardiologist)"
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
        />
        <Button variant="default" onClick={() => setShowFilters(!showFilters)}>
          {showFilters ? "Hide Filters" : "More Filters"}
        </Button>
      </div>

      {showFilters && (
        <div className={styles.searchForm} style={{ marginTop: "-0.5rem" }}>
          <input
            className={styles.searchInput}
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <input
            className={styles.searchInput}
            type="number"
            placeholder="Min Experience (yrs)"
            value={minExperience}
            onChange={(e) => setMinExperience(e.target.value)}
          />
          <input
            className={styles.searchInput}
            type="number"
            placeholder="Max Fee (₹)"
            value={maxFee}
            onChange={(e) => setMaxFee(e.target.value)}
          />
        </div>
      )}

      {loading ? (
        <p className={styles.loadingText}>Searching doctors...</p>
      ) : doctors.length === 0 ? (
        <p className={styles.loadingText}>No doctors found</p>
      ) : (
        doctors.map((doc) => (
          <div key={doc._id} className={styles.doctorCard}>
            <div>
              <h3 className={styles.cardTitle}>
                Dr. {doc.firstName} {doc.lastName}
              </h3>
              {doc.profile && (
                <>
                  <p className={styles.cardDetail}>
                    <strong>Specialty:</strong> {doc.profile.specialization}
                  </p>
                  <p className={styles.cardDetail}>
                    <strong>Fee:</strong> ₹{doc.profile.consultationFee}
                  </p>
                  <p className={styles.cardDetail}>
                    <strong>City:</strong> {doc.profile.clinicCity}
                  </p>
                  <p className={styles.cardDetail}>
                    <strong>Experience:</strong> {doc.profile.experience} yrs
                  </p>
                </>
              )}
            </div>
            <Button
              variant="primary"
              onClick={() => navigate(`/patient/doctors/${doc._id}`)}
            >
              View Profile
            </Button>
          </div>
        ))
      )}
    </div>
  );
}
