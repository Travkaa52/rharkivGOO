import { TransportKind } from '@/types/transport';
import routeGeometries from './routeGeometries.json';

export interface RouteItem {
  id: string;
  kind: TransportKind;
  number: string;
  name: string;
  color: string;
  stopIds: string[];
  headsignForward: string;
  headsignBackward: string;
  schedule: any[];
  firstDeparture: string;
  lastDeparture: string;
  intervalMinutes: number;
}

export interface StopItem {
  id: string;
  name: string;
  kinds: TransportKind[];
  position: {
    lat: number;
    lng: number;
  };
  routeIds: string[];
}

const stopsMap = new Map<string, StopItem>();
const routesMap: RouteItem[] = [];

// Базові маршрути з українськими назвами
const baseRoutes = [
  {
    "id": "tram-1",
    "kind": "tram" as TransportKind,
    "number": "1",
    "name": "Трамвайний маршрут №1 Харків (Залізничний вокзал - Іванівка)",
    "color": "#e74c3c",
    "headsignForward": "Залізничний вокзал",
    "headsignBackward": "Іванівка",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "tram-12",
    "kind": "tram" as TransportKind,
    "number": "12",
    "name": "Трамвайний маршрут №12 Харків (Залізничний вокзал - Центральний парк)",
    "color": "#e74c3c",
    "headsignForward": "Залізничний вокзал",
    "headsignBackward": "Центральний парк",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "tram-16",
    "kind": "tram" as TransportKind,
    "number": "16",
    "name": "Трамвайний маршрут №16 Харків (Салтівська - Гідропарк - Салтівська)",
    "color": "#e74c3c",
    "headsignForward": "Салтівська",
    "headsignBackward": "Гідропарк",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "tram-20",
    "kind": "tram" as TransportKind,
    "number": "20",
    "name": "Трамвайний маршрут №20 Харків (пр. Перемоги - Залізничний вокзал)",
    "color": "#e74c3c",
    "headsignForward": "пр. Перемоги",
    "headsignBackward": "Залізничний вокзал",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "tram-23",
    "kind": "tram" as TransportKind,
    "number": "23",
    "name": "Трамвайний маршрут №23 Харків (Салтівська - 602 мр)",
    "color": "#e74c3c",
    "headsignForward": "Салтівська",
    "headsignBackward": "602 мр",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "tram-27",
    "kind": "tram" as TransportKind,
    "number": "27",
    "name": "Трамвайний маршрут №27 Харків (Салтівська - Новожанове)",
    "color": "#e74c3c",
    "headsignForward": "Салтівська",
    "headsignBackward": "Новожанове",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "tram-3",
    "kind": "tram" as TransportKind,
    "number": "3",
    "name": "Трамвайний маршрут №3 Харків (Залютине - Новожанове)",
    "color": "#e74c3c",
    "headsignForward": "Залютине",
    "headsignBackward": "Новожанове",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "tram-6",
    "kind": "tram" as TransportKind,
    "number": "6",
    "name": "Трамвайний маршрут №6 Харків (602 мр - Залізничний вокзал)",
    "color": "#e74c3c",
    "headsignForward": "602 мр",
    "headsignBackward": "Залізничний вокзал",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "tram-7",
    "kind": "tram" as TransportKind,
    "number": "7",
    "name": "Трамвайний маршрут №7 Харків (Новоселівка - Залізничний вокзал)",
    "color": "#e74c3c",
    "headsignForward": "Новоселівка",
    "headsignBackward": "Залізничний вокзал",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "tram-8",
    "kind": "tram" as TransportKind,
    "number": "8",
    "name": "Трамвайний маршрут №8 Харків (602 мр - вул. Одеська)",
    "color": "#e74c3c",
    "headsignForward": "602 мр",
    "headsignBackward": "вул. Одеська",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-11",
    "kind": "trolleybus" as TransportKind,
    "number": "11",
    "name": "Тролейбусний маршрут №11 Харків (метро Майдан Конституції - пр. Дзюби)",
    "color": "#3498db",
    "headsignForward": "метро Майдан Конституції",
    "headsignBackward": "пр. Дзюби",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-12",
    "kind": "trolleybus" as TransportKind,
    "number": "12",
    "name": "Тролейбусний маршрут №12 Харків (вул. Рудика - вул. Клочківська)",
    "color": "#3498db",
    "headsignForward": "вул. Рудика",
    "headsignBackward": "вул. Клочківська",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-1",
    "kind": "trolleybus" as TransportKind,
    "number": "1",
    "name": "Тролейбусний маршрут №1 Харків (м. Палац Спорту - 28-й мікрорайон)",
    "color": "#3498db",
    "headsignForward": "м. Палац Спорту",
    "headsignBackward": "28-й мікрорайон",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-13",
    "kind": "trolleybus" as TransportKind,
    "number": "13",
    "name": "Тролейбусний маршрут №13 Харків (метро Захисників України - парк Зустріч)",
    "color": "#3498db",
    "headsignForward": "метро Захисників України",
    "headsignBackward": "парк Зустріч",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-18",
    "kind": "trolleybus" as TransportKind,
    "number": "18",
    "name": "Тролейбусний маршрут №18 Харків (метро Держпром - Лікарня невідкладної допомоги)",
    "color": "#3498db",
    "headsignForward": "метро Держпром",
    "headsignBackward": "Лікарня невідкладної допомоги",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-19",
    "kind": "trolleybus" as TransportKind,
    "number": "19",
    "name": "Тролейбусний маршрут №19 Харків (вул. Одеська - 602 мр)",
    "color": "#3498db",
    "headsignForward": "вул. Одеська",
    "headsignBackward": "602 мр",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-2",
    "kind": "trolleybus" as TransportKind,
    "number": "2",
    "name": "Тролейбусний маршрут №2 Харків (пр. Жуковського - пр. Перемоги)",
    "color": "#3498db",
    "headsignForward": "пр. Жуковського",
    "headsignBackward": "пр. Перемоги",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-20",
    "kind": "trolleybus" as TransportKind,
    "number": "20",
    "name": "Тролейбусний маршрут №20 Харків (метро Захисників України - 602 мр)",
    "color": "#3498db",
    "headsignForward": "метро Захисників України",
    "headsignBackward": "602 мр",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-24",
    "kind": "trolleybus" as TransportKind,
    "number": "24",
    "name": "Тролейбусний маршрут №24 Харків (метро Академіка Барабашова - 602 мр)",
    "color": "#3498db",
    "headsignForward": "метро Академіка Барабашова",
    "headsignBackward": "602 мр",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-25",
    "kind": "trolleybus" as TransportKind,
    "number": "25",
    "name": "Тролейбусний маршрут №25 Харків (метро Палац Спорту - бул. Богдана Хмельницького)",
    "color": "#3498db",
    "headsignForward": "метро Палац Спорту",
    "headsignBackward": "бул. Богдана Хмельницького",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-3",
    "kind": "trolleybus" as TransportKind,
    "number": "3",
    "name": "Тролейбусний маршрут №3 Харків (вул. Університетська - вул. 12 Квітня)",
    "color": "#3498db",
    "headsignForward": "вул. Університетська",
    "headsignBackward": "вул. 12 Квітня",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-31",
    "kind": "trolleybus" as TransportKind,
    "number": "31",
    "name": "Тролейбусний маршрут №31 Харків (метро Турбоатом - Північна Салтівка)",
    "color": "#3498db",
    "headsignForward": "метро Турбоатом",
    "headsignBackward": "Північна Салтівка",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-34",
    "kind": "trolleybus" as TransportKind,
    "number": "34",
    "name": "Тролейбусний маршрут №34 Харків (Східна Салтівка - вул. Непокорених)",
    "color": "#3498db",
    "headsignForward": "Східна Салтівка",
    "headsignBackward": "вул. Непокорених",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-35",
    "kind": "trolleybus" as TransportKind,
    "number": "35",
    "name": "Тролейбусний маршрут №35 Харків (вул. Одеська - Північна Салтівка)",
    "color": "#3498db",
    "headsignForward": "вул. Одеська",
    "headsignBackward": "Північна Салтівка",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-40",
    "kind": "trolleybus" as TransportKind,
    "number": "40",
    "name": "Тролейбусний маршрут №40 Харків (метро Майдан Конституції - пр. Перемоги)",
    "color": "#3498db",
    "headsignForward": "метро Майдан Конституції",
    "headsignBackward": "пр. Перемоги",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-45",
    "kind": "trolleybus" as TransportKind,
    "number": "45",
    "name": "Тролейбусний маршрут №45 Харків (вул. 12 Квітня - вул. Роганська)",
    "color": "#3498db",
    "headsignForward": "вул. 12 Квітня",
    "headsignBackward": "вул. Роганська",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-46",
    "kind": "trolleybus" as TransportKind,
    "number": "46",
    "name": "Тролейбусний маршрут №46 Харків (мр Горизонт - вул. 12 Квітня)",
    "color": "#3498db",
    "headsignForward": "мр Горизонт",
    "headsignBackward": "вул. 12 Квітня",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-49",
    "kind": "trolleybus" as TransportKind,
    "number": "49",
    "name": "Тролейбусний маршрут №49 Харків (вул. Університетська - сел. Жихар)",
    "color": "#3498db",
    "headsignForward": "вул. Університетська",
    "headsignBackward": "сел. Жихар",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-51",
    "kind": "trolleybus" as TransportKind,
    "number": "51",
    "name": "Тролейбусний маршрут №51 Харків (вул. 12 Квітня - вул. Зубарєва)",
    "color": "#3498db",
    "headsignForward": "вул. 12 Квітня",
    "headsignBackward": "вул. Зубарєва",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-52",
    "kind": "trolleybus" as TransportKind,
    "number": "52",
    "name": "Тролейбусний маршрут №52 Харків (вул. 12 Квітня - 759 мр)",
    "color": "#3498db",
    "headsignForward": "вул. 12 Квітня",
    "headsignBackward": "759 мр",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-53",
    "kind": "trolleybus" as TransportKind,
    "number": "53",
    "name": "Тролейбусний маршрут №53 Харків (вул. 12 Квітня - мн Горизонт)",
    "color": "#3498db",
    "headsignForward": "вул. 12 Квітня",
    "headsignBackward": "мн Горизонт",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-55",
    "kind": "trolleybus" as TransportKind,
    "number": "55",
    "name": "Тролейбусний маршрут №55 Харків (м. Майдан Конституції - пр. Жуковського)",
    "color": "#3498db",
    "headsignForward": "м. Майдан Конституції",
    "headsignBackward": "пр. Жуковського",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-56",
    "kind": "trolleybus" as TransportKind,
    "number": "56",
    "name": "Тролейбусний маршрут №56 Харків (м. Академіка Барабашова - Східна Салтівка)",
    "color": "#3498db",
    "headsignForward": "м. Академіка Барабашова",
    "headsignBackward": "Східна Салтівка",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-57",
    "kind": "trolleybus" as TransportKind,
    "number": "57",
    "name": "Тролейбусний маршрут №57 Харків (парк Зустріч - метро Академіка Барабашова)",
    "color": "#3498db",
    "headsignForward": "парк Зустріч",
    "headsignBackward": "метро Академіка Барабашова",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-58",
    "kind": "trolleybus" as TransportKind,
    "number": "58",
    "name": "Тролейбусний маршрут №58 Харків (Аеропорт - пр. Перемоги)",
    "color": "#3498db",
    "headsignForward": "Аеропорт",
    "headsignBackward": "пр. Перемоги",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-59",
    "kind": "trolleybus" as TransportKind,
    "number": "59",
    "name": "Тролейбусний маршрут №59 Харків (Станція Рогань - вул. Університетська)",
    "color": "#3498db",
    "headsignForward": "Станція Рогань",
    "headsignBackward": "вул. Університетська",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-6",
    "kind": "trolleybus" as TransportKind,
    "number": "6",
    "name": "Тролейбусний маршрут №6 Харків (вул. Університетська - Станція Основа)",
    "color": "#3498db",
    "headsignForward": "вул. Університетська",
    "headsignBackward": "Станція Основа",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-7",
    "kind": "trolleybus" as TransportKind,
    "number": "7",
    "name": "Тролейбусний маршрут №7 Харків (вул. 12 Квітня - метро Армійська)",
    "color": "#3498db",
    "headsignForward": "вул. 12 Квітня",
    "headsignBackward": "метро Армійська",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  }
];

