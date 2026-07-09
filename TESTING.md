# UI Test Suite — MediBook (Doctor Appointment System)

This suite covers manual end-to-end UI testing for all five roles, plus an automated
Playwright happy-path script (`./Doctor-Appointment-Client/e2e/happy-path.spec.ts`).

## 0. Prerequisites

- MongoDB running locally on `:27017`.
- API server on `:5000` (`Doctor-Appointment-Server`, `npm run dev`).
- Client on `:5173` (`Doctor-Appointment-Client`, `npm run dev`).
- No seed script exists — all users are created through the UI.

## 1. Global validation rules (apply on every form)

| Rule | Accepted value example |
| --- | --- |
| Email | `name@test.com` |
| Phone | 10–15 digits, optional leading `+` → `+919876543210` |
| Password | ≥8 chars, upper + lower + digit + special character, no repeated (consecutive) characters → `Test@123` |
| Required text | non-empty, reason ≤500 chars, review comment ≤1000 chars |
| Date (book / slot / reschedule) | today or future |
| Slot | end time strictly after start; `maxPatients ≥ 1` |
| Error display | **red + small** (rendered via Tailwind `text-red-600 text-xs`) |

## 2. Roles and entry screens

`Patient`, `Doctor`, `Receptionist`, `Admin`, `SuperAdmin`. The register form lets you
pick any role directly. All screens are gated by `<ProtectedRoute>`; unknown routes
redirect to `/dashboard`.

## 3. Recommended test order (reuse generated IDs from the URL)

1. Register an **Admin** → login.
2. **Admin → Manage Doctors → Add Doctor** (creates the doctor user + profile/fee).
3. **Login as that Doctor → My Schedule → Add Slot** (booking is disabled until a slot exists).
4. **Register a Patient** → login.
5. **Patient → Find a Doctor → Book → Pay → My Appointments**.
6. **Receptionist** (register separately) → Queue (Check In) → Walk-in → Billing.
7. **Admin → All Appointments / Reports / License Management**.
8. **SuperAdmin → Dashboard → Add Hospital / toggle users**.

## 4. Test cases with data

### TC-AUTH-01 — Register (any role) — `/register`

| Field | Value |
| --- | --- |
| First Name | Anil |
| Last Name | Kumar |
| Email | `anil.admin@test.com` |
| Phone | `+919876543210` |
| Password | `Test@123` |
| Role | Admin |

- **Expected:** success → redirect to `/dashboard`.
- **Negative:** re-register the same email → friendly error shown, **no white screen** (fixed).
- **Negative:** weak password (e.g. missing special character or with repeated characters) → inline red error.

### TC-AUTH-02 — Login — `/login`

- Email `anil.admin@test.com` / Password `Test@123`.
- **Negative:** login a non-existent user → "Invalid email or password." shown,
  **no white screen** (fixed).
- Forgot / Reset / Change password use a dev reset token printed on screen.

### TC-ADM-01 — Add Doctor — `/admin/doctors`

| Field | Value |
| --- | --- |
| First Name | Suresh |
| Last Name | Rao |
| Email | `dr.suresh@test.com` |
| Password | `Doctor@123` |
| Specialization * | Cardiologist |
| Phone * | `+919812345678` |
| Experience (yrs) | 12 |
| Qualification | MD, DM Cardiology |
| Fee (₹) | 500 |
| Clinic City | Hyderabad |
| Clinic Address | 123 MG Road (optional) |

`*` Required: firstName, lastName, email, password, specialization, phone.
**Expected:** "Doctor added successfully"; doctor appears in the Manage Doctors list.

### TC-DOC-01 — Add Slot — `/doctor/schedule`

- Date `2026-07-10` (future), Start `10:00`, End `11:00`, Patients `3`.
- **Expected:** slot saved; the patient "Book Appointment" button becomes enabled.

### TC-PAT-01 — Search & Book — `/patient/search` → `/patient/book/:id`

- Search: Name `Suresh`, or Specialty `Cardiologist`, or More Filters →
  City `Hyderabad`, Min Experience `5`, Max Fee `1000`.
