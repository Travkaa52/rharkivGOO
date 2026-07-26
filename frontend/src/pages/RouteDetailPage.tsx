import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { routesApi } from '@/api/routes';
import { localStops } from '@/data/localData';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { TransportKindIcon, KIND_LABELS_UK } from '@/components/TransportKindIcon';
import { getStationPhoto } from '@/data/stationPhotos';
import type { TransportRoute } from '@/types/transport';

export function RouteDetailPage() {
  const { routeId } = useParams<{ routeId: string }>();
  const [route, setRoute] = useState<TransportRoute | null>(null);
  const [loading, setLoading] = useState(true);
  const isFavorite = useFavoritesStore((s) => (route ? s.isRouteFavorite(route.id) : false));
  const addRoute = useFavoritesStore((s) => s.addRoute);
  const removeRoute = useFavoritesStore((s) => s.removeRoute);

  useEffect(() => {
    if (!routeId) return;
    let cancelled = false;
    setLoading(true);
    routesApi
      .getById(routeId)
      .then((data) => {
        if (!cancelled) setRoute(data ?? null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [routeId]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-surface-soft pb-20">
        <PageHeader title="Маршрут" />
        <p className="px-4 text-sm text-graphite/50">Завантаження…</p>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="min-h-dvh bg-surface-soft pb-20">
        <PageHeader title="Маршрут не знайдено" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-surface-soft pb-20">
      <div className="px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full font-display text-base font-bold text-white shadow-glass"
              style={{ backgroundColor: route.color }}
            >
              {route.number}
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-white shadow-glass">
              <TransportKindIcon kind={route.kind} size={15} />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-graphite/40">{KIND_LABELS_UK[route.kind]}</p>
            <h1 className="truncate font-display text-lg font-extrabold text-graphite">{route.name}</h1>
            <p className="truncate text-sm text-graphite/50">
              {route.headsignForward} ↔ {route.headsignBackward}
            </p>
          </div>
          <button
            onClick={() => (isFavorite ? removeRoute(route.id) : addRoute(route.id))}
            aria-label={isFavorite ? 'Прибрати з обраного' : 'Додати в обране'}
            className="shrink-0 text-2xl"
          >
            {isFavorite ? '★' : '☆'}
          </button>
        </div>

        <div className="mt-4 flex gap-2 text-xs text-graphite/60">
          <span className="rounded-full bg-white/80 px-3 py-1 shadow-glass">
            {route.firstDeparture}–{route.lastDeparture}
          </span>
          <span className="rounded-full bg-white/80 px-3 py-1 shadow-glass">
            інтервал ~{route.intervalMinutes} хв
          </span>
        </div>
      </div>

      <div className="mt-4 px-4">
        <h2 className="mb-2 font-display text-sm font-bold text-graphite/70">Зупинки на маршруті</h2>
        <ol className="relative flex flex-col gap-4 border-l-2 border-mint pl-4">
          {route.stopIds.map((stopId, idx) => {
            const photo = getStationPhoto(stopId);
            return (
              <li key={`${stopId}-${idx}`} className="relative flex items-center gap-3 text-sm text-graphite">
                <span
                  className="absolute -left-[1.15rem] top-1 h-3 w-3 rounded-full border-2 border-white"
                  style={{ backgroundColor: route.color }}
                />
                {photo && (
                  <img
                    src={photo}
                    alt=""
                    className="h-10 w-14 shrink-0 rounded-md object-cover shadow-glass"
                  />
                )}
                <span className="min-w-0 flex-1 truncate">{localStops.getById(stopId)?.name ?? `Зупинка ${stopId}`}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
