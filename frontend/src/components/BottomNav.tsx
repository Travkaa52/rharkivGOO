import { NavLink } from 'react-router-dom';
import { Home, Map, Route as RouteIcon, Star, User } from 'lucide-react';
import clsx from 'clsx';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Головна', icon: Home, exact: true },
  { to: '/map', label: 'Карта', icon: Map, exact: true },
  { to: '/routes', label: 'Маршрути', icon: RouteIcon },
  { to: '/favorites', label: 'Обране', icon: Star },
  { to: '/profile', label: 'Профіль', icon: User },
];

/**
 * Нижня навігаційна панель у стилі Ultra Premium Glassmorphism.
 * Забезпечує адаптивні відступи (Safe Area) та плавну мікроанімацію активного стану.
 */
export function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/40 bg-surface/80 pb-safe backdrop-blur-xl shadow-2xl transition-colors"
      aria-label="Основна навігація"
    >
      <div className="mx-auto flex max-w-md items-center justify-between px-2 py-1.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                clsx(
                  'group relative flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-1.5 transition-all duration-200 active:scale-95',
                  isActive ? 'text-primary font-bold' : 'text-ink-muted hover:text-ink-text'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* Активний неоновий індикатор зверху */}
                  {isActive && (
                    <span className="absolute -top-1.5 h-1 w-7 rounded-full bg-primary shadow-[0_0_10px_rgba(20,184,166,0.8)]" />
                  )}

                  <Icon
                    className={clsx(
                      'h-5 w-5 transition-all duration-200',
                      isActive
                        ? '-translate-y-0.5 stroke-[2.25] text-primary drop-shadow-[0_0_8px_rgba(20,184,166,0.5)]'
                        : 'stroke-[1.75] group-hover:scale-105'
                    )}
                  />

                  <span className="text-[10px] tracking-tight leading-none">
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
