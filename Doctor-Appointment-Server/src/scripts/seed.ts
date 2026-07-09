/**
 * Seed script — provisions test accounts on fresh database.
 *
 * Runs automatically on server start if no SuperAdmin exists.
 * Idempotent: skips accounts that already exist (matched by email).
 *
 * Usage:
 *   npx ts-node src/scripts/seed.ts         # standalone
 *   npm run dev                             # auto-runs on boot via server.ts
 */

import mongoose from "mongoose";
import { User } from "../models/User";
import { DoctorProfile } from "../models/DoctorProfile";
import { PatientProfile } from "../models/PatientProfile";
import { Slot } from "../models/Slot";
import { env } from "../config/env";

// ── Test accounts ────────────────────────────────────────────────────────────────
interface SeedAccount {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: "Patient" | "Doctor" | "Receptionist" | "Admin" | "SuperAdmin";
}

const ACCOUNTS: SeedAccount[] = [
  {
    email: "superadmin@medibook.com",
    password: "Admin@123",
    firstName: "Super",
    lastName: "Admin",
    phone: "+919999999991",
    role: "SuperAdmin",
  },
  {
    email: "admin@medibook.com",
    password: "Admin@123",
    firstName: "Clinic",
    lastName: "Admin",
    phone: "+919999999992",
    role: "Admin",
  },
  {
    email: "doctor@medibook.com",
    password: "Doctor@123",
    firstName: "Suresh",
    lastName: "Rao",
    phone: "+919999999993",
    role: "Doctor",
  },
  {
    email: "reception@medibook.com",
    password: "Recept@123",
    firstName: "Priya",
    lastName: "Sharma",
    phone: "+919999999994",
    role: "Receptionist",
  },
  {
    email: "patient@medibook.com",
    password: "Patie@123",
    firstName: "Anil",
    lastName: "Kumar",
    phone: "+919999999995",
    role: "Patient",
  },
];

// ── Doctor extras (only applied to the doctor account) ───────────────────────────
const DOCTOR_PROFILE = {
  specialization: "Cardiologist",
  qualification: "MD, DM Cardiology",
  experience: 12,
  registrationNumber: "MED-12345",
  consultationFee: 500,
  languages: ["English", "Hindi", "Telugu"],
  clinicAddress: "123 MG Road, Banjara Hills",
  clinicCity: "Hyderabad",
  bio: "Experienced cardiologist with 12+ years in interventional cardiology.",
  isVerified: true,
  verificationStatus: "approved" as const,
};

// ── Patient extras ───────────────────────────────────────────────────────────────
const PATIENT_PROFILE = {
  dateOfBirth: new Date("1990-05-15"),
  gender: "Male" as const,
  bloodGroup: "O+",
  height: 175,
  weight: 72,
  allergies: ["Penicillin"],
  chronicDiseases: ["Hypertension"],
  emergencyContactName: "Ravi Kumar",
  emergencyContactPhone: "+919800112233",
  insuranceProvider: "Star Health",
  insurancePolicyNumber: "SH12345",
};

// ── Sample slot (future date, so Booking UI has something to show) ───────────────
function getNextSlotDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  // If tomorrow is Sunday, bump to Monday
  if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  return d;
}

// ── Main seed function ───────────────────────────────────────────────────────────
export async function seed(): Promise<void> {
  // Check if seeding is needed (idempotent guard)
  const existingSuperAdmin = await User.findOne({ role: "SuperAdmin" });
  if (existingSuperAdmin) {
    console.log("[SEED] SuperAdmin already exists — skipping seed.");
    return;
  }

  console.log("[SEED] No SuperAdmin found — provisioning test accounts...");

  for (const account of ACCOUNTS) {
    const exists = await User.findOne({ email: account.email });
    if (exists) {
      console.log(`[SEED]  ↳ ${account.email} already exists — skipping.`);
      continue;
    }

    const user = await User.create(account);
    console.log(`[SEED]  ✓ ${account.role} created: ${account.email}`);

    // Create DoctorProfile for the doctor
    if (account.role === "Doctor") {
      await DoctorProfile.create({
        userId: user._id,
        ...DOCTOR_PROFILE,
      });
      console.log(`[SEED]  ✓ DoctorProfile created for ${account.email}`);

      // Create a sample future slot
      const slotDate = getNextSlotDate();
      await Slot.create({
        doctorId: user._id,
        date: slotDate,
        startTime: "10:00",
        endTime: "11:00",
        isBooked: false,
        maxPatients: 3,
        currentBookings: 0,
      });
      console.log(
        `[SEED]  ✓ Sample slot created for ${account.email} on ${slotDate.toISOString().slice(0, 10)}`,
      );
    }

    // Create PatientProfile for the patient
    if (account.role === "Patient") {
      await PatientProfile.create({
        userId: user._id,
        ...PATIENT_PROFILE,
      });
      console.log(`[SEED]  ✓ PatientProfile created for ${account.email}`);
    }
  }

  console.log("[SEED] ✓ All test accounts provisioned.");
}

// ── Run standalone ───────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  await mongoose.connect(env.MONGODB_URI);
  await seed();
  await mongoose.disconnect();
  console.log("[SEED] Done.");
}

if (require.main === module) {
  main().catch((err) => {
    console.error("[SEED] Failed:", err);
    process.exit(1);
  });
}
