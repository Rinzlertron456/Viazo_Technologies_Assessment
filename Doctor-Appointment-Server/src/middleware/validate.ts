import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { BadRequestError } from "../utils/errors";

/**
 * Middleware that validates all :id, :doctorId, :patientId, :appointmentId
 * route params are valid MongoDB ObjectIds.
 */
export function validateObjectIds(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const idParams = ["id", "doctorId", "patientId", "appointmentId", "userId"];

  for (const param of idParams) {
    const value = req.params[param];
    if (value && !mongoose.Types.ObjectId.isValid(value as string)) {
      next(new BadRequestError(`Invalid ${param}`));
      return;
    }
  }

  next();
}

/**
 * Picks only allowed fields from an object.
 * Prevents mass-assignment attacks.
 */
export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[],
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Allowed fields for updating patient profile.
 */
export const PATIENT_PROFILE_FIELDS = [
  "dateOfBirth",
  "gender",
  "bloodGroup",
  "height",
  "weight",
  "allergies",
  "chronicDiseases",
  "emergencyContactName",
  "emergencyContactPhone",
  "insuranceProvider",
  "insurancePolicyNumber",
] as const;

/**
 * Allowed fields for updating doctor profile.
 */
export const DOCTOR_PROFILE_FIELDS = [
  "specialization",
  "qualification",
  "experience",
  "consultationFee",
  "clinicCity",
  "clinicAddress",
  "languages",
  "registrationNumber",
  "profilePicture",
] as const;

/**
 * Allowed fields for creating/updating pharmacy.
 */
export const PHARMACY_FIELDS = [
  "name",
  "address",
  "phone",
  "licenseNumber",
  "isActive",
] as const;

/**
 * Allowed fields for creating hospital.
 */
export const HOSPITAL_FIELDS = [
  "name",
  "address",
  "city",
  "phone",
  "email",
  "isActive",
] as const;
