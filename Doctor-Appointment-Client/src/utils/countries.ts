export interface Country {
  name: string;
  iso2: string;
  dialCode: string; // without the leading "+"
  min: number; // min national (after-dial-code) digits
  max: number; // max national (after-dial-code) digits
}

// Sorted with India first (app default). `min`/`max` are the national number
// digit lengths so validation can enforce length *per country code*.
export const COUNTRIES: Country[] = [
  { name: "India", iso2: "IN", dialCode: "91", min: 10, max: 10 },
  { name: "United States", iso2: "US", dialCode: "1", min: 10, max: 10 },
  { name: "Canada", iso2: "CA", dialCode: "1", min: 10, max: 10 },
  { name: "United Kingdom", iso2: "GB", dialCode: "44", min: 10, max: 10 },
  { name: "Australia", iso2: "AU", dialCode: "61", min: 9, max: 9 },
  { name: "United Arab Emirates", iso2: "AE", dialCode: "971", min: 9, max: 9 },
  { name: "Saudi Arabia", iso2: "SA", dialCode: "966", min: 9, max: 9 },
  { name: "Singapore", iso2: "SG", dialCode: "65", min: 8, max: 8 },
  { name: "Malaysia", iso2: "MY", dialCode: "60", min: 9, max: 9 },
  { name: "Pakistan", iso2: "PK", dialCode: "92", min: 10, max: 10 },
  { name: "Bangladesh", iso2: "BD", dialCode: "880", min: 10, max: 10 },
  { name: "Sri Lanka", iso2: "LK", dialCode: "94", min: 9, max: 9 },
  { name: "Nepal", iso2: "NP", dialCode: "977", min: 10, max: 10 },
  { name: "Germany", iso2: "DE", dialCode: "49", min: 10, max: 11 },
  { name: "France", iso2: "FR", dialCode: "33", min: 9, max: 9 },
  { name: "Italy", iso2: "IT", dialCode: "39", min: 9, max: 10 },
  { name: "Spain", iso2: "ES", dialCode: "34", min: 9, max: 9 },
  { name: "Netherlands", iso2: "NL", dialCode: "31", min: 9, max: 9 },
  { name: "Portugal", iso2: "PT", dialCode: "351", min: 9, max: 9 },
  { name: "Ireland", iso2: "IE", dialCode: "353", min: 9, max: 9 },
  { name: "Belgium", iso2: "BE", dialCode: "32", min: 9, max: 9 },
  { name: "Switzerland", iso2: "CH", dialCode: "41", min: 9, max: 9 },
  { name: "Austria", iso2: "AT", dialCode: "43", min: 10, max: 10 },
  { name: "Sweden", iso2: "SE", dialCode: "46", min: 7, max: 9 },
  { name: "Norway", iso2: "NO", dialCode: "47", min: 8, max: 8 },
  { name: "Denmark", iso2: "DK", dialCode: "45", min: 8, max: 8 },
  { name: "Finland", iso2: "FI", dialCode: "358", min: 9, max: 9 },
  { name: "Poland", iso2: "PL", dialCode: "48", min: 9, max: 9 },
  { name: "Russia", iso2: "RU", dialCode: "7", min: 10, max: 10 },
  { name: "Ukraine", iso2: "UA", dialCode: "380", min: 9, max: 9 },
  { name: "Turkey", iso2: "TR", dialCode: "90", min: 10, max: 10 },
  { name: "Greece", iso2: "GR", dialCode: "30", min: 10, max: 10 },
  { name: "Romania", iso2: "RO", dialCode: "40", min: 9, max: 9 },
  { name: "Czechia", iso2: "CZ", dialCode: "420", min: 9, max: 9 },
  { name: "Hungary", iso2: "HU", dialCode: "36", min: 9, max: 9 },
  { name: "South Africa", iso2: "ZA", dialCode: "27", min: 9, max: 9 },
  { name: "Nigeria", iso2: "NG", dialCode: "234", min: 10, max: 10 },
  { name: "Kenya", iso2: "KE", dialCode: "254", min: 9, max: 9 },
  { name: "Egypt", iso2: "EG", dialCode: "20", min: 10, max: 10 },
  { name: "Morocco", iso2: "MA", dialCode: "212", min: 9, max: 9 },
  { name: "Ghana", iso2: "GH", dialCode: "233", min: 9, max: 9 },
  { name: "Ethiopia", iso2: "ET", dialCode: "251", min: 9, max: 9 },
  { name: "China", iso2: "CN", dialCode: "86", min: 11, max: 11 },
  { name: "Japan", iso2: "JP", dialCode: "81", min: 10, max: 11 },
  { name: "South Korea", iso2: "KR", dialCode: "82", min: 10, max: 11 },
  { name: "Indonesia", iso2: "ID", dialCode: "62", min: 9, max: 12 },
  { name: "Thailand", iso2: "TH", dialCode: "66", min: 9, max: 9 },
  { name: "Vietnam", iso2: "VN", dialCode: "84", min: 9, max: 9 },
  { name: "Philippines", iso2: "PH", dialCode: "63", min: 10, max: 10 },
  { name: "Hong Kong", iso2: "HK", dialCode: "852", min: 8, max: 8 },
  { name: "Taiwan", iso2: "TW", dialCode: "886", min: 9, max: 9 },
  { name: "New Zealand", iso2: "NZ", dialCode: "64", min: 9, max: 9 },
  { name: "Brazil", iso2: "BR", dialCode: "55", min: 10, max: 11 },
  { name: "Mexico", iso2: "MX", dialCode: "52", min: 10, max: 10 },
  { name: "Argentina", iso2: "AR", dialCode: "54", min: 10, max: 10 },
  { name: "Chile", iso2: "CL", dialCode: "56", min: 9, max: 9 },
  { name: "Colombia", iso2: "CO", dialCode: "57", min: 10, max: 10 },
  { name: "Peru", iso2: "PE", dialCode: "51", min: 9, max: 9 },
  { name: "Qatar", iso2: "QA", dialCode: "974", min: 8, max: 8 },
  { name: "Kuwait", iso2: "KW", dialCode: "965", min: 8, max: 8 },
  { name: "Bahrain", iso2: "BH", dialCode: "973", min: 8, max: 8 },
  { name: "Oman", iso2: "OM", dialCode: "968", min: 8, max: 8 },
  { name: "Jordan", iso2: "JO", dialCode: "962", min: 9, max: 9 },
  { name: "Lebanon", iso2: "LB", dialCode: "961", min: 7, max: 8 },
  { name: "Israel", iso2: "IL", dialCode: "972", min: 9, max: 9 },
  { name: "Iran", iso2: "IR", dialCode: "98", min: 10, max: 10 },
];

