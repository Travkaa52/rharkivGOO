import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToastStore } from '@/store/useToastStore';
import { 
  User, 
  Star, 
  History, 
  Send, 
  ChevronRight, 
  ShieldCheck,
  Sparkles,
  Settings as SettingsIcon,
  Info,
  Trash2,
  Share2,
  FileText,
  Award,
  LifeBuoy,
  Heart,
  Clock,
  MapPin,
  Route,
  ChevronRight as ChevronRightIcon
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { useAuthStore } from '@/store/useAuthStore';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useHistoryStore } from '@/store/useHistoryStore';
import {
  AboutAppModal,
  RateAppModal,
  PrivacyPolicyModal,
  SupportModal,
  SupportProjectModal
} from '@/components/ProfileModals';
import { HomeScreenShortcutCard } from '@/components/HomeScreenShortcutCard';

// ─── Design Tokens ─────────────────────────────────────────────────
const SPRING_TRANSITION = 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)';
const SMOOTH_TRANSITION = 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)';

// Цветовые акценты для разных секций
const SECTION_ACCENT = {
  favorites: 'from-amber-400 to-orange-500',
  history: 'from-slate-400 to-slate-500',
  settings: 'from-indigo-500 to-violet-600',
  about: 'from-sky-400 to-blue-500',
  support: 'from-emerald-400 to-teal-500',
  donate: 'from-rose-400 to-pink-500',
} as const;

interface MenuItemProps {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle?: string;
  badge?: string | number;
  onClick?: () => void;
  to?: string;
  isLast?: boolean;
}

