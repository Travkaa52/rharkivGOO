import { useEffect, useRef, useState } from 'react';
import maplibregl, { Map as MapLibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import { DEFAULT_ZOOM, KHARKIV_CENTER, MAP_STYLES, MAX_ZOOM, MIN_ZOOM, TRANSPORT_COLORS } from '@/config/map';
import { useSettingsStore } from '@/store/useSettingsStore';
import { buildRouteLinesGeoJson, buildStopsGeoJson, buildTripPathGeoJson } from '@/lib/mapLayers';
import { assetUrl } from '@/lib/assetUrl';
import { localRoutes } from '@/data/localData';
import type { TripPlan } from '@/data/localData';
import type { TransportKind } from '@/types/transport';

const TRIP_PATH_SOURCE_ID = 'khgo-trip-path';
const TRIP_PATH_CASING_LAYER_ID = 'khgo-trip-path-casing';
const TRIP_PATH_LAYER_ID = 'khgo-trip-path-line';
const TRIP_PATH_WALK_LAYER_ID = 'khgo-trip-path-walk';

const ROUTES_SOURCE_ID = 'khgo-routes';
const ROUTES_LAYER_ID = 'khgo-routes-lines';
const ROUTES_CASING_LAYER_ID = 'khgo-routes-casing';
const ROUTES_HITBOX_LAYER_ID = 'khgo-routes-hitbox';
const STOPS_SOURCE_ID = 'khgo-stops';
const STOPS_LAYER_ID = 'khgo-stops-circles';
const STOPS_HALO_LAYER_ID = 'khgo-stops-halo';
const STOP_HIGHLIGHT_LAYER_ID = 'khgo-stops-highlight';
const METRO_STOPS_LAYER_ID = 'khgo-stops-metro-icons';
const METRO_ICON_IMAGE_ID = 'khgo-metro-station-icon';

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

    map.addLayer({
      id: ROUTES_HITBOX_LAYER_ID,
      type: 'line',
      source: ROUTES_SOURCE_ID,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': '#000000',
        'line-width': ['interpolate', ['linear'], ['zoom'], 11, 18, 17, 26],
        'line-opacity': 0
      }
    }, ROUTES_LAYER_ID);
  }

  if (!map.getSource(TRIP_PATH_SOURCE_ID)) {
    map.addSource(TRIP_PATH_SOURCE_ID, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    map.addLayer({
      id: TRIP_PATH_WALK_LAYER_ID,
      type: 'line',
      source: TRIP_PATH_SOURCE_ID,
      filter: ['==', ['get', 'kind'], 'walk'],
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': '#9AA3AE',
        'line-width': 3,
        'line-dasharray': [0.001, 1.6]
      }
    });

    map.addLayer({
      id: TRIP_PATH_CASING_LAYER_ID,
      type: 'line',
      source: TRIP_PATH_SOURCE_ID,
      filter: ['==', ['get', 'kind'], 'transit'],
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': '#0A0F0D',
        'line-width': ['interpolate', ['linear'], ['zoom'], 11, 7, 17, 12],
        'line-opacity': 0.5
      }
    });

    map.addLayer({
      id: TRIP_PATH_LAYER_ID,
      type: 'line',
      source: TRIP_PATH_SOURCE_ID,
      filter: ['==', ['get', 'kind'], 'transit'],
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': ['coalesce', ['get', 'color'], '#05522E'],
        'line-width': ['interpolate', ['linear'], ['zoom'], 11, 4.5, 17, 9],
        'line-opacity': 1
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

    addMetroIconLayer(map, showStops);
  }
}

/**
 * Додає значок станції метро як MapLibre-зображення.
 */
async function addMetroIconLayer(map: MapLibreMap, showStops: boolean) {
  const buildLayer = () => {
    if (map.getLayer(METRO_STOPS_LAYER_ID) || !map.getSource(STOPS_SOURCE_ID)) return;
    map.addLayer({
      id: METRO_STOPS_LAYER_ID,
      type: 'symbol',
      source: STOPS_SOURCE_ID,
      filter: ['==', ['get', 'dominantKind'], 'metro'],
      layout: {
        visibility: showStops ? 'visible' : 'none',
        'icon-image': map.hasImage(METRO_ICON_IMAGE_ID) ? METRO_ICON_IMAGE_ID : '',
        'icon-size': ['interpolate', ['linear'], ['zoom'], 10, 0.32, 17, 0.6],
        'icon-anchor': 'center',
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
        'text-field': ['get', 'name'],
        'text-size': 11,
        'text-anchor': 'left',
        'text-offset': [1.15, 0],
        'text-allow-overlap': false,
        'text-ignore-placement': false,
        'text-optional': true
      },
      paint: {
        'text-color': TRANSPORT_COLORS.metro,
        'text-halo-color': '#FFFFFF',
        'text-halo-width': 1.4
      }
    });
  };

  if (map.hasImage(METRO_ICON_IMAGE_ID)) {
    buildLayer();
    return;
  }

  try {
    const res = await map.loadImage(assetUrl('icons/kharkiv-metro-logo.png'));
    if (res?.data && !map.hasImage(METRO_ICON_IMAGE_ID)) {
      map.addImage(METRO_ICON_IMAGE_ID, res.data);
    }
  } catch (err) {
    console.warn('Failed to load metro icon:', err);
  } finally {
    buildLayer();
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

  for (const layerId of [STOPS_LAYER_ID, STOPS_HALO_LAYER_ID, METRO_STOPS_LAYER_ID]) {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, 'visibility', showStops ? 'visible' : 'none');
    }
  }
}

