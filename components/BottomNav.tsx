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
    label: 'Головна',
    icon: (
      <path d="M4 11.5 12 4l8 7.5M6 10v9a1 1 0 0 0 1 1h4v-6h2v6h4a1 1 0 0 0 1-1v-9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    )
  },
  {
    to: '/map',
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

/** Нижня навігація — темна "скляна" панель з мокапу: 5 пунктів, активний виділяється зеленим і трохи піднімається. */
export function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
      aria-label="Основна навігація"
    >
      <ul className="mx-auto flex max-w-md items-center justify-between px-1 py-1.5">
        {items.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.to === '/' || item.to === '/map'}
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center gap-0.5 rounded-xl2 px-1.5 py-1.5 text-[10.5px] font-medium transition-all',
                  isActive ? 'text-mint' : 'text-white/40 hover:text-white/70'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    className={clsx('transition-transform', isActive && '-translate-y-0.5 drop-shadow-[0_0_6px_rgba(168,213,186,0.6)]')}
                  >
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
