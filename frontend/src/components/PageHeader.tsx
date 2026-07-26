interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

/** Єдиний заголовок сторінки — однакова типографіка й відступи на всіх екранах. */
export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <header className="px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
      <h1 className="text-display-lg text-ink-text">{title}</h1>
      {subtitle && <p className="mt-1 text-body-sm text-ink-muted">{subtitle}</p>}
    </header>
  );
}