// Реальна геометрія маршрутів (координати вздовж вулиць), розшифрована з
// офіційних KML-схем. Формат: { [routeId]: [lng, lat][][] } — масив
// сегментів полілінії (кожен сегмент — послідовність точок [lng, lat]).
const ROUTE_GEOMETRIES = routeGeometries as unknown as Record<string, [number, number][][]>;

/** Відстань між двома геоточками (метри), формула гаверсинуса. */
function haversineMeters(a: [number, number], b: [number, number]): number {
  const R = 6371000;
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const rLat1 = (lat1 * Math.PI) / 180;
  const rLat2 = (lat2 * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Розгортає всі сегменти геометрії маршруту в одну послідовність точок [lng, lat]. */
function flattenGeometry(segments: [number, number][][]): [number, number][] {
  const points: [number, number][] = [];
  for (const segment of segments) {
    for (const point of segment) {
      points.push(point);
    }
  }
  return points;
}

/** Точка на ламаній лінії на заданій відстані (у метрах) від початку. */
function pointAtDistance(
  points: [number, number][],
  cumulative: number[],
  targetDist: number
): [number, number] {
  const total = cumulative[cumulative.length - 1];
  const d = Math.max(0, Math.min(targetDist, total));

  for (let i = 1; i < cumulative.length; i++) {
    if (d <= cumulative[i]) {
      const segStart = cumulative[i - 1];
      const segLen = cumulative[i] - segStart;
      const t = segLen === 0 ? 0 : (d - segStart) / segLen;
      const [lng1, lat1] = points[i - 1];
      const [lng2, lat2] = points[i];
      return [lng1 + (lng2 - lng1) * t, lat1 + (lat2 - lat1) * t];
    }
  }
  return points[points.length - 1];
}

baseRoutes.forEach((baseRoute) => {
  const routeStops: string[] = [];

  const rawSegments = ROUTE_GEOMETRIES[baseRoute.id];
  const points = rawSegments && rawSegments.length > 0 ? flattenGeometry(rawSegments) : [];

  if (points.length < 2) {
    // Немає реальної геометрії для цього маршруту — пропускаємо генерацію
    // зупинок (маршрут просто не матиме ліній/зупинок на карті), щоб не
    // засмічувати дані вигаданими координатами.
    routesMap.push({
      ...baseRoute,
      stopIds: [],
      schedule: [],
    });
    return;
  }

  // Кумулятивна довжина ламаної для рівномірного розподілу зупинок.
  const cumulative: number[] = [0];
  for (let i = 1; i < points.length; i++) {
    cumulative.push(cumulative[i - 1] + haversineMeters(points[i - 1], points[i]));
  }
  const totalLength = cumulative[cumulative.length - 1] || 0;

  // Одна зупинка приблизно на кожні ~500м реального маршруту, але не менше
  // 4 і не більше 18, щоб карта лишалась читабельною.
  const stopsCount = Math.max(4, Math.min(18, Math.round(totalLength / 500) + 1));

  const generatedStops = Array.from({ length: stopsCount }, (_, i) => {
    const isFirst = i === 0;
    const isLast = i === stopsCount - 1;
    const targetDist = (i / (stopsCount - 1)) * totalLength;
    const [lng, lat] = pointAtDistance(points, cumulative, targetDist);

    const name = isFirst
      ? baseRoute.headsignForward
      : isLast
        ? baseRoute.headsignBackward
        : `Зупинка ${i} (${baseRoute.number})`;

    return { id: `${baseRoute.id}-stop-${i}`, name, lng, lat };
  });

  generatedStops.forEach((stop) => {
    routeStops.push(stop.id);

    if (!stopsMap.has(stop.id)) {
      stopsMap.set(stop.id, {
        id: stop.id,
        name: stop.name,
        kinds: [baseRoute.kind],
        position: {
          lat: stop.lat,
          lng: stop.lng,
        },
        routeIds: [baseRoute.id],
      });
    } else {
      const existing = stopsMap.get(stop.id)!;
      if (!existing.routeIds.includes(baseRoute.id)) {
        existing.routeIds.push(baseRoute.id);
      }
    }
  });

  routesMap.push({
    ...baseRoute,
    stopIds: routeStops,
    schedule: [],
  });
});

const routesData: RouteItem[] = routesMap;
const stopsData: StopItem[] = Array.from(stopsMap.values());

export interface TripOption {
  route: RouteItem;
  boardStop: StopItem;
  alightStop: StopItem;
  boardDistanceM: number;
  alightDistanceM: number;
}

function distanceMetersLatLng(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/**
 * Підбирає маршрути громадського транспорту, які проходять і біля точки
 * відправлення, і біля точки призначення — простий "будівник маршруту"
 * без бекенду (жодних live-даних, тільки статична геометрія routes.json).
 *
 * Для кожного маршруту шукає найближчу до `from` та найближчу до `to`
 * зупинку з-поміж його власних зупинок; якщо обидві в межах допустимого
 * радіусу (і це різні зупинки) — маршрут вважається придатним варіантом.
 * Радіус пошуку поступово розширюється, якщо нічого не знайдено поруч.
 */
export function buildTripOptions(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  maxOptions = 5
): TripOption[] {
  const RADII_M = [700, 1200, 2200, 4000];

  for (const radius of RADII_M) {
    const candidates: TripOption[] = [];

    for (const route of routesData) {
      let nearestToStart: { stop: StopItem; dist: number } | null = null;
      let nearestToEnd: { stop: StopItem; dist: number } | null = null;

      for (const stopId of route.stopIds) {
        const stop = stopsMap.get(stopId);
        if (!stop) continue;

        const dStart = distanceMetersLatLng(fromLat, fromLng, stop.position.lat, stop.position.lng);
        if (!nearestToStart || dStart < nearestToStart.dist) nearestToStart = { stop, dist: dStart };

        const dEnd = distanceMetersLatLng(toLat, toLng, stop.position.lat, stop.position.lng);
        if (!nearestToEnd || dEnd < nearestToEnd.dist) nearestToEnd = { stop, dist: dEnd };
      }

      if (!nearestToStart || !nearestToEnd) continue;
      if (nearestToStart.stop.id === nearestToEnd.stop.id) continue;
      if (nearestToStart.dist > radius || nearestToEnd.dist > radius) continue;

      candidates.push({
        route,
        boardStop: nearestToStart.stop,
        alightStop: nearestToEnd.stop,
        boardDistanceM: nearestToStart.dist,
        alightDistanceM: nearestToEnd.dist
      });
    }

    if (candidates.length > 0) {
      return candidates
        .sort((a, b) => a.boardDistanceM + a.alightDistanceM - (b.boardDistanceM + b.alightDistanceM))
        .slice(0, maxOptions);
    }
  }

  return [];
}


export const localRoutes = {
  all: (): RouteItem[] => routesData,
  getById: (id: string): RouteItem | undefined => routesData.find((r) => r.id === id),
  getByKind: (kind: TransportKind): RouteItem[] => routesData.filter((r) => r.kind === kind),
  search: (query: string): RouteItem[] => {
    const q = query.toLowerCase();
    return routesData.filter(
      (r) => r.number.toLowerCase().includes(q) || r.name.toLowerCase().includes(q)
    );
  },
  buildTrip: (fromLat: number, fromLng: number, toLat: number, toLng: number): TripOption[] =>
    buildTripOptions(fromLat, fromLng, toLat, toLng)
};

export const localStops = {
  all: (): StopItem[] => stopsData,
  getById: (id: string): StopItem | undefined => stopsData.find((s) => s.id === id),
  search: (query: string): StopItem[] => {
    const q = query.toLowerCase();
    return stopsData.filter((s) => s.name.toLowerCase().includes(q));
  },
  getNearby: (lat: number, lng: number, maxDistance = 1000): StopItem[] => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const distanceMeters = (aLat: number, aLng: number, bLat: number, bLng: number) => {
      const R = 6371000;
      const dLat = toRad(bLat - aLat);
      const dLng = toRad(bLng - aLng);
      const la1 = toRad(aLat);
      const la2 = toRad(bLat);
      const x = dLng * Math.cos((la1 + la2) / 2);
      const y = dLat;
      return Math.sqrt(x * x + y * y) * R;
    };
    return stopsData
      .filter((s) => distanceMeters(lat, lng, s.position.lat, s.position.lng) <= maxDistance)
      .sort(
        (a, b) =>
          distanceMeters(lat, lng, a.position.lat, a.position.lng) -
          distanceMeters(lat, lng, b.position.lat, b.position.lng)
      );
  },
  // Симулює найближчі прибуття для кожного маршруту, що проходить через зупинку,
  // на основі реального інтервалу руху (intervalMinutes) та поточного часу доби.
  // Раніше повертало завжди [] — картка "Прибуття транспорту" ніколи не з'являлась.
  getArrivals: (stopId: string): { routeId: string; etaMinutes: number }[] => {
    const stop = stopsData.find((s) => s.id === stopId);
    if (!stop) return [];

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    return stop.routeIds
      .map((routeId) => {
        const route = routesData.find((r) => r.id === routeId);
        if (!route) return null;

        const [fromH, fromM] = route.firstDeparture.split(':').map(Number);
        const [toH, toM] = route.lastDeparture.split(':').map(Number);
        const startMinutes = fromH * 60 + fromM;
        const endMinutes = toH * 60 + toM;
        if (nowMinutes < startMinutes || nowMinutes > endMinutes) return null;

        const interval = Math.max(route.intervalMinutes || 10, 3);
        // Детермінований, але відмінний для кожного маршруту зсув фази,
        // щоб борти на одній зупинці не прибували всі одночасно.
        const phaseSeed = routeId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
        const minutesIntoInterval = (nowMinutes + phaseSeed) % interval;
        const etaMinutes = interval - minutesIntoInterval;

        return { routeId, etaMinutes: etaMinutes === interval ? 0 : etaMinutes };
      })
      .filter((a): a is { routeId: string; etaMinutes: number } => a !== null);
  }
};
