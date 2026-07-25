import { TransportKindIcon } from '@/components/TransportKindIcon';
import type { Stop, TransportRoute } from '@/types/transport';

interface MapSearchSuggestionsProps {
  stops: Stop[];
  routes: TransportRoute[];
  onStopSelect: (stopId: string) => void;
  onRouteSelect: (routeId: string) => void;
}

/**
 * Живі підказки пошуку на карті: зупинки й маршрути, що містять введений
 * текст. Пункти використовують onMouseDown (а не onClick) з preventDefault,
 * щоб клік не "губився" через blur інпуту пошуку, який спрацьовує раніше.
 */
export function MapSearchSuggestions({ stops, routes, onStopSelect, onRouteSelect }: MapSearchSuggestionsProps) {
  if (stops.length === 0 && routes.length === 0) {
    return (
      <div className="animate-slide-up rounded-xl2 border border-white/60 bg-white/95 p-4 text-center shadow-glass-lg backdrop-blur-xs">
        <p className="font-body text-sm text-graphite/50">Нічого не знайдено</p>
      </div>
    );
  }

  return (
    <div className="max-h-[60vh] animate-slide-up overflow-y-auto rounded-xl2 border border-white/60 bg-white/95 p-1.5 shadow-glass-lg backdrop-blur-xs">
      {routes.length > 0 && (
        <div className="mb-1">
          <p className="px-2.5 pb-1 pt-1.5 font-display text-[10px] font-bold uppercase tracking-wide text-graphite/40">
            Маршрути
          </p>
          {routes.map((route) => (
            <button
              key={route.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onRouteSelect(route.id);
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition hover:bg-mint/20 active:scale-[0.99]"
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-xs font-bold text-white"
                style={{ backgroundColor: route.color }}
              >
                {route.number}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-body text-sm font-medium text-graphite">
                  {route.headsignForward} ↔ {route.headsignBackward}
                </span>
              </span>
              <TransportKindIcon kind={route.kind} size={16} />
            </button>
          ))}
        </div>
      )}

      {stops.length > 0 && (
        <div>
          <p className="px-2.5 pb-1 pt-1.5 font-display text-[10px] font-bold uppercase tracking-wide text-graphite/40">
            Зупинки
          </p>
          {stops.map((stop) => (
            <button
              key={stop.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onStopSelect(stop.id);
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition hover:bg-mint/20 active:scale-[0.99]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center gap-0.5 rounded-full bg-mint/40 p-1">
                {stop.kinds.slice(0, 2).map((k) => (
                  <TransportKindIcon key={k} kind={k} size={stop.kinds.length > 1 ? 12 : 18} />
                ))}
              </span>
              <span className="min-w-0 flex-1 truncate font-body text-sm font-medium text-graphite">{stop.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
