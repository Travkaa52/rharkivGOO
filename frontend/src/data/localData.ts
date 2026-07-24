import stopsJson from '@/data/stops.json';
import routesJson from '@/data/routes.json';
import type { Stop, TransportKind, TransportRoute } from '@/types/transport';

const STOPS = stopsJson as Stop[];
const ROUTES = routesJson as TransportRoute[];

/**
 * Проєкт працює повністю без бекенду: усі зупинки/маршрути — статичний JSON
 * (frontend/src/data/*.json), який можна доповнювати чи замінювати на реальний
 * GTFS-експорт без зміни коду сторінок.
 */

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

/** Розрахунок відстані між двома точками [lat, lng] у метрах */
function haversineMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const lat1 = (aLat * Math.PI) / 180;
  const lat2 = (bLat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Стабільний псевдовипадковий "шум" 0..1 з рядка-ключа (щоб ETA не стрибав на кожен рендер). */
function seededFraction(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return (hash % 1000) / 1000;
}

export const localStops = {
  all(): Stop[] {
    return STOPS;
  },
  search(query: string): Stop[] {
    const q = normalize(query);
    if (!q) return [];
    return STOPS.filter((s) => normalize(s.name).includes(q));
  },
  getById(id: string): Stop | undefined {
    return STOPS.find((s) => s.id === id);
  },
  getNearby(lat: number, lng: number, radiusM = 700): Stop[] {
    return STOPS.map((s) => ({
      stop: s,
      dist: haversineMeters(lat, lng, s.position[0], s.position[1])
    }))
      .filter((x) => x.dist <= radiusM)
      .sort((a, b) => a.dist - b.dist)
      .map((x) => x.stop);
  },
  /**
   * Наближений час прибуття. Реальних GPS-даних немає (проєкт без бекенду),
   * тож ETA рахується детерміновано з інтервалу руху маршруту + поточної хвилини,
   * щоб виглядало правдоподібно та не "стрибало" щосекунди.
   */
  getArrivals(stopId: string): { routeId: string; etaMinutes: number; vehicleId: string }[] {
    const routes = ROUTES.filter((r) => r.stopIds.includes(stopId));
    const minuteBucket = Math.floor(Date.now() / 60000);
    return routes.map((r) => {
      const noise = seededFraction(`${stopId}:${r.id}:${minuteBucket}`);
      const etaMinutes = Math.max(1, Math.round(noise * r.intervalMinutes));
      return { routeId: r.id, etaMinutes, vehicleId: `${r.id}-demo` };
    });
  }
};

export const localRoutes = {
  all(): TransportRoute[] {
    return ROUTES;
  },
  search(query: string): TransportRoute[] {
    const q = normalize(query);
    if (!q) return [];
    return ROUTES.filter((r) => normalize(r.number).includes(q) || normalize(r.name).includes(q));
  },
  getById(id: string): TransportRoute | undefined {
    return ROUTES.find((r) => r.id === id);
  },
  getByKind(kind: TransportKind): TransportRoute[] {
    return ROUTES.filter((r) => r.kind === kind);
  },
  /**
   * Спрощена побудова маршруту без сервера: пряма пішохідна відстань між
   * точками. Повноцінний мультимодальний роутинг (пересадки, граф зупинок)
   * потребує або офлайн-графа побудованого з GTFS, або зовнішнього routing API —
   * не входить у поточну статичну збірку.
   */
  buildTrip(fromLat: number, fromLng: number, toLat: number, toLng: number) {
    const distanceM = haversineMeters(fromLat, fromLng, toLat, toLng);
    const walkSpeedMS = 1.35; // ~4.8 км/год
    const durationSec = Math.round(distanceM / walkSpeedMS);
    return Promise.resolve({
      legs: [{ mode: 'walk' as const, durationSec, distanceM: Math.round(distanceM) }],
      totalDurationSec: durationSec
    });
  }
};