const DEFAULT_COUNTRY = COUNTRIES[0]; // India

/** Convert an ISO 3166-1 alpha-2 code to a flag emoji. */
export function flagEmoji(iso2: string): string {
  return String.fromCodePoint(
    ...[...iso2.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
}

/** Given a full phone value (e.g. "+919876543210"), find the best matching country. */
export function matchCountry(value: string): Country | undefined {
  const v = value.trim();
  if (!v.startsWith("+")) return undefined;
  const candidates = COUNTRIES.filter((c) => v.startsWith("+" + c.dialCode));
  if (candidates.length === 0) return undefined;
  // Longest dial code wins (e.g. "+1" -> US/CA, not a shorter code).
  candidates.sort((a, b) => b.dialCode.length - a.dialCode.length);
  return candidates[0];
}

export function getCountryByIso2(iso2: string): Country {
  return COUNTRIES.find((c) => c.iso2 === iso2) ?? DEFAULT_COUNTRY;
}

export function getDefaultCountry(): Country {
  return DEFAULT_COUNTRY;
}

export interface ParsedPhone {
  country: Country;
  dialCode: string;
  national: string; // digits only, after the dial code
  full: string; // "+<dialCode><national>"
}

/** Split a full phone string into country + national digits. */
export function parsePhone(value: string): ParsedPhone {
  const country = matchCountry(value) ?? DEFAULT_COUNTRY;
  const prefix = "+" + country.dialCode;
  const national = value.trim().startsWith(prefix)
    ? value.trim().slice(prefix.length).replace(/\D/g, "")
    : value.trim().replace(/\D/g, "");
  return { country, dialCode: country.dialCode, national, full: prefix + national };
}
