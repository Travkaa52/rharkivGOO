import { useSearchParams } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { 
  X, 
  Mic, 
  Plus, 
  Minus, 
  Compass, 
  Navigation, 
  Bus, 
  Zap, 
  TrainTrack,
  MapPin,
  ArrowUpDown,
  Route as RouteIcon,
  LocateFixed,
  Loader2
} from 'lucide-react';
import { MapView } from '@/components/MapView';
import { LiveMetroWidget } from '@/components/LiveMetroWidget';
import { StopDetailModal } from '@/components/StopDetailModal';
import { TripPlanSheet } from '@/components/TripPlanSheet';
import { RouteSheet } from '@/components/RouteSheet';
import { Sheet } from '@/components/ui/Sheet';
import { MapSearchSuggestions } from '@/components/MapSearchSuggestions';
import { GpsButton } from '@/components/GpsButton';
import { MapModeButton } from '@/components/MapModeButton';
import { TransportLayersPanel } from '@/components/TransportLayersPanel';
import { useGeolocation } from '@/hooks/useGeolocation';
import { localRoutes, localStops, type TripPlan, type StopItem } from '@/data/localData';
import { getRouteBounds } from '@/lib/mapLayers';
import { refineTripPlansWithOSM } from '@/lib/tripPlanRefine';
import { useSettingsStore } from '@/store/useSettingsStore';
import type { TransportKind } from '@/types/transport';

const SUGGESTIONS_LIMIT = 6;
const STORAGE_PREFIX = 'kharkiv_go_map_state_';

// ─── Design Tokens ─────────────────────────────────────────────────
// Единая система визуальных констант. 15 лет опыта = никаких magic numbers.
const CHIP_FILTERS: { 
  id: TransportKind | 'stops'; 
  label: string; 
  icon: typeof Bus;
  accentColor: string;
}[] = [
  { id: 'bus', label: 'Автобуси', icon: Bus, accentColor: 'bg-sky-500' },
  { id: 'trolleybus', label: 'Тролейбуси', icon: Zap, accentColor: 'bg-amber-500' },
  { id: 'tram', label: 'Трамваї', icon: TrainTrack, accentColor: 'bg-emerald-500' },
  { id: 'metro', label: 'Метро', icon: TrainTrack, accentColor: 'bg-indigo-500' },
  { id: 'stops', label: 'Зупинки', icon: Navigation, accentColor: 'bg-slate-500' },
];

// Spring-анимация для нативного ощущения (cubic-bezier(0.34, 1.56, 0.64, 1))
const SPRING_TRANSITION = 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)';
const SMOOTH_TRANSITION = 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)';

