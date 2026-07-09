export function isNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

import { parsePhone } from "./countries";

export function isPhone(value: string): boolean {
  if (!value.trim().startsWith("+")) return false;
  const { country, national } = parsePhone(value);
  // Length limit is enforced per country code.
  return national.length >= country.min && national.length <= country.max;
}

/** Returns a human-readable error for a phone value, or "" when valid. */
export function getPhoneError(value: string): string {
  const v = value.trim();
  if (!v) return "Phone number is required.";
  if (!v.startsWith("+")) return "Include the country code (e.g. +91).";
  const { country, national } = parsePhone(v);
  if (national.length < country.min || national.length > country.max) {
    return `Enter a valid ${country.name} number (${country.min}-${country.max} digits after +${country.dialCode}).`;
  }
  return "";
}

export function isPasswordStrong(value: string): boolean {
  return (
    value.length >= 8 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /[0-9]/.test(value)
  );
}

export function isPositiveNumber(value: string): boolean {
  if (value.trim() === "") return false;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0;
}

export function maxLength(value: string, len: number): boolean {
  return value.trim().length <= len;
}

export function isFutureOrTodayDate(value: string): boolean {
  if (!value) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const input = new Date(value);
  return !Number.isNaN(input.getTime()) && input >= today;
}
