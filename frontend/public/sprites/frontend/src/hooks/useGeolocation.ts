import { useCallback, useState } from 'react';
import type { GeoPoint } from '@/types/transport';

interface GeolocationState {
  position: GeoPoint | null;
  accuracy: number | null;
  error: string | null;
  isLocating: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    accuracy: null,
    error: null,
    isLocating: false
  });

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: 'Геолокація не підтримується цим браузером' }));
      return;
    }

    setState((s) => ({ ...s, isLocating: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          position: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          accuracy: pos.coords.accuracy,
          error: null,
          isLocating: false
        });
      },
      (err) => {
        setState((s) => ({ ...s, isLocating: false, error: err.message }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  }, []);

  return { ...state, locate };
}
