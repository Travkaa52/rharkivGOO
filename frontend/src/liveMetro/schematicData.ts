/**
 * Схематичні (не геокоординатні) дані для екрана «Живе метро».
 *
 * Розташування станцій тут повторює компонування офіційної схеми
 * Харківського метрополітену (як на друкованій схемі в вагонах/на станціях):
 * три лінії, порядок станцій НЕ змінюється (він точно відповідає stopIds
 * з routes.json), три реальні пересадочні вузли:
 *  - Держпром (Л3) ↔ Університет (Л2)
 *  - Майдан Конституції (Л1) ↔ Історичний музей (Л2, кінцева)
 *  - Спортивна (Л1) ↔ Метробудівників (Л3, кінцева)
 *
 * Координати — умовні одиниці схеми (viewBox 0 0 1200 1000), не географічні,
 * але пропорції та взаємне розташування ліній підібрані «1в1» під офіційну схему.
 */

export interface SchematicPoint {
  x: number;
  y: number;
}

export interface SchematicStation {
  /** Має збігатись з id зупинки в stops.json (для показу реальної назви/зв'язку з іншими шарами). */
  id: string;
  name: string;
  point: SchematicPoint;
  /** Час прибуття (від початку рейсу прямого напрямку), секунд — з routes.json. */
  arrivalOffsetSec: number;
  /** id станцій-пересадок на інші лінії (для позначки на схемі). */
  interchangeWith?: string[];
}

export type LiveMetroDayType = 'weekday' | 'weekend';

export interface SchematicLine {
  id: string;
  number: string;
  name: string;
  color: string;
  /** Станції в порядку "прямого" напрямку (forward), як у stopIds лінії. */
  stations: SchematicStation[];
  /** Назва кінцевої прямого напрямку (headsign forward). */
  headsignForward: string;
  /** Назва кінцевої зворотного напрямку (headsign backward). */
  headsignBackward: string;
  /** Перший рейс прямого напрямку, "HH:MM", окремо для буднів/вихідних. */
  firstDepartureForward: Record<LiveMetroDayType, string>;
  /** Перший рейс зворотного напрямку, "HH:MM", окремо для буднів/вихідних. */
  firstDepartureBackward: Record<LiveMetroDayType, string>;
  /** Останній можливий момент відправлення (обидва напрямки, як в routes.json). */
  lastDeparture: string;
  /** Інтервал руху, хвилин. */
  intervalMinutes: Record<LiveMetroDayType, number>;
}

/** Час стоянки на станції (відкриті двері), секунд — використовується у фізиці руху. */
export const DWELL_SEC = 25;

const LINE_1_STATIONS: SchematicStation[] = [
  { id: 'stop-metro-holodna-gora', name: 'Холодна Гора', point: { x: 60, y: 480 }, arrivalOffsetSec: 0 },
  { id: 'stop-metro-vokzalna', name: 'Вокзальна', point: { x: 150, y: 460 }, arrivalOffsetSec: 205 },
  { id: 'stop-metro-tsentralnyi-rynok', name: 'Центральний ринок', point: { x: 230, y: 500 }, arrivalOffsetSec: 345 },
  {
    id: 'stop-metro-maidan-konstytutsii',
    name: 'Майдан Конституції',
    point: { x: 330, y: 540 },
    arrivalOffsetSec: 465,
    interchangeWith: ['stop-metro-istorychnyi-muzei']
  },
  { id: 'stop-metro-levada', name: 'Левада', point: { x: 300, y: 620 }, arrivalOffsetSec: 635 },
  {
    id: 'stop-metro-sportyvna',
    name: 'Спортивна',
    point: { x: 430, y: 660 },
    arrivalOffsetSec: 790,
    interchangeWith: ['stop-metro-metrobudivnykiv']
  },
  { id: 'stop-metro-zavodska', name: 'Заводська', point: { x: 520, y: 700 }, arrivalOffsetSec: 969 },
  { id: 'stop-metro-turboatom', name: 'Турбоатом', point: { x: 600, y: 745 }, arrivalOffsetSec: 1154 },
  { id: 'stop-metro-palats-sportu', name: 'Палац Спорту', point: { x: 670, y: 790 }, arrivalOffsetSec: 1337 },
  { id: 'stop-metro-armiiska', name: 'Армійська', point: { x: 740, y: 830 }, arrivalOffsetSec: 1535 },
  { id: 'stop-metro-imeni-o-s-maselskogo', name: 'Імені О. С. Масельського', point: { x: 810, y: 870 }, arrivalOffsetSec: 1690 },
  { id: 'stop-metro-traktornyi-zavod', name: 'Тракторний завод', point: { x: 900, y: 900 }, arrivalOffsetSec: 1863 },
  { id: 'stop-metro-industrialna', name: 'Індустріальна', point: { x: 1030, y: 900 }, arrivalOffsetSec: 2053 }
];

