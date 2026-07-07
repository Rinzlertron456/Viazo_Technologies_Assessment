import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/auth/Login";
import { Register } from "./pages/auth/Register";
import { ForgotPassword } from "./pages/auth/ForgotPassword";
import { ResetPassword } from "./pages/auth/ResetPassword";
import { ChangePassword } from "./pages/auth/ChangePassword";
import { Dashboard } from "./pages/dashboard/Dashboard";
import { DoctorSearch } from "./pages/patient/DoctorSearch";
import { DoctorProfile } from "./pages/patient/DoctorProfile";
import { BookAppointment } from "./pages/patient/BookAppointment";
import { MyAppointments } from "./pages/patient/MyAppointments";
import { RescheduleAppointment } from "./pages/patient/RescheduleAppointment";
import { PatientProfile } from "./pages/patient/PatientProfile";
import { MedicalRecords } from "./pages/patient/MedicalRecords";
import { Reviews } from "./pages/patient/Reviews";
import { DoctorAppointments } from "./pages/doctor/DoctorAppointments";
import { PatientDetail } from "./pages/doctor/PatientDetail";
import { Schedule } from "./pages/doctor/Schedule";
import { Queue } from "./pages/receptionist/Queue";
import { WalkIn } from "./pages/receptionist/WalkIn";
import { Billing } from "./pages/receptionist/Billing";
import { ManageDoctors } from "./pages/admin/ManageDoctors";
import { ManagePatients } from "./pages/admin/ManagePatients";
import { AllAppointments } from "./pages/admin/AllAppointments";
import { Reports } from "./pages/admin/Reports";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/change-password" element={<ChangePassword />} />

            <Route element={<ProtectedRoute allowedRoles={["Patient"]} />}>
              <Route path="/patient/search" element={<DoctorSearch />} />
              <Route
                path="/patient/doctors/:doctorId"
                element={<DoctorProfile />}
              />
              <Route
                path="/patient/book/:doctorId"
                element={<BookAppointment />}
              />
              <Route
                path="/patient/appointments"
                element={<MyAppointments />}
              />
              <Route
                path="/patient/reschedule/:appointmentId"
                element={<RescheduleAppointment />}
              />
              <Route path="/patient/profile" element={<PatientProfile />} />
              <Route path="/patient/records" element={<MedicalRecords />} />
              <Route path="/patient/reviews/:doctorId" element={<Reviews />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["Doctor"]} />}>
              <Route
                path="/doctor/appointments"
                element={<DoctorAppointments />}
              />
              <Route
                path="/doctor/patients/:patientId"
                element={<PatientDetail />}
              />
              <Route path="/doctor/schedule" element={<Schedule />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["Receptionist"]} />}>
              <Route path="/receptionist/queue" element={<Queue />} />
              <Route path="/receptionist/walk-in" element={<WalkIn />} />
              <Route path="/receptionist/billing" element={<Billing />} />
            </Route>

            <Route
              element={
                <ProtectedRoute allowedRoles={["Admin", "SuperAdmin"]} />
              }
            >
              <Route path="/admin/doctors" element={<ManageDoctors />} />
              <Route path="/admin/patients" element={<ManagePatients />} />
              <Route path="/admin/appointments" element={<AllAppointments />} />
              <Route path="/admin/reports" element={<Reports />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["SuperAdmin"]} />}>
              <Route
                path="/super-admin/*"
                element={<div>Super Admin module in Phase 2</div>}
              />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
