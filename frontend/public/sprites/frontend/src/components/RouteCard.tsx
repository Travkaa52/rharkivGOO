import { Link } from 'react-router-dom';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { TransportKindIcon } from '@/components/TransportKindIcon';
import type { TransportRoute } from '@/types/transport';

export function RouteCard({ route }: { route: TransportRoute }) {
  const isFavorite = useFavoritesStore((s) => s.isRouteFavorite(route.id));
  const addRoute = useFavoritesStore((s) => s.addRoute);
  const removeRoute = useFavoritesStore((s) => s.removeRoute);

  return (
    <Link
      to={`/routes/${route.id}`}
      className="flex items-center gap-3 rounded-xl2 border border-white/60 bg-white/90 p-3 shadow-glass transition hover:shadow-glass-lg active:scale-[0.99]"
    >
      <div className="relative shrink-0">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full font-display text-sm font-bold text-white"
          style={{ backgroundColor: route.color }}
        >
          {route.number}
        </div>
        {/* Іконка виду транспорту поверх бейджа з номером — без спрайту/анімації,
            лише щоб користувач одразу бачив: автобус, тролейбус, трамвай чи метро. */}
        <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-white shadow-glass">
          <TransportKindIcon kind={route.kind} size={13} />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-body text-sm font-semibold text-graphite">{route.name}</p>
        <p className="truncate text-xs text-graphite/50">
          {route.headsignForward} ↔ {route.headsignBackward}
        </p>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          isFavorite ? removeRoute(route.id) : addRoute(route.id);
        }}
        aria-label={isFavorite ? 'Прибрати з обраного' : 'Додати в обране'}
        className="shrink-0 p-1 text-lg"
      >
        {isFavorite ? '★' : '☆'}
      </button>
    </Link>
  );
}
