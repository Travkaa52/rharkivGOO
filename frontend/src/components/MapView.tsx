import { useEffect, useRef, useState } from 'react';
import maplibregl, { Map as MapLibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { DEFAULT_ZOOM, KHARKIV_CENTER, MAP_STYLES, MAX_ZOOM, MIN_ZOOM } from '@/config/map';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useVehicleAnimation } from '@/hooks/useVehicleAnimation';
import { TransportSprite } from '@/components/TransportSprite';
import { buildRouteLinesGeoJson, buildStopsGeoJson } from '@/lib/mapLayers';
import type { Vehicle } from '@/types/transport';

const ROUTES_SOURCE_ID = 'khgo-routes';
const ROUTES_LAYER_ID = 'khgo-routes-lines';
const STOPS_SOURCE_ID = 'khgo-stops';
const STOPS_LAYER_ID = 'khgo-stops-circles';

/** Додає статичні шари маршрутів (лінії) і зупинок (точки) — без анімації руху. */
function addStaticTransitLayers(map: MapLibreMap) {
  if (!map.getSource(ROUTES_SOURCE_ID)) {
    map.addSource(ROUTES_SOURCE_ID, { type: 'geojson', data: buildRouteLinesGeoJson() });
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
    map.addSource(STOPS_SOURCE_ID, { type: 'geojson', data: buildStopsGeoJson() });
    map.addLayer({
      id: STOPS_LAYER_ID,
      type: 'circle',
      source: STOPS_SOURCE_ID,
      minzoom: 12,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 2.5, 17, 6],
        'circle-color': '#FFFFFF',
        'circle-stroke-color': '#0B3D2E',
        'circle-stroke-width': 2
      }
    });
  }
}

interface MapViewProps {
  vehicles: Vehicle[];
  userPosition?: { lat: number; lng: number } | null;
  onVehicleSelect?: (vehicleId: string) => void;
  selectedVehicleId?: string | null;
  show3DBuildings?: boolean;
  onStopSelect?: (stopId: string) => void;
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
  show3DBuildings = true,
  onStopSelect
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const mapStyle = useSettingsStore((s) => s.mapStyle);
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
      if (show3DBuildings && map.getSource('openmaptiles')) {
        map.addLayer({
          id: '3d-buildings',
          source: 'openmaptiles',
          'source-layer': 'building',
          type: 'fill-extrusion',
          minzoom: 14,
          paint: {
            'fill-extrusion-color': '#CFE9DA',
            'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 8],
            'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
            'fill-extrusion-opacity': 0.75
          }
        });
      }
      addStaticTransitLayers(map);
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
    map.once('styledata', () => addStaticTransitLayers(map));
  }, [mapStyle]);

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
