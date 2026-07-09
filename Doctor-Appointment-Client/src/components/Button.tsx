import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'danger' | 'outline';
  fullWidth?: boolean;
  isLoading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'default',
  fullWidth = false,
  isLoading = false,
  children,
  className = '',
  disabled,
  ...rest
}: ButtonProps) {
  const classes = [
    styles.btn,
    styles[variant],
    fullWidth ? styles.fullWidth : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button className={classes} disabled={disabled || isLoading} {...rest}>
      {isLoading ? (
        <span className={styles.spinner}>
          <svg className={styles.spinnerSvg} viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading...
        </span>
      ) : children}
    </button>
  );
}
