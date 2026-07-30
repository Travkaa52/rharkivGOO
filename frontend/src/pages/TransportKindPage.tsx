import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrainTrack, 
  Bus, 
  Zap, 
  Search, 
  RotateCcw, 
  AlertCircle, 
  ArrowRight, 
  Radio, 
  SearchX,
  Compass,
  SlidersHorizontal,
  ArrowUpDown,
  Star,
  Check,
  Loader2,
  MapPin,
  Route,
  X
} from 'lucide-react';
import { RouteCard } from '@/components/RouteCard';
import { MetroLinesExplorer } from '@/components/MetroLinesExplorer';
import { routesApi } from '@/api/routes';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import type { TransportKind, TransportRoute } from '@/types/transport';

// ─── Design Tokens ─────────────────────────────────────────────────
const SPRING_TRANSITION = 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)';
const SMOOTH_TRANSITION = 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)';

interface TransportMeta {
  title: string;
  subtitle: string;
  icon: typeof TrainTrack;
  accentColor: string;
  gradientFrom: string;
  gradientTo: string;
  iconBg: string;
  chipActive: string;
  chipInactive: string;
  liveBadge: string;
}

// У каждого вида транспорта — свой цветовой акцент
const TRANSPORT_META: Record<TransportKind, TransportMeta> = {
  metro: { 
    title: 'Метро', 
    subtitle: '3 лінії · 30 станцій · Швидкісний підземний транспорт', 
    icon: TrainTrack,
    accentColor: 'text-indigo-500',
    gradientFrom: 'from-indigo-500',
    gradientTo: 'to-violet-600',
    iconBg: 'bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-200/60',
    chipActive: 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25',
    chipInactive: 'bg-white/80 text-slate-500 border border-slate-200/60 hover:bg-white hover:text-slate-700',
    liveBadge: 'bg-white/20 text-white',
  },
  tram: { 
    title: 'Трамваї', 
    subtitle: 'Наземні рейкові маршрути міста', 
    icon: TrainTrack,
    accentColor: 'text-emerald-500',
    gradientFrom: 'from-emerald-500',
    gradientTo: 'to-teal-600',
    iconBg: 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200/60',
    chipActive: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25',
    chipInactive: 'bg-white/80 text-slate-500 border border-slate-200/60 hover:bg-white hover:text-slate-700',
    liveBadge: 'bg-white/20 text-white',
  },
  trolleybus: { 
    title: 'Тролейбуси', 
    subtitle: 'Екологічний міський електротранспорт', 
    icon: Zap,
    accentColor: 'text-amber-500',
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-orange-600',
    iconBg: 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/60',
    chipActive: 'bg-amber-500 text-white shadow-lg shadow-amber-500/25',
    chipInactive: 'bg-white/80 text-slate-500 border border-slate-200/60 hover:bg-white hover:text-slate-700',
    liveBadge: 'bg-white/20 text-white',
  },
  bus: { 
    title: 'Автобуси', 
    subtitle: 'Міські та приміські маршрутні автобуси', 
    icon: Bus,
    accentColor: 'text-sky-500',
    gradientFrom: 'from-sky-500',
    gradientTo: 'to-blue-600',
    iconBg: 'bg-gradient-to-br from-sky-50 to-blue-50 border-sky-200/60',
    chipActive: 'bg-sky-500 text-white shadow-lg shadow-sky-500/25',
    chipInactive: 'bg-white/80 text-slate-500 border border-slate-200/60 hover:bg-white hover:text-slate-700',
    liveBadge: 'bg-white/20 text-white',
  }
};

// ─── Skeleton с shimmer-эффектом ───────────────────────────────────
function RouteSkeleton({ index }: { index: number }) {
  return (
    <div 
      className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white/80 px-4 py-3.5 shadow-sm"
      style={{ 
        animation: `stagger-in 0.4s ease-out ${index * 0.08}s both`,
        transition: SMOOTH_TRANSITION 
      }}
    >
      <div className="h-12 w-12 shrink-0 rounded-2xl bg-slate-100 animate-pulse" />
      <div className="flex-1 space-y-2.5">
        <div className="h-4 w-20 rounded-lg bg-slate-100 animate-pulse" />
        <div className="h-3 w-3/4 rounded-lg bg-slate-50 animate-pulse" />
      </div>
      <div className="h-8 w-8 rounded-xl bg-slate-50 animate-pulse" />
    </div>
  );
}

