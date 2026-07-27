import { useEffect, useRef, useState } from 'react';
import maplibregl, { Map as MapLibreMap } from 'maplibre-gl';
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
 * Додає статичні шари маршрутів (лінії) і зупинок (точки) — без анімації руху.
 * `visibleKinds`/`showStops` керуються панеллю <TransportLayersPanel /> —
 * дані з локальної бази (routes.json / stops.json) відфільтровуються ще
 * ДО потрапляння в GeoJSON-джерело, тож карта не малює зайвого.
 *
 * Лінії маршрутів мають "casing" (темна підкладка під кольоровою лінією) для
 * контрасту на світлих/темних тайлах, а обраний маршрут — товстіший і
 * непрозорий, решта — притлумлені (властивості selected/dimmed рахуються в
 * buildRouteLinesGeoJson і оновлюються без перестворення джерела/шару).
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

    // Тонкий світлий ореол під кожною зупинкою — робить кольорові кола
    // читабельними і на світлій, і на темній підкладці карти.
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

    // Позначка зупинок обраного маршруту — золоте кільце навколо звичайного
    // маркера. Фільтр порожній за замовчуванням, оновлюється разом з вибором маршруту.
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
  }
}

/** Оновлює лише фільтр шару підсвітки зупинок обраного маршруту. */
function updateRouteStopHighlight(map: MapLibreMap, selectedRouteId?: string | null) {
  if (!map.getLayer(STOP_HIGHLIGHT_LAYER_ID)) return;
  const route = selectedRouteId ? localRoutes.getById(selectedRouteId) : undefined;
  map.setFilter(STOP_HIGHLIGHT_LAYER_ID, ['in', ['get', 'stopId'], ['literal', route?.stopIds ?? []]]);
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

  for (const layerId of [STOPS_LAYER_ID, STOPS_HALO_LAYER_ID]) {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, 'visibility', showStops ? 'visible' : 'none');
    }
  }
}

interface MapViewProps {
  vehicles: Vehicle[];
  userPosition?: { lat: number; lng: number } | null;
  /** Курс руху користувача в градусах (0 = північ) — обертає іконку-стрілку в потрібний бік. */
  userHeading?: number | null;
  /** true, коли користувач реально йде/їде — маркер перемикається з PNG-іконки на відеопетлю ходьби. */
  userIsMoving?: boolean;
  onVehicleSelect?: (vehicleId: string) => void;
  selectedVehicleId?: string | null;
  onStopSelect?: (stopId: string) => void;
  /** Обраний маршрут (клік по лінії на карті або вибір у пошуку/картці) — підсвічує лінію й зупинки. */
  selectedRouteId?: string | null;
  onRouteSelect?: (routeId: string) => void;
  /** Які види транспорту показувати (лінії маршрутів на карті) — керується панеллю керування шарами. */
  visibleKinds?: TransportKind[];
  /** Показувати шар зупинок з локальної бази. */
  showStops?: boolean;
  /** Викликається з інстансом карти одразу після завантаження (для зовнішніх шарів, напр. <MetroLayer />), і з null при демонтуванні. */
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
      map.on('click', ROUTES_LAYER_ID, (e) => {
        const routeId = e.features?.[0]?.properties?.routeId as string | undefined;
        if (routeId) onRouteSelectRef.current?.(routeId);
      });
      for (const layerId of [STOPS_LAYER_ID, ROUTES_LAYER_ID]) {
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

  // Зміна стилю карти (день/ніч) без пересворення інстансу.
  // setStyle() скидає всі кастомні джерела/шари — тож перевішуємо їх після 'styledata'.
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
    updateStaticTransitLayers(map, visibleKinds, showStops, selectedRouteId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleKinds, showStops, mapReady]);

  // Вибір маршруту (клік по лінії, пошук, картка зупинки) — перефарбовуємо лінії
  // й підсвічуємо зупинки без зміни фільтрів видів транспорту/зупинок.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const routesSource = map.getSource(ROUTES_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    routesSource?.setData(buildRouteLinesGeoJson(visibleKinds, selectedRouteId));
    updateRouteStopHighlight(map, selectedRouteId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRouteId, mapReady]);

  // Маркер користувача: створюється один раз (img + video всередині), далі лише
  // рухається/перемикається — так video не перестворюється (і не блимає) на кожен
  // GPS-семпл.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userPosition) return;

    if (!userMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'kg-user-marker relative h-11 w-11';
      el.innerHTML = `
        <div class="absolute inset-0 rounded-full bg-neon/25 animate-pulse-soft"></div>
        <div class="kg-user-marker-rotate absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out">
          <img class="kg-user-marker-icon h-11 w-11 select-none" src="${assetUrl('markers/user-location.png')}" alt="" draggable="false" />
          <video class="kg-user-marker-video absolute inset-0 hidden h-11 w-11 rounded-full object-cover" src="${assetUrl('markers/walking.mp4')}" muted loop playsinline preload="none"></video>
        </div>
      `;
      userMarkerRef.current = new maplibregl.Marker({ element: el, rotationAlignment: 'map' })
        .setLngLat([userPosition.lng, userPosition.lat])
        .addTo(map);
    } else {
      userMarkerRef.current.setLngLat([userPosition.lng, userPosition.lat]);
    }
  }, [userPosition]);

  // Перемикання іконка⇄відео і поворот за курсом — окремий ефект, щоб не чіпати
  // маркер (і не рестартити відео) на кожну зміну координат.
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
      // У русі курс дає GPS-компас — стрілку/бейдж більше не крутимо вручну по heading,
      // відео ходьби вже само по собі не напрямлене, лишаємо нейтральну орієнтацію.
      rotor.style.transform = 'rotate(0deg)';
    } else {
      video.classList.add('hidden');
      video.pause();
      img.classList.remove('hidden');
      rotor.style.transform = typeof userHeading === 'number' ? `rotate(${userHeading}deg)` : 'rotate(0deg)';
    }
  }, [userIsMoving, userHeading]);

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
