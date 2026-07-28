import { useEffect, useRef, useState } from 'react';
import maplibregl, { Map as MapLibreMap } from 'maplibre-gl';
import { Navigation } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';

import { DEFAULT_ZOOM, KHARKIV_CENTER, MAP_STYLES, MAX_ZOOM, MIN_ZOOM, TRANSPORT_COLORS } from '@/config/map';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useVehicleAnimation } from '@/hooks/useVehicleAnimation';
import { TransportSprite } from '@/components/TransportSprite';
import { buildRouteLinesGeoJson, buildStopsGeoJson } from '@/lib/mapLayers';
import { assetUrl } from '@/lib/assetUrl';
import { localRoutes } from '@/data/localData';
import type { TransportKind, Vehicle } from '@/types/transport';

const ROUTES_SOURCE_ID = 'khgo-routes';
const ROUTES_LAYER_ID = 'khgo-routes-lines';
const ROUTES_CASING_LAYER_ID = 'khgo-routes-casing';
const STOPS_SOURCE_ID = 'khgo-stops';
const STOPS_LAYER_ID = 'khgo-stops-circles';
const STOPS_HALO_LAYER_ID = 'khgo-stops-halo';
const STOP_HIGHLIGHT_LAYER_ID = 'khgo-stops-highlight';
// Метро — окремі шари без minzoom-обмеження: станції метро мають лишатись
// видимими на будь-якому масштабі карти, на відміну від трамвайних/тролейбусних/
// автобусних зупинок, яких на віддаленому зумі забагато й вони заховані навмисно.
const METRO_STOPS_HALO_LAYER_ID = 'khgo-stops-metro-halo';
const METRO_STOPS_LAYER_ID = 'khgo-stops-metro-circles';

const STOP_COLOR_MATCH: maplibregl.ExpressionSpecification = [
  'match',
  ['get', 'dominantKind'],
  'metro',
  TRANSPORT_COLORS.metro,
  'tram',
  TRANSPORT_COLORS.tram,
  'trolleybus',
  TRANSPORT_COLORS.trolleybus,
  TRANSPORT_COLORS.bus
];

/**
 * Додає статичні шари маршрутів (лінії) і зупинок (точки).
 */
