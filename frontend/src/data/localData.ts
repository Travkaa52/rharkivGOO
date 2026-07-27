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

const baseRoutes = [
  {
    "id": "tram-1",
    "kind": "tram" as TransportKind,
    "number": "1",
    "name": "Трамвайный маршрут №1 Харьков (Жд вокзал - Ивановка)",
    "color": "#e74c3c",
    "headsignForward": "Жд вокзал",
    "headsignBackward": "Ивановка",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "tram-12",
    "kind": "tram" as TransportKind,
    "number": "12",
    "name": "Трамвайный маршрут №12 Харьков (Жд вокзал - Центральный парк)",
    "color": "#e74c3c",
    "headsignForward": "Жд вокзал",
    "headsignBackward": "Центральный парк",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "tram-16",
    "kind": "tram" as TransportKind,
    "number": "16",
    "name": "Трамвайный маршрут №16 Харьков (Салтовская - Гидропарк - Салтовская)",
    "color": "#e74c3c",
    "headsignForward": "Салтовская",
    "headsignBackward": "Гидропарк",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "tram-20",
    "kind": "tram" as TransportKind,
    "number": "20",
    "name": "Трамвайный маршрут №20 Харьков (пр. Победы - Жд вокзал)",
    "color": "#e74c3c",
    "headsignForward": "пр. Победы",
    "headsignBackward": "Жд вокзал",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "tram-23",
    "kind": "tram" as TransportKind,
    "number": "23",
    "name": "Трамвайный маршрут №23 Харьков (Салтовская - 602 мр)",
    "color": "#e74c3c",
    "headsignForward": "Салтовская",
    "headsignBackward": "602 мр",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "tram-27",
    "kind": "tram" as TransportKind,
    "number": "27",
    "name": "Трамвайный маршрут №27 Харьков (Салтовская  - Новожаново)",
    "color": "#e74c3c",
    "headsignForward": "Салтовская",
    "headsignBackward": "Новожаново",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "tram-3",
    "kind": "tram" as TransportKind,
    "number": "3",
    "name": "Трамвайный маршрут №3 Харьков (Залютино - Новожаново)",
    "color": "#e74c3c",
    "headsignForward": "Залютино",
    "headsignBackward": "Новожаново",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "tram-6",
    "kind": "tram" as TransportKind,
    "number": "6",
    "name": "Трамвайный маршрут №6 Харьков (602 мр - Жд вокзал)",
    "color": "#e74c3c",
    "headsignForward": "602 мр",
    "headsignBackward": "Жд вокзал",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "tram-7",
    "kind": "tram" as TransportKind,
    "number": "7",
    "name": "Трамвайный маршрут №7 Харьков (Новоселовка - Жд вокзал)",
    "color": "#e74c3c",
    "headsignForward": "Новоселовка",
    "headsignBackward": "Жд вокзал",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "tram-8",
    "kind": "tram" as TransportKind,
    "number": "8",
    "name": "Трамвайный маршрут №8 Харьков (602 мр - ул. Одесская)",
    "color": "#e74c3c",
    "headsignForward": "602 мр",
    "headsignBackward": "ул. Одесская",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-11",
    "kind": "trolleybus" as TransportKind,
    "number": "11",
    "name": "Троллебусный маршрут №11 Харьков (метро Площадь Конституции - пр. Дзюбы)",
    "color": "#3498db",
    "headsignForward": "метро Площадь Конституции",
    "headsignBackward": "пр. Дзюбы",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-12",
    "kind": "trolleybus" as TransportKind,
    "number": "12",
    "name": "Троллебусный маршрут №12. Харьков (ул. Рудика - ул. Клочковская)",
    "color": "#3498db",
    "headsignForward": "ул. Рудика",
    "headsignBackward": "ул. Клочковская",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-1",
    "kind": "trolleybus" as TransportKind,
    "number": "1",
    "name": "Троллейбусный маршрут №1 Харьков (м. Дворец Спорта-28 микрорайон)",
    "color": "#3498db",
    "headsignForward": "м. Дворец Спорта",
    "headsignBackward": "28 микрорайон",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-13",
    "kind": "trolleybus" as TransportKind,
    "number": "13",
    "name": "Троллейбусный маршрут №13 Харьков (метро Защитников Украины - парк Зустрич)",
    "color": "#3498db",
    "headsignForward": "метро Защитников Украины",
    "headsignBackward": "парк Зустрич",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-18",
    "kind": "trolleybus" as TransportKind,
    "number": "18",
    "name": "Троллейбусный маршрут №18 Харьков (метро Госпром - Больница неотложной помощи)",
    "color": "#3498db",
    "headsignForward": "метро Госпром",
    "headsignBackward": "Больница неотложной помощи",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-19",
    "kind": "trolleybus" as TransportKind,
    "number": "19",
    "name": "Троллейбусный маршрут №19 Харьков (ул. Одесская - 602 мр)",
    "color": "#3498db",
    "headsignForward": "ул. Одесская",
    "headsignBackward": "602 мр",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-2",
    "kind": "trolleybus" as TransportKind,
    "number": "2",
    "name": "Троллейбусный маршрут №2 Харьков (пр. Жуковского - пр. Победы)",
    "color": "#3498db",
    "headsignForward": "пр. Жуковского",
    "headsignBackward": "пр. Победы",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-20",
    "kind": "trolleybus" as TransportKind,
    "number": "20",
    "name": "Троллейбусный маршрут №20 Харьков (метро Защитников Украины - 602 мр)",
    "color": "#3498db",
    "headsignForward": "метро Защитников Украины",
    "headsignBackward": "602 мр",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-24",
    "kind": "trolleybus" as TransportKind,
    "number": "24",
    "name": "Троллейбусный маршрут №24. Харьков (метро Академика Барабашова - 602 мр)",
    "color": "#3498db",
    "headsignForward": "метро Академика Барабашова",
    "headsignBackward": "602 мр",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-25",
    "kind": "trolleybus" as TransportKind,
    "number": "25",
    "name": "Троллейбусный маршрут №25 Харьков (метро Дворец Спорта - бул. Богдана Хмельницкого)",
    "color": "#3498db",
    "headsignForward": "метро Дворец Спорта",
    "headsignBackward": "бул. Богдана Хмельницкого",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-3",
    "kind": "trolleybus" as TransportKind,
    "number": "3",
    "name": "Троллейбусный маршрут №3 Харьков (ул. Университетская - ул. 12 Апреля)",
    "color": "#3498db",
    "headsignForward": "ул. Университетская",
    "headsignBackward": "ул. 12 Апреля",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-31",
    "kind": "trolleybus" as TransportKind,
    "number": "31",
    "name": "Троллейбусный маршрут №31 Харьков (метро Турбоатом - Северная Салтовка)",
    "color": "#3498db",
    "headsignForward": "метро Турбоатом",
    "headsignBackward": "Северная Салтовка",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-34",
    "kind": "trolleybus" as TransportKind,
    "number": "34",
    "name": "Троллейбусный маршрут №34 Харьков (Восточная Салтовка - ул. Непокоренных)",
    "color": "#3498db",
    "headsignForward": "Восточная Салтовка",
    "headsignBackward": "ул. Непокоренных",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-35",
    "kind": "trolleybus" as TransportKind,
    "number": "35",
    "name": "Троллейбусный маршрут №35 Харьков (ул. Одесская - Северная Салтовка)",
    "color": "#3498db",
    "headsignForward": "ул. Одесская",
    "headsignBackward": "Северная Салтовка",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-40",
    "kind": "trolleybus" as TransportKind,
    "number": "40",
    "name": "Троллейбусный маршрут №40 Харьков (метро Площадь Конституции - пр. Победы)",
    "color": "#3498db",
    "headsignForward": "метро Площадь Конституции",
    "headsignBackward": "пр. Победы",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-45",
    "kind": "trolleybus" as TransportKind,
    "number": "45",
    "name": "Троллейбусный маршрут №45 Харьков (ул. 12 апреля - ул. Роганская)",
    "color": "#3498db",
    "headsignForward": "ул. 12 апреля",
    "headsignBackward": "ул. Роганская",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-46",
    "kind": "trolleybus" as TransportKind,
    "number": "46",
    "name": "Троллейбусный маршрут №46 Харьков (мр Горизонт - ул. 12 Апреля)",
    "color": "#3498db",
    "headsignForward": "мр Горизонт",
    "headsignBackward": "ул. 12 Апреля",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-49",
    "kind": "trolleybus" as TransportKind,
    "number": "49",
    "name": "Троллейбусный маршрут №49 Харьков (ул. Университенская - пос. Жихарь)",
    "color": "#3498db",
    "headsignForward": "ул. Университетская",
    "headsignBackward": "пос. Жихарь",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-51",
    "kind": "trolleybus" as TransportKind,
    "number": "51",
    "name": "Троллейбусный маршрут №51 Харьков (ул. 12 апреля - ул. Зубарева)",
    "color": "#3498db",
    "headsignForward": "ул. 12 апреля",
    "headsignBackward": "ул. Зубарева",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-52",
    "kind": "trolleybus" as TransportKind,
    "number": "52",
    "name": "Троллейбусный маршрут №52 Харьков (ул. 12 Апреля - 759 мр)",
    "color": "#3498db",
    "headsignForward": "ул. 12 Апреля",
    "headsignBackward": "759 мр",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-53",
    "kind": "trolleybus" as TransportKind,
    "number": "53",
    "name": "Троллейбусный маршрут №53. Харьков (ул. 12 Апреля - мн  Горизонт)",
    "color": "#3498db",
    "headsignForward": "ул. 12 Апреля",
    "headsignBackward": "мн Горизонт",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-55",
    "kind": "trolleybus" as TransportKind,
    "number": "55",
    "name": "Троллейбусный маршрут №55 Харьков (м. Площадь Конституции - пр. Жуковского)",
    "color": "#3498db",
    "headsignForward": "м. Площадь Конституции",
    "headsignBackward": "пр. Жуковского",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-56",
    "kind": "trolleybus" as TransportKind,
    "number": "56",
    "name": "Троллейбусный маршрут №56 Харьков (м. Академика Барабашова - Восточная Салтовка)",
    "color": "#3498db",
    "headsignForward": "м. Академика Барабашова",
    "headsignBackward": "Восточная Салтовка",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-57",
    "kind": "trolleybus" as TransportKind,
    "number": "57",
    "name": "Троллейбусный маршрут №57 Харьков (парк Зустрич - метро Академика Барабашова)",
    "color": "#3498db",
    "headsignForward": "парк Зустрич",
    "headsignBackward": "метро Академика Барабашова",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-58",
    "kind": "trolleybus" as TransportKind,
    "number": "58",
    "name": "Троллейбусный маршрут №58 Харьков (Аэропорт - пр. Победы)",
    "color": "#3498db",
    "headsignForward": "Аэропорт",
    "headsignBackward": "пр. Победы",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-59",
    "kind": "trolleybus" as TransportKind,
    "number": "59",
    "name": "Троллейбусный маршрут №59 Харьков (Станция Рогань - ул. Университетская)",
    "color": "#3498db",
    "headsignForward": "Станция Рогань",
    "headsignBackward": "ул. Университетская",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-6",
    "kind": "trolleybus" as TransportKind,
    "number": "6",
    "name": "Троллейбусный маршрут №6 Харьков (ул. Университетская - Станция Основа)",
    "color": "#3498db",
    "headsignForward": "ул. Университетская",
    "headsignBackward": "Станция Основа",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-7",
    "kind": "trolleybus" as TransportKind,
    "number": "7",
    "name": "Троллейбусный маршрут №7 Харьков (ул. 12 Апреля - метро Армейская)",
    "color": "#3498db",
    "headsignForward": "ул. 12 Апреля",
    "headsignBackward": "метро Армейская",
    "firstDeparture": "06:00",
    "lastDeparture": "22:00",
    "intervalMinutes": 10
  }
];

