import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronUp, Search } from "lucide-react";
import {
  COUNTRIES,
  type Country,
  flagEmoji,
  getDefaultCountry,
  parsePhone,
} from "../utils/countries";
import styles from "./PhoneInput.module.css";

interface PhoneInputProps {
  id?: string;
  label?: string;
  value: string; // full E.164, e.g. "+919876543210"
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
}

export function PhoneInput({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  placeholder,
  required,
}: PhoneInputProps) {
  const { country, national } = useMemo(() => parsePhone(value), [value]);
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(true);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function selectCountry(c: Country) {
    const prefix = "+" + c.dialCode;
    // Keep the national digits, swap the dial code.
    onChange(prefix + national);
    setOpen(false);
    setQuery("");
  }

  function onNationalChange(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, country.max);
    onChange("+" + country.dialCode + digits);
  }

  const filtered = COUNTRIES.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.dialCode.includes(q) ||
      c.iso2.toLowerCase().includes(q)
    );
  });

  return (
    <div className={styles.wrapper} ref={wrapRef}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
          {required && <span className={styles.req}> *</span>}
        </label>
      )}

      <div ref={fieldRef} className={`${styles.field} ${error ? styles.fieldError : ""}`}>
        <button
          type="button"
          className={styles.countryButton}
          onClick={() => {
            if (!disabled) {
              if (!open) {
                const r = fieldRef.current?.getBoundingClientRect();
                setDropUp((r?.top ?? 999) > 260);
              }
              setOpen((o) => !o);
            }
          }}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className={styles.flag}>{flagEmoji(country.iso2)}</span>
          <span className={styles.dialCode}>+{country.dialCode}</span>
          <ChevronUp
            size={14}
            className={styles.chevron}
            style={{ transform: open ? "none" : "rotate(180deg)" }}
          />
        </button>

        <input
          id={id}
          className={styles.nationalInput}
          type="tel"
          inputMode="numeric"
          value={national}
          placeholder={placeholder ?? ` ${country.min}-${country.max} digits`}
          onChange={(e) => onNationalChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          aria-invalid={!!error}
        />

        {open && (
          <div
          className={`${styles.dropdown} ${dropUp ? styles.dropdownUp : styles.dropdownDown}`}
          role="listbox"
        >
            <div className={styles.searchBox}>
              <Search size={14} />
              <input
                autoFocus
                className={styles.searchInput}
                placeholder="Search country or code"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className={styles.list}>
              {filtered.length === 0 && (
                <div className={styles.noResult}>No countries found</div>
              )}
              {filtered.map((c) => {
                const active = c.dialCode === country.dialCode;
                return (
                  <button
                    type="button"
                    key={c.iso2}
                    className={`${styles.option} ${active ? styles.optionActive : ""}`}
                    onClick={() => selectCountry(c)}
                    role="option"
                    aria-selected={active}
                  >
                    <span className={styles.flag}>{flagEmoji(c.iso2)}</span>
                    <span className={styles.optionName}>{c.name}</span>
                    <span className={styles.optionCode}>+{c.dialCode}</span>
                    {active && <Check size={14} className={styles.check} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}

export { getDefaultCountry };
