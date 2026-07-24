import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { useAuthStore } from '@/store/useAuthStore';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useHistoryStore } from '@/store/useHistoryStore';

export function ProfilePage() {
  const profile = useAuthStore((s) => s.profile);
  const isTelegramEnv = useAuthStore((s) => s.isTelegramEnv);
  const favoritesCount = useFavoritesStore((s) => s.stops.length + s.routes.length);
  const historyCount = useHistoryStore((s) => s.entries.length);

  return (
    <div className="min-h-dvh bg-surface-soft pb-20">
      <PageHeader title="Профіль" />
      <div className="px-4">
        {profile ? (
          <div className="flex flex-col items-center gap-3 rounded-xl2 bg-white/90 py-8 text-center shadow-glass">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
                className="h-20 w-20 rounded-full object-cover shadow-glass"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-forest/10 text-3xl">
                👤
              </div>
            )}
            <div>
              <p className="font-display text-lg font-extrabold text-graphite">{profile.displayName}</p>
              {profile.username && <p className="text-sm text-graphite/50">@{profile.username}</p>}
            </div>
            <div className="flex gap-4 text-sm text-graphite/60">
              <span>★ {favoritesCount} обраного</span>
              <span>🕓 {historyCount} у історії</span>
            </div>
          </div>
        ) : isTelegramEnv ? (
          <div className="flex flex-col items-center gap-3 rounded-xl2 bg-white/90 py-10 text-center shadow-glass">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-forest/10 text-2xl">👤</div>
            <p className="max-w-[240px] text-sm text-graphite/60">
              Не вдалося отримати профіль з Telegram. Спробуйте перевідкрити застосунок.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-xl2 bg-white/90 py-10 text-center shadow-glass">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-forest/10 text-2xl">👤</div>
            <p className="max-w-[240px] text-sm text-graphite/60">
              Профіль підтягується автоматично, коли застосунок відкрито через Telegram-бота
              (Mini App). Обране та історія вже зберігаються локально на цьому пристрої.
            </p>
            <a
              href="https://t.me"
              className="rounded-full bg-forest px-6 py-2 text-sm font-semibold text-white shadow-glass hover:bg-forest-light"
            >
              Відкрити в Telegram
            </a>
          </div>
        )}
        <div className="mt-4">
          <Link to="/settings" className="block rounded-xl2 bg-white/90 px-4 py-3 text-sm text-graphite shadow-glass">
            ⚙️ Налаштування
          </Link>
        </div>
      </div>
    </div>
  );
}
