import { useFavoritesStore } from '@/store/useFavoritesStore';
import type { Stop } from '@/types/transport';

const KIND_LABELS: Record<string, string> = { metro: 'М', tram: 'Тр', trolleybus: 'Тб', bus: 'А' };

export function StopCard({ stop, etaMinutes, onClick }: { stop: Stop; etaMinutes?: number; onClick?: () => void }) {
  const isFavorite = useFavoritesStore((s) => s.isStopFavorite(stop.id));
  const addStop = useFavoritesStore((s) => s.addStop);
  const removeStop = useFavoritesStore((s) => s.removeStop);

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl2 border border-white/60 bg-white/90 p-3 text-left shadow-glass transition hover:shadow-glass-lg active:scale-[0.99]"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mint/40 font-display text-xs font-bold text-forest">
        {stop.kinds.map((k) => KIND_LABELS[k]).join('')}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-body text-sm font-semibold text-graphite">{stop.name}</p>
        {typeof etaMinutes === 'number' && (
          <p className="text-xs text-forest">
            {etaMinutes === 0 ? 'прибуває' : `через ${etaMinutes} хв`}
          </p>
        )}
      </div>
      <span
        onClick={(e) => {
          e.stopPropagation();
          isFavorite ? removeStop(stop.id) : addStop(stop.id);
        }}
        className="shrink-0 p-1 text-lg"
        role="button"
        aria-label={isFavorite ? 'Прибрати з обраного' : 'Додати в обране'}
      >
        {isFavorite ? '★' : '☆'}
      </span>
    </button>
  );
}
