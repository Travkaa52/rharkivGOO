import { useEffect, useRef, useState } from 'react';
import maplibregl, { Map as MapLibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { DEFAULT_ZOOM, KHARKIV_CENTER, MAP_STYLES, MAX_ZOOM, MIN_ZOOM } from '@/config/map';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useVehicleAnimation } from '@/hooks/useVehicleAnimation';
import { TransportSprite } from '@/components/TransportSprite';
import { buildRouteLinesGeoJson, buildStopsGeoJson } from '@/lib/mapLayers';
import type { TransportKind, Vehicle } from '@/types/transport';

const ROUTES_SOURCE_ID = 'khgo-routes';
const ROUTES_LAYER_ID = 'khgo-routes-lines';
const STOPS_SOURCE_ID = 'khgo-stops';
const STOPS_LAYER_ID = 'khgo-stops-circles';

/**
 * Додає статичні шари маршрутів (лінії) і зупинок (точки) — без анімації руху.
 * `visibleKinds`/`showStops` керуються панеллю <TransportLayersPanel /> —
 * дані з локальної бази (routes.json / stops.json) відфільтровуються ще
 * ДО потрапляння в GeoJSON-джерело, тож карта не малює зайвого.
 */
function addStaticTransitLayers(map: MapLibreMap, visibleKinds: TransportKind[], showStops: boolean) {
  if (!map.getSource(ROUTES_SOURCE_ID)) {
    map.addSource(ROUTES_SOURCE_ID, { type: 'geojson', data: buildRouteLinesGeoJson(visibleKinds) });
    map.addLayer({
      id: ROUTES_LAYER_ID,
      type: 'line',
      source: ROUTES_SOURCE_ID,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': ['coalesce', ['get', 'color'], '#0B3D2E'],
        'line-width': ['interpolate', ['linear'], ['zoom'], 11, 1.5, 16, 4],
        'line-opacity': 0.75
      }
    });
  }

  if (!map.getSource(STOPS_SOURCE_ID)) {
    map.addSource(STOPS_SOURCE_ID, { type: 'geojson', data: buildStopsGeoJson(visibleKinds) });
    map.addLayer({
      id: STOPS_LAYER_ID,
      type: 'circle',
      source: STOPS_SOURCE_ID,
      minzoom: 12,
      layout: { visibility: showStops ? 'visible' : 'none' },
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 2.5, 17, 6],
        'circle-color': '#FFFFFF',
        'circle-stroke-color': '#0B3D2E',
        'circle-stroke-width': 2
      }
    });
  }
}

/** Додає шар об'ємних будівель (якщо його ще немає) — видимість керується окремо через layout.visibility. */
function ensureBuildingsLayer(map: MapLibreMap, visible: boolean) {
  if (map.getLayer('3d-buildings') || !map.getSource('openmaptiles')) return;
  map.addLayer({
    id: '3d-buildings',
    source: 'openmaptiles',
    'source-layer': 'building',
    type: 'fill-extrusion',
    minzoom: 14,
    layout: { visibility: visible ? 'visible' : 'none' },
    paint: {
      'fill-extrusion-color': '#CFE9DA',
      'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 8],
      'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
      'fill-extrusion-opacity': 0.75
    }
  });
}

