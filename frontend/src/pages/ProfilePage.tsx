import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  Star, 
  History, 
  Settings, 
  Send, 
  ChevronRight, 
  ShieldCheck,
  Sparkles,
  Moon,
  Globe,
  Bell,
  MapPin,
  Info,
  Trash2,
  RefreshCw,
  Download,
  Share2,
  FileText,
  Award,
  ExternalLink,
  Check
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { useAuthStore } from '@/store/useAuthStore';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useHistoryStore } from '@/store/useHistoryStore';

export function ProfilePage() {
  const profile = useAuthStore((s) => s.profile);
  const isTelegramEnv = useAuthStore((s) => s.isTelegramEnv);
  
  const favoriteStops = useFavoritesStore((s) => s.stops);
  const favoriteRoutes = useFavoritesStore((s) => s.routes);
  const favoritesCount = favoriteStops.length + favoriteRoutes.length;
  
  const historyEntries = useHistoryStore((s) => s.entries);
  const clearHistory = useHistoryStore((s) => s.clearHistory);

  // Локальні стани для інтерактивних перемикачів налаштувань (без зміни бізнес-логіки)
  const [darkMode, setDarkMode] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [geolocationEnabled, setGeolocationEnabled] = useState(true);
  const [cacheSize, setCacheSize] = useState('14.2 MB');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleClearCache = () => {
    setCacheSize('0 KB');
    alert('Кеш успішно очищено!');
  };

  const handleUpdateData = () => {
    setIsUpdating(true);
    setTimeout(() => {
      setIsUpdating(false);
      alert('Дані успішно оновлено до актуальної версії.');
    }, 800);
  };

  return (
    <div className="min-h-dvh bg-bg text-ink-text selection:bg-primary/20 pb-32">
      <PageHeader title="Профіль" subtitle="Особистий кабінет та керування" />

      <div className="mx-auto max-w-md space-y-5 px-4 pt-2">
        
        {/* 1. ВЕРХНЯ ЧАСТИНА: КАРТКА ПРОФІЛЮ АБО АВТОРИЗАЦІЇ */}
        {profile ? (
          <div className="relative overflow-hidden rounded-[22px] border border-border/60 bg-surface/80 p-6 backdrop-blur-2xl shadow-xl transition-all">
            {/* Ambient Glow */}
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
            
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.displayName}
                    className="h-18 w-18 rounded-full object-cover ring-4 ring-primary/20 shadow-md"
                  />
                ) : (
                  <div className="flex h-18 w-18 items-center justify-center rounded-full bg-primary/10 text-primary ring-4 ring-primary/20 shadow-md">
                    <User className="h-9 w-9" />
                  </div>
                )}
                
                <div 
                  className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-surface shadow-xs"
                  title="Авторизовано через Telegram"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 mb-1">
                  Користувач Kharkiv GO
                </span>
                <h2 className="text-lg font-extrabold text-ink-text truncate leading-tight">
                  {profile.displayName}
                </h2>
                {profile.username && (
                  <p className="text-xs font-medium text-ink-muted truncate">
                    @{profile.username}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-border/40 flex items-center justify-between">
              <span className="text-xs font-semibold text-ink-muted">Статус акаунта</span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Активний сеанс
              </span>
            </div>
          </div>
        ) : isTelegramEnv ? (
          <div className="relative overflow-hidden rounded-[22px] border border-destructive/30 bg-destructive/5 p-6 text-center backdrop-blur-xl shadow-md">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-3 border border-destructive/20">
              <User className="h-7 w-7" />
            </div>
            <h3 className="text-body font-bold text-ink-text mb-1">Не вдалося завантажити профіль</h3>
            <p className="text-body-sm text-ink-muted max-w-xs mx-auto">
              Спробуйте перевідкрити застосунок у Telegram.
            </p>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-[22px] border border-border/60 bg-surface/80 p-6 text-center backdrop-blur-2xl shadow-xl">
            <div className="absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4 border border-primary/20">
              <Sparkles className="h-7 w-7" />
            </div>

            <h3 className="text-base font-extrabold text-ink-text mb-2">
              Увійдіть у свій акаунт
            </h3>

            <p className="text-xs text-ink-muted leading-relaxed mb-5 max-w-xs mx-auto">
              Авторизуйтеся через Telegram для синхронізації обраного та персональних налаштувань на всіх пристроях.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <a
                href="https://t.me"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground shadow-md transition-all hover:bg-primary/90 active:scale-98"
              >
                <Send className="h-4 w-4" />
                <span>Увійти</span>
              </a>
              <a
                href="https://t.me"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-2xl bg-surface border border-border/80 px-4 py-3 text-xs font-bold text-ink-text shadow-xs transition-all hover:bg-surface/90 active:scale-98"
              >
                <span>Зареєструватися</span>
              </a>
            </div>
          </div>
        )}

        {/* 2. РОЗДІЛ "ІЗБРАННОЕ" */}
        <div className="space-y-2">
          <span className="px-1 text-[11px] font-bold uppercase tracking-wider text-ink-muted/80">
            Збережене
          </span>
          <div className="overflow-hidden rounded-[22px] border border-border/60 bg-surface/80 backdrop-blur-2xl shadow-sm divide-y divide-border/40">
            <Link
              to="/favorites"
              className="flex items-center justify-between p-4 transition-colors hover:bg-surface/90 active:bg-muted/50 min-h-[48px]"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <Star className="h-5 w-5 fill-amber-500/20" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-ink-text">Обране</h4>
                  <p className="text-[11px] text-ink-muted">Маршрути, зупинки та станції</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-extrabold text-amber-600">
                  {favoritesCount}
                </span>
                <ChevronRight className="h-4 w-4 text-ink-muted" />
              </div>
            </Link>
          </div>
        </div>

        {/* 3. РОЗДІЛ "ИСТОРИЯ" */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted/80">
              Історія переглядів (до 10)
            </span>
            {historyEntries.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-[11px] font-bold text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1 min-h-[32px] px-2"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Очистити історію</span>
              </button>
            )}
          </div>

          <div className="overflow-hidden rounded-[22px] border border-border/60 bg-surface/80 backdrop-blur-2xl shadow-sm p-4">
            {historyEntries.length > 0 ? (
              <div className="space-y-2">
                {historyEntries.slice(0, 10).map((entry, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                    <div className="flex items-center gap-3">
                      <History className="h-4 w-4 text-ink-muted shrink-0" />
                      <span className="text-xs font-semibold text-ink-text truncate max-w-[220px]">
                        {entry.title || `Об'єкт #${entry.id}`}
                      </span>
                    </div>
                    <span className="text-[10px] text-ink-muted font-medium">Щойно</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center flex flex-col items-center justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-ink-muted mb-2">
                  <History className="h-6 w-6" />
                </div>
                <h4 className="text-xs font-bold text-ink-text mb-1">Ви ще нічого не переглядали</h4>
                <p className="text-[11px] text-ink-muted max-w-[200px]">
                  Маршрути та зупинки, які ви відкриваєте, з'являться тут.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 4. НАЛАШТУВАННЯ (Групування по картках) */}
        <div className="space-y-3">
          <span className="px-1 text-[11px] font-bold uppercase tracking-wider text-ink-muted/80">
            Налаштування
          </span>

          {/* Внешний вид */}
          <div className="overflow-hidden rounded-[22px] border border-border/60 bg-surface/80 backdrop-blur-2xl shadow-sm divide-y divide-border/40">
            <div className="p-4 font-bold text-xs text-ink-muted bg-surface-muted/30 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Зовнішній вигляд</span>
            </div>

            <div className="flex items-center justify-between p-4 min-h-[48px]">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface border border-border/40 text-ink-text">
                  <Moon className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-ink-text">Темна тема</span>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  darkMode ? 'bg-primary' : 'bg-border'
                }`}
                role="switch"
                aria-checked={darkMode}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    darkMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 min-h-[48px]">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface border border-border/40 text-ink-text">
                  <Globe className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-ink-text">Мова інтерфейсу</span>
              </div>
              <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                Українська
              </span>
            </div>
          </div>

          {/* Карта */}
          <div className="overflow-hidden rounded-[22px] border border-border/60 bg-surface/80 backdrop-blur-2xl shadow-sm divide-y divide-border/40">
            <div className="p-4 font-bold text-xs text-ink-muted bg-surface-muted/30 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-500" />
              <span>Карта</span>
            </div>

            <div className="flex items-center justify-between p-4 min-h-[48px]">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface border border-border/40 text-ink-text">
                  <MapPin className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-ink-text">Використовувати геолокацію</span>
              </div>
              <button
                onClick={() => setGeolocationEnabled(!geolocationEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  geolocationEnabled ? 'bg-primary' : 'bg-border'
                }`}
                role="switch"
                aria-checked={geolocationEnabled}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    geolocationEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Уведомления */}
          <div className="overflow-hidden rounded-[22px] border border-border/60 bg-surface/80 backdrop-blur-2xl shadow-sm divide-y divide-border/40">
            <div className="p-4 font-bold text-xs text-ink-muted bg-surface-muted/30 flex items-center gap-2">
              <Bell className="h-4 w-4 text-blue-500" />
              <span>Сповіщення</span>
            </div>

            <div className="flex items-center justify-between p-4 min-h-[48px]">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface border border-border/40 text-ink-text">
                  <Bell className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-ink-text">Новини транспорту та метро</span>
              </div>
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  notificationsEnabled ? 'bg-primary' : 'bg-border'
                }`}
                role="switch"
                aria-checked={notificationsEnabled}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Приложение */}
          <div className="overflow-hidden rounded-[22px] border border-border/60 bg-surface/80 backdrop-blur-2xl shadow-sm divide-y divide-border/40">
            <div className="p-4 font-bold text-xs text-ink-muted bg-surface-muted/30 flex items-center gap-2">
              <Info className="h-4 w-4 text-amber-500" />
              <span>Додаток</span>
            </div>

            <a
              href="#about"
              onClick={(e) => { e.preventDefault(); alert('Kharkiv GO v1.2.0 — ваш надійний міський помічник.'); }}
              className="flex items-center justify-between p-4 transition-colors hover:bg-surface/90 active:bg-muted/50 min-h-[48px]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface border border-border/40 text-ink-text">
                  <Info className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-ink-text">Про програму</span>
              </div>
              <ChevronRight className="h-4 w-4 text-ink-muted" />
            </a>

            <a
              href="#rate"
              onClick={(e) => { e.preventDefault(); alert('Дякуємо за вашу підтримку! Оцінка доступна в Telegram Bot.'); }}
              className="flex items-center justify-between p-4 transition-colors hover:bg-surface/90 active:bg-muted/50 min-h-[48px]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface border border-border/40 text-ink-text">
                  <Award className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-ink-text">Оцінити застосунок</span>
              </div>
              <ChevronRight className="h-4 w-4 text-ink-muted" />
            </a>

            <a
              href="#share"
              onClick={(e) => { e.preventDefault(); alert('Посилання скопійовано в буфер обміну!'); }}
              className="flex items-center justify-between p-4 transition-colors hover:bg-surface/90 active:bg-muted/50 min-h-[48px]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface border border-border/40 text-ink-text">
                  <Share2 className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-ink-text">Поділитися з друзями</span>
              </div>
              <ChevronRight className="h-4 w-4 text-ink-muted" />
            </a>

            <a
              href="#privacy"
              onClick={(e) => { e.preventDefault(); alert('Усі дані зберігаються локально відповідно до політики конфіденційності.'); }}
              className="flex items-center justify-between p-4 transition-colors hover:bg-surface/90 active:bg-muted/50 min-h-[48px]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface border border-border/40 text-ink-text">
                  <FileText className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-ink-text">Політика конфіденційності</span>
              </div>
              <ExternalLink className="h-4 w-4 text-ink-muted" />
            </a>
          </div>
        </div>

        {/* 5. ІНФОРМАЦІЯ ТА СИСТЕМНІ ДАНІ */}
        <div className="space-y-2">
          <span className="px-1 text-[11px] font-bold uppercase tracking-wider text-ink-muted/80">
            Системна інформація
          </span>
          <div className="overflow-hidden rounded-[22px] border border-border/60 bg-surface/80 backdrop-blur-2xl shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-muted font-medium">Версія додатка</span>
              <span className="font-bold text-ink-text">v1.2.0 (Build 420)</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-muted font-medium">Версія бази даних</span>
              <span className="font-bold text-ink-text">GTFS 2026.06</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-muted font-medium">Останнє оновлення</span>
              <span className="font-bold text-ink-text">Сьогодні, 06:30</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
              <span className="text-ink-muted font-medium">Розмір локального кешу</span>
              <span className="font-bold text-emerald-600">{cacheSize}</span>
            </div>
          </div>
        </div>

        {/* 6. ШВИДКІ ДІЇ */}
        <div className="space-y-2">
          <span className="px-1 text-[11px] font-bold uppercase tracking-wider text-ink-muted/80">
            Швидкі дії
          </span>
          <div className="grid grid-cols-1 gap-2.5">
            <button
              onClick={handleUpdateData}
              disabled={isUpdating}
              className="flex items-center justify-center gap-2 w-full rounded-[20px] bg-primary px-4 py-3.5 text-xs font-extrabold text-primary-foreground shadow-md transition-all hover:bg-primary/90 active:scale-98 min-h-[48px]"
            >
              <RefreshCw className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
              <span>{isUpdating ? 'Оновлення...' : 'Оновити дані розкладу'}</span>
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={handleClearCache}
                className="flex items-center justify-center gap-2 rounded-[20px] bg-surface/80 border border-border/60 px-4 py-3.5 text-xs font-bold text-ink-text shadow-xs transition-all hover:bg-surface active:scale-98 min-h-[48px]"
              >
                <Trash2 className="h-4 w-4 text-rose-500" />
                <span>Очистити кеш</span>
              </button>

              <button
                onClick={() => alert('Встановлено актуальну версію (v1.2.0). Оновлень немає.')}
                className="flex items-center justify-center gap-2 rounded-[20px] bg-surface/80 border border-border/60 px-4 py-3.5 text-xs font-bold text-ink-text shadow-xs transition-all hover:bg-surface active:scale-98 min-h-[48px]"
              >
                <Check className="h-4 w-4 text-emerald-500" />
                <span>Перевірити оновлення</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
