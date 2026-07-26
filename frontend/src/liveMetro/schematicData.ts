/**
 * Схематичні (не геокоординатні) дані для екрана «Живе метро».
 *
 * Розташування станцій тут — це умовна схема на кшталт офіційної схеми
 * Харківського метрополітену: три лінії, порядок станцій НЕ змінюється
 * (він точно відповідає stopIds з routes.json), збережено дві реальні
 * пересадочні точки:
 *  - Майдан Конституції (Л1) ↔ Університет (Л2)
 *  - Спортивна (Л1) ↔ Історичний музей (Л2, кінцева) ↔ Держпром (Л3)
 *
 * Координати — умовні одиниці схеми (viewBox 0 0 1200 1000), не географічні.
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
  { id: 'stop-metro-holodna-gora', name: 'Холодна Гора', point: { x: 120, y: 520 }, arrivalOffsetSec: 0 },
  { id: 'stop-metro-vokzalna', name: 'Вокзальна', point: { x: 210, y: 495 }, arrivalOffsetSec: 205 },
  { id: 'stop-metro-tsentralnyi-rynok', name: 'Центральний ринок', point: { x: 300, y: 470 }, arrivalOffsetSec: 345 },
  {
    id: 'stop-metro-maidan-konstytutsii',
    name: 'Майдан Конституції',
    point: { x: 390, y: 445 },
    arrivalOffsetSec: 465,
    interchangeWith: ['stop-metro-universytet']
  },
  { id: 'stop-metro-levada', name: 'Левада', point: { x: 470, y: 470 }, arrivalOffsetSec: 635 },
  {
    id: 'stop-metro-sportyvna',
    name: 'Спортивна',
    point: { x: 555, y: 500 },
    arrivalOffsetSec: 790,
    interchangeWith: ['stop-metro-istorychnyi-muzei', 'stop-metro-derzhprom']
  },
  { id: 'stop-metro-zavodska', name: 'Заводська', point: { x: 630, y: 565 }, arrivalOffsetSec: 969 },
  { id: 'stop-metro-turboatom', name: 'Турбоатом', point: { x: 700, y: 625 }, arrivalOffsetSec: 1154 },
  { id: 'stop-metro-palats-sportu', name: 'Палац Спорту', point: { x: 765, y: 685 }, arrivalOffsetSec: 1337 },
  { id: 'stop-metro-armiiska', name: 'Армійська', point: { x: 830, y: 735 }, arrivalOffsetSec: 1535 },
  { id: 'stop-metro-imeni-o-s-maselskogo', name: 'Імені О. С. Масельського', point: { x: 895, y: 785 }, arrivalOffsetSec: 1690 },
  { id: 'stop-metro-traktornyi-zavod', name: 'Тракторний завод', point: { x: 960, y: 835 }, arrivalOffsetSec: 1863 },
  { id: 'stop-metro-industrialna', name: 'Індустріальна', point: { x: 1025, y: 880 }, arrivalOffsetSec: 2053 }
];

const LINE_2_STATIONS: SchematicStation[] = [
  { id: 'stop-metro-saltivska', name: 'Салтівська', point: { x: 700, y: 60 }, arrivalOffsetSec: 0 },
  { id: 'stop-metro-studentska', name: 'Студентська', point: { x: 678, y: 140 }, arrivalOffsetSec: 126 },
  { id: 'stop-metro-akademika-pavlova', name: 'Академіка Павлова', point: { x: 650, y: 220 }, arrivalOffsetSec: 271 },
  { id: 'stop-metro-akademika-barabashova', name: 'Академіка Барабашова', point: { x: 612, y: 300 }, arrivalOffsetSec: 437 },
  { id: 'stop-metro-kyivska', name: 'Київська', point: { x: 565, y: 365 }, arrivalOffsetSec: 702 },
  { id: 'stop-metro-iaroslava-mudrogo', name: 'Ярослава Мудрого', point: { x: 490, y: 405 }, arrivalOffsetSec: 897 },
  {
    id: 'stop-metro-universytet',
    name: 'Університет',
    point: { x: 415, y: 430 },
    arrivalOffsetSec: 1017,
    interchangeWith: ['stop-metro-maidan-konstytutsii']
  },
  {
    id: 'stop-metro-istorychnyi-muzei',
    name: 'Історичний музей',
    point: { x: 560, y: 525 },
    arrivalOffsetSec: 1176,
    interchangeWith: ['stop-metro-sportyvna', 'stop-metro-derzhprom']
  }
];

const LINE_3_STATIONS: SchematicStation[] = [
  { id: 'stop-metro-peremoga', name: 'Перемога', point: { x: 950, y: 150 }, arrivalOffsetSec: 0 },
  { id: 'stop-metro-oleksiivska', name: 'Олексіївська', point: { x: 895, y: 230 }, arrivalOffsetSec: 147 },
  { id: 'stop-metro-23-serpnia', name: '23 Серпня', point: { x: 840, y: 300 }, arrivalOffsetSec: 374 },
  { id: 'stop-metro-botanichnyi-sad', name: 'Ботанічний сад', point: { x: 790, y: 360 }, arrivalOffsetSec: 486 },
  { id: 'stop-metro-naukova', name: 'Наукова', point: { x: 715, y: 410 }, arrivalOffsetSec: 676 },
  {
    id: 'stop-metro-derzhprom',
    name: 'Держпром',
    point: { x: 585, y: 485 },
    arrivalOffsetSec: 788,
    interchangeWith: ['stop-metro-sportyvna', 'stop-metro-istorychnyi-muzei']
  },
  { id: 'stop-metro-arhitektora-beketova', name: 'Архітектора Бекетова', point: { x: 605, y: 565 }, arrivalOffsetSec: 921 },
  { id: 'stop-metro-zahysnykiv-ukrainy', name: 'Захисників України', point: { x: 625, y: 655 }, arrivalOffsetSec: 1160 },
  { id: 'stop-metro-metrobudivnykiv', name: 'Метробудівників', point: { x: 645, y: 745 }, arrivalOffsetSec: 1301 }
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
