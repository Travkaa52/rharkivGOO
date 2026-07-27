import { useSearchParams } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
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

  // Інстанс MapLibre-карти передається сюди з <MapView /> одразу після
  // завантаження стилю — <MetroLayer /> використовує його лише для
  // проєкції геокоординат потягів у пікселі (map.project), нічого не
  // домальовуючи в саму карту; тут же ним користуємось для flyTo/fitBounds
  // при виборі зупинки/маршруту з пошуку.
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

  // Синхронізуємо поле пошуку з ?q= у URL, якщо воно змінилось ззовні (напр. з іншого екрана).
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  return (
    <div className="relative h-dvh w-full">
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

      {/* Метро — рухається за офіційним розкладом (без GPS, без випадковості), завжди активне;
          пропс visible лише ховає/показує шар, симуляція рахується незалежно від нього. */}
      <MetroLayer
        map={map}
        visible={visibleKinds.includes('metro')}
        selectedTrainId={selectedVehicleId}
        onTrainSelect={handleTrainSelect}
      />

      <TransportLayersPanel />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex flex-col gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-2">
          <div className="pointer-events-auto flex-1">
            <SearchBar
              value={query}
              onSubmit={handleSearchSubmit}
              onQueryChange={setQuery}
              onFocus={() => {
                clearTimeout(blurTimeoutRef.current);
                setSuggestionsOpen(true);
              }}
              onBlur={() => {
                // невелика затримка — щоб клік по підказці (onMouseDown) встиг спрацювати
                blurTimeoutRef.current = setTimeout(() => setSuggestionsOpen(false), 120);
              }}
              placeholder="Куди їдемо? Зупинка або номер маршруту…"
            />
          </div>
          <div className="pointer-events-auto flex flex-col gap-2">
            <GpsButton onClick={locate} isLocating={isLocating} hasError={!!error} />
            <MapModeButton />
          </div>
        </div>

        {suggestionsOpen && query.trim() && (
          <div className="pointer-events-auto">
            <MapSearchSuggestions
              stops={suggestedStops}
              routes={suggestedRoutes}
              onStopSelect={handleStopSelect}
              onRouteSelect={handleRouteSelect}
            />
          </div>
        )}
      </div>

      {selectedRoute && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="pointer-events-auto mx-auto max-w-md">
            <RouteSheet route={selectedRoute} onClose={clearSelection} onStopSelect={handleStopSelect} />
          </div>
        </div>
      )}

      {selectedStop && !selectedRoute && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="pointer-events-auto mx-auto max-w-md animate-slide-up">
            <StopCard stop={selectedStop} onClick={() => setSelectedStopId(null)} />
            {arrivals.length > 0 && (
              <ul className="mt-2 flex max-h-40 flex-col gap-1 overflow-y-auto rounded-xl2 border border-ink-border bg-ink-surface/90 p-2 shadow-glass">
                {arrivals
                  .sort((a, b) => a.etaMinutes - b.etaMinutes)
                  .map((a) => {
                    const route = localRoutes.getById(a.routeId);
                    if (!route) return null;
                    return (
                      <li key={a.routeId}>
                        <button
                          type="button"
                          onClick={() => handleRouteSelect(a.routeId)}
                          className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs transition hover:bg-mint/20"
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className="flex h-5 w-8 items-center justify-center rounded-full font-display text-[10px] font-bold text-white"
                              style={{ backgroundColor: route.color }}
                            >
                              {route.number}
                            </span>
                            <span className="text-white/60">{KIND_LABELS_UK[route.kind]}</span>
                          </span>
                          <span className="font-semibold text-mint">
                            {a.etaMinutes === 0 ? 'прибуває' : `≈ ${a.etaMinutes} хв`}
                          </span>
                        </button>
                      </li>
                    );
                  })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
