import { useEffect } from 'react';
import { useGeolocationStore } from '@/store/useGeolocationStore';

export function useGeolocation() {
  const store = useGeolocationStore();

  useEffect(() => {
    store.ensureWatching();
  }, [store]);

  return {
    loading: store.isLocating && !store.hasFix,
    accuracy: store.accuracy,
    altitude: null,
    altitudeAccuracy: null,
    heading: store.heading,
    latitude: store.position?.lat ?? null,
    longitude: store.position?.lng ?? null,
    speed: store.speedMps,
    timestamp: null,
    error: store.error,
  };
}
