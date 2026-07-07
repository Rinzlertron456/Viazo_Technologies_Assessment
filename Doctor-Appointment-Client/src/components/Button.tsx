import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'danger';
  fullWidth?: boolean;
  isLoading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'default',
  fullWidth = false,
  isLoading = false,
  children,
  className,
  disabled,
  ...rest
}: ButtonProps) {
  const classes = [
    styles.button,
    variant === 'primary' && styles.primary,
    variant === 'danger' && styles.danger,
    fullWidth && styles.fullWidth,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} disabled={disabled || isLoading} {...rest}>
      {isLoading ? 'Loading...' : children}
    </button>
  );
}
