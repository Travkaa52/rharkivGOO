/**
 * Схематичні дані Харківського метрополітену — координати станцій, лінії,
 * пересадочні вузли та розклад руху. Це єдине джерело правди для "живої
 * карти" (LiveMetroPage) — координати підібрані так, щоб схема повторювала
 * офіційну карту (три лінії, що сходяться у центрі трьома парами
 * пересадочних станцій).
 */

export type LiveMetroDayType = 'weekday' | 'weekend';

/** Скільки секунд потяг стоїть на станції з відкритими дверима. */
export const DWELL_SEC = 25;

export interface SchematicStation {
  id: string;
  name: string;
  nameEn: string;
  point: { x: number; y: number };
  /** Час прибуття від початкової станції лінії (пряме сполучення), сек. */
  arrivalOffsetSec: number;
  /** id станцій-пересадок (на інших лініях), з якими є перехід. */
  interchangeWith?: string[];
}

export interface SchematicLine {
  id: string;
  number: '1' | '2' | '3';
  name: string;
  nameEn: string;
  color: string;
  stations: SchematicStation[];
  intervalMinutes: Record<LiveMetroDayType, number>;
  firstDepartureForward: Record<LiveMetroDayType, string>;
  firstDepartureBackward: Record<LiveMetroDayType, string>;
  lastDeparture: string;
  /** Напрямок "вперед" (за порядком станцій) — назва кінцевої. */
  headsignForward: string;
  /** Напрямок "назад" — назва початкової станції. */
  headsignBackward: string;
}

const st = (
  id: string,
  name: string,
  nameEn: string,
  x: number,
  y: number,
  arrivalOffsetSec: number,
  interchangeWith?: string[]
): SchematicStation => ({ id: `stop-metro-${id}`, name, nameEn, point: { x, y }, arrivalOffsetSec, interchangeWith });

export const LINE_RED = 'route-metro-1';
export const LINE_BLUE = 'route-metro-2';
export const LINE_GREEN = 'route-metro-3';

/** Лінія 1 — Холодногірсько-Заводська (червона). */
const redStations: SchematicStation[] = [
  st('holodna-gora', 'Холодна гора', 'Kholodna Hora', 60, 480, 0),
  st('vokzalna', 'Південний вокзал', 'Pivdenniy Vokzal', 175, 480, 110),
  st('tsentralnyi-rynok', 'Центральний ринок', 'Tsentralniy Rynok', 290, 505, 230),
  st('maidan-konstytutsii', 'Майдан Конституції', 'Maydan Konstytutsiy', 490, 660, 380, ['stop-metro-istorychnyi-muzei']),
  st('levada', 'Проспект Гагаріна', 'Prospekt Gagarina', 475, 745, 490),
  st('sportyvna', 'Спортивна', 'Sportyvna', 555, 780, 590, ['stop-metro-metrobudivnykiv']),
  st('zavodska', 'Завод ім. Малишева', 'Zavod imeni Malysheva', 680, 830, 710),
  st('turboatom', 'Турбоатом', 'Turboatom', 720, 910, 830),
  st('palats-sportu', 'Палац Спорту', 'Palats Sportu', 750, 990, 950),
  st('armiiska', 'Армійська', 'Armiyska', 780, 1060, 1070),
  st('imeni-o-s-maselskogo', 'Ім. О.С. Масельського', 'Imeni O.S. Maselskoho', 900, 1060, 1190),
  st('traktornyi-zavod', 'Тракторний завод', 'Traktorniy Zavod', 1010, 1060, 1310),
  st('industrialna', 'Індустріальна', 'Industrialna', 1120, 1060, 1430)
];

