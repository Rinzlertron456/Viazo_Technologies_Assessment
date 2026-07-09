# MediBook — Test Credentials

> 🔐 These credentials are for demo/testing purposes only.  
> They are auto-provisioned by the seed script (`scripts/seed.ts`) on first deploy.  
> Each password passes all validation rules (≥8 chars, upper+lower+digit+special, no repeated chars).

---

## 5 IAM Roles — Pre-Seeded Accounts

| #   | Role             | Email                     | Password     | First Name | Last Name | Phone           | Nav / Dashboard          |
| --- | ---------------- | ------------------------- | ------------ | ---------- | --------- | --------------- | ------------------------ |
| 1   | **SuperAdmin**   | `superadmin@medibook.com` | `Admin@123`  | Super      | Admin     | `+919999999991` | `/super-admin/dashboard` |
| 2   | **Admin**        | `admin@medibook.com`      | `Admin@123`  | Clinic     | Admin     | `+919999999992` | `/admin/doctors`         |
| 3   | **Doctor**       | `doctor@medibook.com`     | `Doctor@123` | Suresh     | Rao       | `+919999999993` | `/doctor/appointments`   |
| 4   | **Receptionist** | `reception@medibook.com`  | `Recept@123` | Priya      | Sharma    | `+919999999994` | `/receptionist/queue`    |
| 5   | **Patient**      | `patient@medibook.com`    | `Patie@123`  | Anil       | Kumar     | `+919999999995` | `/patient/search`        |

---

## Validation Compliance

All credentials pass the following Zod server-side rules:

| Rule                          | Example (Patient)         |
| ----------------------------- | ------------------------- |
| Email format                  | `patient@medibook.com` ✅ |
| Password ≥ 8 chars            | `Patie@123` → 9 chars ✅  |
| Has uppercase                 | `P` ✅                    |
| Has lowercase                 | `atie` ✅                 |
| Has digit                     | `123` ✅                  |
| Has special character         | `@` ✅                    |
| No repeated consecutive chars | No `aa`, `11`, `@@` ✅    |
| Phone starts with `+`         | `+919999999995` ✅        |
| Phone 8–15 digits             | 13 chars ✅               |

---

## What Each Role Can Do

### SuperAdmin (`superadmin@medibook.com`)

- **Dashboard**: `/super-admin/dashboard`
- Add hospitals, manage any user (activate/deactivate)
- Full system access

### Admin (`admin@medibook.com`)

- **Manage Doctors**: `/admin/doctors` — Add/edit doctor profiles
- **Manage Patients**: `/admin/patients` — View/search patients
- **All Appointments**: `/admin/appointments` — Read-only view
- **Reports**: `/admin/reports`
- **License Management**: `/admin/license` — Approve/reject doctor license verification

### Doctor (`doctor@medibook.com`)

- **Appointments**: `/doctor/appointments` — View/confirm/complete appointments
- **Schedule**: `/doctor/schedule` — Add time slots for booking
- **Patient Detail**: `/doctor/patients/:patientId` — View patient history & write prescriptions

### Receptionist (`reception@medibook.com`)

- **Queue**: `/receptionist/queue` — Check in patients
- **Walk-In**: `/receptionist/walk-in` — Register walk-in appointments
- **Billing**: `/receptionist/billing` — Generate invoices

### Patient (`patient@medibook.com`)

- **Find a Doctor**: `/patient/search` — Search by name, specialty, city
- **Book Appointment**: `/patient/book/:doctorId` — Select slot, reason, optional file upload
- **My Appointments**: `/patient/appointments` — View/cancel/reschedule
- **Profile**: `/patient/profile` — Medical info, emergency contact, insurance
- **Medical Records**: `/patient/records`
- **Payment History**: `/patient/bills`

---

## Quick Start

```bash
# 1. Log in with any account at:
#    http://localhost:5173/login  (dev)
#    https://<your-frontend>.vercel.app/login  (prod)

# 2. Use the email + password from the table above
```

> ⚠️ **Important**: On first deploy, the seed script (`scripts/seed.ts`) runs automatically if no SuperAdmin exists. This ensures these credentials are always available. If you deploy to a fresh database, the seed runs once.

---

## Notes

- The Doctor account (`doctor@medibook.com`) has a **pre-seeded `DoctorProfile`** with specialization "Cardiologist", 12 years experience, ₹500 fee, and a sample slot on the next available future date.
- The Patient account (`patient@medibook.com`) has a **pre-seeded `PatientProfile`** with basic medical info.
- Passwords can be changed after login via `/change-password`.
- For 2FA setup, visit `/login` with any account and follow the 2FA setup flow.
