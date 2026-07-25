import { useNavigate } from 'react-router-dom';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { TransportKindIcon } from '@/components/TransportKindIcon';
import { FavoriteButton } from '@/components/FavoriteButton';
import type { TransportRoute } from '@/types/transport';

export function RouteCard({ route }: { route: TransportRoute }) {
  const navigate = useNavigate();
  const isFavorite = useFavoritesStore((s) => s.isRouteFavorite(route.id));
  const addRoute = useFavoritesStore((s) => s.addRoute);
  const removeRoute = useFavoritesStore((s) => s.removeRoute);

  // Раніше картка була <Link> (тег <a>), а зірочка обраного — <button> всередині
  // неї: HTML забороняє вкладати інтерактивні елементи в посилання, і це ламало
  // клавіатурну навігацію та читалки екрана. Тепер картка — це div з роллю
  // "link" і навігацією через useNavigate, а кнопка обраного лежить поруч,
  // а не всередині клікабельної області.
  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => navigate(`/routes/${route.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(`/routes/${route.id}`);
        }
      }}
      className="flex cursor-pointer items-center gap-3 rounded-xl2 border border-white/60 bg-white/90 p-3 shadow-glass transition hover:shadow-glass-lg active:scale-[0.99]"
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
      <FavoriteButton
        active={isFavorite}
        onToggle={() => (isFavorite ? removeRoute(route.id) : addRoute(route.id))}
        label={isFavorite ? 'Прибрати з обраного' : 'Додати в обране'}
      />
    </div>
  );
}
