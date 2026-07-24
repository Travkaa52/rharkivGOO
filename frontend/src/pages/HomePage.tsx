import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapView } from '@/components/MapView';
import { SearchBar } from '@/components/SearchBar';
import { GpsButton } from '@/components/GpsButton';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useHistoryStore } from '@/store/useHistoryStore';
import { useMetroPositions } from '@/hooks/useMetroPositions';

export function HomePage() {
  const navigate = useNavigate();
  const { position, isLocating, error, locate } = useGeolocation();
  const addHistoryEntry = useHistoryStore((s) => s.addEntry);
  const vehicles = useMetroPositions();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  function handleSearch(query: string) {
    addHistoryEntry({ query, type: 'address' });
    navigate(`/map?q=${encodeURIComponent(query)}`);
  }

  return (
    <div className="relative h-dvh w-full">
      <MapView
        vehicles={vehicles}
        userPosition={position}
        selectedVehicleId={selectedVehicleId}
        onVehicleSelect={setSelectedVehicleId}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="pointer-events-auto flex-1">
          <SearchBar onSubmit={handleSearch} />
        </div>
        <div className="pointer-events-auto">
          <GpsButton onClick={locate} isLocating={isLocating} hasError={!!error} />
        </div>
      </div>
    </div>
  );
}
