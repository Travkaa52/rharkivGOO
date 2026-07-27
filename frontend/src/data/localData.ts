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

// Витягуємо координати з масиву у routeGeometries.json
let coordsList: number[][] = [];
if (Array.isArray(routeGeometries)) {
  if (Array.isArray(routeGeometries[0])) {
    // Якщо це масив масивів координат [[lng, lat], [lng, lat], ...]
    coordsList = routeGeometries as number[][];
  }
}

baseRoutes.forEach((baseRoute, index) => {
  const routeStops: string[] = [];

  // Генеруємо основні зупинки для кожного маршруту, використовуючи реальні координати з файлу (або дефолтні у разі нестачі)
  const startCoord = coordsList[index * 2] || [36.23, 50.00];
  const midCoord = coordsList[Math.floor(coordsList.length / 2)] || [36.25, 50.01];
  const endCoord = coordsList[index * 2 + 1] || [36.27, 50.02];

  const generatedStops = [
    { id: `${baseRoute.id}-stop-start`, name: baseRoute.headsignForward, lng: startCoord[0], lat: startCoord[1] },
    { id: `${baseRoute.id}-stop-mid`, name: `Проміжна зупинка (${baseRoute.number})`, lng: midCoord[0], lat: midCoord[1] },
    { id: `${baseRoute.id}-stop-end`, name: baseRoute.headsignBackward, lng: endCoord[0], lat: endCoord[1] }
  ];

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
  buildTrip: (..._args: unknown[]) => ({ routeId: _args[0] as string, segments: [] })
};

export const localStops = {
  all: (): StopItem[] => stopsData,
  getById: (id: string): StopItem | undefined => stopsData.find((s) => s.id === id),
  search: (query: string): StopItem[] => {
    const q = query.toLowerCase();
    return stopsData.filter((s) => s.name.toLowerCase().includes(q));
  },
  getNearby: (_lat: number, _lng: number, _maxDistance = 1000): StopItem[] => stopsData,
  getArrivals: (_stopId: string): { routeId: string; etaMinutes: number }[] => []
};
