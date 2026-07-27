import clsx from 'clsx';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  className?: string;
}

/** Сегментований перемикач (тема, мова, одиниці виміру) — один компонент для всіх виборів у Settings. */
export function SegmentedControl<T extends string>({ value, options, onChange, className }: SegmentedControlProps<T>) {
  return (
    <div
      className={clsx('flex rounded-md bg-surface-soft/70 p-1 [box-shadow:inset_0_1px_3px_rgb(0_0_0_/_0.12)]', className)}
      role="tablist"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          role="tab"
          aria-selected={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={clsx(
            'flex-1 rounded-[10px] px-2 py-2 text-body-sm font-display font-semibold transition-all duration-150',
            value === opt.value ? 'glass-card text-forest shadow-glass' : 'text-ink-muted hover:text-ink-text'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
