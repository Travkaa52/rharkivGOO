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
  /** Зміщення підпису назви станції (відносно x: 0, y: -16 за замовчуванням). */
  labelOffset?: { x?: number; y?: number };
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
  interchangeWith?: string[],
  labelOffset?: { x?: number; y?: number }
): SchematicStation => ({
  id: `stop-metro-${id}`,
  name,
  nameEn,
  point: { x, y },
  arrivalOffsetSec,
  interchangeWith,
  labelOffset
});

export const LINE_RED = 'route-metro-1';
export const LINE_BLUE = 'route-metro-2';
export const LINE_GREEN = 'route-metro-3';

/** Лінія 1 — Холодногірсько-Заводська (червона). */
const redStations: SchematicStation[] = [
  st('holodna-gora', 'Холодна гора', 'Kholodna Hora', 100, 520, 0, undefined, { y: -18 }),
  st('vokzalna', 'Південний вокзал', 'Pivdenniy Vokzal', 210, 520, 110, undefined, { y: -18 }),
  st('tsentralnyi-rynok', 'Центральний ринок', 'Tsentralniy Rynok', 320, 520, 230, undefined, { y: -18 }),
  st('maidan-konstytutsii', 'Майдан Конституції', 'Maydan Konstytutsiy', 480, 520, 380, ['stop-metro-istorychnyi-muzei'], { y: 24 }),
  st('levada', 'Проспект Гагаріна', 'Prospekt Gagarina', 580, 580, 490, undefined, { x: 80, y: 4 }),
  st('sportyvna', 'Спортивна', 'Sportyvna', 680, 680, 590, ['stop-metro-metrobudivnykiv'], { x: 60, y: -10 }),
  st('zavodska', 'Завод ім. Малишева', 'Zavod imeni Malysheva', 760, 760, 710, undefined, { x: 80, y: 4 }),
  st('turboatom', 'Турбоатом', 'Turboatom', 830, 830, 830, undefined, { x: 65, y: 4 }),
  st('palats-sportu', 'Палац Спорту', 'Palats Sportu', 900, 900, 950, undefined, { x: 70, y: 4 }),
  st('armiiska', 'Армійська', 'Armiyska', 970, 970, 1070, undefined, { x: 60, y: 4 }),
  st('imeni-o-s-maselskogo', 'Ім. О.С. Масельського', 'Imeni O.S. Maselskoho', 1040, 970, 1190, undefined, { y: 22 }),
  st('traktornyi-zavod', 'Тракторний завод', 'Traktorniy Zavod', 1110, 970, 1310, undefined, { y: 22 }),
  st('industrialna', 'Індустріальна', 'Industrialna', 1170, 970, 1430, undefined, { y: 22 })
];

/** Лінія 2 — Салтівська (синя). */
const blueStations: SchematicStation[] = [
  st('heroiv-pratsi', 'Героїв Праці', 'Heroiv Pratsi', 900, 80, 0, undefined, { x: -75, y: 4 }),
  st('studentska', 'Студентська', 'Studentska', 900, 150, 120, undefined, { x: -65, y: 4 }),
  st('akademika-pavlova', 'Академіка Павлова', 'Akademika Pavlova', 900, 220, 240, undefined, { x: -85, y: 4 }),
  st('akademika-barabashova', 'Академіка Барабашова', 'Akademika Barabashova', 900, 290, 360, undefined, { x: -95, y: 4 }),
  st('kyivska', 'Київська', 'Kyivska', 830, 360, 480, undefined, { x: 50, y: -10 }),
  st('iaroslava-mudrogo', 'Пушкінська', 'Pushkinska', 730, 360, 600, undefined, { y: -18 }),
  st('universytet', 'Університет', 'Universytet', 580, 360, 720, ['stop-metro-derzhprom'], { y: -18 }),
  st('arhitektora-beketova', 'Архітектора Бекетова', 'Arkhitektora Beketova', 480, 440, 840, undefined, { x: -90, y: 4 })
];

/** Лінія 3 — Олексіївська (зелена). */
const greenStations: SchematicStation[] = [
  st('peremoga', 'Перемога', 'Peremoha', 340, 80, 0, undefined, { x: -60, y: 4 }),
  st('oleksiivska', 'Олексіївська', 'Oleksiyivska', 340, 150, 120, undefined, { x: -70, y: 4 }),
  st('23-serpnia', '23 Серпня', '23 Serpnya', 340, 220, 240, undefined, { x: -60, y: 4 }),
  st('botanichnyi-sad', 'Ботанічний сад', 'Botanichniy Sad', 340, 290, 360, undefined, { x: -80, y: 4 }),
  st('naukova', 'Наукова', 'Naukova', 410, 360, 480, undefined, { y: -18 }),
  st('derzhprom', 'Держпром', 'Derzhprom', 540, 360, 600, ['stop-metro-universytet'], { y: 22 }),
  st('istorychnyi-muzei', 'Історичний музей', 'Istorychniy Muzey', 480, 480, 730, ['stop-metro-maidan-konstytutsii'], { x: -80, y: 4 }),
  st('zahysnykiv-ukrainy', 'Захисників України', 'Zakhysnykiv Ukrayiny', 580, 680, 850, undefined, { x: -90, y: 4 }),
  st('metrobudivnykiv', 'Метробудівників', 'Metrobudivnykiv', 640, 740, 970, ['stop-metro-sportyvna'], { x: -80, y: 4 })
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
