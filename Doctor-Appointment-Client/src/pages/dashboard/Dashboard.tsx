import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import {
  CalendarDays, ClipboardList, User, Users, Stethoscope, Activity,
  DollarSign, Clock, CheckCircle, Search, Calendar,
  Building2, FileText, CreditCard, ArrowRight
} from 'lucide-react';
import styles from './Dashboard.module.css';

interface DashboardStats {
  upcomingAppointments?: number;
  completedAppointments?: number;
  todayAppointments?: number;
  totalPatients?: number;
  pendingConsultations?: number;
  earnings?: number;
  todayBookings?: number;
  pendingCheckIns?: number;
  checkedIn?: number;
  totalDoctors?: number;
  totalUsers?: number;
  revenue?: number;
  pendingPayments?: number;
}

const ICONS: Record<string, React.ReactNode> = {
  'Find a Doctor': <Search size={18} />,
  'My Appointments': <CalendarDays size={18} />,
  'My Profile': <User size={18} />,
  'Medical Records': <FileText size={18} />,
  'Payment History': <CreditCard size={18} />,
  'Appointments': <ClipboardList size={18} />,
  'My Schedule': <Calendar size={18} />,
  'Patient Queue': <Users size={18} />,
  'Walk-in Registration': <ClipboardList size={18} />,
  'Billing': <DollarSign size={18} />,
  'Manage Doctors': <Stethoscope size={18} />,
  'Manage Patients': <Users size={18} />,
  'All Appointments': <CalendarDays size={18} />,
  'Reports': <FileText size={18} />,
  'License Verification': <FileText size={18} />,
  'Super Admin Dashboard': <Building2 size={18} />,
};

const STAT_ICONS: Record<string, React.ReactNode> = {
  'Upcoming Appointments': <CalendarDays size={16} color="#0284c7" />,
  'Completed': <CheckCircle size={16} color="#059669" />,
  "Today's Appointments": <Clock size={16} color="#2563eb" />,
  'Total Patients': <Users size={16} color="#7c3aed" />,
  'Pending Consultations': <Clock size={16} color="#d97706" />,
  'Earnings': <DollarSign size={16} color="#059669" />,
  "Today's Bookings": <CalendarDays size={16} color="#0284c7" />,
  'Pending Check-ins': <Clock size={16} color="#d97706" />,
  'Checked In': <CheckCircle size={16} color="#059669" />,
  'Doctors': <Stethoscope size={16} color="#0284c7" />,
  'Total Users': <Users size={16} color="#7c3aed" />,
  'Today Appointments': <CalendarDays size={16} color="#2563eb" />,
  'Revenue': <DollarSign size={16} color="#059669" />,
  'Pending Payments': <Clock size={16} color="#d97706" />,
};

const quickLinks: Record<string, { label: string; path: string }[]> = {
  Patient: [
    { label: 'Find a Doctor', path: '/patient/search' },
    { label: 'My Appointments', path: '/patient/appointments' },
    { label: 'My Profile', path: '/patient/profile' },
    { label: 'Medical Records', path: '/patient/records' },
    { label: 'Payment History', path: '/patient/bills' },
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
    { label: 'Reports', path: '/admin/reports' },
    { label: 'License Verification', path: '/admin/license' },
  ],
  SuperAdmin: [
    { label: 'Super Admin Dashboard', path: '/super-admin/dashboard' },
    { label: 'Manage Doctors', path: '/admin/doctors' },
    { label: 'Manage Patients', path: '/admin/patients' },
    { label: 'All Appointments', path: '/admin/appointments' },
    { label: 'Reports', path: '/admin/reports' },
  ],
};

export function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await api.get<{ success: boolean; data?: { stats: DashboardStats } }>('/dashboard/stats');
        if (res.success && res.data?.stats) setStats(res.data.stats);
      } catch { /* */ } finally { setLoading(false); }
    }
    loadStats();
  }, []);

  const links = quickLinks[user?.role || ''] || [];

  function renderStats() {
    if (loading) {
      return (
        <div className={styles.skeletonGrid}>
          {[1,2,3,4].map(i => (
            <div key={i} className={styles.skeleton}>
              <div className={styles.skelBar} />
              <div className={styles.skelBig} />
            </div>
          ))}
        </div>
      );
    }
    if (!stats) return <p className={styles.loadingText}>Unable to load stats</p>;

    const role = user?.role || '';
    let items: { label: string; value: string | number }[] = [];
    if (role === 'Patient') items = [
      { label: 'Upcoming Appointments', value: stats.upcomingAppointments ?? 0 },
      { label: 'Completed', value: stats.completedAppointments ?? 0 },
    ];
    else if (role === 'Doctor') items = [
      { label: "Today's Appointments", value: stats.todayAppointments ?? 0 },
      { label: 'Total Patients', value: stats.totalPatients ?? 0 },
      { label: 'Pending Consultations', value: stats.pendingConsultations ?? 0 },
      { label: 'Earnings', value: `₹${stats.earnings ?? 0}` },
    ];
    else if (role === 'Receptionist') items = [
      { label: "Today's Bookings", value: stats.todayBookings ?? 0 },
      { label: 'Pending Check-ins', value: stats.pendingCheckIns ?? 0 },
      { label: 'Checked In', value: stats.checkedIn ?? 0 },
    ];
    else if (role === 'Admin' || role === 'SuperAdmin') items = [
      { label: 'Doctors', value: stats.totalDoctors ?? 0 },
      { label: 'Total Patients', value: stats.totalPatients ?? 0 },
      { label: 'Total Users', value: stats.totalUsers ?? 0 },
      { label: 'Today Appointments', value: stats.todayAppointments ?? 0 },
      { label: 'Revenue', value: `₹${stats.revenue ?? 0}` },
      { label: 'Pending Payments', value: stats.pendingPayments ?? 0 },
    ];

    return (
      <div className={styles.statsGrid}>
        {items.map(item => (
          <div key={item.label} className={styles.statCard}>
            <div className={styles.statHeader}>
              {STAT_ICONS[item.label]}
              <span className={styles.statLabel}>{item.label}</span>
            </div>
            <div className={styles.statValue}>{item.value}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.welcomeSection}>
          <h1 className={styles.greeting}>Welcome, {user?.firstName}!</h1>
          <p className={styles.roleTag}>
            You are logged in as <strong>{user?.role === 'SuperAdmin' ? 'Super Admin' : user?.role}</strong>
          </p>
        </div>

        <div>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>
          <div className={styles.linksGrid}>
            {links.map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={styles.linkCard}
              >
                <span className={styles.linkIcon}>
                  {ICONS[link.label] || <Activity size={18} />}
                </span>
                {link.label}
                <ArrowRight size={14} style={{ marginLeft: 'auto', opacity: 0.4 }} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className={styles.sectionTitle}>Dashboard Overview</h2>
          {renderStats()}
        </div>
      </main>
    </div>
  );
}