interface MapViewProps {
  userPosition?: { lat: number; lng: number } | null;
  userHeading?: number | null;
  userIsMoving?: boolean;
  onStopSelect?: (stopId: string) => void;
  selectedRouteId?: string | null;
  onRouteSelect?: (routeId: string) => void;
  visibleKinds?: TransportKind[];
  showStops?: boolean;
  onMapReady?: (map: MapLibreMap | null) => void;
  onMapError?: (message: string) => void;
  fromPoint?: { lat: number; lng: number } | null;
  toPoint?: { lat: number; lng: number } | null;
  tripPlan?: TripPlan | null;
}

export function MapView({
  userPosition,
  userHeading = null,
  userIsMoving = false,
  onStopSelect,
  selectedRouteId = null,
  onRouteSelect,
  visibleKinds = ['metro', 'tram', 'trolleybus', 'bus'],
  showStops = true,
  onMapReady,
  onMapError,
  fromPoint = null,
  toPoint = null,
  tripPlan = null
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const fromMarkerRef = useRef<maplibregl.Marker | null>(null);
  const toMarkerRef = useRef<maplibregl.Marker | null>(null);

  const mapStyle = useSettingsStore((s) => s.mapStyle);
  const show3DBuildings = useSettingsStore((s) => s.is3DMode);

  const [mapReady, setMapReady] = useState(false);

  const onStopSelectRef = useRef(onStopSelect);
  onStopSelectRef.current = onStopSelect;
  const onRouteSelectRef = useRef(onRouteSelect);
  onRouteSelectRef.current = onRouteSelect;
  const onMapReadyRef = useRef(onMapReady);
  onMapReadyRef.current = onMapReady;
  const onMapErrorRef = useRef(onMapError);
  onMapErrorRef.current = onMapError;

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

    map.on('error', (e) => {
      const message = e?.error?.message || 'Не вдалося завантажити стиль карти';
      onMapErrorRef.current?.(message);
    });

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

      map.on('click', ROUTES_HITBOX_LAYER_ID, (e) => {
        const routeId = e.features?.[0]?.properties?.routeId as string | undefined;
        if (routeId) onRouteSelectRef.current?.(routeId);
      });

      for (const layerId of [STOPS_LAYER_ID, METRO_STOPS_LAYER_ID, ROUTES_HITBOX_LAYER_ID]) {
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

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(MAP_STYLES[mapStyle]);
    map.once('styledata', () => {
      ensureBuildingsLayer(map, show3DBuildings);
      addStaticTransitLayers(map, visibleKinds, showStops, selectedRouteId);
      const tripSource = map.getSource(TRIP_PATH_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
      tripSource?.setData(
        tripPlan ? buildTripPathGeoJson(tripPlan, fromPoint, toPoint) : { type: 'FeatureCollection', features: [] }
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapStyle]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    map.easeTo({ pitch: show3DBuildings ? 45 : 0, duration: 400 });
    ensureBuildingsLayer(map, show3DBuildings);
    if (map.getLayer('3d-buildings')) {
      map.setLayoutProperty('3d-buildings', 'visibility', show3DBuildings ? 'visible' : 'none');
    }
  }, [show3DBuildings, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    updateStaticTransitLayers(map, visibleKinds, showStops, selectedRouteId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleKinds, showStops, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const routesSource = map.getSource(ROUTES_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    routesSource?.setData(buildRouteLinesGeoJson(visibleKinds, selectedRouteId));
    updateRouteStopHighlight(map, selectedRouteId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRouteId, mapReady]);

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

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const source = map.getSource(TRIP_PATH_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    if (!source) return;
    source.setData(
      tripPlan ? buildTripPathGeoJson(tripPlan, fromPoint, toPoint) : { type: 'FeatureCollection', features: [] }
    );
  }, [tripPlan, fromPoint, toPoint, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!fromPoint) {
      fromMarkerRef.current?.remove();
      fromMarkerRef.current = null;
    } else {
      if (!fromMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'flex h-8 w-8 items-center justify-center';
        el.innerHTML = `<div style="width:16px;height:16px;border-radius:9999px;background:#059669;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35)"></div>`;
        fromMarkerRef.current = new maplibregl.Marker({ element: el }).setLngLat([fromPoint.lng, fromPoint.lat]).addTo(map);
      } else {
        fromMarkerRef.current.setLngLat([fromPoint.lng, fromPoint.lat]);
      }
    }
  }, [fromPoint]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!toPoint) {
      toMarkerRef.current?.remove();
      toMarkerRef.current = null;
    } else {
      if (!toMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'flex h-8 w-8 items-center justify-center';
        el.innerHTML = `<div style="width:16px;height:16px;border-radius:9999px;background:#e11d48;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35)"></div>`;
        toMarkerRef.current = new maplibregl.Marker({ element: el }).setLngLat([toPoint.lng, toPoint.lat]).addTo(map);
      } else {
        toMarkerRef.current.setLngLat([toPoint.lng, toPoint.lat]);
      }
    }
  }, [toPoint]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div ref={containerRef} className="absolute inset-0" style={{ position: 'absolute', inset: 0 }} />
    </div>
  );
}