- Book: Date `2026-07-10`, Time `10:30`, Type `Clinic`,
  Reason `Chest pain and palpitations`, (optional file ≤5 MB image/PDF).
- Pay `₹500` (mock) → success. Copy the appointment ID from the `/patient/appointments` URL.

### TC-PAT-02 — Reschedule / Cancel — `/patient/appointments`, `/patient/reschedule/:id`

- Reschedule: new date `2026-07-11`, time `11:00` → status `Rescheduled`.
- Cancel: confirm modal → status `Cancelled`.

### TC-PAT-03 — Profile / Medical Info — `/patient/profile`

- DOB `1990-05-15`, Gender `Male`, Blood Group `O+`, Height `175`, Weight `72`,
  Allergies `Penicillin`, Chronic Diseases `Hypertension`,
  Emergency Contact `Ravi / +919800112233`, Insurance `Star Health / SH12345`.
- Basic-info edit allows First/Last/Phone only.

### TC-PAT-04 — Reviews — `/patient/reviews/:doctorId`

- Paste appointment ID, Rating `5` (click number), Comment `Very professional and on time`.

### TC-REC-01 — Queue / Check In — `/receptionist/queue`

- Lists today's appointments. **Check In button appears only when status = `Confirmed`**
  (booking starts as `Pending`; verify the confirm transition). After check-in status → `CheckedIn`.

### TC-REC-02 — Walk-in — `/receptionist/walk-in`

- Patient ID (paste a Patient `_id`), Doctor `Suresh Rao`, Reason `Walk-in fever` (≤500 chars).

### TC-REC-03 — Billing — `/receptionist/billing`

- Appointment ID *, Patient ID *, Consultation Fee `500` *, Discount `50`, Tax `90`,
  Payment Method `UPI`.

### TC-ADM-02 — License Management — `/admin/license`

- Pending (self-registered doctors) → Approve or Reject (reason optional).
- **Fixed:** a rejected doctor now gets `verificationStatus: rejected` and does **not**
  reappear in the pending list after reload.
- Doctors created via Manage Doctors do not appear here.

### TC-ADM-03 — All Appointments / Reports / Manage Patients

- Read-only tables. Manage Patients has a name/email/phone search box.

### TC-SA-01 — SuperAdmin Dashboard — `/super-admin/dashboard`

- Add Hospital: Name `Viazo Medical Center` *, City `Hyderabad` *, Address,
  Phone `+914012345678`, Email `info@viazo.com`.
- Search-users box filters by name/email/role; Deactivate/Activate buttons per user.

## 5. Known gaps to expect during UI testing

- **Payment is mocked** — Pay only hits create-order/verify; no real gateway.
- **Notifications** are server-side `console.log` only — watch the server terminal on book/cancel.
- **Payment History** renders empty by design until the billing list endpoint is populated.
- **File upload** is optional on booking (image/PDF ≤5 MB).
- **Manage Doctors** has no UI field for `registrationNumber` though the type expects it.
- **Booking starts `Pending`** — confirm how/when it becomes `Confirmed` (affects
  Receptionist Check-In visibility).

## 6. Regression checklist for the current fixes

- [ ] Duplicate-email register → friendly error, **no white screen**.
- [ ] Non-existent-user login → friendly error, **no white screen**.
- [ ] Reject a license → it stays out of the pending list after reload.
- [ ] Field errors are **red and small** (not plain dark text).
- [ ] No black borders / offset hard shadows anywhere (brutalist styles removed).

## 7. Automated happy-path test

A Playwright script covering TC-AUTH-01 → TC-ADM-01 → TC-DOC-01 → TC-PAT-01 is in
`./Doctor-Appointment-Client/e2e/happy-path.spec.ts`.

```bash
# from Doctor-Appointment-Client
npm install
npm install -D @playwright/test
npx playwright install chromium

# start the API server in another terminal, then:
npm run test:e2e
```

The script expects both the API server (`:5000`) and the Vite client (`:5173`) to be
reachable. The Playwright config starts only the Vite client; run the server separately.
