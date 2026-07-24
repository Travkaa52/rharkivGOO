import { PageHeader } from '@/components/PageHeader';
import { localRoutes, localStops } from '@/data/localData';
import { useFavoritesStore } from '@/store/useFavoritesStore';

export function FavoritesPage() {
  const stops = useFavoritesStore((s) => s.stops);
  const routes = useFavoritesStore((s) => s.routes);
  const removeStop = useFavoritesStore((s) => s.removeStop);
  const removeRoute = useFavoritesStore((s) => s.removeRoute);

  const isEmpty = stops.length === 0 && routes.length === 0;

  return (
    <div className="min-h-dvh bg-surface-soft pb-20">
      <PageHeader title="Обране" subtitle="Ваші улюблені зупинки та маршрути" />
      <div className="px-4">
        {isEmpty && (
          <div className="flex flex-col items-center gap-2 rounded-xl2 bg-white/70 py-12 text-center shadow-glass">
            <span className="text-3xl">☆</span>
            <p className="text-sm text-graphite/60">Ще немає обраного.<br />Додайте зупинки чи маршрути, натиснувши ★.</p>
          </div>
        )}

        {routes.length > 0 && (
          <section className="mb-4">
            <h2 className="mb-2 font-display text-sm font-bold text-graphite/70">Маршрути</h2>
            <ul className="flex flex-col gap-2">
              {routes.map((r) => (
                <li key={r.routeId} className="flex items-center justify-between rounded-xl2 bg-white/90 p-3 shadow-glass">
                  <span className="text-sm text-graphite">
                    Маршрут {localRoutes.getById(r.routeId)?.number ?? r.routeId}
                  </span>
                  <button onClick={() => removeRoute(r.routeId)} className="text-xs text-graphite/40 hover:text-red-500">
                    Прибрати
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {stops.length > 0 && (
          <section>
            <h2 className="mb-2 font-display text-sm font-bold text-graphite/70">Зупинки</h2>
            <ul className="flex flex-col gap-2">
              {stops.map((s) => (
                <li key={s.stopId} className="flex items-center justify-between rounded-xl2 bg-white/90 p-3 shadow-glass">
                  <span className="text-sm text-graphite">
                    {localStops.getById(s.stopId)?.name ?? `Зупинка ${s.stopId}`}
                  </span>
                  <button onClick={() => removeStop(s.stopId)} className="text-xs text-graphite/40 hover:text-red-500">
                    Прибрати
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
