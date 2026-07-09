import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import { PhoneInput } from "../../components/PhoneInput";
import styles from "./SuperAdmin.module.css";

interface Stats {
  totalUsers: number;
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  totalBills: number;
  totalRevenue: number;
}

interface Hospital {
  _id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  isActive: boolean;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export function SuperAdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showAddHospital, setShowAddHospital] = useState(false);
  const [newHospital, setNewHospital] = useState({
    name: "",
    address: "",
    city: "",
    phone: "",
    email: "",
  });
  const [userFilter, setUserFilter] = useState("");

  async function loadAll() {
    setLoading(true);
    try {
      const [statsRes, hospRes, usersRes] = await Promise.all([
        api.get<{ success: boolean; data: { stats: Stats } }>(
          "/super-admin/stats",
        ),
        api.get<{ success: boolean; data: { hospitals: Hospital[] } }>(
          "/super-admin/hospitals",
        ),
        api.get<{ success: boolean; data: { users: User[]; total: number } }>(
          "/super-admin/users",
        ),
      ]);
      if (statsRes.success) setStats(statsRes.data.stats);
      if (hospRes.success) setHospitals(hospRes.data.hospitals);
      if (usersRes.success) setUsers(usersRes.data.users);
    } catch {
      setMessage("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleAddHospital(e: React.FormEvent) {
    e.preventDefault();
    if (!newHospital.name || !newHospital.city) {
      setMessage("Name and city required");
      return;
    }
    try {
      const res = await api.post<{ success: boolean }>(
        "/super-admin/hospitals",
        newHospital,
      );
      if (res.success) {
        setMessage("Hospital added");
        setShowAddHospital(false);
        setNewHospital({
          name: "",
          address: "",
          city: "",
          phone: "",
          email: "",
        });
        // Reload
        const hospRes = await api.get<{
          success: boolean;
          data: { hospitals: Hospital[] };
        }>("/super-admin/hospitals");
        if (hospRes.success) setHospitals(hospRes.data.hospitals);
      }
    } catch {
      setMessage("Failed to add hospital");
    }
  }

  async function handleToggleUser(userId: string) {
    try {
      const res = await api.patch<{ success: boolean; message: string }>(
        `/super-admin/users/${userId}/toggle`,
        {},
      );
      if (res.success) {
        setMessage(res.message);
        const usersRes = await api.get<{
          success: boolean;
          data: { users: User[] };
        }>("/super-admin/users");
        if (usersRes.success) setUsers(usersRes.data.users);
      }
    } catch {
      setMessage("Failed to toggle user");
    }
  }

  const filteredUsers = users.filter((u) => {
    if (!userFilter) return true;
    const q = userFilter.toLowerCase();
    return (
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  if (loading)
    return (
      <div className={styles.pageContainer}>
        <p className={styles.loadingText}>Loading...</p>
      </div>
    );

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Super Admin Dashboard</h1>
      <p className={styles.pageSubtitle}>Multi-hospital system management</p>

      {message && (
        <div
          style={{
            background: message.includes("Failed") ? "#fde8e8" : "#e8f5e9",
            border:
              "2px solid " +
              (message.includes("Failed") ? "#c62828" : "#2e7d32"),
            borderRadius: "0.5rem",
            padding: "0.75rem 1rem",
            marginBottom: "1rem",
            fontWeight: 600,
            fontSize: "0.9rem",
            color: message.includes("Failed") ? "#c62828" : "#2e7d32",
          }}
        >
          {message}
        </div>
      )}

      {stats && (
        <>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.totalUsers}</div>
              <div className={styles.statLabel}>Total Users</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.totalDoctors}</div>
              <div className={styles.statLabel}>Doctors</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.totalPatients}</div>
              <div className={styles.statLabel}>Patients</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.totalAppointments}</div>
              <div className={styles.statLabel}>Appointments</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.totalBills}</div>
              <div className={styles.statLabel}>Bills</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>
                ₹{stats.totalRevenue.toLocaleString()}
              </div>
              <div className={styles.statLabel}>Revenue</div>
            </div>
          </div>
        </>
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3 className={styles.sectionTitle}>Hospitals</h3>
        <Button
          variant="primary"
          onClick={() => setShowAddHospital(true)}
          style={{ marginBottom: "1rem" }}
        >
          Add Hospital
        </Button>
      </div>

      <Modal
        open={showAddHospital}
        title="Add New Hospital"
        onClose={() => {
          setShowAddHospital(false);
          setNewHospital({
            name: "",
            address: "",
            city: "",
            phone: "",
            email: "",
          });
        }}
        footer={
          <>
            <Button
              variant="default"
              onClick={() => {
                setShowAddHospital(false);
                setNewHospital({
                  name: "",
                  address: "",
                  city: "",
                  phone: "",
                  email: "",
                });
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" form="hospital-form">
              Save Hospital
            </Button>
          </>
        }
      >
        <form id="hospital-form" onSubmit={handleAddHospital}>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Hospital Name *</label>
              <input
                className={styles.formInput}
                value={newHospital.name}
                onChange={(e) =>
                  setNewHospital({ ...newHospital, name: e.target.value })
                }
                placeholder="e.g. Viazo Medical Center"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>City *</label>
              <input
                className={styles.formInput}
                value={newHospital.city}
                onChange={(e) =>
                  setNewHospital({ ...newHospital, city: e.target.value })
                }
                placeholder="e.g. Hyderabad"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Address</label>
              <input
                className={styles.formInput}
                value={newHospital.address}
                onChange={(e) =>
                  setNewHospital({ ...newHospital, address: e.target.value })
                }
                placeholder="Full address"
              />
            </div>
            <PhoneInput
              id="hospital-phone"
              label="Phone"
              value={newHospital.phone}
              onChange={(v) => setNewHospital({ ...newHospital, phone: v })}
            />
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Email</label>
              <input
                className={styles.formInput}
                type="email"
                value={newHospital.email}
                onChange={(e) =>
                  setNewHospital({ ...newHospital, email: e.target.value })
                }
                placeholder="info@hospital.com"
              />
            </div>
          </div>
        </form>
      </Modal>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>City</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {hospitals.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                style={{ textAlign: "center", padding: "1rem", color: "#666" }}
              >
                No hospitals
              </td>
            </tr>
          ) : (
            hospitals.map((h) => (
              <tr key={h._id}>
                <td>{h.name}</td>
                <td>{h.city}</td>
                <td>{h.phone}</td>
                <td>{h.email}</td>
                <td>
                  <span
                    style={{
                      color: h.isActive ? "#2e7d32" : "#c62828",
                      fontWeight: 600,
                    }}
                  >
                    {h.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <h3 className={styles.sectionTitle}>All Users</h3>
      <input
        className={styles.formInput}
        style={{ width: "300px", marginBottom: "1rem" }}
        placeholder="Search users by name, email, or role..."
        value={userFilter}
        onChange={(e) => setUserFilter(e.target.value)}
      />
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                style={{ textAlign: "center", padding: "1rem", color: "#666" }}
              >
                No users found
              </td>
            </tr>
          ) : (
            filteredUsers.slice(0, 50).map((u) => (
              <tr key={u._id}>
                <td>
                  {u.firstName} {u.lastName}
                </td>
                <td>{u.email}</td>
                <td>
                  <span
                    style={{
                      background: "#eef2f7",
                      color: "#334155",
                      padding: "0.1rem 0.4rem",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      borderRadius: "0.375rem",
                    }}
                  >
                    {u.role}
                  </span>
                </td>
                <td>
                  <span
                    style={{
                      color: u.isActive ? "#2e7d32" : "#c62828",
                      fontWeight: 600,
                    }}
                  >
                    {u.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td>
                  <Button
                    variant={u.isActive ? "danger" : "primary"}
                    onClick={() => handleToggleUser(u._id)}
                  >
                    {u.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
