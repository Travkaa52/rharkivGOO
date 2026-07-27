import { useSearchParams } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { Clock, X, ChevronRight } from 'lucide-react';
import { MapView } from '@/components/MapView';
import { MetroLayer } from '@/components/MetroLayer';
import { SearchBar } from '@/components/SearchBar';
import { MapSearchSuggestions } from '@/components/MapSearchSuggestions';
import { GpsButton } from '@/components/GpsButton';
import { MapModeButton } from '@/components/MapModeButton';
import { StopCard } from '@/components/StopCard';
import { RouteSheet } from '@/components/RouteSheet';
import { TransportLayersPanel } from '@/components/TransportLayersPanel';
import { useGeolocation } from '@/hooks/useGeolocation';
import { localRoutes, localStops } from '@/data/localData';
import { getRouteBounds } from '@/lib/mapLayers';
import { useSettingsStore } from '@/store/useSettingsStore';
import { KIND_LABELS_UK } from '@/components/TransportKindIcon';

const SUGGESTIONS_LIMIT = 6;

export function MapPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';
  const { position, heading, isMoving, isLocating, error, locate } = useGeolocation();
  const visibleKinds = useSettingsStore((s) => s.visibleTransportKinds);
  const showStops = useSettingsStore((s) => s.showStopsOnMap);

  // Інстанс MapLibre-карти передається сюди з <MapView /> одразу після завантаження стилю
  const [map, setMap] = useState<MapLibreMap | null>(null);

  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  const [query, setQuery] = useState(initialQuery);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const selectedStop = useMemo(() => (selectedStopId ? localStops.getById(selectedStopId) : undefined), [selectedStopId]);
  const arrivals = useMemo(() => (selectedStopId ? localStops.getArrivals(selectedStopId) : []), [selectedStopId]);
  const selectedRoute = useMemo(() => (selectedRouteId ? localRoutes.getById(selectedRouteId) : undefined), [selectedRouteId]);

  const suggestedStops = useMemo(() => (query.trim() ? localStops.search(query).slice(0, SUGGESTIONS_LIMIT) : []), [query]);
  const suggestedRoutes = useMemo(() => (query.trim() ? localRoutes.search(query).slice(0, SUGGESTIONS_LIMIT) : []), [query]);

  function handleSearchSubmit(q: string) {
    setSearchParams({ q });
  }

  function clearSelection() {
    setSelectedStopId(null);
    setSelectedRouteId(null);
    setSelectedVehicleId(null);
  }

  function handleStopSelect(stopId: string) {
    setSelectedVehicleId(null);
    setSelectedRouteId(null);
    setSelectedStopId(stopId);
    setSuggestionsOpen(false);
    const stop = localStops.getById(stopId);
    if (map && stop) {
      map.flyTo({ center: [stop.position.lng, stop.position.lat], zoom: Math.max(map.getZoom(), 15.5), essential: true });
    }
  }

  function handleRouteSelect(routeId: string) {
    setSelectedStopId(null);
    setSelectedVehicleId(null);
    setSelectedRouteId((current) => (current === routeId ? null : routeId));
    setSuggestionsOpen(false);
    if (map) {
      const coords = getRouteBounds(routeId);
      if (coords.length >= 2) {
        const lngs = coords.map((c) => c[0]);
        const lats = coords.map((c) => c[1]);
        map.fitBounds(
          [
            [Math.min(...lngs), Math.min(...lats)],
            [Math.max(...lngs), Math.max(...lats)]
          ],
          { padding: { top: 120, bottom: 260, left: 60, right: 60 }, duration: 700, maxZoom: 16 }
        );
      }
    }
  }

  function handleTrainSelect(trainId: string) {
    setSelectedStopId(null);
    setSelectedRouteId(null);
    setSelectedVehicleId((current) => (current === trainId ? null : trainId));
  }

  // Синхронізуємо поле пошуку з ?q= у URL, якщо воно змінилось ззовні
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-bg text-ink-text">
      {/* Map Base Canvas */}
      <MapView
        vehicles={[]}
        userPosition={position}
        userHeading={heading}
        userIsMoving={isMoving}
        selectedVehicleId={selectedVehicleId}
        onVehicleSelect={(id) => {
          setSelectedStopId(null);
          setSelectedRouteId(null);
          setSelectedVehicleId(id);
        }}
        onStopSelect={handleStopSelect}
        selectedRouteId={selectedRouteId}
        onRouteSelect={handleRouteSelect}
        visibleKinds={visibleKinds}
        showStops={showStops}
        onMapReady={setMap}
      />

      {/* Live Metro Layer Simulation */}
      <MetroLayer
        map={map}
        visible={visibleKinds.includes('metro')}
        selectedTrainId={selectedVehicleId}
        onTrainSelect={handleTrainSelect}
      />

      {/* Floating Layer Selection Bar */}
      <TransportLayersPanel />

      {/* Top Controls Header */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex flex-col gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-2">
          <div className="pointer-events-auto flex-1 shadow-lg rounded-2xl">
            <SearchBar
              value={query}
              onSubmit={handleSearchSubmit}
              onQueryChange={setQuery}
              onFocus={() => {
                clearTimeout(blurTimeoutRef.current);
                setSuggestionsOpen(true);
              }}
              onBlur={() => {
                blurTimeoutRef.current = setTimeout(() => setSuggestionsOpen(false), 150);
              }}
              placeholder="Зупинка або номер маршруту…"
            />
          </div>
          <div className="pointer-events-auto flex flex-col gap-2 shrink-0">
            <GpsButton onClick={locate} isLocating={isLocating} hasError={!!error} />
            <MapModeButton />
          </div>
        </div>

        {/* Dynamic Search Suggestions Popup */}
        {suggestionsOpen && query.trim() && (
          <div className="pointer-events-auto shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <MapSearchSuggestions
              stops={suggestedStops}
              routes={suggestedRoutes}
              onStopSelect={handleStopSelect}
              onRouteSelect={handleRouteSelect}
            />
          </div>
        )}
      </div>

      {/* Bottom Sheet: Active Selected Route */}
      {selectedRoute && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="pointer-events-auto mx-auto max-w-md animate-in slide-in-from-bottom-6 duration-300">
            <RouteSheet route={selectedRoute} onClose={clearSelection} onStopSelect={handleStopSelect} />
          </div>
        </div>
      )}

      {/* Bottom Sheet: Active Selected Stop & Realtime Arrivals */}
      {selectedStop && !selectedRoute && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="pointer-events-auto mx-auto max-w-md space-y-2.5 animate-in slide-in-from-bottom-6 duration-300">
            {/* Stop Main Card with Quick Dismiss Button */}
            <div className="relative">
              <StopCard stop={selectedStop} onClick={() => setSelectedStopId(null)} />
              <button
                onClick={() => setSelectedStopId(null)}
                className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border border-border/40 bg-surface/80 text-ink-muted backdrop-blur-md transition-all hover:text-ink-text active:scale-90 shadow-2xs"
                aria-label="Закрити"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Arrivals Live List */}
            {arrivals.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-border/60 bg-surface/90 p-3 backdrop-blur-xl shadow-xl">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/40 px-1">
                  <div className="flex items-center gap-1.5 text-caption font-bold uppercase tracking-wider text-ink-muted">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    <span>Прибуття транспорту</span>
                  </div>
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE
                  </span>
                </div>

                <ul className="flex max-h-48 flex-col gap-1.5 overflow-y-auto no-scrollbar">
                  {arrivals
                    .sort((a, b) => a.etaMinutes - b.etaMinutes)
                    .map((a) => {
                      const route = localRoutes.getById(a.routeId);
                      if (!route) return null;
                      const isArrivingNow = a.etaMinutes === 0;

                      return (
                        <li key={a.routeId}>
                          <button
                            type="button"
                            onClick={() => handleRouteSelect(a.routeId)}
                            className="flex w-full items-center justify-between rounded-xl border border-border/30 bg-surface/60 px-3 py-2 text-body-sm transition-all hover:border-border/80 hover:bg-surface/90 active:scale-98"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className="flex h-6 w-9 shrink-0 items-center justify-center rounded-lg font-display text-xs font-bold text-white shadow-xs"
                                style={{ backgroundColor: route.color || '#10b981' }}
                              >
                                {route.number}
                              </span>
                              <div className="flex flex-col text-left min-w-0">
                                <span className="text-caption font-semibold text-ink-muted truncate">
                                  {KIND_LABELS_UK[route.kind]}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-body-sm font-bold ${
                                isArrivingNow ? 'text-emerald-400 animate-pulse' : 'text-primary'
                              }`}>
                                {isArrivingNow ? 'Прибуває' : `≈ ${a.etaMinutes} хв`}
                              </span>
                              <ChevronRight className="h-4 w-4 text-ink-muted/60" />
                            </div>
                          </button>
                        </li>
                      );
                    })}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
