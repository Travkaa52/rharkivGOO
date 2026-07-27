import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import {
  Star,
  MapPin,
  Clock,
  ChevronRight,
  ArrowRight,
  Search,
  Map as MapIcon,
  Train,
  Sparkles,
  Navigation
} from 'lucide-react';
import { localRoutes, localStops } from '@/data/localData';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useHistoryStore } from '@/store/useHistoryStore';
import { useGeolocation } from '@/hooks/useGeolocation';
import { LiveMetroWidget } from '@/components/LiveMetroWidget';
import type { TransportKind } from '@/types/transport';

const KIND_ICON: Record<TransportKind, string> = {
  metro: '🚇',
  tram: '🚊',
  trolleybus: '🚎',
  bus: '🚌'
};


/** Форматування відстані в метрах чи кілометрах */
function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} м`;
  return `${(m / 1000).toFixed(1)} км`;
}

/** Розрахунок реальної відстані між двома точками за формулою Гаверсину */
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Радіус Землі в метрах
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function HomePage() {
  const favoriteRoutes = useFavoritesStore((s) => s.routes);
  const historyEntries = useHistoryStore((s) => s.entries);
  const { position } = useGeolocation();

  const favoriteRouteDetails = useMemo(
    () =>
      favoriteRoutes
        .slice(0, 3)
        .map((f) => localRoutes.getById(f.routeId))
        .filter((r): r is NonNullable<typeof r> => !!r),
    [favoriteRoutes]
  );

  // Найближчі зупинки з розрахованою точною відстанню
  const nearbyStopsWithDistance = useMemo(() => {
    if (!position) return [];
    const stops = localStops.getNearby(position.lat, position.lng, 900).slice(0, 3);
    return stops.map((stop) => ({
      ...stop,
      distance: calculateDistanceMeters(position.lat, position.lng, stop.position.lat, stop.position.lng)
    }));
  }, [position]);

  const lastEntry = historyEntries[0];

  const hour = new Date().getHours();
  const greeting =
    hour < 6 ? 'Доброї ночі' : hour < 12 ? 'Доброго ранку' : hour < 18 ? 'Доброго дня' : 'Доброго вечора';

  return (
    <div className="relative min-h-dvh bg-bg pb-28 pt-[max(1rem,env(safe-area-inset-top))] text-ink-text overflow-hidden">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-md px-4 space-y-4">
        {/* Header Greeting */}
        <header className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 text-caption font-bold uppercase tracking-wider text-primary">
            <Sparkles className="h-4 w-4" />
            <span>Харківський транспорт</span>
          </div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight mt-0.5">{greeting}! 👋</h1>
          <p className="mt-1 text-body-sm text-ink-muted">
            Твоя зручна навігація містом у реальному часі.
          </p>
        </header>

        {/* Live Metro Widget Frame */}
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-surface/80 backdrop-blur-xl shadow-xl transition-all">
            <LiveMetroWidget userPosition={position} />
          </div>
        </section>

        {/* Dashboard Grid: Favorites & Nearby */}
        <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-3 duration-400">
          {/* Favorite Routes */}
          <section className="flex flex-col justify-between rounded-2xl border border-border/60 bg-surface/70 p-3.5 backdrop-blur-xl shadow-lg transition-all hover:border-border">
            <div>
              <div className="mb-2.5 flex items-center justify-between">
                <h2 className="flex items-center gap-1.5 text-caption font-bold uppercase tracking-wider text-amber-400">
                  <Star className="h-3.5 w-3.5 fill-amber-400" />
                  <span>Улюблені</span>
                </h2>
                <span className="text-[10px] font-semibold text-ink-muted/60">{favoriteRouteDetails.length}</span>
              </div>

              {favoriteRouteDetails.length === 0 ? (
                <p className="text-body-sm text-ink-muted/70 py-2">Ще немає доданих маршрутів.</p>
              ) : (
                <ul className="space-y-1.5">
                  {favoriteRouteDetails.map((r) => (
                    <li key={r.id}>
                      <Link
                        to={`/routes/${r.id}`}
                        className="flex items-center justify-between rounded-xl border border-border/30 bg-surface/60 px-2.5 py-1.5 text-body-sm transition-all hover:bg-surface active:scale-98"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs">{KIND_ICON[r.kind]}</span>
                          <span className="font-bold text-ink-text">{r.number}</span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-ink-muted/60" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Link
              to="/favorites"
              className="mt-3 flex items-center justify-center gap-1 rounded-xl border border-border/40 bg-surface/40 py-2 text-caption font-bold text-ink-text transition-all hover:bg-surface active:scale-95"
            >
              <span>Усі улюблені</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </section>

          {/* Nearby Stops */}
          <section className="flex flex-col justify-between rounded-2xl border border-border/60 bg-surface/70 p-3.5 backdrop-blur-xl shadow-lg transition-all hover:border-border">
            <div>
              <div className="mb-2.5 flex items-center justify-between">
                <h2 className="flex items-center gap-1.5 text-caption font-bold uppercase tracking-wider text-emerald-400">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>Поруч</span>
                </h2>
                {position && (
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </div>

              {nearbyStopsWithDistance.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-3 text-center">
                  <Navigation className="h-5 w-5 text-ink-muted/40 mb-1 animate-bounce" />
                  <p className="text-caption text-ink-muted">Увімкніть GPS для пошуку зупинок поруч</p>
                </div>
              ) : (
                <ul className="space-y-1.5">
                  {nearbyStopsWithDistance.map((s) => (
                    <li key={s.id}>
                      <Link
                        to={`/map?q=${encodeURIComponent(s.name)}`}
                        className="flex items-center justify-between gap-1.5 rounded-xl border border-border/30 bg-surface/60 px-2.5 py-1.5 text-body-sm transition-all hover:bg-surface active:scale-98"
                      >
                        <span className="truncate text-ink-text font-medium">{s.name}</span>
                        <span className="shrink-0 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
                          {formatDistance(s.distance)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Link
              to="/map"
              className="mt-3 flex items-center justify-center gap-1 rounded-xl border border-border/40 bg-surface/40 py-2 text-caption font-bold text-ink-text transition-all hover:bg-surface active:scale-95"
            >
              <span>Показати на карті</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </section>
        </div>

        {/* Continue Last Action Banner */}
        {lastEntry && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Link
              to={lastEntry.type === 'route' && lastEntry.resultId ? `/routes/${lastEntry.resultId}` : '/map'}
              className="group flex items-center justify-between rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/15 via-surface/80 to-surface/90 p-3.5 backdrop-blur-xl shadow-lg transition-all hover:border-primary/60 active:scale-98"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/30 shadow-xs">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    Остання переглянута дія
                  </span>
                  <span className="truncate text-body-sm font-bold text-ink-text group-hover:text-primary transition-colors">
                    {lastEntry.query}
                  </span>
                </div>
              </div>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface/80 text-ink-muted group-hover:text-ink-text group-hover:translate-x-0.5 transition-all">
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          </section>
        )}

        {/* Quick Actions Grid */}
        <section className="pt-1 animate-in fade-in slide-in-from-bottom-5 duration-600">
          <h2 className="mb-2.5 text-caption font-bold uppercase tracking-wider text-ink-muted px-1">
            Швидкий доступ
          </h2>
          <div className="grid grid-cols-4 gap-2.5">
            <QuickAction
              to="/metro/live"
              icon={<Train className="h-5 w-5 text-red-400" />}
              label="Метро"
              color="group-hover:border-red-500/40"
            />
            <QuickAction
              to="/routes"
              icon={<Search className="h-5 w-5 text-blue-400" />}
              label="Пошук"
              color="group-hover:border-blue-500/40"
            />
            <QuickAction
              to="/favorites"
              icon={<Star className="h-5 w-5 text-amber-400 fill-amber-400/20" />}
              label="Улюблене"
              color="group-hover:border-amber-500/40"
            />
            <QuickAction
              to="/map"
              icon={<MapIcon className="h-5 w-5 text-emerald-400" />}
              label="Карта"
              color="group-hover:border-emerald-500/40"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function QuickAction({
  to,
  icon,
  label,
  color
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  color?: string;
}) {
  return (
    <Link
      to={to}
      className={`group flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-border/50 bg-surface/70 py-3.5 px-1 text-center backdrop-blur-xl shadow-md transition-all hover:bg-surface hover:shadow-xl active:scale-92 ${
        color || ''
      }`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface/80 border border-border/40 shadow-2xs group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <span className="text-caption font-bold text-ink-text/90 group-hover:text-ink-text">
        {label}
      </span>
    </Link>
  );
}
