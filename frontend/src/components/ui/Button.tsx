import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from 'react';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-forest text-white shadow-glass hover:bg-forest-light active:bg-forest-dark',
  secondary: 'bg-surface-raised text-ink-text border border-border hover:border-gold/50',
  ghost: 'bg-transparent text-ink-text hover:bg-surface-soft',
  danger: 'bg-red-500/10 text-red-500 hover:bg-red-500/15'
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-3 text-body-sm gap-1.5 rounded-md',
  md: 'h-11 px-4 text-body gap-2 rounded-lg',
  lg: 'h-14 px-6 text-title gap-2 rounded-xl2'
};

/**
 * Єдина кнопка для всього застосунку. Замінює розрізнені <button className="...">
 * що були розкидані по сторінках з різними радіусами/кольорами/паддінгами.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', icon, fullWidth, className, children, disabled, ...rest }, ref) => (
    <button
      ref={ref}
      disabled={disabled}
      className={clsx(
        'inline-flex items-center justify-center font-display font-semibold transition-all duration-150 active:scale-[0.97]',
        'disabled:opacity-40 disabled:pointer-events-none',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
);
Button.displayName = 'Button';
