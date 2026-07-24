import { useSearchParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { MapView } from '@/components/MapView';
import { SearchBar } from '@/components/SearchBar';
import { GpsButton } from '@/components/GpsButton';
import { MapModeButton } from '@/components/MapModeButton';
import { StopCard } from '@/components/StopCard';
import { TransportLayersPanel } from '@/components/TransportLayersPanel';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useMetroPositions } from '@/hooks/useMetroPositions';
import { localStops } from '@/data/localData';
import { useSettingsStore } from '@/store/useSettingsStore';

export function MapPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';
  const { position, isLocating, error, locate } = useGeolocation();
  const visibleKinds = useSettingsStore((s) => s.visibleTransportKinds);
  const showStops = useSettingsStore((s) => s.showStopsOnMap);

  // Рухаються на карті ТІЛЬКИ поїзди метро — їхня позиція розрахована
  // математично за офіційним розкладом (без GPS). Трамваї, тролейбуси
  // й автобуси не мають достовірного джерела координат, тому на карті
  // показані лише як статичні лінії маршрутів і зупинки (MapView сам
  // додає ці шари) — без симуляції руху.
  const allMetroVehicles = useMetroPositions();
  // Панель керування шарами може вимкнути метро окремо — тоді потяги
  // не рендеряться, хоча математична симуляція розкладу все одно рахується.
  const metroVehicles = useMemo(
    () => (visibleKinds.includes('metro') ? allMetroVehicles : []),
    [allMetroVehicles, visibleKinds]
  );

  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);

  const selectedStop = useMemo(() => (selectedStopId ? localStops.getById(selectedStopId) : undefined), [selectedStopId]);
  const arrivals = useMemo(() => (selectedStopId ? localStops.getArrivals(selectedStopId) : []), [selectedStopId]);

  function handleSearch(query: string) {
    setSearchParams({ q: query });
  }

  function handleStopSelect(stopId: string) {
    setSelectedVehicleId(null);
    setSelectedStopId(stopId);
  }

  return (
    <div className="relative h-dvh w-full">
      <MapView
        vehicles={metroVehicles}
        userPosition={position}
        selectedVehicleId={selectedVehicleId}
        onVehicleSelect={(id) => {
          setSelectedStopId(null);
          setSelectedVehicleId(id);
        }}
        onStopSelect={handleStopSelect}
        visibleKinds={visibleKinds}
        showStops={showStops}
      />

      <TransportLayersPanel />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="pointer-events-auto flex-1">
          <SearchBar onSubmit={handleSearch} placeholder={initialQuery || 'Куди їдемо?'} autoFocus={!initialQuery} />
        </div>
        <div className="pointer-events-auto flex flex-col gap-2">
          <GpsButton onClick={locate} isLocating={isLocating} hasError={!!error} />
          <MapModeButton />
        </div>
      </div>

      {selectedStop && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="pointer-events-auto mx-auto max-w-md animate-slide-up">
            <StopCard stop={selectedStop} onClick={() => setSelectedStopId(null)} />
            {arrivals.length > 0 && (
              <ul className="mt-2 flex flex-col gap-1 rounded-xl2 border border-white/60 bg-white/90 p-2 shadow-glass">
                {arrivals.map((a) => (
                  <li key={a.routeId} className="flex items-center justify-between px-2 py-1 text-xs text-graphite/70">
                    <span>{a.routeId.replace('route-', '')}</span>
                    <span className="font-semibold text-forest">≈ {a.etaMinutes} хв</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
