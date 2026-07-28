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
  Star
} from 'lucide-react';
import { RouteCard } from '@/components/RouteCard';
import { MetroLinesExplorer } from '@/components/MetroLinesExplorer';
import { routesApi } from '@/api/routes';
import type { TransportKind, TransportRoute } from '@/types/transport';

interface TransportMeta {
  title: string;
  subtitle: string;
  icon: typeof TrainTrack;
  badgeColor: string;
  themeColor: string;
}

const TRANSPORT_META: Record<TransportKind, TransportMeta> = {
  metro: { 
    title: 'Метро', 
    subtitle: '3 лінії · 30 станцій · Швидкісний підземний транспорт', 
    icon: TrainTrack,
    badgeColor: 'text-purple-600 bg-purple-50 border-purple-200',
    themeColor: 'from-purple-600 to-purple-800'
  },
  tram: { 
    title: 'Трамваї', 
    subtitle: 'Наземні рейкові маршрути міста', 
    icon: TrainTrack,
    badgeColor: 'text-red-600 bg-red-50 border-red-200',
    themeColor: 'from-red-600 to-red-800'
  },
  trolleybus: { 
    title: 'Тролейбуси', 
    subtitle: 'Екологічний міський електротранспорт', 
    icon: Zap,
    badgeColor: 'text-blue-600 bg-blue-50 border-blue-200',
    themeColor: 'from-blue-600 to-blue-800'
  },
  bus: { 
    title: 'Автобуси', 
    subtitle: 'Міські та приміські маршрутні автобуси', 
    icon: Bus,
    badgeColor: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    themeColor: 'from-emerald-600 to-emerald-800'
  }
};

function RouteSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-[22px] border border-slate-100 bg-white p-4.5 shadow-sm animate-pulse">
      <div className="h-12 w-12 shrink-0 rounded-2xl bg-slate-100" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-1/3 rounded-lg bg-slate-100" />
        <div className="h-3 w-3/4 rounded-lg bg-slate-50" />
      </div>
    </div>
  );
}

export function TransportKindPage({ kind }: { kind: TransportKind }) {
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'favorites'>('all');

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
        if (!cancelled) setErrorMsg('Не вдалося завантажити маршрути. Перевірте з’єднання.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
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

    return result;
  }, [routes, searchQuery]);

  return (
    <div className="min-h-dvh bg-slate-50 pb-28 pt-[max(0.75rem,env(safe-area-inset-top))] text-slate-900 selection:bg-emerald-500 selection:text-white font-sans antialiased">
      
      <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="mx-auto max-w-md space-y-4 px-4 relative z-10">
        
        <header className="flex items-start justify-between pt-1 animate-in fade-in slide-in-from-top-2 duration-300">
          <div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold shadow-2xs ${meta.badgeColor}`}>
                <TransportIcon className="h-3.5 w-3.5" />
                <span>{meta.title}</span>
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 mt-2">Маршрути</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Оберіть маршрут громадського транспорту</p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              aria-label="Фільтри"
              className="p-2.5 rounded-full bg-white border border-slate-100 hover:bg-slate-100 text-slate-700 shadow-sm transition-all active:scale-95"
            >
              <SlidersHorizontal size={17} />
            </button>
            <button 
              aria-label="Сортування"
              className="p-2.5 rounded-full bg-white border border-slate-100 hover:bg-slate-100 text-slate-700 shadow-sm transition-all active:scale-95"
            >
              <ArrowUpDown size={17} />
            </button>
          </div>
        </header>

        {kind === 'metro' && (
          <div className="relative group overflow-hidden rounded-[22px] bg-gradient-to-r from-emerald-600 to-emerald-800 p-4 text-white shadow-lg shadow-emerald-900/10 transition-transform active:scale-[0.99]">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            
            <Link
              to="/metro/live"
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-white">
                  <Radio className="h-5 w-5 animate-pulse" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold tracking-tight">Живе метро</span>
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-extrabold tracking-wider uppercase backdrop-blur-md">
                      LIVE
                    </span>
                  </div>
                  <p className="text-xs text-emerald-100 font-medium truncate">
                    Поїзди на схемі в реальному часі
                  </p>
                </div>
              </div>

              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition-transform group-hover:translate-x-0.5">
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          </div>
        )}

        {kind === 'metro' && (
          <div className="pt-1">
            <MetroLinesExplorer />
          </div>
        )}

        {!loading && !errorMsg && routes.length > 0 && (
          <div className="relative animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Пошук маршруту..."
              className="w-full rounded-[20px] border border-slate-100 bg-white py-3 pl-10 pr-10 text-xs font-semibold text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 hover:text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {!loading && !errorMsg && routes.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 shadow-2xs ${
                selectedFilter === 'all'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-white text-slate-600 border border-slate-100 hover:bg-slate-100'
              }`}
            >
              Усі маршрути ({routes.length})
            </button>
            <button
              onClick={() => setSelectedFilter('favorites')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1 shadow-2xs ${
                selectedFilter === 'favorites'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  : 'bg-white text-slate-600 border border-slate-100 hover:bg-slate-100'
              }`}
            >
              <Star size={13} className="fill-current" />
              <span>Обране</span>
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          {loading && (
            <>
              <RouteSkeleton />
              <RouteSkeleton />
              <RouteSkeleton />
              <RouteSkeleton />
            </>
          )}

          {errorMsg && !loading && (
            <div className="flex flex-col items-center justify-center rounded-[22px] border border-red-100 bg-white p-8 text-center shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500 mb-3">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Помилка завантаження</h3>
              <p className="text-xs text-slate-500 max-w-xs mb-4">{errorMsg}</p>
              <button
                onClick={loadRoutes}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 active:scale-95 transition-all"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Спробувати знову</span>
              </button>
            </div>
          )}

          {!loading && !errorMsg && routes.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-[22px] border border-slate-100 bg-white p-8 text-center shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 mb-3">
                <Compass className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-slate-900 mb-1">Маршрутів не знайдено</p>
              <p className="text-xs text-slate-500">Список наразі порожній.</p>
            </div>
          )}

          {!loading && !errorMsg && routes.length > 0 && filteredRoutes.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-[22px] border border-slate-100 bg-white p-8 text-center shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-3">
                <SearchX className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-slate-900 mb-1">Маршрутів не знайдено</p>
              <p className="text-xs text-slate-500 mb-4">
                Спробуйте змінити параметри пошуку.
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-emerald-700 active:scale-95 transition-all inline-flex items-center gap-1.5"
              >
                <span>Скинути фільтри</span>
              </button>
            </div>
          )}

          {!loading &&
            !errorMsg &&
            filteredRoutes.map((route) => (
              <RouteCard key={route.id} route={route} />
            ))}
        </div>

      </div>
    </div>
  );
}
