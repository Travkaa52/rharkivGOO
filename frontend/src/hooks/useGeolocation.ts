import { useCallback, useEffect, useRef, useState } from 'react';
import type { GeoPoint } from '@/types/transport';

interface GeolocationState {
  position: GeoPoint | null;
  accuracy: number | null;
  /** Курс руху в градусах (0 = північ), null якщо пристрій не рухається/не дає heading. */
  heading: number | null;
  /** Швидкість в м/с за даними GPS (null, якщо пристрій стоїть на місці або дані недоступні). */
  speedMps: number | null;
  /** true, якщо користувач зараз реально рухається (іде/їде) — за швидкістю з GPS
   *  або, якщо браузер її не віддає, за відстанню між останніми фіксаціями. */
  isMoving: boolean;
  error: string | null;
  isLocating: boolean;
  /** Геолокація підтримується і дозволена — за весь час роботи хука хоч раз отримали фікс. */
  hasFix: boolean;
}

// Нижче цієї швидкості вважаємо, що людина стоїть (GPS-шум на місці зазвичай < 0.5 м/с).
const MOVING_SPEED_THRESHOLD_MPS = 0.55;
// Якщо speed від пристрою недоступний — оцінюємо рух за зсувом координат між фіксаціями.
const MOVING_DISTANCE_FALLBACK_M = 3;

function haversineMeters(a: GeoPoint, b: GeoPoint): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Постійне відстеження геолокації користувача (watchPosition), а не разовий запит.
 * Стартує сам при монтуванні (якщо дозвіл вже надано раніше — браузер віддасть позицію
 * без додаткового промпта; інакше `locate()` явно запитує дозвіл, наприклад по кліку на
 * кнопку GPS). Стеження триває, поки хук змонтований — позиція на карті лишається
 * "живою" весь час, а не застигає після першого визначення.
 */
export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    accuracy: null,
    heading: null,
    speedMps: null,
    isMoving: false,
    error: null,
    isLocating: false,
    hasFix: false
  });

  const watchIdRef = useRef<number | null>(null);
  const lastFixRef = useRef<{ point: GeoPoint; atMs: number } | null>(null);
  const movingClearTimerRef = useRef<number | null>(null);

  const handlePosition = useCallback((pos: GeolocationPosition) => {
    const point: GeoPoint = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    const nowMs = pos.timestamp || Date.now();

    let moving = false;
    if (typeof pos.coords.speed === 'number' && !Number.isNaN(pos.coords.speed)) {
      moving = pos.coords.speed > MOVING_SPEED_THRESHOLD_MPS;
    } else if (lastFixRef.current) {
      const dtSec = (nowMs - lastFixRef.current.atMs) / 1000;
      const distM = haversineMeters(lastFixRef.current.point, point);
      if (dtSec > 0.2) moving = distM > MOVING_DISTANCE_FALLBACK_M && distM / dtSec > MOVING_SPEED_THRESHOLD_MPS;
    }

    lastFixRef.current = { point, atMs: nowMs };

    // Невеликий "hold" перед тим, як погасити відео ходьби — інакше воно блимає
    // на кожному GPS-семплі, де швидкість на мить впала до нуля (нормальний шум GPS).
    if (movingClearTimerRef.current !== null) {
      window.clearTimeout(movingClearTimerRef.current);
      movingClearTimerRef.current = null;
    }
    if (!moving) {
      movingClearTimerRef.current = window.setTimeout(() => {
        setState((s) => ({ ...s, isMoving: false }));
      }, 1500);
    }

    setState((s) => ({
      position: point,
      accuracy: pos.coords.accuracy,
      heading: typeof pos.coords.heading === 'number' && !Number.isNaN(pos.coords.heading) ? pos.coords.heading : s.heading,
      speedMps: typeof pos.coords.speed === 'number' ? pos.coords.speed : null,
      isMoving: moving || s.isMoving,
      error: null,
      isLocating: false,
      hasFix: true
    }));
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    setState((s) => ({ ...s, isLocating: false, error: err.message }));
  }, []);

  const startWatch = useCallback(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: 'Геолокація не підтримується цим браузером' }));
      return;
    }
    if (watchIdRef.current !== null) return; // вже стежимо

    setState((s) => ({ ...s, isLocating: true, error: null }));
    watchIdRef.current = navigator.geolocation.watchPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 15000
    });
  }, [handlePosition, handleError]);

  // Стартуємо стеження одразу при монтуванні застосунку — "постійна" геолокація,
  // а не тільки за кліком на кнопку. Якщо дозвіл ще не надавався, браузер сам
  // покаже системний промпт один раз.
  useEffect(() => {
    startWatch();
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (movingClearTimerRef.current !== null) {
        window.clearTimeout(movingClearTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Явний запит (напр. по кліку на кнопку GPS) — корисно як тригер системного
   *  дозволу, якщо автостарт мовчки впав у стан "denied"/ще не питали. */
  const locate = useCallback(() => {
    if (watchIdRef.current === null) {
      startWatch();
      return;
    }
    setState((s) => ({ ...s, isLocating: true }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handlePosition(pos);
      },
      handleError,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 }
    );
  }, [handleError, handlePosition, startWatch]);

  return { ...state, locate };
}