function addStaticTransitLayers(
  map: MapLibreMap,
  visibleKinds: TransportKind[],
  showStops: boolean,
  selectedRouteId?: string | null
) {
  if (!map.getSource(ROUTES_SOURCE_ID)) {
    map.addSource(ROUTES_SOURCE_ID, { type: 'geojson', data: buildRouteLinesGeoJson(visibleKinds, selectedRouteId) });

    map.addLayer({
      id: ROUTES_CASING_LAYER_ID,
      type: 'line',
      source: ROUTES_SOURCE_ID,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': '#0A0F0D',
        'line-width': ['case', ['get', 'selected'], ['interpolate', ['linear'], ['zoom'], 11, 4, 17, 8], 0],
        'line-opacity': ['case', ['get', 'dimmed'], 0, 0.35]
      }
    });

    map.addLayer({
      id: ROUTES_LAYER_ID,
      type: 'line',
      source: ROUTES_SOURCE_ID,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': ['coalesce', ['get', 'color'], '#05522E'],
        'line-width': [
          'case',
          ['get', 'selected'],
          ['interpolate', ['linear'], ['zoom'], 11, 3, 17, 6.5],
          ['interpolate', ['linear'], ['zoom'], 11, 1.4, 17, 3.5]
        ],
        'line-opacity': ['case', ['get', 'dimmed'], 0.12, 0.9]
      }
    });
  }

  if (!map.getSource(STOPS_SOURCE_ID)) {
    map.addSource(STOPS_SOURCE_ID, { type: 'geojson', data: buildStopsGeoJson(visibleKinds) });

    map.addLayer({
      id: STOPS_HALO_LAYER_ID,
      type: 'circle',
      source: STOPS_SOURCE_ID,
      minzoom: 12,
      layout: { visibility: showStops ? 'visible' : 'none' },
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          12,
          ['case', ['get', 'isHub'], 4.5, 3.5],
          17,
          ['case', ['get', 'isHub'], 11, 8.5]
        ],
        'circle-color': '#FFFFFF',
        'circle-opacity': 0.9
      }
    });

    map.addLayer({
      id: STOPS_LAYER_ID,
      type: 'circle',
      source: STOPS_SOURCE_ID,
      minzoom: 12,
      layout: { visibility: showStops ? 'visible' : 'none' },
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          12,
          ['case', ['get', 'isHub'], 3.2, 2.2],
          17,
          ['case', ['get', 'isHub'], 8, 5.5]
        ],
        'circle-color': STOP_COLOR_MATCH,
        'circle-stroke-color': '#FFFFFF',
        'circle-stroke-width': ['case', ['get', 'isHub'], 2, 1.4]
      }
    });

    map.addLayer({
      id: STOP_HIGHLIGHT_LAYER_ID,
      type: 'circle',
      source: STOPS_SOURCE_ID,
      minzoom: 11,
      filter: ['in', ['get', 'stopId'], ['literal', []]],
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 6, 17, 13],
        'circle-color': 'transparent',
        'circle-stroke-color': '#C6A552',
        'circle-stroke-width': 2.5
      }
    });

    // Метро — без minzoom, завжди видимі, поки showStops увімкнено.
    map.addLayer({
      id: METRO_STOPS_HALO_LAYER_ID,
      type: 'circle',
      source: STOPS_SOURCE_ID,
      filter: ['==', ['get', 'dominantKind'], 'metro'],
      layout: { visibility: showStops ? 'visible' : 'none' },
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 4.5, 17, 11],
        'circle-color': '#FFFFFF',
        'circle-opacity': 0.95
      }
    });

    map.addLayer({
      id: METRO_STOPS_LAYER_ID,
      type: 'circle',
      source: STOPS_SOURCE_ID,
      filter: ['==', ['get', 'dominantKind'], 'metro'],
      layout: { visibility: showStops ? 'visible' : 'none' },
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 3.5, 17, 8],
        'circle-color': TRANSPORT_COLORS.metro,
        'circle-stroke-color': '#FFFFFF',
        'circle-stroke-width': 2
      }
    });
  }
}

function updateRouteStopHighlight(map: MapLibreMap, selectedRouteId?: string | null) {
  if (!map.getLayer(STOP_HIGHLIGHT_LAYER_ID)) return;
  const route = selectedRouteId ? localRoutes.getById(selectedRouteId) : undefined;
  map.setFilter(STOP_HIGHLIGHT_LAYER_ID, ['in', ['get', 'stopId'], ['literal', route?.stopIds ?? []]]);
}

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

function updateStaticTransitLayers(
  map: MapLibreMap,
  visibleKinds: TransportKind[],
  showStops: boolean,
  selectedRouteId?: string | null
) {
  const routesSource = map.getSource(ROUTES_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
  routesSource?.setData(buildRouteLinesGeoJson(visibleKinds, selectedRouteId));

  const stopsSource = map.getSource(STOPS_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
  stopsSource?.setData(buildStopsGeoJson(visibleKinds));

  updateRouteStopHighlight(map, selectedRouteId);

  for (const layerId of [STOPS_LAYER_ID, STOPS_HALO_LAYER_ID, METRO_STOPS_LAYER_ID, METRO_STOPS_HALO_LAYER_ID]) {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, 'visibility', showStops ? 'visible' : 'none');
    }
  }
}

interface MapViewProps {
  vehicles: Vehicle[];
  userPosition?: { lat: number; lng: number } | null;
  userHeading?: number | null;
  userIsMoving?: boolean;
  onVehicleSelect?: (vehicleId: string) => void;
  selectedVehicleId?: string | null;
  onStopSelect?: (stopId: string) => void;
  selectedRouteId?: string | null;
  onRouteSelect?: (routeId: string) => void;
  visibleKinds?: TransportKind[];
  showStops?: boolean;
  onMapReady?: (map: MapLibreMap | null) => void;
}

