import { useSearchParams } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { 
  Clock, 
  X, 
  ChevronRight, 
  Mic, 
  SlidersHorizontal, 
  Plus, 
  Minus, 
  Compass, 
  Navigation, 
  Star, 
  Bus, 
  Zap, 
  TrainTrack 
} from 'lucide-react';
import { MapView } from '@/components/MapView';
import { MetroLayer } from '@/components/MetroLayer';
import { StopCard } from '@/components/StopCard';
import { RouteSheet } from '@/components/RouteSheet';
import { MapSearchSuggestions } from '@/components/MapSearchSuggestions';
import { GpsButton } from '@/components/GpsButton';
import { MapModeButton } from '@/components/MapModeButton';
import { useGeolocation } from '@/hooks/useGeolocation';
import { localRoutes, localStops } from '@/data/localData';
import { getRouteBounds } from '@/lib/mapLayers';
import { useSettingsStore } from '@/store/useSettingsStore';
import { KIND_LABELS_UK } from '@/components/TransportKindIcon';
import type { TransportKind } from '@/types/transport';

const SUGGESTIONS_LIMIT = 6;

const CHIP_FILTERS: { id: TransportKind | 'favorites' | 'stops'; label: string; icon: typeof Bus }[] = [
  { id: 'bus', label: 'Автобуси', icon: Bus },
  { id: 'trolleybus', label: 'Тролейбуси', icon: Zap },
  { id: 'tram', label: 'Трамваї', icon: TrainTrack },
  { id: 'metro', label: 'Метро', icon: TrainTrack },
  { id: 'favorites', label: 'Обране', icon: Star },
  { id: 'stops', label: 'Зупинки', icon: Navigation },
];

