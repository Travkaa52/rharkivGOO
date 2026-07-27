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
  Compass
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { RouteCard } from '@/components/RouteCard';
import { routesApi } from '@/api/routes';
import type { TransportKind, TransportRoute } from '@/types/transport';

interface TransportMeta {
  title: string;
  subtitle: string;
  icon: typeof TrainTrack;
  badgeColor: string;
}

const TRANSPORT_META: Record<TransportKind, TransportMeta> = {
  metro: { 
    title: 'Метро', 
    subtitle: '3 лінії · 30 станцій · Швидкісний підземний транспорт',
    icon: TrainTrack,
    badgeColor: 'text-red-500 bg-red-500/10 border-red-500/20'
  },
  tram: { 
    title: 'Трамваї', 
    subtitle: 'Наземні рейкові маршрути міста',
    icon: TrainTrack,
    badgeColor: 'text-amber-500 bg-amber-500/10 border-amber-500/20'
  },
  trolleybus: { 
    title: 'Тролейбуси', 
    subtitle: 'Екологічний міський електротранспорт',
    icon: Zap,
    badgeColor: 'text-blue-500 bg-blue-500/10 border-blue-500/20'
  },
  bus: { 
    title: 'Автобуси', 
    subtitle: 'Міські та приміські маршрутні автобуси',
    icon: Bus,
    badgeColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
  }
};

function RouteSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border/40 bg-surface/50 p-4 backdrop-blur-md animate-pulse">
      <div className="h-11 w-11 shrink-0 rounded-xl bg-muted/60" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-1/3 rounded-md bg-muted/60" />
        <div className="h-3 w-3/4 rounded-md bg-muted/40" />
      </div>
    </div>
  );
}

export function TransportKindPage({ kind }: { kind: TransportKind }) {
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
    if (!searchQuery.trim()) return routes;
    const query = searchQuery.toLowerCase().trim();
    return routes.filter((r) => {
      const numMatch = r.number != null && String(r.number).toLowerCase().includes(query);
      const nameMatch = r.name != null && r.name.toLowerCase().includes(query);
      return numMatch || nameMatch;
    });
  }, [routes, searchQuery]);

  return (
    <div className="min-h-dvh bg-gradient-to-b from-bg via-bg/95 to-bg pb-28 text-ink-text selection:bg-primary/20">
      <PageHeader title={meta.title} subtitle={meta.subtitle} />

      <div className="mx-auto max-w-md space-y-4 px-4 pt-2">
        
        {/* Кастомний бейдж з іконкою типу транспорту */}
        <div className="flex items-center justify-between gap-2">
          <div className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold backdrop-blur-md ${meta.badgeColor}`}>
            <TransportIcon className="h-4 w-4" />
            <span>{meta.title}</span>
          </div>
        </div>

        {/* Metro Live Hero Banner */}
        {kind === 'metro' && (
          <div className="relative group overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-surface/80 to-surface/60 p-0.5 shadow-lg backdrop-blur-xl transition-all hover:border-emerald-500/50">
            <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
            
            <Link
              to="/metro/live"
              className="flex items-center justify-between gap-3 rounded-[14px] bg-surface/40 p-4 transition-transform active:scale-[0.99]"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  <Radio className="h-5 w-5 animate-pulse text-emerald-400" />
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                  </span>
                </div>
                
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-body font-semibold text-ink-text">Живе метро</span>
                    <span className="rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-emerald-400 uppercase border border-emerald-500/30">
                      LIVE
                    </span>
                  </div>
                  <p className="text-body-sm text-ink-muted truncate">
                    Поїзди на схемі в реальному часі
                  </p>
                </div>
              </div>

              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 transition-transform group-hover:translate-x-1">
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          </div>
        )}

        {/* Search Bar */}
        {!loading && !errorMsg && routes.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Пошук за номером або назвою..."
                className="w-full rounded-xl border border-border/60 bg-surface/80 py-2.5 pl-10 pr-4 text-body-sm text-ink-text placeholder:text-ink-muted/50 backdrop-blur-md focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-ink-muted hover:text-ink-text"
                >
                  Очистити
                </button>
              )}
            </div>

            <div className="flex shrink-0 items-center justify-center rounded-xl border border-border/60 bg-surface/80 px-3 py-2.5 backdrop-blur-md shadow-2xs">
              <span className="text-caption font-semibold text-ink-muted">
                {filteredRoutes.length}
              </span>
            </div>
          </div>
        )}

        {/* List Content */}
        <div className="flex flex-col gap-2.5">
          {loading && (
            <>
              <RouteSkeleton />
              <RouteSkeleton />
              <RouteSkeleton />
            </>
          )}

          {errorMsg && !loading && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center backdrop-blur-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-3">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="text-body font-semibold text-ink-text mb-1">Помилка завантаження</h3>
              <p className="text-body-sm text-ink-muted max-w-xs mb-4">{errorMsg}</p>
              <button
                onClick={loadRoutes}
                className="inline-flex items-center gap-2 rounded-xl bg-surface border border-border/80 px-4 py-2 text-body-sm font-medium text-ink-text hover:bg-muted/50 transition-all shadow-2xs"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Спробувати знову</span>
              </button>
            </div>
          )}

          {!loading && !errorMsg && routes.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-surface/60 p-8 text-center backdrop-blur-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 text-ink-muted mb-3">
                <Compass className="h-6 w-6" />
              </div>
              <p className="text-body font-medium text-ink-text mb-1">Маршрутів не знайдено</p>
              <p className="text-body-sm text-ink-muted">Список наразі порожній.</p>
            </div>
          )}

          {!loading && !errorMsg && routes.length > 0 && filteredRoutes.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-surface/60 p-8 text-center backdrop-blur-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 text-ink-muted mb-3">
                <SearchX className="h-6 w-6" />
              </div>
              <p className="text-body font-medium text-ink-text mb-1">Нічого не знайдено</p>
              <p className="text-body-sm text-ink-muted">
                Немає маршрутів за запитом «{searchQuery}»
              </p>
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
