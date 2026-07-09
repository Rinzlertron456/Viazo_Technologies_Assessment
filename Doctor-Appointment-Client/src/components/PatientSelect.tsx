import { useEffect, useRef, useState } from "react";
import { Check, ChevronUp, Search } from "lucide-react";
import styles from "./PatientSelect.module.css";

export interface SelectablePatient {
  _id: string;
  firstName: string;
  lastName: string;
  customId?: string;
}

interface PatientSelectProps {
  id?: string;
  label?: string;
  patients: SelectablePatient[];
  value: string; // selected patient _id
  onChange: (id: string) => void;
  error?: string;
  required?: boolean;
}

function patientLabel(p: SelectablePatient): string {
  return `${p.firstName} ${p.lastName}`.trim();
}

export function PatientSelect({
  id,
  label,
  patients,
  value,
  onChange,
  error,
  required,
}: PatientSelectProps) {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(true);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const controlRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const selected = patients.find((p) => p._id === value);
  const filtered = patients.filter((p) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      patientLabel(p).toLowerCase().includes(q) ||
      (p.customId || "").toLowerCase().includes(q)
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

      <button
        type="button"
        id={id}
        ref={controlRef}
        className={`${styles.control} ${error ? styles.controlError : ""}`}
        onClick={() => {
          if (!open) {
            const r = controlRef.current?.getBoundingClientRect();
            setDropUp((r?.top ?? 999) > 260);
          }
          setOpen((o) => !o);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={selected ? styles.value : styles.placeholder}>
          {selected
            ? `${patientLabel(selected)}  ·  ${selected.customId || "—"}`
            : "Select patient"}
        </span>
        <ChevronUp
          size={14}
          className={styles.chevron}
          style={{ transform: open ? "none" : "rotate(180deg)" }}
        />
      </button>

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
              placeholder="Search name or ID…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className={styles.list}>
            {filtered.length === 0 && (
              <div className={styles.noResult}>No patients found</div>
            )}
            {filtered.map((p) => {
              const active = p._id === value;
              return (
                <button
                  type="button"
                  key={p._id}
                  className={`${styles.option} ${active ? styles.optionActive : ""}`}
                  onClick={() => {
                    onChange(p._id);
                    setOpen(false);
                    setQuery("");
                  }}
                  role="option"
                  aria-selected={active}
                >
                  <span className={styles.optionName}>{patientLabel(p)}</span>
                  <span className={styles.optionId}>{p.customId || "—"}</span>
                  {active && <Check size={14} className={styles.check} />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