export function MapPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';
  const { position, heading, isMoving, isLocating, error, locate } = useGeolocation();

  const storeVisibleKinds = useSettingsStore((s) => s.visibleTransportKinds);
  const showStops = useSettingsStore((s) => s.showStopsOnMap);
  const toggleStopsOnMap = useSettingsStore((s) => s.toggleStopsOnMap);

  const [map, setMap] = useState<MapLibreMap | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapKey, setMapKey] = useState(0);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  // ─── Route Builder State ────────────────────────────────────────────
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState(initialQuery);
  const [fromPoint, setFromPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [toPoint, setToPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [activeField, setActiveField] = useState<'from' | 'to' | null>(null);
  const [tripPlans, setTripPlans] = useState<TripPlan[] | null>(null);
  const [isRefiningTrip, setIsRefiningTrip] = useState(false);
  const refineRequestIdRef = useRef(0);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState<number | null>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ─── Filter Chips State ─────────────────────────────────────────────
  const [activeFilterChips, setActiveFilterChips] = useState<Record<string, boolean>>(() => {
    try {
      const cached = localStorage.getItem(`${STORAGE_PREFIX}filters`);
      if (cached) return JSON.parse(cached);
    } catch { /* silent fail */ }
    return { bus: true, trolleybus: true, tram: true, metro: true, stops: true };
  });

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}filters`, JSON.stringify(activeFilterChips));
    } catch { /* quota exceeded or private mode */ }
  }, [activeFilterChips]);

  const visibleKinds = useMemo(() => {
    return storeVisibleKinds.filter((kind) => activeFilterChips[kind] ?? true);
  }, [storeVisibleKinds, activeFilterChips]);

  // ─── Voice Search ───────────────────────────────────────────────────
  const [voiceSupported] = useState(() => 
    typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
  );
  const [isListening, setIsListening] = useState(false);

  const handleVoiceSearch = useCallback((field: 'from' | 'to') => {
    const SpeechRecognitionCtor: any = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'uk-UA';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript as string | undefined;
      if (transcript) {
        if (field === 'from') setFromQuery(transcript);
        else setToQuery(transcript);
        setActiveField(field);
      }
    };
    recognition.start();
  }, []);

  // ─── Derived Data ───────────────────────────────────────────────────
  const selectedStop = useMemo(() => 
    selectedStopId ? localStops.getById(selectedStopId) : undefined, 
    [selectedStopId]
  );
  const arrivals = useMemo(() => 
    selectedStopId ? localStops.getArrivals(selectedStopId) : [], 
    [selectedStopId]
  );
  const selectedRoute = useMemo(() => 
    selectedRouteId ? localRoutes.getById(selectedRouteId) : undefined, 
    [selectedRouteId]
  );

  const activeFieldQuery = activeField === 'from' ? fromQuery : activeField === 'to' ? toQuery : '';
  const fieldSuggestions = useMemo(
    () => activeField && activeFieldQuery.trim() 
      ? localStops.search(activeFieldQuery).slice(0, SUGGESTIONS_LIMIT) 
      : [],
    [activeField, activeFieldQuery]
  );

  // ─── Handlers ───────────────────────────────────────────────────────
  const clearSelection = useCallback(() => {
    setSelectedStopId(null);
    setSelectedRouteId(null);
  }, []);

  const handleStopSelect = useCallback((stopId: string) => {
    setSelectedRouteId(null);
    setSelectedStopId(stopId);
    setActiveField(null);
    const stop = localStops.getById(stopId);
    if (map && stop) {
      map.flyTo({ 
        center: [stop.position.lng, stop.position.lat], 
        zoom: Math.max(map.getZoom(), 15.5), 
        essential: true,
        duration: 800
      });
    }
  }, [map]);

  const handleRouteSelect = useCallback((routeId: string) => {
    setSelectedStopId(null);
    setSelectedRouteId((current) => (current === routeId ? null : routeId));
    setActiveField(null);
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
  }, [map]);

  const handlePickPoint = useCallback((field: 'from' | 'to', stop: StopItem) => {
    const point = { lat: stop.position.lat, lng: stop.position.lng };
    if (field === 'from') {
      setFromPoint(point);
      setFromQuery(stop.name);
    } else {
      setToPoint(point);
      setToQuery(stop.name);
      setSearchParams({ q: stop.name });
    }
    setActiveField(null);
    setTripPlans(null);
    setSelectedPlanIndex(null);
    clearSelection();
  }, [clearSelection, setSearchParams]);

  const [pendingUseLocation, setPendingUseLocation] = useState(false);

  const handleUseMyLocationAsFrom = useCallback(() => {
    if (position) {
      setFromPoint({ lat: position.lat, lng: position.lng });
      setFromQuery('Моє місцезнаходження');
      setTripPlans(null);
      setSelectedPlanIndex(null);
    } else {
      setPendingUseLocation(true);
      locate();
    }
  }, [position, locate]);

  useEffect(() => {
    if (pendingUseLocation && position) {
      setFromPoint({ lat: position.lat, lng: position.lng });
      setFromQuery('Моє місцезнаходження');
      setPendingUseLocation(false);
    }
  }, [pendingUseLocation, position]);

  const handleSwapPoints = useCallback(() => {
    setFromPoint(toPoint);
    setToPoint(fromPoint);
    setFromQuery(toQuery);
    setToQuery(fromQuery);
    setTripPlans(null);
    setSelectedPlanIndex(null);
  }, [fromPoint, toPoint, fromQuery, toQuery]);

  const handleBuildTrip = useCallback(() => {
    if (!fromPoint || !toPoint) return;
    clearSelection();
    const plans = localRoutes.buildTripPlans(fromPoint.lat, fromPoint.lng, toPoint.lat, toPoint.lng);
    setTripPlans(plans);
    setSelectedPlanIndex(plans.length > 0 ? 0 : null);

    if (map) {
      map.fitBounds(
        [
          [Math.min(fromPoint.lng, toPoint.lng), Math.min(fromPoint.lat, toPoint.lat)],
          [Math.max(fromPoint.lng, toPoint.lng), Math.max(fromPoint.lat, toPoint.lat)]
        ],
        { padding: { top: 160, bottom: 320, left: 60, right: 60 }, duration: 700, maxZoom: 15 }
      );
    }

    if (plans.length > 0) {
      const requestId = ++refineRequestIdRef.current;
      setIsRefiningTrip(true);
      refineTripPlansWithOSM(plans, fromPoint, toPoint)
        .then((refined) => {
          if (refineRequestIdRef.current !== requestId) return;
          setTripPlans(refined);
          setSelectedPlanIndex(refined.length > 0 ? 0 : null);
        })
        .finally(() => {
          if (refineRequestIdRef.current === requestId) setIsRefiningTrip(false);
        });
    }
  }, [fromPoint, toPoint, map, clearSelection]);

  const selectedTripPlan = useMemo(
    () => (tripPlans && selectedPlanIndex !== null ? tripPlans[selectedPlanIndex] : null),
    [tripPlans, selectedPlanIndex]
  );

  useEffect(() => {
    if (tripPlans === null) {
      refineRequestIdRef.current += 1;
      setIsRefiningTrip(false);
    }
  }, [tripPlans]);

  const handleSelectTripOption = useCallback((index: number) => {
    setSelectedPlanIndex(index);
    setSelectedStopId(null);
    setSelectedRouteId(null);

    const plan = tripPlans?.[index];
    if (!plan || !map) return;

    const coords: [number, number][] = [];
    if (fromPoint) coords.push([fromPoint.lng, fromPoint.lat]);
    plan.legs.forEach((leg) => {
      coords.push([leg.boardStop.position.lng, leg.boardStop.position.lat]);
      coords.push([leg.alightStop.position.lng, leg.alightStop.position.lat]);
    });
    if (toPoint) coords.push([toPoint.lng, toPoint.lat]);

    if (coords.length >= 2) {
      const lngs = coords.map((c) => c[0]);
      const lats = coords.map((c) => c[1]);
      map.fitBounds(
        [
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)]
        ],
        { padding: { top: 160, bottom: 340, left: 60, right: 60 }, duration: 700, maxZoom: 16 }
      );
    }
  }, [tripPlans, fromPoint, toPoint, map]);

  const handleUseStopAsFrom = useCallback((stop: StopItem) => {
    setFromPoint({ lat: stop.position.lat, lng: stop.position.lng });
    setFromQuery(stop.name);
    setTripPlans(null);
    setSelectedPlanIndex(null);
    clearSelection();
  }, [clearSelection]);

  const handleUseStopAsTo = useCallback((stop: StopItem) => {
    setToPoint({ lat: stop.position.lat, lng: stop.position.lng });
    setToQuery(stop.name);
    setTripPlans(null);
    setSelectedPlanIndex(null);
    clearSelection();
  }, [clearSelection]);

  const toggleChip = useCallback((id: string) => {
    setActiveFilterChips((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      if (id === 'stops') toggleStopsOnMap();
      return next;
    });
  }, [toggleStopsOnMap]);

  // ─── Map Camera Persistence ─────────────────────────────────────────
  useEffect(() => {
    if (!map) return;
    try {
      const cachedState = localStorage.getItem(`${STORAGE_PREFIX}camera`);
      if (cachedState) {
        const { center, zoom } = JSON.parse(cachedState);
        if (center && typeof zoom === 'number') {
          map.jumpTo({ center, zoom });
        }
      }
    } catch { /* ignore */ }

    const handleMoveEnd = () => {
      try {
        const center = map.getCenter().toArray();
        const zoom = map.getZoom();
        localStorage.setItem(`${STORAGE_PREFIX}camera`, JSON.stringify({ center, zoom }));
      } catch { /* ignore */ }
    };

    map.on('moveend', handleMoveEnd);
    return () => { map.off('moveend', handleMoveEnd); };
  }, [map]);

  useEffect(() => {
    if (initialQuery) setToQuery(initialQuery);
  }, [initialQuery]);

  const handleMapReady = useCallback((mapInstance: MapLibreMap | null) => {
    if (!mapInstance) return;
    setMap(mapInstance);
    setMapError(null);
    if (mapInstance.isStyleLoaded()) {
      setIsMapLoaded(true);
    } else {
      mapInstance.on('load', () => setIsMapLoaded(true));
    }
  }, []);

  const handleMapError = useCallback((message: string) => {
    setMapError(message);
  }, []);

  const handleRetryMap = useCallback(() => {
    setMapError(null);
    setIsMapLoaded(false);
    setMap(null);
    setMapKey((k) => k + 1);
  }, []);

  // Safety timeout: не держим пользователя вечно на загрузке
  useEffect(() => {
    if (isMapLoaded || mapError) {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      return;
    }
    loadTimeoutRef.current = setTimeout(() => {
      setIsMapLoaded(true);
    }, 3000);
    return () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    };
  }, [isMapLoaded, mapError, mapKey]);

  // ─── Render ─────────────────────────────────────────────────────────
  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#f5f5f7] text-slate-900 font-sans antialiased selection:bg-indigo-500 selection:text-white">

      {/* ═══════════════════════════════════════════════════════════════
          1. MAP CANVAS + LOADING / ERROR OVERLAYS
          ═══════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 z-0">
        {/* Skeleton / Loading State */}
        {!isMapLoaded && !mapError && (
          <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#f5f5f7]/95 backdrop-blur-xl">
            <div className="flex flex-col items-center gap-5">
              <div className="relative">
                <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30 flex items-center justify-center">
                  <MapPin className="h-7 w-7 text-white" strokeWidth={2.5} />
                </div>
                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-400 border-2 border-white shadow-sm" />
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-sm font-semibold tracking-tight text-slate-800">Завантаження карти Харкова</span>
                <span className="text-xs text-slate-400 font-medium">Підготовка маршрутів та зупинок...</span>
              </div>
              {/* Прогресс-индикатор в виде тонкой полоски */}
              <div className="w-32 h-1 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full animate-[shimmer_1.5s_ease-in-out_infinite]" 
                     style={{ width: '60%' }} />
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {mapError && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 bg-[#f5f5f7]/98 px-8 text-center backdrop-blur-xl">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-50 border border-rose-200 shadow-sm">
                <span className="text-2xl">📡</span>
              </div>
              <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-500 border-2 border-white" />
            </div>
            <div className="flex flex-col items-center gap-2 max-w-[280px]">
              <h3 className="text-base font-bold text-slate-800 tracking-tight">Не вдалося завантажити карту</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Перевірте з'єднання з інтернетом або спробуйте ще раз через кілька секунд.
              </p>
            </div>
            <button
              onClick={handleRetryMap}
              className="mt-2 group relative overflow-hidden rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition-all hover:shadow-xl hover:shadow-slate-900/30 active:scale-[0.97]"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Loader2 className="h-4 w-4 transition-transform group-hover:rotate-180" />
                Спробувати знову
              </span>
            </button>
          </div>
        )}

        <MapView
          key={mapKey}
          userPosition={position}
          userHeading={heading}
          userIsMoving={isMoving}
          onStopSelect={handleStopSelect}
          selectedRouteId={selectedRouteId}
          onRouteSelect={handleRouteSelect}
          visibleKinds={visibleKinds}
          showStops={showStops}
          onMapReady={handleMapReady}
          onMapError={handleMapError}
          fromPoint={fromPoint}
          toPoint={toPoint}
          tripPlan={selectedTripPlan}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          2. TOP PANEL: Route Builder
          ═══════════════════════════════════════════════════════════════ */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex flex-col gap-3 p-4 pt-[max(1rem,env(safe-area-inset-top))]">

        {/* Main Search Card */}
        <div 
          className="pointer-events-auto relative overflow-hidden rounded-[28px] border border-white/60 bg-white/90 shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-2xl transition-shadow hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)]"
          style={{ transition: SMOOTH_TRANSITION }}
        >
          {/* Gradient top accent line */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 opacity-80" />

          <div className="flex items-stretch">
            {/* Route indicators (dots + line) */}
            <div className="flex flex-col items-center pl-5 pt-5 pb-5">
              <div className="relative">
                <div className="h-3 w-3 rounded-full bg-indigo-500 ring-[3px] ring-indigo-100" />
                <div className="absolute inset-0 rounded-full bg-indigo-500 animate-ping opacity-20" />
              </div>
              <div className="my-2 flex-1 w-px bg-gradient-to-b from-indigo-200 via-slate-200 to-rose-200" />
              <div className="h-3 w-3 rounded-full bg-rose-500 ring-[3px] ring-rose-100" />
            </div>

            {/* Inputs */}
            <div className="flex-1 py-2">
              {/* FROM field */}
              <div className="group flex items-center gap-2 px-3 py-3 border-b border-slate-100 transition-colors hover:bg-slate-50/50">
                <input
                  type="text"
                  value={fromQuery}
                  onChange={(e) => {
                    setFromQuery(e.target.value);
                    setFromPoint(null);
                    setTripPlans(null);
                    setSelectedPlanIndex(null);
                  }}
                  onFocus={() => {
                    clearTimeout(blurTimeoutRef.current);
                    setActiveField('from');
                  }}
                  onBlur={() => {
                    blurTimeoutRef.current = setTimeout(() => setActiveField((f) => (f === 'from' ? null : f)), 200);
                  }}
                  placeholder="Звідки їдемо?"
                  className="flex-1 bg-transparent text-[15px] font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  onClick={handleUseMyLocationAsFrom}
                  aria-label="Моє місцезнаходження"
                  className="shrink-0 rounded-xl p-2 text-slate-400 transition-all hover:bg-indigo-50 hover:text-indigo-600 active:scale-90"
                  style={{ transition: SPRING_TRANSITION }}
                >
                  <LocateFixed size={18} />
                </button>
                {voiceSupported && (
                  <button
                    onClick={() => handleVoiceSearch('from')}
                    aria-label="Голосовий пошук"
                    className={`shrink-0 rounded-xl p-2 transition-all active:scale-90 ${
                      isListening && activeField === 'from' 
                        ? 'bg-rose-50 text-rose-500 animate-pulse' 
                        : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                    }`}
                    style={{ transition: SPRING_TRANSITION }}
                  >
                    <Mic size={18} />
                  </button>
                )}
              </div>

              {/* TO field */}
              <div className="group flex items-center gap-2 px-3 py-3 transition-colors hover:bg-slate-50/50">
                <input
                  type="text"
                  value={toQuery}
                  onChange={(e) => {
                    setToQuery(e.target.value);
                    setToPoint(null);
                    setTripPlans(null);
                    setSelectedPlanIndex(null);
                  }}
                  onFocus={() => {
                    clearTimeout(blurTimeoutRef.current);
                    setActiveField('to');
                  }}
                  onBlur={() => {
                    blurTimeoutRef.current = setTimeout(() => setActiveField((f) => (f === 'to' ? null : f)), 200);
                  }}
                  placeholder="Куди прямуємо?"
                  className="flex-1 bg-transparent text-[15px] font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none"
                />
                {toQuery && (
                  <button
                    onClick={() => {
                      setToQuery('');
                      setToPoint(null);
                      setTripPlans(null);
                      setSelectedPlanIndex(null);
                    }}
                    aria-label="Очистити"
                    className="shrink-0 rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 active:scale-90"
                    style={{ transition: SPRING_TRANSITION }}
                  >
                    <X size={18} />
                  </button>
                )}
                {voiceSupported && (
                  <button
                    onClick={() => handleVoiceSearch('to')}
                    aria-label="Голосовий пошук"
                    className={`shrink-0 rounded-xl p-2 transition-all active:scale-90 ${
                      isListening && activeField === 'to' 
                        ? 'bg-rose-50 text-rose-500 animate-pulse' 
                        : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                    }`}
                    style={{ transition: SPRING_TRANSITION }}
                  >
                    <Mic size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Swap button */}
            <div className="flex items-center pr-3">
              <button
                onClick={handleSwapPoints}
                aria-label="Поміняти місцями"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 shadow-sm transition-all hover:bg-indigo-50 hover:text-indigo-600 hover:shadow-md active:scale-90 hover:-rotate-180"
                style={{ transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              >
                <ArrowUpDown size={18} />
              </button>
            </div>
          </div>

          {/* Build Route CTA */}
          {fromPoint && toPoint && (
            <div className="border-t border-slate-100 p-3 animate-in slide-in-from-top-2 fade-in duration-300">
              <button
                onClick={handleBuildTrip}
                className="group flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:shadow-emerald-500/30 active:scale-[0.98] hover:brightness-105"
              >
                <RouteIcon size={18} className="transition-transform group-hover:scale-110" />
                <span>Побудувати маршрут</span>
                <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
                  {Math.round(
                    Math.sqrt(
                      Math.pow(toPoint.lat - fromPoint.lat, 2) + 
                      Math.pow(toPoint.lng - fromPoint.lng, 2)
                    ) * 111
                  )} км
                </span>
              </button>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            3. FILTER CHIPS
            ═══════════════════════════════════════════════════════════════ */}
        <div className="pointer-events-auto flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1 px-0.5">
          {CHIP_FILTERS.map((chip, index) => {
            const isActive = activeFilterChips[chip.id];
            const Icon = chip.icon;
            return (
              <button
                key={chip.id}
                onClick={() => toggleChip(chip.id)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[13px] font-semibold transition-all shrink-0 active:scale-95 ${
                  isActive
                    ? `${chip.accentColor} text-white shadow-lg shadow-black/10`
                    : 'bg-white/80 text-slate-600 shadow-sm shadow-black/5 border border-slate-200/60 hover:bg-white hover:shadow-md hover:text-slate-800'
                }`}
                style={{ 
                  transition: SPRING_TRANSITION,
                  animationDelay: `${index * 50}ms`
                }}
              >
                <Icon size={15} className={isActive ? 'text-white/90' : 'text-slate-400'} strokeWidth={2.5} />
                <span>{chip.label}</span>
                {isActive && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/40 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            4. LIVE METRO WIDGET
            ═══════════════════════════════════════════════════════════════ */}
        {activeFilterChips.metro && !activeField && !tripPlans && (
          <div className="pointer-events-auto animate-in fade-in slide-in-from-top-3 duration-500">
            <LiveMetroWidget userPosition={position} />
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            5. SEARCH SUGGESTIONS DROPDOWN
            ═══════════════════════════════════════════════════════════════ */}
        {activeField && fieldSuggestions.length > 0 && (
          <div 
            className="pointer-events-auto overflow-hidden rounded-[24px] border border-white/60 bg-white/95 shadow-2xl shadow-black/10 backdrop-blur-2xl animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200"
          >
            <div className="px-1 py-1">
              <div className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Зупинки
              </div>
              <MapSearchSuggestions
                stops={fieldSuggestions}
                routes={[]}
                onStopSelect={(stopId) => {
                  const stop = localStops.getById(stopId);
                  if (stop) handlePickPoint(activeField, stop);
                }}
                onRouteSelect={() => {}}
              />
            </div>
          </div>
        )}

        {activeField && fieldSuggestions.length === 0 && (activeField === 'from' ? fromQuery : toQuery).trim() && (
          <div className="pointer-events-auto flex flex-col items-center justify-center gap-3 rounded-[24px] border border-slate-200/60 bg-white/95 p-8 text-center shadow-2xl shadow-black/10 backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <MapPin className="h-6 w-6 text-slate-400" strokeWidth={2} />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-slate-700">Зупинок не знайдено</p>
              <p className="text-xs text-slate-400">Спробуйте іншу назву або адресу</p>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          6. MAP CONTROLS (Floating Action Buttons)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="absolute right-4 bottom-36 z-20 flex flex-col gap-3">
        {/* Zoom Controls */}
        <div className="flex flex-col rounded-[20px] bg-white/90 shadow-lg shadow-black/8 backdrop-blur-xl border border-white/60 overflow-hidden">
          <button
            onClick={() => map?.zoomIn({ duration: 300 })}
            className="flex h-12 w-12 items-center justify-center text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100 border-b border-slate-100"
            aria-label="Збільшити"
          >
            <Plus size={20} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => map?.zoomOut({ duration: 300 })}
            className="flex h-12 w-12 items-center justify-center text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100"
            aria-label="Зменшити"
          >
            <Minus size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Compass */}
        <button
          onClick={() => map?.resetNorthPitch({ duration: 400 })}
          className="flex h-12 w-12 items-center justify-center rounded-[20px] bg-white/90 text-slate-600 shadow-lg shadow-black/8 backdrop-blur-xl border border-white/60 transition-all hover:bg-slate-50 hover:text-slate-900 hover:shadow-xl active:scale-95"
          aria-label="Компас"
          title="Скинути нахил"
        >
          <Compass size={20} strokeWidth={2} />
        </button>

        {/* Map Mode */}
        <div className="rounded-[20px] overflow-hidden shadow-lg shadow-black/8">
          <MapModeButton />
        </div>

        {/* GPS */}
        <div className="rounded-[20px] overflow-hidden shadow-lg shadow-black/8">
          <GpsButton onClick={locate} isLocating={isLocating} hasError={!!error} />
        </div>
      </div>

      <TransportLayersPanel />

      {/* ═══════════════════════════════════════════════════════════════
          7. BOTTOM SHEETS
          ═══════════════════════════════════════════════════════════════ */}

      {/* Route Details Sheet */}
      <Sheet open={!!selectedRoute} onClose={clearSelection}>
        {selectedRoute && (
          <RouteSheet 
            route={selectedRoute} 
            onClose={clearSelection} 
            onStopSelect={handleStopSelect} 
          />
        )}
      </Sheet>

      {/* Trip Plans Sheet */}
      <Sheet
        open={tripPlans !== null}
        onClose={() => {
          setTripPlans(null);
          setSelectedPlanIndex(null);
        }}
        title="Варіанти поїздки"
      >
        {tripPlans !== null && (
          <div className="-mx-5 -mt-2">
            {isRefiningTrip && (
              <div className="mx-5 mb-3 flex items-center gap-3 rounded-2xl bg-indigo-50 border border-indigo-100 px-4 py-3">
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-indigo-500" />
                <div className="flex flex-col">
                  <span className="text-[13px] font-semibold text-indigo-700">Уточнюємо маршрут</span>
                  <span className="text-[11px] text-indigo-500">Аналізуємо пішохідні відстані через OpenStreetMap...</span>
                </div>
              </div>
            )}
            <div className="max-h-[55vh] overflow-y-auto">
              <TripPlanSheet 
                plans={tripPlans} 
                selectedIndex={selectedPlanIndex} 
                onSelect={handleSelectTripOption} 
              />
            </div>
          </div>
        )}
      </Sheet>

      {/* ═══════════════════════════════════════════════════════════════
          8. STOP DETAIL MODAL
          ═══════════════════════════════════════════════════════════════ */}
      <StopDetailModal
        stop={selectedStop ?? null}
        arrivals={arrivals}
        onClose={() => setSelectedStopId(null)}
        onRouteSelect={handleRouteSelect}
        onUseAsFrom={handleUseStopAsFrom}
        onUseAsTo={handleUseStopAsTo}
      />
    </div>
  );
}
