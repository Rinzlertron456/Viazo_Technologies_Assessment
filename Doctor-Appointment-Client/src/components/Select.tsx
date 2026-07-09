import { useEffect, useRef, useState } from "react";
import { Check, ChevronUp, Search } from "lucide-react";
import styles from "./Select.module.css";

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SelectProps {
  id?: string;
  label?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  searchable?: boolean;
}

export function Select({
  id,
  label,
  options,
  value,
  onChange,
  error,
  placeholder = "Select…",
  required,
  searchable = true,
}: SelectProps) {
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

  const selected = options.find((o) => o.value === value);
  const filtered = options.filter((o) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      o.label.toLowerCase().includes(q) ||
      (o.sublabel || "").toLowerCase().includes(q)
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
          {selected ? selected.label : placeholder}
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
          {searchable && (
            <div className={styles.searchBox}>
              <Search size={14} />
              <input
                autoFocus
                className={styles.searchInput}
                placeholder="Search…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          )}
          <div className={styles.list}>
            {filtered.length === 0 && (
              <div className={styles.noResult}>No options found</div>
            )}
            {filtered.map((o) => {
              const active = o.value === value;
              return (
                <button
                  type="button"
                  key={o.value}
                  className={`${styles.option} ${active ? styles.optionActive : ""}`}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                    setQuery("");
                  }}
                  role="option"
                  aria-selected={active}
                >
                  <span className={styles.optionName}>{o.label}</span>
                  {o.sublabel && (
                    <span className={styles.optionId}>{o.sublabel}</span>
                  )}
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