function MenuItem({ icon: Icon, iconBg, iconColor, title, subtitle, badge, onClick, to, isLast }: MenuItemProps) {
  const content = (
    <div 
      className={`flex items-center justify-between px-5 py-4 transition-all active:scale-[0.99] ${
        !isLast ? 'border-b border-slate-100' : ''
      }`}
      style={{ transition: SMOOTH_TRANSITION }}
    >
      <div className="flex items-center gap-4">
        <div 
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconBg} shadow-sm`}
        >
          <Icon className={`h-5 w-5 ${iconColor}`} strokeWidth={2} />
        </div>
        <div className="flex flex-col">
          <span className="text-[15px] font-semibold text-slate-800">{title}</span>
          {subtitle && (
            <span className="text-[13px] text-slate-400 font-medium">{subtitle}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {badge !== undefined && (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[13px] font-bold text-slate-600">
            {badge}
          </span>
        )}
        <ChevronRightIcon className="h-5 w-5 text-slate-300" strokeWidth={2.5} />
      </div>
    </div>
  );

  const className = "group block w-full text-left transition-colors hover:bg-slate-50/80";

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={className}>
      {content}
    </button>
  );
}

export function ProfilePage() {
  const profile = useAuthStore((s) => s.profile);
  const isTelegramEnv = useAuthStore((s) => s.isTelegramEnv);

  const favoriteStops = useFavoritesStore((s) => s.stops);
  const favoriteRoutes = useFavoritesStore((s) => s.routes);
  const favoritesCount = favoriteStops.length + favoriteRoutes.length;

  const historyEntries = useHistoryStore((s) => s.entries);
  const clearHistory = () => {
    useHistoryStore.setState({ entries: [] });
  };

  const showToast = useToastStore((s) => s.show);

  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isRateOpen, setIsRateOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isSupportProjectOpen, setIsSupportProjectOpen] = useState(false);

  const handleShareApp = async () => {
    const shareData = {
      title: 'Kharkiv GO',
      text: 'Найкращий додаток для навігації та громадського транспорту у Харкові!',
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Посилання скопійовано в буфер обміну!', 'success');
    }
  };

  return (
    <div className="min-h-dvh bg-[#f5f5f7] text-slate-900 font-sans antialiased selection:bg-indigo-500 selection:text-white pb-32">

      {/* ═══════════════════════════════════════════════════════════════
          HEADER
          ═══════════════════════════════════════════════════════════════ */}
      <PageHeader
        title="Профіль"
        subtitle="Особистий кабінет"
        action={
          <Link
            to="/settings"
            aria-label="Налаштування"
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 text-slate-700 shadow-lg shadow-black/5 backdrop-blur-xl border border-white/60 transition-all hover:bg-white hover:shadow-xl hover:shadow-black/10 active:scale-90"
            style={{ transition: SPRING_TRANSITION }}
          >
            <SettingsIcon className="h-5 w-5" strokeWidth={2} />
          </Link>
        }
      />

      <div className="mx-auto max-w-md space-y-6 px-4 pt-3">

        {/* ═══════════════════════════════════════════════════════════════
            PROFILE CARD
            ═══════════════════════════════════════════════════════════════ */}
        {profile ? (
          <div 
            className="relative overflow-hidden rounded-[28px] border border-white/60 bg-white/90 p-6 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
          >
            {/* Decorative gradient blobs */}
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-indigo-400/20 to-violet-400/20 blur-3xl pointer-events-none" />
            <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-gradient-to-br from-sky-400/10 to-indigo-400/10 blur-3xl pointer-events-none" />

            <div className="relative flex items-center gap-5">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div 
                  className="h-20 w-20 rounded-[22px] overflow-hidden shadow-lg shadow-black/10 ring-[3px] ring-white"
                >
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : profile.avatarEmoji ? (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-600 text-3xl">
                      {profile.avatarEmoji}
                    </div>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-600">
                      <User className="h-10 w-10 text-white/90" strokeWidth={1.5} />
                    </div>
                  )}
                </div>

                {/* Status indicator */}
                <div 
                  className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md border-2 border-white"
                  title={profile.isLocal ? 'Локальний профіль' : 'Telegram'}
                >
                  <div className={`flex h-5 w-5 items-center justify-center rounded-full ${
                    profile.isLocal ? 'bg-slate-500' : 'bg-sky-500'
                  }`}>
                    <ShieldCheck className="h-3 w-3 text-white" strokeWidth={2.5} />
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${
                    profile.isLocal 
                      ? 'bg-slate-100 text-slate-600 border border-slate-200' 
                      : 'bg-sky-50 text-sky-600 border border-sky-200'
                  }`}>
                    {profile.isLocal ? 'Локальний' : 'Telegram'}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 truncate leading-tight tracking-tight">
                  {profile.displayName}
                </h2>
                {profile.username && (
                  <p className="text-[13px] font-medium text-slate-400 truncate">
                    @{profile.username}
                  </p>
                )}
                {profile.isLocal && profile.contact && (
                  <p className="text-[13px] font-medium text-slate-400 truncate">
                    {profile.contact}
                  </p>
                )}
              </div>
            </div>

            {/* Status bar */}
            <div className="relative mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[13px] font-medium text-slate-400">Статус акаунта</span>
              <span className="flex items-center gap-2 text-[13px] font-bold text-emerald-600">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                Активний
              </span>
            </div>
          </div>
        ) : isTelegramEnv ? (
          /* ═══════════════════════════════════════════════════════════════
             ERROR STATE (Telegram env, no profile)
             ═══════════════════════════════════════════════════════════════ */
          <div className="relative overflow-hidden rounded-[28px] border border-rose-200/60 bg-white/90 p-8 text-center backdrop-blur-2xl shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-50/50 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 border border-rose-200 mb-4 shadow-sm">
                <User className="h-8 w-8 text-rose-500" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Не вдалося завантажити профіль</h3>
              <p className="text-[13px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                Спробуйте перевідкрити застосунок у Telegram або оновіть сторінку.
              </p>
            </div>
          </div>
        ) : (
          /* ═══════════════════════════════════════════════════════════════
             GUEST STATE (Not logged in)
             ═══════════════════════════════════════════════════════════════ */
          <div className="relative overflow-hidden rounded-[28px] border border-white/60 bg-white/90 p-8 text-center backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
            <div className="absolute -left-20 -bottom-20 h-56 w-56 rounded-full bg-gradient-to-br from-indigo-400/10 to-violet-400/10 blur-3xl pointer-events-none" />
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-sky-400/10 to-indigo-400/10 blur-3xl pointer-events-none" />

            <div className="relative">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white mb-5 shadow-lg shadow-indigo-500/25">
                <Sparkles className="h-8 w-8" strokeWidth={1.5} />
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">
                Ласкаво просимо!
              </h3>

              <p className="text-[14px] text-slate-400 leading-relaxed mb-6 max-w-[280px] mx-auto">
                Авторизуйтеся через Telegram для синхронізації обраного та налаштувань на всіх пристроях.
              </p>

              <div className="flex flex-col gap-3">
                <a
                  href="https://t.me"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:shadow-indigo-500/30 active:scale-[0.98]"
                >
                  <Send className="h-5 w-5 transition-transform group-hover:scale-110" strokeWidth={2} />
                  <span>Увійти через Telegram</span>
                </a>
                <a
                  href="https://t.me"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-3.5 text-[15px] font-semibold text-slate-600 transition-all hover:bg-slate-200 active:scale-[0.98]"
                >
                  <span>Продовжити як гість</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            SAVED SECTION
            ═══════════════════════════════════════════════════════════════ */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            <h3 className="text-[13px] font-bold uppercase tracking-wider text-slate-400">
              Збережене
            </h3>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-white/60 bg-white/90 backdrop-blur-2xl shadow-sm shadow-black/5">
            <MenuItem
              icon={Star}
              iconBg="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60"
              iconColor="text-amber-500"
              title="Обране"
              subtitle="Маршрути, зупинки та станції"
              badge={favoritesCount > 0 ? favoritesCount : undefined}
              to="/favorites"
              isLast
            />
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            HISTORY SECTION
            ═══════════════════════════════════════════════════════════════ */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              <h3 className="text-[13px] font-bold uppercase tracking-wider text-slate-400">
                Історія
              </h3>
            </div>
            {historyEntries.length > 0 && (
              <button
                onClick={clearHistory}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[13px] font-semibold text-rose-500 transition-all hover:bg-rose-50 active:scale-95"
                style={{ transition: SPRING_TRANSITION }}
              >
                <Trash2 className="h-4 w-4" strokeWidth={2} />
                <span>Очистити</span>
              </button>
            )}
          </div>

          <div className="overflow-hidden rounded-[24px] border border-white/60 bg-white/90 backdrop-blur-2xl shadow-sm shadow-black/5">
            {historyEntries.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {historyEntries.slice(0, 20).map((entry, idx) => {
                  const entryText = (entry as any).title || (entry as any).query || (entry as any).name || `Об'єкт #${entry.id ?? idx}`;
                  const entryType = (entry as any).type || 'stop';
                  const TypeIcon = entryType === 'route' ? Route : entryType === 'trip' ? MapPin : History;

                  return (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-slate-50/60 active:bg-slate-100/60"
                      style={{ 
                        animation: `stagger-in 0.3s ease-out ${idx * 0.05}s both`,
                        transition: SMOOTH_TRANSITION 
                      }}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                          <TypeIcon className="h-4 w-4" strokeWidth={2} />
                        </div>
                        <span className="text-[14px] font-medium text-slate-700 truncate">
                          {entryText}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Clock className="h-3.5 w-3.5 text-slate-300" strokeWidth={2} />
                        <span className="text-[12px] text-slate-400 font-medium">Нещодавно</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center flex flex-col items-center justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-300 mb-4">
                  <History className="h-8 w-8" strokeWidth={1.5} />
                </div>
                <h4 className="text-[15px] font-bold text-slate-700 mb-1">Історія порожня</h4>
                <p className="text-[13px] text-slate-400 max-w-[220px] leading-relaxed">
                  Маршрути та зупинки, які ви відкриваєте, з'являться тут автоматично.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            MANAGEMENT SECTION
            ═══════════════════════════════════════════════════════════════ */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
            <h3 className="text-[13px] font-bold uppercase tracking-wider text-slate-400">
              Керування
            </h3>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-white/60 bg-white/90 backdrop-blur-2xl shadow-sm shadow-black/5">
            <MenuItem
              icon={SettingsIcon}
              iconBg="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200/60"
              iconColor="text-indigo-500"
              title="Налаштування"
              subtitle="Тема, карта, мова, сповіщення"
              to="/settings"
              isLast
            />
          </div>

          <HomeScreenShortcutCard />
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            ABOUT SECTION
            ═══════════════════════════════════════════════════════════════ */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="h-1.5 w-1.5 rounded-full bg-sky-400" />
            <h3 className="text-[13px] font-bold uppercase tracking-wider text-slate-400">
              Про додаток
            </h3>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-white/60 bg-white/90 backdrop-blur-2xl shadow-sm shadow-black/5 divide-y divide-slate-100">
            <MenuItem
              icon={Info}
              iconBg="bg-slate-50 border border-slate-200/60"
              iconColor="text-slate-500"
              title="Про програму"
              onClick={() => setIsAboutOpen(true)}
            />
            <MenuItem
              icon={Award}
              iconBg="bg-slate-50 border border-slate-200/60"
              iconColor="text-slate-500"
              title="Оцінити застосунок"
              onClick={() => setIsRateOpen(true)}
            />
            <MenuItem
              icon={Share2}
              iconBg="bg-slate-50 border border-slate-200/60"
              iconColor="text-slate-500"
              title="Поділитися застосунком"
              onClick={handleShareApp}
            />
            <MenuItem
              icon={FileText}
              iconBg="bg-slate-50 border border-slate-200/60"
              iconColor="text-slate-500"
              title="Політика конфіденційності"
              onClick={() => setIsPrivacyOpen(true)}
              isLast
            />
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SUPPORT SECTION
            ═══════════════════════════════════════════════════════════════ */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <h3 className="text-[13px] font-bold uppercase tracking-wider text-slate-400">
              Підтримка
            </h3>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-white/60 bg-white/90 backdrop-blur-2xl shadow-sm shadow-black/5 divide-y divide-slate-100">
            <MenuItem
              icon={LifeBuoy}
              iconBg="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/60"
              iconColor="text-emerald-500"
              title="Зв'язок з підтримкою"
              subtitle="Напишіть — повідомлення піде адміну"
              onClick={() => setIsSupportOpen(true)}
            />
            <MenuItem
              icon={Heart}
              iconBg="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200/60"
              iconColor="text-rose-500"
              title="Підтримати проект"
              onClick={() => setIsSupportProjectOpen(true)}
              isLast
            />
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            FOOTER
            ═══════════════════════════════════════════════════════════════ */}
        <div className="pt-4 pb-8 text-center">
          <p className="text-[12px] text-slate-400 font-medium">
            Kharkiv GO · Зроблено з любов'ю до Харкова
          </p>
          <p className="text-[11px] text-slate-300 mt-1">
            v1.0.0
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MODALS
          ═══════════════════════════════════════════════════════════════ */}
      <AboutAppModal open={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      <RateAppModal open={isRateOpen} onClose={() => setIsRateOpen(false)} />
      <PrivacyPolicyModal open={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
      <SupportModal open={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
      <SupportProjectModal open={isSupportProjectOpen} onClose={() => setIsSupportProjectOpen(false)} />
    </div>
  );
}
