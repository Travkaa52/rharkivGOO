import { localRoutes, localStops } from '@/data/localData';
import { TRANSPORT_COLORS } from '@/config/map';
import type { FeatureCollection, LineString, Point } from 'geojson';
import type { TransportKind } from '@/types/transport';

/**
 * Статичні шари маршрутів і зупинок для наземного транспорту (трамвай,
 * тролейбус, автобус) та метро. На відміну від рухомих маркерів
 * <TransportSprite />, ці лінії/точки НЕ анімуються — саме так, як
 * вимагає специфікація: без достовірних GPS-даних наземний транспорт
 * не симулюється, показуються лише маршрут, зупинки та розклад.
 */
export function buildRouteLinesGeoJson(visibleKinds?: TransportKind[]): FeatureCollection<LineString> {
  const routes = localRoutes.all().filter((r) => !visibleKinds || visibleKinds.includes(r.kind));
  return {
    type: 'FeatureCollection',
    features: routes
      .map((route) => {
        const coordinates = route.stopIds
          .map((stopId) => localStops.getById(stopId))
          .filter((s): s is NonNullable<typeof s> => !!s)
          .map((s) => [s.position.lng, s.position.lat] as [number, number]);
        if (coordinates.length < 2) return null;
        return {
          type: 'Feature' as const,
          properties: { routeId: route.id, kind: route.kind, number: route.number, color: route.color ?? TRANSPORT_COLORS[route.kind] },
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
      properties: { stopId: stop.id, name: stop.name, kinds: stop.kinds.join(',') },
      geometry: { type: 'Point' as const, coordinates: [stop.position.lng, stop.position.lat] }
    }))
  };
}