/** Оновлює вже додані шари маршрутів/зупинок під нові фільтри панелі керування — без перестворення джерел. */
function updateStaticTransitLayers(map: MapLibreMap, visibleKinds: TransportKind[], showStops: boolean) {
  const routesSource = map.getSource(ROUTES_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
  routesSource?.setData(buildRouteLinesGeoJson(visibleKinds));

  const stopsSource = map.getSource(STOPS_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
  stopsSource?.setData(buildStopsGeoJson(visibleKinds));

  if (map.getLayer(STOPS_LAYER_ID)) {
    map.setLayoutProperty(STOPS_LAYER_ID, 'visibility', showStops ? 'visible' : 'none');
  }
}

interface MapViewProps {
  vehicles: Vehicle[];
  userPosition?: { lat: number; lng: number } | null;
  onVehicleSelect?: (vehicleId: string) => void;
  selectedVehicleId?: string | null;
  onStopSelect?: (stopId: string) => void;
  /** Які види транспорту показувати (лінії маршрутів на карті) — керується панеллю керування шарами. */
  visibleKinds?: TransportKind[];
  /** Показувати шар зупинок з локальної бази. */
  showStops?: boolean;
}

interface ScreenVehicle {
  id: string;
  x: number;
  y: number;
}

export function MapView({
  vehicles,
  userPosition,
  onVehicleSelect,
  selectedVehicleId,
  onStopSelect,
  visibleKinds = ['metro', 'tram', 'trolleybus', 'bus'],
  showStops = true
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const mapStyle = useSettingsStore((s) => s.mapStyle);
  const show3DBuildings = useSettingsStore((s) => s.is3DMode);
  const animatedVehicles = useVehicleAnimation(vehicles);
  const [screenPositions, setScreenPositions] = useState<Record<string, ScreenVehicle>>({});
  const [mapReady, setMapReady] = useState(false);
  const onStopSelectRef = useRef(onStopSelect);
  onStopSelectRef.current = onStopSelect;

  // Ініціалізація карти
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLES[mapStyle],
      center: [KHARKIV_CENTER.lng, KHARKIV_CENTER.lat],
      zoom: DEFAULT_ZOOM,
      maxZoom: MAX_ZOOM,
      minZoom: MIN_ZOOM,
      pitch: show3DBuildings ? 45 : 0,
      attributionControl: false
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');

    map.on('load', () => {
      ensureBuildingsLayer(map, show3DBuildings);
      addStaticTransitLayers(map, visibleKinds, showStops);
      map.on('click', STOPS_LAYER_ID, (e) => {
        const stopId = e.features?.[0]?.properties?.stopId as string | undefined;
        if (stopId) onStopSelectRef.current?.(stopId);
      });
      map.on('mouseenter', STOPS_LAYER_ID, () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', STOPS_LAYER_ID, () => {
        map.getCanvas().style.cursor = '';
      });

      setMapReady(true);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Зміна стилю карти (день/ніч) без пересворення інстансу.
  // setStyle() скидає всі кастомні джерела/шари — тож перевішуємо їх після 'styledata'.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(MAP_STYLES[mapStyle]);
    map.once('styledata', () => {
      ensureBuildingsLayer(map, show3DBuildings);
      addStaticTransitLayers(map, visibleKinds, showStops);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapStyle]);

  // Живе перемикання 2D/3D: нахил камери + видимість об'ємних будівель, без перестворення карти чи стилю.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    map.easeTo({ pitch: show3DBuildings ? 45 : 0, duration: 400 });
    ensureBuildingsLayer(map, show3DBuildings);
    if (map.getLayer('3d-buildings')) {
      map.setLayoutProperty('3d-buildings', 'visibility', show3DBuildings ? 'visible' : 'none');
    }
  }, [show3DBuildings, mapReady]);

  // Панель керування шарами: перефільтровуємо лінії маршрутів і зупинки без перестворення карти.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    updateStaticTransitLayers(map, visibleKinds, showStops);
  }, [visibleKinds, showStops, mapReady]);

  // Маркер користувача
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userPosition) return;

    if (!userMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'h-4 w-4 rounded-full bg-gold border-2 border-white shadow-glass animate-pulse-soft';
      userMarkerRef.current = new maplibregl.Marker({ element: el }).setLngLat([userPosition.lng, userPosition.lat]).addTo(map);
    } else {
      userMarkerRef.current.setLngLat([userPosition.lng, userPosition.lat]);
    }
  }, [userPosition]);

  // Перерахунок екранних координат транспорту на кожен кадр анімації + рух карти
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    function updateScreenPositions() {
      const positions: Record<string, ScreenVehicle> = {};
      for (const v of animatedVehicles) {
        const point = map!.project([v.animatedPosition.lng, v.animatedPosition.lat]);
        positions[v.id] = { id: v.id, x: point.x, y: point.y };
      }
      setScreenPositions(positions);
    }

    updateScreenPositions();
    map.on('move', updateScreenPositions);
    return () => {
      map.off('move', updateScreenPositions);
    };
  }, [animatedVehicles, mapReady]);

  function flyToUser() {
    if (mapRef.current && userPosition) {
      mapRef.current.flyTo({ center: [userPosition.lng, userPosition.lat], zoom: 16, essential: true });
    }
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div ref={containerRef} className="absolute inset-0" />

      {/* Оверлей транспорту, спроєктований у пікселі поверх карти */}
      <div className="pointer-events-none absolute inset-0">
        {animatedVehicles.map((v) => {
          const screen = screenPositions[v.id];
          if (!screen) return null;
          return (
            <div key={v.id} className="pointer-events-auto">
              <TransportSprite
                kind={v.kind}
                routeNumber={v.routeNumber}
                headsign={v.headsign}
                heading={v.animatedHeading}
                speedKmh={v.speedKmh}
                x={screen.x}
                y={screen.y}
                state={v.state}
                selected={selectedVehicleId === v.id}
                onClick={() => onVehicleSelect?.(v.id)}
              />
            </div>
          );
        })}
      </div>

      {userPosition && (
        <button
          type="button"
          onClick={flyToUser}
          aria-label="Показати моє місцезнаходження"
          className="absolute bottom-24 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-glass-lg backdrop-blur-xs transition hover:scale-105 active:scale-95"
        >
          <span className="h-3 w-3 rounded-full bg-forest" />
        </button>
      )}
    </div>
  );
}
