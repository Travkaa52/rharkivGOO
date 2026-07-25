import { NavLink } from 'react-router-dom';
import clsx from 'clsx';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const items: NavItem[] = [
  {
    to: '/',
    label: 'Карта',
    icon: (
      <path d="M9 4 3 6.5v14L9 18l6 2.5 6-2.5v-14L15 6.5 9 4Zm0 0v14m6-11.5V20.5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    )
  },
  {
    to: '/routes',
    label: 'Маршрути',
    icon: <path d="M4 6h16M4 12h10M4 18h13" strokeWidth="2" strokeLinecap="round" />
  },
  {
    to: '/favorites',
    label: 'Обране',
    icon: (
      <path
        d="M12 20.5 4.5 13a5 5 0 1 1 7.5-6.5 5 5 0 1 1 7.5 6.5L12 20.5Z"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    )
  },
  {
    to: '/profile',
    label: 'Профіль',
    icon: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  }
];

export function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/40 bg-white/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xs"
      aria-label="Основна навігація"
    >
      <ul className="mx-auto flex max-w-md items-center justify-between px-2 py-1.5">
        {items.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center gap-0.5 rounded-xl2 px-2 py-1.5 text-[11px] font-medium transition-colors',
                  isActive ? 'text-forest' : 'text-graphite/50 hover:text-graphite'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={clsx(isActive && 'drop-shadow-sm')}>
                    {item.icon}
                  </svg>
                  {item.label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
