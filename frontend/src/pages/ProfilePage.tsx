import { Link } from 'react-router-dom';
import { 
  User, 
  Star, 
  History, 
  Settings, 
  Send, 
  ChevronRight, 
  ShieldCheck,
  Sparkles
} from 'lucide-react';
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
    <div className="min-h-dvh bg-bg text-ink-text selection:bg-primary/20 pb-28">
      <PageHeader title="Профіль" subtitle="Особистий кабінет та налаштування" />

      <div className="mx-auto max-w-md space-y-5 px-4 pt-2">
        {/* Profile Card Section */}
        {profile ? (
          <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-surface/60 p-6 backdrop-blur-xl shadow-lg">
            {/* Ambient Background Glow */}
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
            
            <div className="flex flex-col items-center text-center">
              {/* Avatar Container */}
              <div className="relative mb-3.5">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.displayName}
                    className="h-20 w-20 rounded-full object-cover ring-4 ring-primary/20 shadow-md"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary ring-4 ring-primary/20 shadow-md">
                    <User className="h-10 w-10" />
                  </div>
                )}
                
                {/* Telegram Badge Indicator */}
                <div 
                  className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-surface shadow-xs"
                  title="Авторизовано через Telegram"
                >
                  <ShieldCheck className="h-4 w-4" />
                </div>
              </div>

              {/* User Identity Info */}
              <h2 className="text-body-lg font-extrabold text-ink-text leading-tight">
                {profile.displayName}
              </h2>
              {profile.username && (
                <p className="mt-0.5 text-body-sm font-medium text-ink-muted">
                  @{profile.username}
                </p>
              )}

              {/* Stats Grid */}
              <div className="mt-5 grid w-full grid-cols-2 gap-3">
                <Link
                  to="/favorites"
                  className="flex items-center gap-3 rounded-2xl border border-border/40 bg-surface/80 p-3.5 backdrop-blur-md transition-all hover:border-amber-500/30 active:scale-98 shadow-2xs"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <Star className="h-4 w-4 fill-amber-500/20" />
                  </div>
                  <div className="text-left min-w-0">
                    <div className="text-body font-bold text-ink-text">{favoritesCount}</div>
                    <div className="text-caption text-ink-muted truncate">Обране</div>
                  </div>
                </Link>

                <div className="flex items-center gap-3 rounded-2xl border border-border/40 bg-surface/80 p-3.5 backdrop-blur-md shadow-2xs">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <History className="h-4 w-4" />
                  </div>
                  <div className="text-left min-w-0">
                    <div className="text-body font-bold text-ink-text">{historyCount}</div>
                    <div className="text-caption text-ink-muted truncate">В історії</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : isTelegramEnv ? (
          /* Telegram Environment, but profile load error */
          <div className="relative overflow-hidden rounded-3xl border border-destructive/30 bg-destructive/5 p-6 text-center backdrop-blur-xl shadow-md">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-3 border border-destructive/20">
              <User className="h-7 w-7" />
            </div>
            <h3 className="text-body font-bold text-ink-text mb-1">Не вдалося завантажити профіль</h3>
            <p className="text-body-sm text-ink-muted max-w-xs mx-auto">
              Спробуйте перевідкрити застосунок у Telegram.
            </p>
          </div>
        ) : (
          /* Standard Web Browser environment banner */
          <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-surface/60 p-6 text-center backdrop-blur-xl shadow-lg">
            <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4 border border-primary/20">
              <Sparkles className="h-7 w-7" />
            </div>

            <h3 className="text-body-lg font-extrabold text-ink-text mb-2">
              Telegram Mini App
            </h3>

            <p className="text-body-sm text-ink-muted leading-relaxed mb-6 max-w-xs mx-auto">
              Профіль підтягується автоматично при запуску через Telegram-бота. Обране та історія вже зберігаються на цьому пристрої.
            </p>

            <a
              href="https://t.me"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 w-full rounded-2xl bg-primary px-6 py-3.5 text-body-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 active:scale-98"
            >
              <Send className="h-4 w-4" />
              <span>Відкрити в Telegram</span>
            </a>
          </div>
        )}

        {/* Quick Settings & Navigation Menu */}
        <div className="space-y-2 pt-1">
          <span className="px-1 text-caption font-bold uppercase tracking-wider text-ink-muted/80">
            Налаштування та додаток
          </span>

          <div className="overflow-hidden rounded-2xl border border-border/60 bg-surface/60 backdrop-blur-xl shadow-sm">
            <Link
              to="/settings"
              className="flex items-center justify-between gap-3 p-4 text-body-sm font-semibold text-ink-text transition-colors hover:bg-surface/80 active:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface/80 border border-border/40 text-ink-muted">
                  <Settings className="h-4 w-4" />
                </div>
                <span>Налаштування застосунку</span>
              </div>
              <ChevronRight className="h-4 w-4 text-ink-muted" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
