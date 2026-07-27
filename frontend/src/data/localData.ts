import { TransportKind } from '@/types/transport';

export interface RouteItem {
  id: string;
  kind: TransportKind;
  number: string;
  name: string;
  color: string;
  stopIds: string[];
  headsignForward: string;
  headsignBackward: string;
  schedule?: unknown;
  firstDeparture?: string;
  lastDeparture?: string;
  intervalMinutes?: number;
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

const routesData: RouteItem[] = [
  {
    "id": "tram-1",
    "kind": "tram",
    "number": "1",
    "name": "Трамвайный маршрут №1 Харьков (Жд вокзал - Ивановка)",
    "color": "#e74c3c",
    "stopIds": [],
    "headsignForward": "Жд вокзал",
    "headsignBackward": "Ивановка",
    "intervalMinutes": 10
  },
  {
    "id": "tram-12",
    "kind": "tram",
    "number": "12",
    "name": "Трамвайный маршрут №12 Харьков (Жд вокзал - Центральный парк)",
    "color": "#e74c3c",
    "stopIds": [],
    "headsignForward": "Жд вокзал",
    "headsignBackward": "Центральный парк",
    "intervalMinutes": 10
  },
  {
    "id": "tram-16",
    "kind": "tram",
    "number": "16",
    "name": "Трамвайный маршрут №16 Харьков (Салтовская - Гидропарк - Салтовская)",
    "color": "#e74c3c",
    "stopIds": [],
    "headsignForward": "Салтовская",
    "headsignBackward": "Гидропарк",
    "intervalMinutes": 10
  },
  {
    "id": "tram-20",
    "kind": "tram",
    "number": "20",
    "name": "Трамвайный маршрут №20 Харьков (пр. Победы - Жд вокзал)",
    "color": "#e74c3c",
    "stopIds": [],
    "headsignForward": "пр. Победы",
    "headsignBackward": "Жд вокзал",
    "intervalMinutes": 10
  },
  {
    "id": "tram-23",
    "kind": "tram",
    "number": "23",
    "name": "Трамвайный маршрут №23 Харьков (Салтовская - 602 мр)",
    "color": "#e74c3c",
    "stopIds": [],
    "headsignForward": "Салтовская",
    "headsignBackward": "602 мр",
    "intervalMinutes": 10
  },
  {
    "id": "tram-27",
    "kind": "tram",
    "number": "27",
    "name": "Трамвайный маршрут №27 Харьков (Салтовская  - Новожаново)",
    "color": "#e74c3c",
    "stopIds": [],
    "headsignForward": "Салтовская",
    "headsignBackward": "Новожаново",
    "intervalMinutes": 10
  },
  {
    "id": "tram-3",
    "kind": "tram",
    "number": "3",
    "name": "Трамвайный маршрут №3 Харьков (Залютино - Новожаново)",
    "color": "#e74c3c",
    "stopIds": [],
    "headsignForward": "Залютино",
    "headsignBackward": "Новожаново",
    "intervalMinutes": 10
  },
  {
    "id": "tram-6",
    "kind": "tram",
    "number": "6",
    "name": "Трамвайный маршрут №6 Харьков (602 мр - Жд вокзал)",
    "color": "#e74c3c",
    "stopIds": [],
    "headsignForward": "602 мр",
    "headsignBackward": "Жд вокзал",
    "intervalMinutes": 10
  },
  {
    "id": "tram-7",
    "kind": "tram",
    "number": "7",
    "name": "Трамвайный маршрут №7 Харьков (Новоселовка - Жд вокзал)",
    "color": "#e74c3c",
    "stopIds": [],
    "headsignForward": "Новоселовка",
    "headsignBackward": "Жд вокзал",
    "intervalMinutes": 10
  },
  {
    "id": "tram-8",
    "kind": "tram",
    "number": "8",
    "name": "Трамвайный маршрут №8 Харьков (602 мр - ул. Одесская)",
    "color": "#e74c3c",
    "stopIds": [],
    "headsignForward": "602 мр",
    "headsignBackward": "ул. Одесская",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-11",
    "kind": "trolleybus",
    "number": "11",
    "name": "Троллебусный маршрут №11 Харьков (метро Площадь Конституции - пр. Дзюбы)",
    "color": "#3498db",
    "stopIds": [],
    "headsignForward": "метро Площадь Конституции",
    "headsignBackward": "пр. Дзюбы",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-12",
    "kind": "trolleybus",
    "number": "12",
    "name": "Троллебусный маршрут №12. Харьков (ул. Рудика - ул. Клочковская)",
    "color": "#3498db",
    "stopIds": [],
    "headsignForward": "ул. Рудика",
    "headsignBackward": "ул. Клочковская",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-1",
    "kind": "trolleybus",
    "number": "1",
    "name": "Троллейбусный маршрут №1 Харьков (м. Дворец Спорта-28 микрорайон)",
    "color": "#3498db",
    "stopIds": [],
    "headsignForward": "м. Дворец Спорта",
    "headsignBackward": "28 микрорайон",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-13",
    "kind": "trolleybus",
    "number": "13",
    "name": "Троллейбусный маршрут №13 Харьков (метро Защитников Украины - парк Зустрич)",
    "color": "#3498db",
    "stopIds": [],
    "headsignForward": "метро Защитников Украины",
    "headsignBackward": "парк Зустрич",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-18",
    "kind": "trolleybus",
    "number": "18",
    "name": "Троллейбусный маршрут №18 Харьков (метро Госпром - Больница неотложной помощи)",
    "color": "#3498db",
    "stopIds": [],
    "headsignForward": "метро Госпром",
    "headsignBackward": "Больница неотложной помощи",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-19",
    "kind": "trolleybus",
    "number": "19",
    "name": "Троллейбусный маршрут №19 Харьков (ул. Одесская - 602 мр)",
    "color": "#3498db",
    "stopIds": [],
    "headsignForward": "ул. Одесская",
    "headsignBackward": "602 мр",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-2",
    "kind": "trolleybus",
    "number": "2",
    "name": "Троллейбусный маршрут №2 Харьков (пр. Жуковского - пр. Победы)",
    "color": "#3498db",
    "stopIds": [],
    "headsignForward": "пр. Жуковского",
    "headsignBackward": "пр. Победы",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-20",
    "kind": "trolleybus",
    "number": "20",
    "name": "Троллейбусный маршрут №20 Харьков (метро Защитников Украины - 602 мр)",
    "color": "#3498db",
    "stopIds": [],
    "headsignForward": "метро Защитников Украины",
    "headsignBackward": "602 мр",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-24",
    "kind": "trolleybus",
    "number": "24",
    "name": "Троллейбусный маршрут №24. Харьков (метро Академика Барабашова - 602 мр)",
    "color": "#3498db",
    "stopIds": [],
    "headsignForward": "метро Академика Барабашова",
    "headsignBackward": "602 мр",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-25",
    "kind": "trolleybus",
    "number": "25",
    "name": "Троллейбусный маршрут №25 Харьков (метро Дворец Спорта - бул. Богдана Хмельницкого)",
    "color": "#3498db",
    "stopIds": [],
    "headsignForward": "метро Дворец Спорта",
    "headsignBackward": "бул. Богдана Хмельницкого",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-3",
    "kind": "trolleybus",
    "number": "3",
    "name": "Троллейбусный маршрут №3 Харьков (ул. Университетская - ул. 12 Апреля)",
    "color": "#3498db",
    "stopIds": [],
    "headsignForward": "ул. Университетская",
    "headsignBackward": "ул. 12 Апреля",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-31",
    "kind": "trolleybus",
    "number": "31",
    "name": "Троллейбусный маршрут №31 Харьков (метро Турбоатом - Северная Салтовка)",
    "color": "#3498db",
    "stopIds": [],
    "headsignForward": "метро Турбоатом",
    "headsignBackward": "Северная Салтовка",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-34",
    "kind": "trolleybus",
    "number": "34",
    "name": "Троллейбусный маршрут №34 Харьков (Восточная Салтовка - ул. Непокоренных)",
    "color": "#3498db",
    "stopIds": [],
    "headsignForward": "Восточная Салтовка",
    "headsignBackward": "ул. Непокоренных",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-35",
    "kind": "trolleybus",
    "number": "35",
    "name": "Троллейбусный маршрут №35 Харьков (ул. Одесская - Северная Салтовка)",
    "color": "#3498db",
    "stopIds": [],
    "headsignForward": "ул. Одесская",
    "headsignBackward": "Северная Салтовка",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-40",
    "kind": "trolleybus",
    "number": "40",
    "name": "Троллейбусный маршрут №40 Харьков (метро Площадь Конституции - пр. Победы)",
    "color": "#3498db",
    "stopIds": [],
    "headsignForward": "метро Площадь Конституции",
    "headsignBackward": "пр. Победы",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-45",
    "kind": "trolleybus",
    "number": "45",
    "name": "Троллейбусный маршрут №45 Харьков (ул. 12 апреля - ул. Роганская)",
    "color": "#3498db",
    "stopIds": [],
    "headsignForward": "ул. 12 апреля",
    "headsignBackward": "ул. Роганская",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-46",
    "kind": "trolleybus",
    "number": "46",
    "name": "Троллейбусный маршрут №46 Харьков (мр Горизонт - ул. 12 Апреля)",
    "color": "#3498db",
    "stopIds": [],
    "headsignForward": "мр Горизонт",
    "headsignBackward": "ул. 12 Апреля",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-49",
    "kind": "trolleybus",
    "number": "49",
    "name": "Троллейбусный маршрут №49 Харьков (ул. Университенская - пос. Жихарь)",
    "color": "#3498db",
    "stopIds": [],
    "headsignForward": "ул. Университетская",
    "headsignBackward": "пос. Жихарь",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-51",
    "kind": "trolleybus",
    "number": "51",
    "name": "Троллейбусный маршрут №51 Харьков (ул. 12 апреля - ул. Зубарева)",
    "color": "#3498db",
    "stopIds": [],
    "headsignForward": "ул. 12 апреля",
    "headsignBackward": "ул. Зубарева",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-52",
    "kind": "trolleybus",
    "number": "52",
    "name": "Троллейбусный маршрут №52 Харьков (ул. 12 Апреля - 759 мр)",
    "color": "#3498db",
    "stopIds": [],
    "headsignForward": "ул. 12 Апреля",
    "headsignBackward": "759 мр",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-53",
    "kind": "trolleybus",
    "number": "53",
    "name": "Троллейбусный маршрут №53. Харьков (ул. 12 Апреля - мн  Горизонт)",
    "color": "#3498db",
    "stopIds": [],
    "headsignForward": "ул. 12 Апреля",
    "headsignBackward": "мн Горизонт",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-55",
    "kind": "trolleybus",
    "number": "55",
    "name": "Троллейбусный маршрут №55 Харьков (м. Площадь Конституции - пр. Жуковского)",
    "color": "#3498db",
    "stopIds": [],
    "headsignForward": "м. Площадь Конституции",
    "headsignBackward": "пр. Жуковского",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-56",
    "kind": "trolleybus",
    "number": "56",
    "name": "Троллейбусный маршрут №56 Харьков (м. Академика Барабашова - Восточная Салтовка)",
    "color": "#3498db",
    "stopIds": [],
    "headsignForward": "м. Академика Барабашова",
    "headsignBackward": "Восточная Салтовка",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-57",
    "kind": "trolleybus",
    "number": "57",
    "name": "Троллейбусный маршрут №57 Харьков (парк Зустрич - метро Академика Барабашова)",
    "color": "#3498db",
    "stopIds": [],
    "headsignForward": "парк Зустрич",
    "headsignBackward": "метро Академика Барабашова",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-58",
    "kind": "trolleybus",
    "number": "58",
    "name": "Троллейбусный маршрут №58 Харьков (Аэропорт - пр. Победы)",
    "color": "#3498db",
    "stopIds": [],
    "headsignForward": "Аэропорт",
    "headsignBackward": "пр. Победы",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-59",
    "kind": "trolleybus",
    "number": "59",
    "name": "Троллейбусный маршрут №59 Харьков (Станция Рогань - ул. Университетская)",
    "color": "#3498db",
    "stopIds": [],
    "headsignForward": "Станция Рогань",
    "headsignBackward": "ул. Университетская",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-6",
    "kind": "trolleybus",
    "number": "6",
    "name": "Троллейбусный маршрут №6 Харьков (ул. Университетская - Станция Основа)",
    "color": "#3498db",
    "stopIds": [],
    "headsignForward": "ул. Университетская",
    "headsignBackward": "Станция Основа",
    "intervalMinutes": 10
  },
  {
    "id": "trolleybus-7",
    "kind": "trolleybus",
    "number": "7",
    "name": "Троллейбусный маршрут №7 Харьков (ул. 12 Апреля - метро Армейская)",
    "color": "#3498db",
    "stopIds": [],
    "headsignForward": "ул. 12 Апреля",
    "headsignBackward": "метро Армейская",
    "intervalMinutes": 10
  }
];

const stopsData: StopItem[] = [];

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