export function MapPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';
  const { position, heading, isMoving, isLocating, error, locate } = useGeolocation();
  const storeVisibleKinds = useSettingsStore((s) => s.visibleTransportKinds);
  const showStops = useSettingsStore((s) => s.showStopsOnMap);
  const toggleStopsOnMap = useSettingsStore((s) => s.toggleStopsOnMap);

  const [map, setMap] = useState<MapLibreMap | null>(null);

  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  const [query, setQuery] = useState(initialQuery);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [activeFilterChips, setActiveFilterChips] = useState<Record<string, boolean>>({
    bus: true,
    trolleybus: true,
    tram: true,
    metro: true,
    favorites: false,
    stops: true,
  });

  const visibleKinds = useMemo(() => {
    return storeVisibleKinds.filter((kind) => activeFilterChips[kind] ?? true);
  }, [storeVisibleKinds, activeFilterChips]);

  const selectedStop = useMemo(() => (selectedStopId ? localStops.getById(selectedStopId) : undefined), [selectedStopId]);
  const arrivals = useMemo(() => (selectedStopId ? localStops.getArrivals(selectedStopId) : []), [selectedStopId]);
  const selectedRoute = useMemo(() => (selectedRouteId ? localRoutes.getById(selectedRouteId) : undefined), [selectedRouteId]);

  const suggestedStops = useMemo(() => (query.trim() ? localStops.search(query).slice(0, SUGGESTIONS_LIMIT) : []), [query]);
  const suggestedRoutes = useMemo(() => (query.trim() ? localRoutes.search(query).slice(0, SUGGESTIONS_LIMIT) : []), [query]);

  function handleSearchSubmit(q: string) {
    setSearchParams({ q });
    setSuggestionsOpen(false);
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
          { padding: { top: 140, bottom: 280, left: 40, right: 40 }, duration: 700, maxZoom: 16 }
        );
      }
    }
  }

  function handleTrainSelect(trainId: string) {
    setSelectedStopId(null);
    setSelectedRouteId(null);
    setSelectedVehicleId((current) => (current === trainId ? null : trainId));
  }

  function toggleChip(id: string) {
    setActiveFilterChips((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      if (id === 'stops') {
        toggleStopsOnMap();
      }
      return next;
    });
  }

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-slate-900 text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-white">
      
      {/* 1. КАРТА (MapBase Canvas) */}
      <div className="absolute inset-0 z-0">
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
      </div>

      {/* 2. ВЕРХНЯ ПАНЕЛЬ (Пошук, Голос, Фільтри) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex flex-col gap-2.5 p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        
        {/* Пошуковий рядок з Glassmorphism */}
        <div className="pointer-events-auto flex items-center gap-2.5">
          <div className="relative flex-1 rounded-[24px] bg-white/90 backdrop-blur-xl border border-white/40 shadow-xl shadow-black/10 transition-all focus-within:ring-2 focus-within:ring-emerald-500/30">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              🔍
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                clearTimeout(blurTimeoutRef.current);
                setSuggestionsOpen(true);
              }}
              onBlur={() => {
                blurTimeoutRef.current = setTimeout(() => setSuggestionsOpen(false), 200);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearchSubmit(query);
              }}
              placeholder="Зупинка, станція метро або маршрут..."
              className="w-full bg-transparent py-3.5 pl-11 pr-24 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1.5 rounded-full hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-colors"
                  aria-label="Очистити"
                >
                  <X size={14} />
                </button>
              )}
              <button
                onClick={() => alert('Голосовий пошук активовано (заглушка)')}
                className="p-2 rounded-full hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 transition-colors"
                aria-label="Голосовий пошук"
                title="Голосовий пошук"
              >
                <Mic size={16} />
              </button>
            </div>
          </div>

          <button
            onClick={() => alert('Меню фільтрів')}
            className="pointer-events-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-[24px] bg-white/90 backdrop-blur-xl border border-white/40 text-slate-700 shadow-xl shadow-black/10 transition-all hover:bg-white active:scale-95"
            aria-label="Фільтри"
          >
            <SlidersHorizontal size={19} />
          </button>
        </div>

        {/* Швидкі фільтри (Filter Chips) */}
        <div className="pointer-events-auto flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {CHIP_FILTERS.map((chip) => {
            const isActive = activeFilterChips[chip.id];
            const Icon = chip.icon;
            return (
              <button
                key={chip.id}
                onClick={() => toggleChip(chip.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all shrink-0 backdrop-blur-xl shadow-md ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-emerald-600/30 border border-emerald-500'
                    : 'bg-white/80 text-slate-700 border border-white/40 hover:bg-white'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-white' : 'text-slate-500'} />
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>

        {/* Динамічні підказки пошуку */}
        {suggestionsOpen && query.trim() && (
          <div className="pointer-events-auto shadow-2xl rounded-[24px] overflow-hidden bg-white/95 backdrop-blur-2xl border border-white/50 animate-in fade-in zoom-in-95 duration-150">
            <MapSearchSuggestions
              stops={suggestedStops}
              routes={suggestedRoutes}
              onStopSelect={handleStopSelect}
              onRouteSelect={handleRouteSelect}
            />
          </div>
        )}
      </div>

      {/* 3. КНОПКИ КАРТИ */}
      <div className="absolute right-4 bottom-32 z-20 flex flex-col gap-2.5">
        <div className="flex flex-col rounded-[24px] bg-white/90 backdrop-blur-xl border border-white/40 shadow-xl shadow-black/10 overflow-hidden">
          <button
            onClick={() => map?.zoomIn({ duration: 300 })}
            className="flex h-[52px] w-[52px] items-center justify-center text-slate-700 hover:bg-slate-100/60 active:bg-slate-200 transition-colors border-b border-slate-100/80"
            aria-label="Збільшити"
          >
            <Plus size={21} />
          </button>
          <button
            onClick={() => map?.zoomOut({ duration: 300 })}
            className="flex h-[52px] w-[52px] items-center justify-center text-slate-700 hover:bg-slate-100/60 active:bg-slate-200 transition-colors"
            aria-label="Зменшити"
          >
            <Minus size={21} />
          </button>
        </div>

        <button
          onClick={() => map?.resetNorthPitch({ duration: 400 })}
          className="flex h-[52px] w-[52px] items-center justify-center rounded-[24px] bg-white/90 backdrop-blur-xl border border-white/40 text-slate-700 shadow-xl shadow-black/10 hover:bg-white active:scale-95 transition-all"
          aria-label="Компас / Північ"
          title="Скинути нахил"
        >
          <Compass size={21} />
        </button>

        <div className="rounded-[24px] overflow-hidden shadow-xl shadow-black/10">
          <MapModeButton />
        </div>

        <div className="rounded-[24px] overflow-hidden shadow-xl shadow-black/10">
          <GpsButton onClick={locate} isLocating={isLocating} hasError={!!error} />
        </div>
      </div>

      {/* 4. НИЖНЯ КАРТОЧКА: Маршрут */}
      {selectedRoute && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="pointer-events-auto mx-auto max-w-md animate-in slide-in-from-bottom-6 duration-300">
            <RouteSheet route={selectedRoute} onClose={clearSelection} onStopSelect={handleStopSelect} />
          </div>
        </div>
      )}

      {/* 5. НИЖНЯ КАРТОЧКА: Зупинка */}
      {selectedStop && !selectedRoute && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="pointer-events-auto mx-auto max-w-md space-y-3 animate-in slide-in-from-bottom-6 duration-300">
            <div className="relative rounded-[24px] overflow-hidden shadow-2xl bg-white/95 backdrop-blur-2xl border border-white/50">
              <StopCard stop={selectedStop} onClick={() => setSelectedStopId(null)} />
              <button
                onClick={() => setSelectedStopId(null)}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors active:scale-90 shadow-xs"
                aria-label="Закрити"
              >
                <X size={16} />
              </button>
            </div>

            {arrivals.length > 0 && (
              <div className="overflow-hidden rounded-[24px] border border-white/50 bg-white/95 backdrop-blur-2xl p-4 shadow-2xl">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 px-1">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <Clock className="h-4 w-4 text-emerald-600" />
                    <span>Прибуття транспорту</span>
                  </div>
                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-600 border border-emerald-200">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
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
                            className="flex w-full items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 px-3.5 py-2.5 text-xs transition-all hover:bg-emerald-50/60 hover:border-emerald-200 active:scale-[0.98]"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span
                                className="flex h-7 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-white shadow-xs"
                                style={{ backgroundColor: route.color || '#10b981' }}
                              >
                                {route.number}
                              </span>
                              <div className="flex flex-col text-left min-w-0">
                                <span className="font-bold text-slate-800 truncate">
                                  {KIND_LABELS_UK[route.kind]}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`font-extrabold ${
                                isArrivingNow ? 'text-emerald-600 animate-pulse' : 'text-emerald-700'
                              }`}>
                                {isArrivingNow ? 'Прибуває' : `≈ ${a.etaMinutes} хв`}
                              </span>
                              <ChevronRight className="h-4 w-4 text-slate-400" />
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
