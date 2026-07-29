import { Star } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { RouteDetailContent } from '@/components/RouteDetailContent';
import { TransportKindIcon } from '@/components/TransportKindIcon';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import type { TransportRoute } from '@/types/transport';

interface RouteDetailModalProps {
  route: TransportRoute | null;
  open: boolean;
  onClose: () => void;
}

/**
 * Показує повну картку маршруту (інформація, послідовність зупинок,
 * розклад руху) одним тапом — у модальному вікні поверх поточного
 * екрана, а не окремою сторінкою на весь застосунок.
 */
export function RouteDetailModal({ route, open, onClose }: RouteDetailModalProps) {
  const isFavorite = useFavoritesStore((s) => (route ? s.isRouteFavorite(route.id) : false));
  const addRoute = useFavoritesStore((s) => s.addRoute);
  const removeRoute = useFavoritesStore((s) => s.removeRoute);

  if (!route) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={route.name}
      icon={<TransportKindIcon kind={route.kind} size={18} />}
    >
      <div className="-mt-1 mb-3 flex justify-end">
        <button
          type="button"
          onClick={() => (isFavorite ? removeRoute(route.id) : addRoute(route.id))}
          aria-label={isFavorite ? 'Прибрати з обраного' : 'Додати в обране'}
          className="flex h-9 items-center gap-1.5 rounded-full border border-border/60 bg-surface/80 px-3 text-xs font-bold text-ink-text backdrop-blur-md active:scale-95 transition-all"
        >
          <Star
            className={`h-4 w-4 transition-all ${
              isFavorite ? 'fill-ink-text text-ink-text scale-110' : 'text-ink-muted'
            }`}
          />
          <span>{isFavorite ? 'В обраному' : 'В обране'}</span>
        </button>
      </div>

      <RouteDetailContent route={route} />
    </Modal>
  );
}