interface ScreenVehicle {
  id: string;
  x: number;
  y: number;
}

export function MapView({
  vehicles,
  userPosition,
  userHeading = null,
  userIsMoving = false,
  onVehicleSelect,
  selectedVehicleId,
  onStopSelect,
  selectedRouteId = null,
  onRouteSelect,
  visibleKinds = ['metro', 'tram', 'trolleybus', 'bus'],
  showStops = true,
  onMapReady
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
  const onRouteSelectRef = useRef(onRouteSelect);
  onRouteSelectRef.current = onRouteSelect;
  const onMapReadyRef = useRef(onMapReady);
  onMapReadyRef.current = onMapReady;

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
      addStaticTransitLayers(map, visibleKinds, showStops, selectedRouteId);

      map.on('click', STOPS_LAYER_ID, (e) => {
        const stopId = e.features?.[0]?.properties?.stopId as string | undefined;
        if (stopId) onStopSelectRef.current?.(stopId);
      });

      map.on('click', METRO_STOPS_LAYER_ID, (e) => {
        const stopId = e.features?.[0]?.properties?.stopId as string | undefined;
        if (stopId) onStopSelectRef.current?.(stopId);
      });

      map.on('click', ROUTES_LAYER_ID, (e) => {
        const routeId = e.features?.[0]?.properties?.routeId as string | undefined;
        if (routeId) onRouteSelectRef.current?.(routeId);
      });

      for (const layerId of [STOPS_LAYER_ID, METRO_STOPS_LAYER_ID, ROUTES_LAYER_ID]) {
        map.on('mouseenter', layerId, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', layerId, () => {
          map.getCanvas().style.cursor = '';
        });
      }

      setMapReady(true);
      onMapReadyRef.current?.(map);
    });

    mapRef.current = map;

    return () => {
      onMapReadyRef.current?.(null);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Зміна стилю карти (день/ніч)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(MAP_STYLES[mapStyle]);
    map.once('styledata', () => {
      ensureBuildingsLayer(map, show3DBuildings);
      addStaticTransitLayers(map, visibleKinds, showStops, selectedRouteId);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapStyle]);

  // Живе перемикання 2D/3D
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    map.easeTo({ pitch: show3DBuildings ? 45 : 0, duration: 400 });
    ensureBuildingsLayer(map, show3DBuildings);
    if (map.getLayer('3d-buildings')) {
      map.setLayoutProperty('3d-buildings', 'visibility', show3DBuildings ? 'visible' : 'none');
    }
  }, [show3DBuildings, mapReady]);

  // Перефільтрація видів транспорту та зупинок
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    updateStaticTransitLayers(map, visibleKinds, showStops, selectedRouteId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleKinds, showStops, mapReady]);

  // Підсвічування обраного маршруту
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const routesSource = map.getSource(ROUTES_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    routesSource?.setData(buildRouteLinesGeoJson(visibleKinds, selectedRouteId));
    updateRouteStopHighlight(map, selectedRouteId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRouteId, mapReady]);

  // Маркер користувача
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userPosition) return;

    if (!userMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'kg-user-marker relative h-11 w-11';
      el.innerHTML = `
        <div class="absolute inset-0 rounded-full bg-primary/30 animate-ping"></div>
        <div class="kg-user-marker-rotate absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out">
          <img class="kg-user-marker-icon h-11 w-11 select-none drop-shadow-md" src="${assetUrl('markers/user-location.png')}" alt="" draggable="false" />
          <video class="kg-user-marker-video absolute inset-0 hidden h-11 w-11 rounded-full object-cover shadow-lg" src="${assetUrl('markers/walking.mp4')}" muted loop playsinline preload="none"></video>
        </div>
      `;
      userMarkerRef.current = new maplibregl.Marker({ element: el, rotationAlignment: 'map' })
        .setLngLat([userPosition.lng, userPosition.lat])
        .addTo(map);
    } else {
      userMarkerRef.current.setLngLat([userPosition.lng, userPosition.lat]);
    }
  }, [userPosition]);

  // Перемикання станів та орієнтації маркера
  useEffect(() => {
    const el = userMarkerRef.current?.getElement();
    if (!el) return;
    const img = el.querySelector<HTMLImageElement>('.kg-user-marker-icon');
    const video = el.querySelector<HTMLVideoElement>('.kg-user-marker-video');
    const rotor = el.querySelector<HTMLElement>('.kg-user-marker-rotate');
    if (!img || !video || !rotor) return;

    if (userIsMoving) {
      img.classList.add('hidden');
      video.classList.remove('hidden');
      if (video.paused) void video.play().catch(() => {});
      rotor.style.transform = 'rotate(0deg)';
    } else {
      video.classList.add('hidden');
      video.pause();
      img.classList.remove('hidden');
      rotor.style.transform = typeof userHeading === 'number' ? `rotate(${userHeading}deg)` : 'rotate(0deg)';
    }
  }, [userIsMoving, userHeading]);

  // Синхронізація екранних координат транспорту (Viewport Culling + rAF)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    let rafId: number | null = null;
    const CULL_PADDING_PX = 120;

    function computeAndSet() {
      rafId = null;
      const canvas = map!.getCanvas();
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const positions: Record<string, ScreenVehicle> = {};

      for (const v of animatedVehicles) {
        const point = map!.project([v.animatedPosition.lng, v.animatedPosition.lat]);
        if (
          point.x < -CULL_PADDING_PX ||
          point.y < -CULL_PADDING_PX ||
          point.x > w + CULL_PADDING_PX ||
          point.y > h + CULL_PADDING_PX
        ) {
          continue;
        }
        positions[v.id] = { id: v.id, x: point.x, y: point.y };
      }
      setScreenPositions(positions);
    }

    function scheduleUpdate() {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(computeAndSet);
    }

    scheduleUpdate();
    map.on('move', scheduleUpdate);

    return () => {
      map.off('move', scheduleUpdate);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [animatedVehicles, mapReady]);

  function flyToUser() {
    if (mapRef.current && userPosition) {
      mapRef.current.flyTo({ center: [userPosition.lng, userPosition.lat], zoom: 16, essential: true });
    }
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* КРИТИЧНО: position/inset заданий інлайн-стилем, а НЕ класами Tailwind
          (absolute inset-0). Бібліотека maplibre-gl.css сама додає на цей
          контейнер клас .maplibregl-map з правилом `position: relative` —
          та сама специфічність (один клас), тож перемагає той, чий CSS
          підключений пізніше в зібраному бандлі. Раніше це призводило до
          того, що контейнер лишався position:relative без заданої висоти,
          inset-0 переставав щось важити, висота схлопувалась у 0px — і
          карта була невидимою (canvas 0×0), хоча жодної JS-помилки не було.
          Інлайн-стиль має найвищий пріоритет і завжди перемагає будь-який
          зовнішній клас, тож карта відображається незалежно від порядку
          CSS-чанків у білді. */}
      <div ref={containerRef} className="absolute inset-0" style={{ position: 'absolute', inset: 0 }} />

      {/* Оверлей транспорту, спроєктований у пікселі поверх карты */}
      <div className="pointer-events-none absolute inset-0 z-10">
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

      {/* Плаваюча кнопка «Моє місцезнаходження» (FAB) */}
      {userPosition && (
        <button
          type="button"
          onClick={flyToUser}
          aria-label="Показати моє місцезнаходження"
          className="absolute bottom-20 right-4 z-20 flex h-12 w-12 items-center justify-center rounded-2xl border border-border/40 bg-surface/85 text-primary shadow-2xl backdrop-blur-xl transition-all duration-200 hover:scale-105 hover:bg-surface active:scale-95 mb-safe"
        >
          <Navigation className="h-5 w-5 fill-primary/20 stroke-[2.25]" />
        </button>
      )}
    </div>
  );
}