/** Лінія 2 — Салтівська (синя). */
const blueStations: SchematicStation[] = [
  st('heroiv-pratsi', 'Героїв Праці', 'Heroiv Pratsi', 1070, 60, 0),
  st('studentska', 'Студентська', 'Studentska', 1010, 150, 120),
  st('akademika-pavlova', 'Академіка Павлова', 'Akademika Pavlova', 955, 240, 240),
  st('akademika-barabashova', 'Академіка Барабашова', 'Akademika Barabashova', 900, 330, 360),
  st('kyivska', 'Київська', 'Kyivska', 845, 420, 480),
  st('iaroslava-mudrogo', 'Пушкінська', 'Pushkinska', 790, 495, 600),
  st('universytet', 'Університет', 'Universytet', 690, 500, 720, ['stop-metro-derzhprom']),
  st('arhitektora-beketova', 'Архітектора Бекетова', 'Arkhitektora Beketova', 770, 590, 840)
];

/** Лінія 3 — Олексіївська (зелена). */
const greenStations: SchematicStation[] = [
  st('peremoga', 'Перемога', 'Peremoha', 430, 60, 0),
  st('oleksiivska', 'Олексіївська', 'Oleksiyivska', 455, 150, 120),
  st('23-serpnia', '23 Серпня', '23 Serpnya', 495, 240, 240),
  st('botanichnyi-sad', 'Ботанічний сад', 'Botanichniy Sad', 540, 330, 360),
  st('naukova', 'Наукова', 'Naukova', 585, 420, 480),
  st('derzhprom', 'Держпром', 'Derzhprom', 630, 495, 600, ['stop-metro-universytet']),
  st('istorychnyi-muzei', 'Історичний музей', 'Istorychniy Muzey', 545, 615, 730, ['stop-metro-maidan-konstytutsii']),
  st('zahysnykiv-ukrainy', 'Захисників України', 'Zakhysnykiv Ukrayiny', 650, 700, 850),
  st('metrobudivnykiv', 'Метробудівників', 'Metrobudivnykiv', 615, 810, 970, ['stop-metro-sportyvna'])
];

export const SCHEMATIC_LINES: SchematicLine[] = [
  {
    id: LINE_RED,
    number: '1',
    name: 'Холодногірсько-Заводська лінія',
    nameEn: 'Kholodnohirsko-Zavodska line',
    color: '#E2231A',
    stations: redStations,
    intervalMinutes: { weekday: 5, weekend: 8 },
    firstDepartureForward: { weekday: '05:30', weekend: '06:00' },
    firstDepartureBackward: { weekday: '05:40', weekend: '06:10' },
    lastDeparture: '23:50',
    headsignForward: redStations[redStations.length - 1].name,
    headsignBackward: redStations[0].name
  },
  {
    id: LINE_BLUE,
    number: '2',
    name: 'Салтівська лінія',
    nameEn: 'Saltivska line',
    color: '#005BAA',
    stations: blueStations,
    intervalMinutes: { weekday: 5, weekend: 8 },
    firstDepartureForward: { weekday: '05:30', weekend: '06:00' },
    firstDepartureBackward: { weekday: '05:40', weekend: '06:10' },
    lastDeparture: '23:50',
    headsignForward: blueStations[blueStations.length - 1].name,
    headsignBackward: blueStations[0].name
  },
  {
    id: LINE_GREEN,
    number: '3',
    name: 'Олексіївська лінія',
    nameEn: 'Oleksiyivska line',
    color: '#00994D',
    stations: greenStations,
    intervalMinutes: { weekday: 6, weekend: 9 },
    firstDepartureForward: { weekday: '05:30', weekend: '06:00' },
    firstDepartureBackward: { weekday: '05:40', weekend: '06:10' },
    lastDeparture: '23:50',
    headsignForward: greenStations[greenStations.length - 1].name,
    headsignBackward: greenStations[0].name
  }
];

/** Межі робочого часу метро (сек від півночі). 05:30–24:00. */
export const SERVICE_START_SEC = 5 * 3600 + 30 * 60;
export const SERVICE_END_SEC = 24 * 3600;