// ─── Filter Dropdown Chip ──────────────────────────────────────────
function FilterChip({ 
  active, 
  onClick, 
  children, 
  activeClass, 
  inactiveClass 
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode;
  activeClass: string;
  inactiveClass: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all shrink-0 active:scale-95 ${
        active ? activeClass : inactiveClass
      }`}
      style={{ transition: SPRING_TRANSITION }}
    >
      {children}
    </button>
  );
}

export function TransportKindPage({ kind }: { kind: TransportKind }) {
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'favorites'>('all');
  const [sortAsc, setSortAsc] = useState(true);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const favoriteRoutes = useFavoritesStore((s) => s.routes);
  const isRouteFavorite = useFavoritesStore((s) => s.isRouteFavorite);

  const meta = TRANSPORT_META[kind] || TRANSPORT_META.bus;
  const TransportIcon = meta.icon;

  const loadRoutes = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setErrorMsg(null);

    routesApi
      .getByKind(kind)
      .then((data) => {
        if (!cancelled) setRoutes(data);
      })
      .catch(() => {
        if (!cancelled) setErrorMsg('Не вдалося завантажити маршрути. Перевірте з\'єднання.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [kind]);

  useEffect(() => {
    const cleanup = loadRoutes();
    return cleanup;
  }, [loadRoutes]);

  const filteredRoutes = useMemo(() => {
    let result = routes;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((r) => {
        const numMatch = r.number != null && String(r.number).toLowerCase().includes(query);
        const nameMatch = r.name != null && r.name.toLowerCase().includes(query);
        return numMatch || nameMatch;
      });
    }

    if (selectedFilter === 'favorites') {
      result = result.filter((r) => isRouteFavorite(r.id));
    }

    result = [...result].sort((a, b) => {
      const cmp = String(a.number ?? '').localeCompare(String(b.number ?? ''), 'uk', { numeric: true, sensitivity: 'base' });
      return sortAsc ? cmp : -cmp;
    });

    return result;
  }, [routes, searchQuery, selectedFilter, sortAsc, favoriteRoutes, isRouteFavorite]);

  const activeCount = selectedFilter === 'favorites' 
    ? routes.filter((r) => isRouteFavorite(r.id)).length 
    : routes.length;

  return (
    <div className="min-h-dvh bg-[#f5f5f7] text-slate-900 font-sans antialiased selection:bg-indigo-500 selection:text-white pb-28">

      {/* Decorative background blur */}
      <div className="pointer-events-none fixed -top-32 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-gradient-to-br from-indigo-200/30 to-violet-200/20 blur-3xl" />

      <div className="mx-auto max-w-md space-y-5 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] relative z-10">

        {/* ═══════════════════════════════════════════════════════════════
            HEADER
            ═══════════════════════════════════════════════════════════════ */}
        <header className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {/* Badge */}
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] font-bold shadow-sm ${meta.iconBg} border`}>
                  <TransportIcon className={`h-4 w-4 ${meta.accentColor}`} strokeWidth={2.5} />
                  <span className="text-slate-700">{meta.title}</span>
                </span>
              </div>

              <h1 className="text-[28px] font-black tracking-tight text-slate-900 leading-none">
                Маршрути
              </h1>
              <p className="text-[14px] text-slate-400 font-medium mt-1.5 leading-relaxed">
                {meta.subtitle}
              </p>
            </div>

            {/* Action buttons */}
            <div className="relative flex items-center gap-2 shrink-0 ml-3">
              <button
                onClick={() => setIsFiltersOpen((v) => !v)}
                aria-label="Фільтри"
                aria-pressed={isFiltersOpen}
                className={`flex h-11 w-11 items-center justify-center rounded-2xl border shadow-sm transition-all active:scale-90 ${
                  isFiltersOpen
                    ? 'bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/25'
                    : 'bg-white/90 border-white/60 text-slate-600 hover:bg-white hover:shadow-md'
                }`}
                style={{ transition: SPRING_TRANSITION }}
              >
                <SlidersHorizontal size={18} strokeWidth={2} />
              </button>

              <button
                onClick={() => setSortAsc((v) => !v)}
                aria-label={sortAsc ? 'За зростанням' : 'За спаданням'}
                title={sortAsc ? 'За зростанням номера' : 'За спаданням номера'}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 border border-white/60 text-slate-600 shadow-sm transition-all hover:bg-white hover:shadow-md active:scale-90"
                style={{ transition: SPRING_TRANSITION }}
              >
                <ArrowUpDown size={18} strokeWidth={2} className={`transition-transform duration-300 ${sortAsc ? '' : 'rotate-180'}`} />
              </button>

              {/* Filter dropdown */}
              {isFiltersOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setIsFiltersOpen(false)} />
                  <div 
                    className="absolute right-0 top-14 z-30 w-56 rounded-2xl border border-white/60 bg-white/95 p-2 shadow-2xl shadow-black/10 backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-200"
                  >
                    <p className="px-3 pb-2 pt-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Показувати
                    </p>
                    {(['all', 'favorites'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => {
                          setSelectedFilter(f);
                          setIsFiltersOpen(false);
                        }}
                        className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[14px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 active:bg-slate-100"
                      >
                        <span className="flex items-center gap-2.5">
                          {f === 'favorites' && <Star size={16} className="text-amber-400" strokeWidth={2} />}
                          {f === 'all' && <Route size={16} className="text-slate-400" strokeWidth={2} />}
                          {f === 'all' ? 'Усі маршрути' : 'Лише обране'}
                        </span>
                        {selectedFilter === f && (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500">
                            <Check size={12} className="text-white" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ═══════════════════════════════════════════════════════════════
            METRO LIVE BANNER
            ═══════════════════════════════════════════════════════════════ */}
        {kind === 'metro' && (
          <div 
            className="group relative overflow-hidden rounded-[24px] bg-gradient-to-r from-indigo-500 to-violet-600 p-5 text-white shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.99] cursor-pointer"
            style={{ transition: SPRING_TRANSITION }}
          >
            <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-8 -top-8 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl pointer-events-none" />

            <Link to="/metro/live" className="relative flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md text-white border border-white/20">
                  <Radio className="h-5 w-5" strokeWidth={2} />
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400 border-2 border-white" />
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[15px] font-bold tracking-tight">Живе метро</span>
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-extrabold tracking-wider uppercase backdrop-blur-md border border-white/10">
                      LIVE
                    </span>
                  </div>
                  <p className="text-[13px] text-indigo-100 font-medium truncate">
                    Поїзди на схемі в реальному часі
                  </p>
                </div>
              </div>

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition-all group-hover:bg-white/20 group-hover:translate-x-0.5 border border-white/10">
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </div>
            </Link>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            METRO LINES EXPLORER
            ═══════════════════════════════════════════════════════════════ */}
        {kind === 'metro' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
            <MetroLinesExplorer />
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            SEARCH
            ═══════════════════════════════════════════════════════════════ */}
        {!loading && !errorMsg && routes.length > 0 && (
          <div className="relative animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="h-5 w-5" strokeWidth={2} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Пошук за номером або назвою..."
              className="w-full rounded-[20px] border border-white/60 bg-white/90 py-3.5 pl-12 pr-12 text-[15px] font-medium text-slate-800 placeholder:text-slate-400 shadow-sm shadow-black/5 focus:border-indigo-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all backdrop-blur-xl"
              style={{ transition: SMOOTH_TRANSITION }}
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all hover:bg-slate-200 hover:text-slate-700 active:scale-90"
                style={{ transition: SPRING_TRANSITION }}
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            ) : (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                <Compass className="h-5 w-5" strokeWidth={1.5} />
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            FILTER CHIPS
            ═══════════════════════════════════════════════════════════════ */}
        {!loading && !errorMsg && routes.length > 0 && (
          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <FilterChip
              active={selectedFilter === 'all'}
              onClick={() => setSelectedFilter('all')}
              activeClass={meta.chipActive}
              inactiveClass={meta.chipInactive}
            >
              <span className="flex items-center gap-1.5">
                <Route size={14} strokeWidth={2.5} />
                Усі ({routes.length})
              </span>
            </FilterChip>

            <FilterChip
              active={selectedFilter === 'favorites'}
              onClick={() => setSelectedFilter('favorites')}
              activeClass={meta.chipActive}
              inactiveClass={meta.chipInactive}
            >
              <span className="flex items-center gap-1.5">
                <Star size={14} strokeWidth={2.5} className={selectedFilter === 'favorites' ? 'fill-white' : 'fill-amber-400 text-amber-400'} />
                Обране
              </span>
            </FilterChip>

            {/* Sort indicator chip */}
            <button
              onClick={() => setSortAsc((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] font-semibold bg-white/80 text-slate-500 border border-slate-200/60 transition-all hover:bg-white active:scale-95 shrink-0"
              style={{ transition: SPRING_TRANSITION }}
            >
              <ArrowUpDown size={14} strokeWidth={2.5} className={`transition-transform duration-300 ${sortAsc ? '' : 'rotate-180'}`} />
              <span>{sortAsc ? '1 → 99' : '99 → 1'}</span>
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            ROUTES LIST
            ═══════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col gap-2.5">

          {/* Loading skeletons */}
          {loading && (
            <>
              <RouteSkeleton index={0} />
              <RouteSkeleton index={1} />
              <RouteSkeleton index={2} />
              <RouteSkeleton index={3} />
              <RouteSkeleton index={4} />
            </>
          )}

          {/* Error state */}
          {errorMsg && !loading && (
            <div className="flex flex-col items-center justify-center rounded-[24px] border border-rose-200/60 bg-white/90 p-10 text-center shadow-lg shadow-black/5 backdrop-blur-xl">
              <div className="relative mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 border border-rose-200 shadow-sm">
                  <AlertCircle className="h-8 w-8 text-rose-500" strokeWidth={1.5} />
                </div>
                <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-500 border-2 border-white" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Помилка завантаження</h3>
              <p className="text-[14px] text-slate-400 max-w-xs mb-6 leading-relaxed">{errorMsg}</p>
              <button
                onClick={loadRoutes}
                className="group inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-[14px] font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:shadow-xl hover:shadow-slate-900/30 active:scale-[0.97]"
                style={{ transition: SPRING_TRANSITION }}
              >
                <RotateCcw className="h-4 w-4 transition-transform group-hover:-rotate-180" strokeWidth={2.5} />
                <span>Спробувати знову</span>
              </button>
            </div>
          )}

          {/* Empty state (no routes at all) */}
          {!loading && !errorMsg && routes.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-[24px] border border-slate-200/60 bg-white/90 p-10 text-center shadow-lg shadow-black/5 backdrop-blur-xl">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-300 mb-4">
                <Compass className="h-8 w-8" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Маршрутів не знайдено</h3>
              <p className="text-[14px] text-slate-400 max-w-xs leading-relaxed">
                Список маршрутів наразі порожній. Спробуйте оновити сторінку пізніше.
              </p>
            </div>
          )}

          {/* No search results */}
          {!loading && !errorMsg && routes.length > 0 && filteredRoutes.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-[24px] border border-slate-200/60 bg-white/90 p-10 text-center shadow-lg shadow-black/5 backdrop-blur-xl">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-300 mb-4">
                <SearchX className="h-8 w-8" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Нічого не знайдено</h3>
              <p className="text-[14px] text-slate-400 max-w-xs mb-6 leading-relaxed">
                Спробуйте змінити запит пошуку або скинути фільтри.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedFilter('all');
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-3 text-[14px] font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl active:scale-[0.97]"
                style={{ transition: SPRING_TRANSITION }}
              >
                <X size={16} strokeWidth={2.5} />
                <span>Скинути фільтри</span>
              </button>
            </div>
          )}

          {/* Routes list */}
          {!loading && !errorMsg && filteredRoutes.map((route, index) => (
            <div 
              key={route.id}
              style={{ 
                animation: `stagger-in 0.35s ease-out ${index * 0.04}s both`,
                transition: SMOOTH_TRANSITION 
              }}
            >
              <RouteCard route={route} />
            </div>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            RESULTS COUNT
            ═══════════════════════════════════════════════════════════════ */}
        {!loading && !errorMsg && routes.length > 0 && filteredRoutes.length > 0 && (
          <div className="flex items-center justify-center pt-2 pb-4">
            <span className="text-[12px] font-medium text-slate-400">
              Показано {filteredRoutes.length} з {activeCount} маршрутів
            </span>
          </div>
        )}

      </div>
    </div>
  );
}
