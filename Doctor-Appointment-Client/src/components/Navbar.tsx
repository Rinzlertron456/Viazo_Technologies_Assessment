import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import styles from "./Navbar.module.css";

const MENUS: Record<string, { label: string; path: string }[]> = {
  Patient: [
    { label: "Find a Doctor", path: "/patient/search" },
    { label: "My Appointments", path: "/patient/appointments" },
    { label: "My Profile", path: "/patient/profile" },
    { label: "Medical Records", path: "/patient/records" },
    { label: "Payment History", path: "/patient/bills" },
  ],
  Doctor: [
    { label: "Appointments", path: "/doctor/appointments" },
    { label: "My Schedule", path: "/doctor/schedule" },
  ],
  Receptionist: [
    { label: "Patient Queue", path: "/receptionist/queue" },
    { label: "Walk-in", path: "/receptionist/walk-in" },
    { label: "Billing", path: "/receptionist/billing" },
  ],
  Admin: [
    { label: "Doctors", path: "/admin/doctors" },
    { label: "Patients", path: "/admin/patients" },
    { label: "Appointments", path: "/admin/appointments" },
    { label: "Reports", path: "/admin/reports" },
    { label: "License Verification", path: "/admin/license" },
  ],
  SuperAdmin: [
    { label: "Dashboard", path: "/super-admin/dashboard" },
    { label: "Doctors", path: "/admin/doctors" },
    { label: "Patients", path: "/admin/patients" },
    { label: "Appointments", path: "/admin/appointments" },
    { label: "Reports", path: "/admin/reports" },
    { label: "License", path: "/admin/license" },
  ],
};

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!user) return null;

  const roleMenus = MENUS[user.role] || [];
  const roleLabel = user.role === "SuperAdmin" ? "Super Admin" : user.role;

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <div className={styles.row}>
          <button onClick={() => navigate("/dashboard")} className={styles.logo}>
            <span className={styles.logoText}>MediBook</span>
          </button>

          <div className={styles.desktopNav} ref={menuRef}>
            <button onClick={() => navigate("/dashboard")} className={styles.navLink}>
              Dashboard
            </button>
            <button onClick={() => navigate("/calendar")} className={styles.navLink}>
              Calendar
            </button>

            {roleMenus.length > 0 && (
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className={`${styles.navLink} ${styles.menuBtn}`}
                >
                  {roleLabel}
                  <svg
                    className={menuOpen ? styles.arrowOpen : ""}
                    width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    style={{ transition: "transform 0.15s" }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {menuOpen && (
                  <div className={styles.dropdown}>
                    {roleMenus.map((item) => (
                      <button
                        key={item.path}
                        onClick={() => { navigate(item.path); setMenuOpen(false); }}
                        className={styles.dropdowItem}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className={styles.navRight}>
              <span className={styles.userName}>{user.firstName} {user.lastName}</span>
              <button
                onClick={() => navigate("/change-password")}
                className={styles.iconBtn}
                title="Change Password"
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </button>
              <button
                onClick={async () => { await logout(); navigate("/login"); }}
                className={styles.logoutBtn}
              >
                Logout
              </button>
            </div>
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className={styles.hamburger}>
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className={styles.mobileMenu}>
          <div className={styles.mobileMenuInner}>
            <button className={styles.mobileLink} onClick={() => { navigate("/dashboard"); setMobileOpen(false); }}>
              Dashboard
            </button>
            <button className={styles.mobileLink} onClick={() => { navigate("/calendar"); setMobileOpen(false); }}>
              Calendar
            </button>
            {roleMenus.map((item) => (
              <button
                key={item.path}
                className={styles.mobileLink}
                onClick={() => { navigate(item.path); setMobileOpen(false); }}
              >
                {item.label}
              </button>
            ))}
            <div className={styles.mobileDivider}>
              <button
                className={styles.mobileLogout}
                onClick={async () => { await logout(); navigate("/login"); }}
              >
                Logout ({user.firstName})
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
