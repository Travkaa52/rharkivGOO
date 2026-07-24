import { Link } from 'react-router-dom';
import { useFavoritesStore } from '@/store/useFavoritesStore';
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
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold text-white"
        style={{ backgroundColor: route.color }}
      >
        {route.number}
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
