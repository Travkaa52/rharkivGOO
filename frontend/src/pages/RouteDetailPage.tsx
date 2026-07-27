import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Star, 
  Clock, 
  Timer, 
  MapPin, 
  Compass, 
  Navigation
} from 'lucide-react';
import { routesApi } from '@/api/routes';
import { localStops } from '@/data/localData';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { TransportKindIcon, KIND_LABELS_UK } from '@/components/TransportKindIcon';
import { getStationPhoto } from '@/data/stationPhotos';
import type { TransportRoute } from '@/types/transport';

function RouteDetailSkeleton() {
  return (
    <div className="min-h-dvh bg-bg pb-28 text-ink-text animate-pulse">
      {/* Top Bar Skeleton */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border/40 bg-bg/80 px-4 py-3 backdrop-blur-xl">
        <div className="h-9 w-9 rounded-xl bg-muted/60" />
        <div className="h-5 w-32 rounded-md bg-muted/60" />
        <div className="h-9 w-9 rounded-xl bg-muted/60" />
      </div>

      <div className="mx-auto max-w-md space-y-6 px-4 pt-4">
        {/* Hero Card Skeleton */}
        <div className="rounded-2xl border border-border/40 bg-surface/50 p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-muted/60 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-20 rounded-md bg-muted/60" />
              <div className="h-6 w-3/4 rounded-md bg-muted/60" />
            </div>
          </div>
          <div className="h-4 w-full rounded-md bg-muted/40" />
          <div className="flex gap-2 pt-2">
            <div className="h-7 w-28 rounded-full bg-muted/50" />
            <div className="h-7 w-28 rounded-full bg-muted/50" />
          </div>
        </div>

        {/* Timeline Skeleton */}
        <div className="space-y-3 pt-2">
          <div className="h-5 w-40 rounded-md bg-muted/60" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 pl-2">
              <div className="h-3.5 w-3.5 rounded-full bg-muted/60" />
              <div className="h-10 w-14 rounded-xl bg-muted/50 shrink-0" />
              <div className="h-4 w-1/2 rounded-md bg-muted/40" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function RouteDetailPage() {
  const { routeId } = useParams<{ routeId: string }>();
  const navigate = useNavigate();
  const [route, setRoute] = useState<TransportRoute | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isFavorite = useFavoritesStore((s) => (route ? s.isRouteFavorite(route.id) : false));
  const addRoute = useFavoritesStore((s) => s.addRoute);
  const removeRoute = useFavoritesStore((s) => s.removeRoute);

  const loadRoute = useCallback(() => {
    if (!routeId) return;
    let cancelled = false;
    setLoading(true);
    setErrorMsg(null);

    routesApi
      .getById(routeId)
      .then((data) => {
        if (!cancelled) {
          if (data) {
            setRoute(data);
          } else {
            setErrorMsg('Маршрут не знайдено');
          }
        }
      })
      .catch(() => {
        if (!cancelled) setErrorMsg('Помилка завантаження даних');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [routeId]);

  useEffect(() => {
    const cleanup = loadRoute();
    return cleanup;
  }, [loadRoute]);

  const toggleFavorite = () => {
    if (!route) return;
    if (isFavorite) {
      removeRoute(route.id);
    } else {
      addRoute(route.id);
    }
  };

  if (loading) {
    return <RouteDetailSkeleton />;
  }

  if (errorMsg || !route) {
    return (
      <div className="min-h-dvh bg-bg text-ink-text pb-28">
        <div className="sticky top-0 z-30 flex items-center border-b border-border/40 bg-bg/80 px-4 py-3 backdrop-blur-xl">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-surface/80 text-ink-text backdrop-blur-md active:scale-95 transition-all"
            aria-label="Назад"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>

        <div className="mx-auto max-w-md px-4 pt-16 flex flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/40 text-ink-muted mb-4 border border-border/40">
            <Compass className="h-8 w-8" />
          </div>
          <h2 className="text-body-lg font-bold text-ink-text mb-1">Маршрут не знайдено</h2>
          <p className="text-body-sm text-ink-muted mb-6 max-w-xs">
            Запитаний маршрут не існує або був видалений з системи.
          </p>
          <button
            onClick={() => navigate('/routes')}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-body-sm font-semibold text-primary-foreground transition-all shadow-md active:scale-95"
          >
            <Navigation className="h-4 w-4" />
            <span>До всіх маршрутів</span>
          </button>
        </div>
      </div>
    );
  }

  const routeColor = route.color || '#10b981';

  return (
    <div className="min-h-dvh bg-bg text-ink-text selection:bg-primary/20 pb-28">
      {/* Top Sticky Navigation */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border/40 bg-bg/80 px-4 py-3 backdrop-blur-xl">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-surface/80 text-ink-text backdrop-blur-md active:scale-95 transition-all shadow-2xs"
          aria-label="Назад"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 min-w-0 px-2">
          <div 
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white shadow-xs"
            style={{ backgroundColor: routeColor }}
          >
            {route.number}
          </div>
          <span className="truncate text-body-sm font-bold text-ink-text">
            {route.name}
          </span>
        </div>

        <button
          onClick={toggleFavorite}
          aria-label={isFavorite ? 'Прибрати з обраного' : 'Додати в обране'}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-surface/80 text-ink-text backdrop-blur-md active:scale-90 transition-all shadow-2xs"
        >
          <Star 
            className={`h-5 w-5 transition-all duration-200 ${
              isFavorite ? 'fill-amber-400 text-amber-400 scale-110' : 'text-ink-muted hover:text-ink-text'
            }`} 
          />
        </button>
      </div>

      <div className="mx-auto max-w-md space-y-6 px-4 pt-4">
        {/* Main Hero Card */}
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-surface/60 p-5 backdrop-blur-xl shadow-lg">
          {/* Subtle Glow Background based on route color */}
          <div 
            className="absolute -right-12 -top-12 h-36 w-36 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ backgroundColor: routeColor }}
          />

          <div className="flex items-start gap-4">
            {/* Route Number Badge */}
            <div className="relative shrink-0">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl font-display text-xl font-extrabold text-white shadow-md border border-white/20"
                style={{ backgroundColor: routeColor }}
              >
                {route.number}
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-xl border-2 border-surface bg-surface text-ink-text shadow-sm">
                <TransportKindIcon kind={route.kind} size={16} />
              </div>
            </div>

            {/* Route Meta info */}
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted/80">
                {KIND_LABELS_UK[route.kind]}
              </span>
              <h1 className="text-body-lg font-extrabold text-ink-text leading-snug">
                {route.name}
              </h1>
            </div>
          </div>

          {/* Direction / Headsign */}
          <div className="mt-4 rounded-xl border border-border/40 bg-surface/80 p-3 backdrop-blur-md">
            <div className="flex items-center gap-2 text-body-sm text-ink-text font-medium">
              <span className="truncate">{route.headsignForward}</span>
              <span className="shrink-0 text-ink-muted">↔</span>
              <span className="truncate">{route.headsignBackward}</span>
            </div>
          </div>

          {/* Key Indicators Badges */}
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {route.firstDeparture && route.lastDeparture && (
              <div className="inline-flex items-center gap-1.5 rounded-xl border border-border/40 bg-surface/50 px-3 py-1.5 font-semibold text-ink-text backdrop-blur-md">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span>{route.firstDeparture}–{route.lastDeparture}</span>
              </div>
            )}

            {route.intervalMinutes != null && (
              <div className="inline-flex items-center gap-1.5 rounded-xl border border-border/40 bg-surface/50 px-3 py-1.5 font-semibold text-ink-text backdrop-blur-md">
                <Timer className="h-3.5 w-3.5 text-amber-500" />
                <span>інтервал ~{route.intervalMinutes} хв</span>
              </div>
            )}

            <div className="inline-flex items-center gap-1.5 rounded-xl border border-border/40 bg-surface/50 px-3 py-1.5 font-semibold text-ink-text backdrop-blur-md">
              <MapPin className="h-3.5 w-3.5 text-emerald-500" />
              <span>{route.stopIds.length} зупинок</span>
            </div>
          </div>
        </div>

        {/* Route Stops Interactive Timeline */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-body font-bold text-ink-text">
              Маршрут руху
            </h2>
            <span className="text-caption font-semibold text-ink-muted">
              Послідовність зупинок
            </span>
          </div>

          <div className="relative rounded-3xl border border-border/60 bg-surface/50 p-4 backdrop-blur-xl shadow-sm">
            {/* Dynamic Continuous Vertical Line */}
            <div 
              className="absolute left-[1.65rem] top-8 bottom-8 w-0.5 rounded-full opacity-60"
              style={{ backgroundColor: routeColor }}
            />

            <ol className="relative flex flex-col gap-3">
              {route.stopIds.map((stopId, idx) => {
                const photo = getStationPhoto(stopId);
                const stopData = localStops.getById(stopId);
                const stopName = stopData?.name ?? `Зупинка ${stopId}`;
                const isFirst = idx === 0;
                const isLast = idx === route.stopIds.length - 1;

                return (
                  <li 
                    key={`${stopId}-${idx}`} 
                    className="relative flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-surface/80"
                  >
                    {/* Circle Node on Timeline */}
                    <div className="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center">
                      <div 
                        className={`h-3.5 w-3.5 rounded-full border-2 border-surface shadow-2xs transition-transform ${
                          isFirst || isLast ? 'scale-125 ring-2 ring-primary/20' : ''
                        }`}
                        style={{ backgroundColor: routeColor }}
                      />
                    </div>

                    {/* Station Thumbnail if available */}
                    {photo ? (
                      <div className="relative h-11 w-16 shrink-0 overflow-hidden rounded-xl border border-border/40 shadow-2xs">
                        <img
                          src={photo}
                          alt={stopName}
                          className="h-full w-full object-cover transition-transform hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/40 bg-surface/80 text-ink-muted/60">
                        <MapPin className="h-5 w-5" />
                      </div>
                    )}

                    {/* Station Name & Badges */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-body-sm font-semibold text-ink-text">
                          {stopName}
                        </span>
                      </div>

                      {/* Special First/Last badges */}
                      {(isFirst || isLast) && (
                        <span className={`inline-block mt-0.5 text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.2 rounded-md border ${
                          isFirst 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {isFirst ? 'Початкова' : 'Кінцева'}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
