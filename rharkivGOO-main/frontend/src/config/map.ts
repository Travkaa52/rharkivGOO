import type { GeoPoint } from '@/types/transport';

// Центр Харкова (площа Свободи)
export const KHARKIV_CENTER: GeoPoint = { lat: 50.0028, lng: 36.2312 };

export const DEFAULT_ZOOM = 13;
export const MAX_ZOOM = 19;
export const MIN_ZOOM = 10;

// Стилі карти. У проді — власний tile-сервер або MapTiler/Stadia ключ через env.
export const MAP_STYLES = {
  day: import.meta.env.VITE_MAP_STYLE_DAY_URL ?? 'https://tiles.openfreemap.org/styles/liberty',
  night: import.meta.env.VITE_MAP_STYLE_NIGHT_URL ?? 'https://tiles.openfreemap.org/styles/dark'
} as const;

export const TRANSPORT_COLORS: Record<string, string> = {
  metro: '#C9A24B', // gold
  tram: '#0B3D2E', // forest
  trolleybus: '#12513D', // forest-light
  bus: '#A8D5BA' // mint
};