const geometriesArray = Array.isArray(routeGeometries) 
  ? routeGeometries 
  : ((routeGeometries as any)?.routes || (routeGeometries as any)?.features || []);

baseRoutes.forEach((baseRoute) => {
  const geoMatch: any = geometriesArray.find((g: any) => g.id === baseRoute.id || `${g.kind}-${g.number}` === baseRoute.id);
  const routeStops: string[] = [];

  if (geoMatch && Array.isArray(geoMatch.stops)) {
    geoMatch.stops.forEach((stop: any, index: number) => {
      const stopId = stop.id || `${baseRoute.id}-stop-${index}`;
      routeStops.push(stopId);

      if (!stopsMap.has(stopId)) {
        stopsMap.set(stopId, {
          id: stopId,
          name: stop.name || `Остановка ${index + 1}`,
          kinds: [baseRoute.kind],
          position: {
            lat: stop.lat || stop.latitude || stop.coordinates?.[1] || 50.0,
            lng: stop.lng || stop.longitude || stop.coordinates?.[0] || 36.2,
          },
          routeIds: [baseRoute.id],
        });
      } else {
        const existing = stopsMap.get(stopId)!;
        if (!existing.routeIds.includes(baseRoute.id)) {
          existing.routeIds.push(baseRoute.id);
        }
        if (!existing.kinds.includes(baseRoute.kind)) {
          existing.kinds.push(baseRoute.kind);
        }
      }
    });
  }

  routesMap.push({
    ...baseRoute,
    stopIds: routeStops,
    schedule: geoMatch?.schedule || [],
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