const LINE_2_STATIONS: SchematicStation[] = [
  { id: 'stop-metro-saltivska', name: 'Салтівська', point: { x: 990, y: 60 }, arrivalOffsetSec: 0 },
  { id: 'stop-metro-studentska', name: 'Студентська', point: { x: 930, y: 130 }, arrivalOffsetSec: 126 },
  { id: 'stop-metro-akademika-pavlova', name: 'Академіка Павлова', point: { x: 870, y: 200 }, arrivalOffsetSec: 271 },
  { id: 'stop-metro-akademika-barabashova', name: 'Академіка Барабашова', point: { x: 810, y: 270 }, arrivalOffsetSec: 437 },
  { id: 'stop-metro-kyivska', name: 'Київська', point: { x: 740, y: 340 }, arrivalOffsetSec: 702 },
  { id: 'stop-metro-iaroslava-mudrogo', name: 'Ярослава Мудрого', point: { x: 650, y: 400 }, arrivalOffsetSec: 897 },
  {
    id: 'stop-metro-universytet',
    name: 'Університет',
    point: { x: 560, y: 460 },
    arrivalOffsetSec: 1017,
    interchangeWith: ['stop-metro-derzhprom']
  },
  {
    id: 'stop-metro-istorychnyi-muzei',
    name: 'Історичний музей',
    point: { x: 390, y: 560 },
    arrivalOffsetSec: 1176,
    interchangeWith: ['stop-metro-maidan-konstytutsii']
  }
];

const LINE_3_STATIONS: SchematicStation[] = [
  { id: 'stop-metro-peremoga', name: 'Перемога', point: { x: 480, y: 60 }, arrivalOffsetSec: 0 },
  { id: 'stop-metro-oleksiivska', name: 'Олексіївська', point: { x: 450, y: 140 }, arrivalOffsetSec: 147 },
  { id: 'stop-metro-23-serpnia', name: '23 Серпня', point: { x: 430, y: 220 }, arrivalOffsetSec: 374 },
  { id: 'stop-metro-botanichnyi-sad', name: 'Ботанічний сад', point: { x: 450, y: 290 }, arrivalOffsetSec: 486 },
  { id: 'stop-metro-naukova', name: 'Наукова', point: { x: 490, y: 360 }, arrivalOffsetSec: 676 },
  {
    id: 'stop-metro-derzhprom',
    name: 'Держпром',
    point: { x: 555, y: 430 },
    arrivalOffsetSec: 788,
    interchangeWith: ['stop-metro-universytet']
  },
  { id: 'stop-metro-arhitektora-beketova', name: 'Архітектора Бекетова', point: { x: 490, y: 520 }, arrivalOffsetSec: 921 },
  { id: 'stop-metro-zahysnykiv-ukrainy', name: 'Захисників України', point: { x: 450, y: 590 }, arrivalOffsetSec: 1160 },
  {
    id: 'stop-metro-metrobudivnykiv',
    name: 'Метробудівників',
    point: { x: 420, y: 660 },
    arrivalOffsetSec: 1301,
    interchangeWith: ['stop-metro-sportyvna']
  }
];

export const SCHEMATIC_LINES: SchematicLine[] = [
  {
    id: 'route-metro-1',
    number: 'М1',
    name: 'Холодногірсько-Заводська лінія',
    color: '#E30613',
    stations: LINE_1_STATIONS,
    headsignForward: 'Індустріальна',
    headsignBackward: 'Холодна Гора',
    firstDepartureForward: { weekday: '05:31', weekend: '05:40' },
    firstDepartureBackward: { weekday: '05:34', weekend: '05:40' },
    lastDeparture: '22:00',
    intervalMinutes: { weekday: 10, weekend: 20 }
  },
  {
    id: 'route-metro-2',
    number: 'М2',
    name: 'Салтівська лінія',
    color: '#0072BC',
    stations: LINE_2_STATIONS,
    headsignForward: 'Історичний музей',
    headsignBackward: 'Салтівська',
    firstDepartureForward: { weekday: '05:38', weekend: '05:38' },
    firstDepartureBackward: { weekday: '05:35', weekend: '05:35' },
    lastDeparture: '22:00',
    intervalMinutes: { weekday: 10, weekend: 20 }
  },
  {
    id: 'route-metro-3',
    number: 'М3',
    name: 'Олексіївська лінія',
    color: '#009444',
    stations: LINE_3_STATIONS,
    headsignForward: 'Метробудівників',
    headsignBackward: 'Перемога',
    firstDepartureForward: { weekday: '05:32', weekend: '05:35' },
    firstDepartureBackward: { weekday: '05:36', weekend: '05:40' },
    lastDeparture: '22:00',
    intervalMinutes: { weekday: 10, weekend: 20 }
  }
];
