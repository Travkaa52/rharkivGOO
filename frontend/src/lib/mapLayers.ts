import { localRoutes, localStops } from '@/data/localData';
import { KIND_PRIORITY, TRANSPORT_COLORS } from '@/config/map';
import routeGeometriesJson from '@/data/routeGeometries.json';
import type { FeatureCollection, LineString, MultiLineString, Point } from 'geojson';
import type { TransportKind } from '@/types/transport';

/**
 * Реальнi геометрії маршрутів (координати вздовж вулиць), розшифровані з
 * офіційних KML-схем. Ключ — `${kind}-${number}`.
 */
const ROUTE_GEOMETRIES = routeGeometriesJson as unknown as Record<string, [number, number][][]>;

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
 * Статичні шари маршрутів і зупинок на основі KML-даних.
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

        // Якщо для маршруту немає геометрії в KML, пропускаємо його
        if (!realGeometry || realGeometry.length === 0) {
          return null;
        }

        const properties = {
          routeId: route.id,
          kind: route.kind,
          number: route.number,
          color: route.color ?? TRANSPORT_COLORS[route.kind],
          selected: selectedRouteId ? route.id === selectedRouteId : true,
          dimmed: !!selectedRouteId && route.id !== selectedRouteId
        };

        return {
          type: 'Feature' as const,
          properties,
          geometry: { type: 'MultiLineString' as const, coordinates: realGeometry }
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
        isHub: stop.kinds.length > 1
      },
      geometry: { type: 'Point' as const, coordinates: [stop.position.lng, stop.position.lat] }
    }))
  };
}

/** Координати всіх зупинок маршруту (для fitBounds при виборі маршруту). */
export function getRouteBounds(routeId: string): [number, number][] {
  const route = localRoutes.getById(routeId);
  if (!route) return [];
  return route.stopIds
    .map((stopId) => localStops.getById(stopId))
    .filter((s): s is NonNullable<typeof s> => !!s)
    .map((s) => [s.position.lng, s.position.lat] as [number, number]);
}
