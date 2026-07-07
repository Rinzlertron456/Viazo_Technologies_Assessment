import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import styles from './Dashboard.module.css';

interface DashboardResponse {
  success: boolean;
  data?: {
    stats: Record<string, unknown>;
  };
  message?: string;
}

export function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await api.get<DashboardResponse>('/dashboard/stats');
        if (res.success && res.data?.stats) {
          setStats(res.data.stats);
        }
      } catch {
        // Stats are non-critical
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  function renderPatientStats(s: Record<string, unknown>) {
    return (
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{String(s.upcomingAppointments ?? 0)}</span>
          <span className={styles.statLabel}>Upcoming Appointments</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{String(s.completedAppointments ?? 0)}</span>
          <span className={styles.statLabel}>Completed</span>
        </div>
      </div>
    );
  }

  function renderDoctorStats(s: Record<string, unknown>) {
    return (
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{String(s.todayAppointments ?? 0)}</span>
          <span className={styles.statLabel}>Today's Appointments</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{String(s.totalPatients ?? 0)}</span>
          <span className={styles.statLabel}>Total Patients</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{String(s.pendingConsultations ?? 0)}</span>
          <span className={styles.statLabel}>Pending Consultations</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>₹{String(s.earnings ?? 0)}</span>
          <span className={styles.statLabel}>Earnings</span>
        </div>
      </div>
    );
  }

  function renderReceptionistStats(s: Record<string, unknown>) {
    return (
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{String(s.todayBookings ?? 0)}</span>
          <span className={styles.statLabel}>Today's Bookings</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{String(s.pendingCheckIns ?? 0)}</span>
          <span className={styles.statLabel}>Pending Check-ins</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{String(s.checkedIn ?? 0)}</span>
          <span className={styles.statLabel}>Checked In</span>
        </div>
      </div>
    );
  }

  function renderAdminStats(s: Record<string, unknown>) {
    return (
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{String(s.totalDoctors ?? 0)}</span>
          <span className={styles.statLabel}>Doctors</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{String(s.totalPatients ?? 0)}</span>
          <span className={styles.statLabel}>Patients</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{String(s.totalUsers ?? 0)}</span>
          <span className={styles.statLabel}>Total Users</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{String(s.todayAppointments ?? 0)}</span>
          <span className={styles.statLabel}>Today Appointments</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>₹{String(s.revenue ?? 0)}</span>
          <span className={styles.statLabel}>Revenue</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{String(s.pendingPayments ?? 0)}</span>
          <span className={styles.statLabel}>Pending Payments</span>
        </div>
      </div>
    );
  }

  function renderStats() {
    if (loading) return <p className={styles.loadingText}>Loading stats...</p>;
    if (!stats) return <p className={styles.loadingText}>Stats unavailable</p>;
    const role = stats.role as string;
    if (role === 'Patient') return renderPatientStats(stats);
    if (role === 'Doctor') return renderDoctorStats(stats);
    if (role === 'Receptionist') return renderReceptionistStats(stats);
    if (role === 'Admin' || role === 'SuperAdmin') return renderAdminStats(stats);
    return null;
  }

  const quickLinks: Record<string, { label: string; path: string }[]> = {
    Patient: [
      { label: 'Find a Doctor', path: '/patient/search' },
      { label: 'My Appointments', path: '/patient/appointments' },
      { label: 'My Profile', path: '/patient/profile' },
    ],
    Doctor: [
      { label: 'Appointments', path: '/doctor/appointments' },
      { label: 'My Schedule', path: '/doctor/schedule' },
    ],
    Receptionist: [
      { label: 'Patient Queue', path: '/receptionist/queue' },
      { label: 'Walk-in Registration', path: '/receptionist/walk-in' },
      { label: 'Billing', path: '/receptionist/billing' },
    ],
    Admin: [
      { label: 'Manage Doctors', path: '/admin/doctors' },
      { label: 'Manage Patients', path: '/admin/patients' },
      { label: 'All Appointments', path: '/admin/appointments' },
    ],
    SuperAdmin: [
      { label: 'Hospitals', path: '/super-admin/hospitals' },
      { label: 'All Users', path: '/admin/doctors' },
    ],
  };

  const links = quickLinks[user?.role || ''] || [];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.logo}>MediBook</h1>
        <div className={styles.userInfo}>
          <span className={styles.role}>{user?.role}</span>
          <span className={styles.name}>{user?.firstName} {user?.lastName}</span>
          <Button variant="danger" onClick={handleLogout}>Logout</Button>
        </div>
      </header>

      <main className={styles.main}>
        <h2 className={styles.greeting}>Welcome, {user?.firstName}!</h2>
        <p className={styles.roleTag}>You are logged in as <strong>{user?.role}</strong></p>

        <div className={styles.grid}>
          {links.map((link) => (
            <button key={link.path} className={styles.card} onClick={() => navigate(link.path)}>
              {link.label}
            </button>
          ))}
        </div>

        <section className={styles.statsSection}>
          <h3 className={styles.sectionTitle}>Dashboard Overview</h3>
          {renderStats()}
        </section>
      </main>
    </div>
  );
}
