import { localRoutes, localStops } from '@/data/localData';
import { KIND_PRIORITY, TRANSPORT_COLORS } from '@/config/map';
import routeGeometriesJson from '@/data/routeGeometries.json';
import type { FeatureCollection, LineString, MultiLineString, Point } from 'geojson';
import type { TransportKind } from '@/types/transport';

/**
 * Реальні геометрії маршрутів (координати вздовж вулиць), розшифровані з
 * офіційних KML-схем трамваїв/тролейбусів/метро Харкова. Ключ — `${kind}-${number}`,
 * значення — масив ліній (кожна лінія = один прохід/напрямок маршруту з KML).
 * Якщо для маршруту немає реальної геометрії (наприклад автобуси), карта
 * повертається до прямих ліній між зупинками (fallback нижче).
 */
const ROUTE_GEOMETRIES = routeGeometriesJson as Record<string, [number, number][][]>;

function geometryKey(kind: TransportKind, number: string): string {
  return `${kind}-${number}`;
}

function dominantKind(kinds: TransportKind[]): TransportKind {
  for (const k of KIND_PRIORITY) {
    if (kinds.includes(k as TransportKind)) return k as TransportKind;
  }
  return kinds[0] ?? 'bus';
}

/**
 * Статичні шари маршрутів і зупинок для наземного транспорту (трамвай,
 * тролейбус, автобус) та метро. На відміну від рухомих маркерів
 * <TransportSprite />, ці лінії/точки НЕ анімуються — саме так, як
 * вимагає специфікація: без достовірних GPS-даних наземний транспорт
 * не симулюється, показуються лише маршрут, зупинки та розклад.
 */
export function buildRouteLinesGeoJson(
  visibleKinds?: TransportKind[],
  selectedRouteId?: string | null
): FeatureCollection<LineString | MultiLineString> {
  const routes = localRoutes.all().filter((r) => !visibleKinds || visibleKinds.includes(r.kind));
  return {
    type: 'FeatureCollection',
    features: routes
      .map((route) => {
        const realGeometry = ROUTE_GEOMETRIES[geometryKey(route.kind, route.number)];

        const properties = {
          routeId: route.id,
          kind: route.kind,
          number: route.number,
          color: route.color ?? TRANSPORT_COLORS[route.kind],
          // Використовується paint-виразами шару ліній: обраний маршрут — товстіший і
          // непрозорий, решта — притлумлені, щоб виділялись на карті без перестворення шару.
          selected: selectedRouteId ? route.id === selectedRouteId : true,
          dimmed: !!selectedRouteId && route.id !== selectedRouteId
        };

        // Реальна траєкторія вздовж вулиць (з KML) — пріоритетна.
        if (realGeometry && realGeometry.length > 0) {
          return {
            type: 'Feature' as const,
            properties,
            geometry: { type: 'MultiLineString' as const, coordinates: realGeometry }
          };
        }

        // Фолбек: пряма лінія між зупинками, якщо реальної геометрії немає.
        const coordinates = route.stopIds
          .map((stopId) => localStops.getById(stopId))
          .filter((s): s is NonNullable<typeof s> => !!s)
          .map((s) => [s.position.lng, s.position.lat] as [number, number]);
        if (coordinates.length < 2) return null;
        return {
          type: 'Feature' as const,
          properties,
          geometry: { type: 'LineString' as const, coordinates }
        };
      })
      .filter((f): f is NonNullable<typeof f> => !!f)
  };
}

export function buildStopsGeoJson(visibleKinds?: TransportKind[]): FeatureCollection<Point> {
  const stops = localStops.all().filter((s) => !visibleKinds || s.kinds.some((k) => visibleKinds.includes(k)));
  return {
    type: 'FeatureCollection',
    features: stops.map((stop) => ({
      type: 'Feature' as const,
      properties: {
        stopId: stop.id,
        name: stop.name,
        kinds: stop.kinds.join(','),
        dominantKind: dominantKind(stop.kinds),
        // Пересадковий вузол (2+ видів транспорту) — малюємо більшим колом з подвійним обвідком.
        isHub: stop.kinds.length > 1
      },
      geometry: { type: 'Point' as const, coordinates: [stop.position.lng, stop.position.lat] }
    }))
  };
}

/** Координати всіх зупинок маршруту (для fitBounds при виборі маршруту на карті/пошуку). */
export function getRouteBounds(routeId: string): [number, number][] {
  const route = localRoutes.getById(routeId);
  if (!route) return [];
  return route.stopIds
    .map((stopId) => localStops.getById(stopId))
    .filter((s): s is NonNullable<typeof s> => !!s)
    .map((s) => [s.position.lng, s.position.lat] as [number, number]);
}
