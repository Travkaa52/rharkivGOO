interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <header className="px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
      <h1 className="font-display text-2xl font-extrabold text-forest">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-graphite/60">{subtitle}</p>}
    </header>
  );
}
