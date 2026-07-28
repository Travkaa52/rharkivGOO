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
      className="flex cursor-pointer items-center gap-2.5 rounded-2xl border border-border/40 bg-surface-raised px-2.5 py-2 shadow-sm transition hover:shadow-md hover:border-border/60 active:scale-[0.98]"
    >
      <div className="relative shrink-0">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full font-display text-base font-extrabold text-white shadow-sm"
          style={{ backgroundColor: route.color }}
        >
          {route.number}
        </div>
        {/* Іконка виду транспорту поверх бейджа з номером — збільшена, щоб
            залишатись головним візуальним акцентом навіть у компактній картці. */}
        <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full border-2 border-surface-raised bg-surface-raised shadow-sm">
          <TransportKindIcon kind={route.kind} size={34} />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-body text-sm font-semibold text-ink-text">{route.name}</p>
        <p className="truncate text-[11px] text-ink-muted">
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
