import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent, type WheelEvent } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { getStationPhoto } from '@/data/stationPhotos';

export { getStationPhoto };

// =============================================================================
// ТИПИ ДАНИХ
// =============================================================================

export type LiveMetroDayType = 'weekday' | 'weekend';

export interface SchematicPoint {
  x: number;
  y: number;
}

export interface SchematicStation {
  id: string;
  name: string;
  nameEn: string;
  point: SchematicPoint;
  labelOffset?: { x: number; y: number };
  interchangeWith?: string[];
  lineId: string;
  opened: string;
  type: 'deep' | 'shallow' | 'single-vault' | 'pylon';
  description?: string;
}

export interface SchematicLine {
  id: string;
  number: number;
  name: string;
  nameEn: string;
  color: string;
  stations: SchematicStation[];
}

export interface LiveMetroTrain {
  id: string;
  lineId: string;
  lineNumber: number;
  lineColor: string;
  headsign: string;
  point: SchematicPoint;
  headingDeg: number;
  speedRatio: number;
  phase: 'moving' | 'dwell';
  previousStation: SchematicStation;
  nextStation: SchematicStation;
  etaNextStationSec: number;
  progress: number;
}

export interface StationDayTimetableEntry {
  lineId: string;
  lineNumber: number;
  lineColor: string;
  headsign: string;
  direction: string;
  times: string[];
}

// =============================================================================
// КОНСТАНТИ
// =============================================================================

const VIEW_W = 1500;
const VIEW_H = 900;
const MIN_SCALE = 0.35;
const MAX_SCALE = 5.0;

const LINE_COLORS: Record<string, string> = {
  'route-metro-1': '#D92B27',
  'route-metro-2': '#0072BC',
  'route-metro-3': '#009640',
};

const LINE_NUMBERS: Record<string, number> = {
  'route-metro-1': 1,
  'route-metro-2': 2,
  'route-metro-3': 3,
};

// =============================================================================
// СТАНЦІЇ ЛІНІЇ 1 — Холодногірсько-Заводська (Червона)
// =============================================================================

const LINE1_STATIONS: SchematicStation[] = [
  {
    id: 'kholodna-hora',
    name: 'Холодна Гора',
    nameEn: 'Kholodna Hora',
    point: { x: 120, y: 500 },
    labelOffset: { x: 0, y: -18 },
    lineId: 'route-metro-1',
    opened: '1975-08-23',
    type: 'single-vault',
    description: 'Північно-західний термінал. Вихід до ж/м Холодна Гора.',
  },
  {
    id: 'vokzalna',
    name: 'Вокзальна',
    nameEn: 'Vokzalna',
    point: { x: 220, y: 500 },
    labelOffset: { x: 0, y: -18 },
    lineId: 'route-metro-1',
    opened: '1975-08-23',
    type: 'deep',
    description: 'Інтегрована в Центральний залізничний вокзал Харків-Пасажирський.',
  },
  {
    id: 'tsentralnyi-rynok',
    name: 'Центральний ринок',
    nameEn: 'Tsentralnyi Rynok',
    point: { x: 320, y: 500 },
    labelOffset: { x: 0, y: -18 },
    lineId: 'route-metro-1',
    opened: '1975-08-23',
    type: 'deep',
    description: 'Центральний ринок, торговий район.',
  },
  {
    id: 'maidan-konstytutsii',
    name: 'Майдан Конституції',
    nameEn: 'Maidan Konstytutsii',
    point: { x: 420, y: 500 },
    labelOffset: { x: 0, y: -18 },
    interchangeWith: ['istorychnyi-muzei'],
    lineId: 'route-metro-1',
    opened: '1975-08-23',
    type: 'deep',
    description: 'Центр міста. Пересадка на Салтівську лінію (Історичний музей).',
  },
  {
    id: 'levada',
    name: 'Левада',
    nameEn: 'Levada',
    point: { x: 520, y: 500 },
    labelOffset: { x: 0, y: -18 },
    lineId: 'route-metro-1',
    opened: '1975-08-23',
    type: 'deep',
    description: 'Вихід до залізничної станції Харків-Левада.',
  },
  {
    id: 'sportyvna',
    name: 'Спортивна',
    nameEn: 'Sportyvna',
    point: { x: 620, y: 500 },
    labelOffset: { x: 0, y: -18 },
    interchangeWith: ['metrobudivnykiv'],
    lineId: 'route-metro-1',
    opened: '1975-08-23',
    type: 'deep',
    description: 'Пересадка на Олексіївську лінію (Метробудівників).',
  },
  {
    id: 'zavodska',
    name: 'Заводська',
    nameEn: 'Zavodska',
    point: { x: 720, y: 500 },
    labelOffset: { x: 0, y: -18 },
    lineId: 'route-metro-1',
    opened: '1975-08-23',
    type: 'deep',
    description: 'Безпосередньо біля залізничної станції Харків-Слобідський.',
  },
  {
    id: 'turboatom',
    name: 'Турбоатом',
    nameEn: 'Turboatom',
    point: { x: 820, y: 500 },
    labelOffset: { x: 0, y: -18 },
    lineId: 'route-metro-1',
    opened: '1975-08-23',
    type: 'deep',
    description: 'Колишня назва — Московський проспект (до 2019).',
  },
  {
    id: 'palats-sportu',
    name: 'Палац Спорту',
    nameEn: 'Palats Sportu',
    point: { x: 920, y: 500 },
    labelOffset: { x: 0, y: -18 },
    lineId: 'route-metro-1',
    opened: '1978-05-11',
    type: 'shallow',
    description: 'Палац спорту, житловий масив.',
  },
  {
    id: 'armiiska',
    name: 'Армійська',
    nameEn: 'Armiiska',
    point: { x: 1020, y: 500 },
    labelOffset: { x: 0, y: -18 },
    lineId: 'route-metro-1',
    opened: '1978-05-11',
    type: 'shallow',
    description: 'Колишня назва — Радянської армії (до 2016).',
  },
  {
    id: 'imeni-maselskoho',
    name: 'Імені О.С. Масельського',
    nameEn: 'Imeni O.S. Maselskoho',
    point: { x: 1120, y: 500 },
    labelOffset: { x: 0, y: -18 },
    lineId: 'route-metro-1',
    opened: '1978-05-11',
    type: 'shallow',
    description: 'Колишня назва — Індустріальна (до 2004).',
  },
  {
    id: 'traktornyi-zavod',
    name: 'Тракторний завод',
    nameEn: 'Traktornyi Zavod',
    point: { x: 1220, y: 500 },
    labelOffset: { x: 0, y: -18 },
    lineId: 'route-metro-1',
    opened: '1978-05-11',
    type: 'single-vault',
    description: 'Вихід до Харківського тракторного заводу.',
  },
  {
    id: 'industrialna',
    name: 'Індустріальна',
    nameEn: 'Industrialna',
    point: { x: 1320, y: 500 },
    labelOffset: { x: 10, y: -18 },
    lineId: 'route-metro-1',
    opened: '1978-05-11',
    type: 'shallow',
    description: 'Південно-східний термінал. Колишня назва — Пролетарська (до 2016).',
  },
];

// =============================================================================
// СТАНЦІЇ ЛІНІЇ 2 — Салтівська (Синя)
// =============================================================================

const LINE2_STATIONS: SchematicStation[] = [
  {
    id: 'saltivska',
    name: 'Салтівська',
    nameEn: 'Saltivska',
    point: { x: 670, y: 30 },
    labelOffset: { x: 0, y: -20 },
    lineId: 'route-metro-2',
    opened: '1986-10-26',
    type: 'shallow',
    description: 'Північно-східний термінал. Колишня назва — Героїв Праці (до 2024).',
  },
  {
    id: 'studentska',
    name: 'Студентська',
    nameEn: 'Studentska',
    point: { x: 635, y: 120 },
    labelOffset: { x: 16, y: -14 },
    lineId: 'route-metro-2',
    opened: '1986-10-26',
    type: 'shallow',
    description: 'Університетський район.',
  },
  {
    id: 'akademika-pavlova',
    name: 'Академіка Павлова',
    nameEn: 'Akademika Pavlova',
    point: { x: 600, y: 210 },
    labelOffset: { x: 16, y: -14 },
    lineId: 'route-metro-2',
    opened: '1986-10-26',
    type: 'single-vault',
    description: 'Імені Івана Павлова, фізіолога.',
  },
  {
    id: 'akademika-barabashova',
    name: 'Академіка Барабашова',
    nameEn: 'Akademika Barabashova',
    point: { x: 565, y: 300 },
    labelOffset: { x: 16, y: -14 },
    lineId: 'route-metro-2',
    opened: '1984-08-11',
    type: 'shallow',
    description: 'Ринок Барабашова — найбільший в Україні.',
  },
  {
    id: 'kyivska',
    name: 'Київська',
    nameEn: 'Kyivska',
    point: { x: 530, y: 390 },
    labelOffset: { x: 16, y: -14 },
    lineId: 'route-metro-2',
    opened: '1984-08-11',
    type: 'single-vault',
    description: 'Автобусний хаб у напрямку Києва.',
  },
  {
    id: 'yaroslava-mudroho',
    name: 'Ярослава Мудрого',
    nameEn: 'Yaroslava Mudroho',
    point: { x: 495, y: 480 },
    labelOffset: { x: 16, y: -14 },
    lineId: 'route-metro-2',
    opened: '1984-08-11',
    type: 'pylon',
    description: 'Колишня назва — Пушкінська (до 2024). Глибина ~35 м.',
  },
  {
    id: 'universytet',
    name: 'Університет',
    nameEn: 'Universytet',
    point: { x: 460, y: 570 },
    labelOffset: { x: 18, y: 4 },
    interchangeWith: ['derzhprom'],
    lineId: 'route-metro-2',
    opened: '1984-08-11',
    type: 'shallow',
    description: 'Національний університет ім. Каразіна. Пересадка на M3 (Держпром).',
  },
  {
    id: 'istorychnyi-muzei',
    name: 'Історичний музей',
    nameEn: 'Istorychnyi Muzei',
    point: { x: 420, y: 660 },
    labelOffset: { x: 0, y: 22 },
    interchangeWith: ['maidan-konstytutsii'],
    lineId: 'route-metro-2',
    opened: '1984-08-11',
    type: 'deep',
    description: 'Історичний музей. Пересадка на M1 (Майдан Конституції).',
  },
];

// =============================================================================
// СТАНЦІЇ ЛІНІЇ 3 — Олексіївська (Зелена)
// =============================================================================

const LINE3_STATIONS: SchematicStation[] = [
  {
    id: 'peremoha',
    name: 'Перемога',
    nameEn: 'Peremoha',
    point: { x: 400, y: 30 },
    labelOffset: { x: 0, y: -20 },
    lineId: 'route-metro-3',
    opened: '2016-08-19',
    type: 'shallow',
    description: 'Північний термінал. Відкрита у 2016 році.',
  },
  {
    id: 'oleksiivska',
    name: 'Олексіївська',
    nameEn: 'Oleksiivska',
    point: { x: 430, y: 110 },
    labelOffset: { x: -16, y: -14 },
    lineId: 'route-metro-3',
    opened: '2010-12-21',
    type: 'shallow',
    description: 'Житловий масив Олексіївка.',
  },
  {
    id: '23-serpnia',
    name: '23 Серпня',
    nameEn: '23 Serpnia',
    point: { x: 460, y: 190 },
    labelOffset: { x: -16, y: -14 },
    lineId: 'route-metro-3',
    opened: '2004-08-21',
    type: 'shallow',
    description: 'День визволення Харкова (23 серпня).',
  },
  {
    id: 'botanichnyi-sad',
    name: 'Ботанічний сад',
    nameEn: 'Botanichnyi Sad',
    point: { x: 490, y: 270 },
    labelOffset: { x: -16, y: -14 },
    lineId: 'route-metro-3',
    opened: '2004-08-21',
    type: 'shallow',
    description: 'Національний ботанічний сад.',
  },
  {
    id: 'naukova',
    name: 'Наукова',
    nameEn: 'Naukova',
    point: { x: 520, y: 350 },
    labelOffset: { x: -16, y: -14 },
    lineId: 'route-metro-3',
    opened: '1995-05-06',
    type: 'shallow',
    description: 'Проспект Науки, науковий район.',
  },
  {
    id: 'derzhprom',
    name: 'Держпром',
    nameEn: 'Derzhprom',
    point: { x: 555, y: 430 },
    labelOffset: { x: -18, y: 4 },
    interchangeWith: ['universytet'],
    lineId: 'route-metro-3',
    opened: '1995-05-06',
    type: 'shallow',
    description: 'Площа Свободи — одна з найбільших у світі. Пересадка на M2 (Університет).',
  },
  {
    id: 'arkhitektora-beketova',
    name: 'Архітектора Бекетова',
    nameEn: 'Arkhitektora Beketova',
    point: { x: 595, y: 500 },
    labelOffset: { x: -16, y: 14 },
    lineId: 'route-metro-3',
    opened: '1995-05-06',
    type: 'shallow',
    description: 'Музей образотворчих мистецтв. Найкоротша ділянка між станціями (до Держпрома).',
  },
  {
    id: 'zakhysnykiv-ukrainy',
    name: 'Захисників України',
    nameEn: 'Zakhysnykiv Ukrainy',
    point: { x: 630, y: 575 },
    labelOffset: { x: -16, y: 14 },
    lineId: 'route-metro-3',
    opened: '1995-05-06',
    type: 'shallow',
    description: 'Колишня назва — Проспект Гагаріна (до 2022).',
  },
  {
    id: 'metrobudivnykiv',
    name: 'Метробудівників',
    nameEn: 'Metrobudivnykiv',
    point: { x: 660, y: 650 },
    labelOffset: { x: 0, y: 22 },
    interchangeWith: ['sportyvna'],
    lineId: 'route-metro-3',
    opened: '1995-05-06',
    type: 'shallow',
    description: 'Південний термінал. Пересадка на M1 (Спортивна).',
  },
];

// =============================================================================
// ЛІНІЇ
// =============================================================================

export const BUILT_LINES: { line: SchematicLine }[] = [
  {
    line: {
      id: 'route-metro-1',
      number: 1,
      name: 'Холодногірсько-Заводська лінія',
      nameEn: 'Kholodnohirsko-Zavodska line',
      color: LINE_COLORS['route-metro-1'],
      stations: LINE1_STATIONS,
    },
  },
  {
    line: {
      id: 'route-metro-2',
      number: 2,
      name: 'Салтівська лінія',
      nameEn: 'Saltivska line',
      color: LINE_COLORS['route-metro-2'],
      stations: LINE2_STATIONS,
    },
  },
  {
    line: {
      id: 'route-metro-3',
      number: 3,
      name: 'Олексіївська лінія',
      nameEn: 'Oleksiivska line',
      color: LINE_COLORS['route-metro-3'],
      stations: LINE3_STATIONS,
    },
  },
];

// =============================================================================
// ДОПОМІЖНІ ФУНКЦІЇ
// =============================================================================

export function dayTypeOf(date: Date): LiveMetroDayType {
  const day = date.getDay();
  return day === 0 || day === 6 ? 'weekend' : 'weekday';
}

export function secOfDay(date: Date): number {
  return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
}

export function formatEtaClock(etaSec: number): string {
  const h = Math.floor(etaSec / 3600);
  const m = Math.floor((etaSec % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatEtaCountdown(etaSec: number, nowSec: number): string {
  const diff = Math.max(0, etaSec - nowSec);
  const m = Math.floor(diff / 60);
  const s = diff % 60;
  if (m === 0) return `${s}с`;
  return `${m}хв ${s}с`;
}

function lerpPoint(a: SchematicPoint, b: SchematicPoint, t: number): SchematicPoint {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function angleBetween(a: SchematicPoint, b: SchematicPoint): number {
  return Math.atan2(b.y - a.y, b.x - a.x) * (180 / Math.PI);
}

function distance(a: SchematicPoint, b: SchematicPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

// =============================================================================
// ГЕНЕРАЦІЯ РОЗКЛАДУ
// =============================================================================

function generateTimetableForLine(
  lineId: string,
  stations: SchematicStation[],
  dayType: LiveMetroDayType,
  direction: 'forward' | 'backward'
): StationDayTimetableEntry[] {
  const lineNumber = LINE_NUMBERS[lineId];
  const lineColor = LINE_COLORS[lineId];
  const headsign = direction === 'forward' ? stations[stations.length - 1].name : stations[0].name;
  const dirLabel = direction === 'forward' ? stations[stations.length - 1].nameEn : stations[0].nameEn;

  const entries: StationDayTimetableEntry[] = [];

  for (let i = 0; i < stations.length; i++) {
    const times: string[] = [];
    const baseStart = 5 * 3600 + 30 * 60; // 5:30
    const baseEnd = 23 * 3600 + 55 * 60; // 23:55
    const interval = dayType === 'weekday' ? 180 : 240; // 3 хв / 4 хв

    const travelOffset = i * 120; // ~2 хв на станцію

    for (let t = baseStart + travelOffset; t <= baseEnd; t += interval) {
      const h = Math.floor(t / 3600);
      const m = Math.floor((t % 3600) / 60);
      times.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }

    entries.push({
      lineId,
      lineNumber,
      lineColor,
      headsign,
      direction: dirLabel,
      times: times.slice(0, 20),
    });
  }

  return entries;
}

export function getStationDayTimetable(
  stationId: string,
  dayType: LiveMetroDayType
): StationDayTimetableEntry[] {
  const result: StationDayTimetableEntry[] = [];

  for (const { line } of BUILT_LINES) {
    const idx = line.stations.findIndex((s) => s.id === stationId);
    if (idx === -1) continue;

    const forward = generateTimetableForLine(line.id, line.stations, dayType, 'forward');
    const backward = generateTimetableForLine(line.id, line.stations, dayType, 'backward');

    const fwdEntry = forward[idx];
    const bwdEntry = backward[idx];

    if (fwdEntry) result.push(fwdEntry);
    if (bwdEntry) result.push(bwdEntry);
  }

  return result;
}

// =============================================================================
// ПОЇЗДИ У РЕАЛЬНОМУ ЧАСІ
// =============================================================================

export function getUpcomingArrivalsForStation(
  stationId: string,
  _date: Date,
  limit: number
): Array<{
  lineId: string;
  lineNumber: number;
  lineColor: string;
  headsign: string;
  etaSec: number;
}> {
  const nowSec = secOfDay(new Date());
  const arrivals: Array<{
    lineId: string;
    lineNumber: number;
    lineColor: string;
    headsign: string;
    etaSec: number;
  }> = [];

  for (const { line } of BUILT_LINES) {
    const idx = line.stations.findIndex((s) => s.id === stationId);
    if (idx === -1) continue;

    const baseStart = 5 * 3600 + 30 * 60;

    // Forward direction
    for (let run = 0; run < 3; run++) {
      const runStart = baseStart + run * 1200;
      const eta = runStart + idx * 120;
      if (eta > nowSec && eta < nowSec + 3600) {
        arrivals.push({
          lineId: line.id,
          lineNumber: line.number,
          lineColor: line.color,
          headsign: line.stations[line.stations.length - 1].name,
          etaSec: eta,
        });
      }
    }

    // Backward direction
    for (let run = 0; run < 3; run++) {
      const runStart = baseStart + run * 1200 + 600;
      const eta = runStart + (line.stations.length - 1 - idx) * 120;
      if (eta > nowSec && eta < nowSec + 3600) {
        arrivals.push({
          lineId: line.id,
          lineNumber: line.number,
          lineColor: line.color,
          headsign: line.stations[0].name,
          etaSec: eta,
        });
      }
    }
  }

  return arrivals.sort((a, b) => a.etaSec - b.etaSec).slice(0, limit);
}

// =============================================================================
// ХУК: useLiveMetroTrains
// =============================================================================

export function useLiveMetroTrains(): LiveMetroTrain[] {
  const [trains, setTrains] = useState<LiveMetroTrain[]>(() => generateTrains());
  const trainsRef = useRef(trains);
  trainsRef.current = trains;

  useEffect(() => {
    const interval = setInterval(() => {
      setTrains((prev) => updateTrains(prev));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return trains;
}

function generateTrains(): LiveMetroTrain[] {
  const allTrains: LiveMetroTrain[] = [];
  let trainId = 0;

  for (const { line } of BUILT_LINES) {
    const stations = line.stations;
    const numTrains = Math.max(3, Math.floor(stations.length / 3));

    for (let i = 0; i < numTrains; i++) {
      const progress = i / numTrains;
      const segIndex = Math.floor(progress * (stations.length - 1));
      const segProgress = (progress * (stations.length - 1)) % 1;

      const from = stations[Math.min(segIndex, stations.length - 1)];
      const to = stations[Math.min(segIndex + 1, stations.length - 1)];

      const point = lerpPoint(from.point, to.point, segProgress);
      const heading = angleBetween(from.point, to.point);
      const dist = distance(from.point, to.point);
      const speedRatio = 0.3 + Math.random() * 0.5;
      const etaNext = Math.max(10, Math.floor((dist / (speedRatio * 40 + 20)) * 3600 / 100));

      allTrains.push({
        id: `train-${line.id}-${trainId++}`,
        lineId: line.id,
        lineNumber: line.number,
        lineColor: line.color,
        headsign: to.name,
        point,
        headingDeg: heading,
        speedRatio,
        phase: segProgress > 0.85 ? 'dwell' : 'moving',
        previousStation: from,
        nextStation: to,
        etaNextStationSec: secOfDay(new Date()) + etaNext,
        progress: segProgress,
      });
    }
  }

  return allTrains;
}

function updateTrains(prev: LiveMetroTrain[]): LiveMetroTrain[] {
  return prev.map((train) => {
    const line = BUILT_LINES.find((l) => l.line.id === train.lineId)?.line;
    if (!line) return train;

    const stations = line.stations;
    const fromIdx = stations.findIndex((s) => s.id === train.previousStation.id);
    const toIdx = stations.findIndex((s) => s.id === train.nextStation.id);

    if (fromIdx === -1 || toIdx === -1) return train;

    const dist = distance(train.previousStation.point, train.nextStation.point);
    const speed = train.speedRatio * 40; // км/год
    const speedPxPerSec = (speed * 1000 / 3600) * 0.05; // масштаб
    const segDuration = dist / speedPxPerSec;

    const newProgress = train.progress + 1 / segDuration;

    if (newProgress >= 1) {
      // Досягли наступної станції
      const newFrom = train.nextStation;
      const direction = toIdx > fromIdx ? 1 : -1;
      const newToIdx = toIdx + direction;

      if (newToIdx < 0 || newToIdx >= stations.length) {
        // Розворот
        const reverseToIdx = toIdx - direction;
        if (reverseToIdx >= 0 && reverseToIdx < stations.length) {
          const reverseTo = stations[reverseToIdx];
          return {
            ...train,
            previousStation: newFrom,
            nextStation: reverseTo,
            point: newFrom.point,
            headingDeg: angleBetween(newFrom.point, reverseTo.point),
            progress: 0,
            phase: 'dwell' as const,
            etaNextStationSec: secOfDay(new Date()) + 30,
            headsign: reverseTo.name,
          };
        }
        return train;
      }

      const newTo = stations[newToIdx];
      return {
        ...train,
        previousStation: newFrom,
        nextStation: newTo,
        point: newFrom.point,
        headingDeg: angleBetween(newFrom.point, newTo.point),
        progress: 0,
        phase: 'dwell' as const,
        etaNextStationSec: secOfDay(new Date()) + 30,
        headsign: newTo.name,
      };
    }

    const point = lerpPoint(train.previousStation.point, train.nextStation.point, newProgress);
    const remainingDist = dist * (1 - newProgress);
    const eta = Math.max(5, Math.floor(remainingDist / speedPxPerSec));

    return {
      ...train,
      point,
      progress: newProgress,
      phase: newProgress > 0.9 ? 'dwell' : 'moving',
      etaNextStationSec: secOfDay(new Date()) + eta,
    };
  });
}

// =============================================================================
// ФОТО СТАНЦІЙ — реальні фото з src/assets/stancia (не Wikimedia-заглушки)
// =============================================================================

/** Префіксує шлях у /public базовим шляхом збірки (важливо для GitHub Pages, де base ≠ "/"). */
export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL ?? '/';
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${normalizedBase}${path}`;
}


// =============================================================================
// КОМПОНЕНТИ
// =============================================================================

interface Transform {
  x: number;
  y: number;
  scale: number;
}

const TRAIN_SPRITES: Record<string, string> = {
  'route-metro-1': assetUrl('/sprites/metro-red-line.jpg'),
  'route-metro-2': assetUrl('/sprites/metro-blue-line.jpg'),
  'route-metro-3': assetUrl('/sprites/metro-green-line.jpg'),
};

export function LiveMetroPage() {
  const trains = useLiveMetroTrains();
  const [transform, setTransform] = useState<Transform>({ x: 60, y: 30, scale: 0.9 });
  const [selectedTrainId, setSelectedTrainId] = useState<string | null>(null);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [dayType, setDayType] = useState<LiveMetroDayType>(() => dayTypeOf(new Date()));
  const [nowSec, setNowSec] = useState<number>(() => secOfDay(new Date()));
  const [showLegend, setShowLegend] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const transformRef = useRef(transform);
  transformRef.current = transform;

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const pinchState = useRef<{ distance: number; scale: number } | null>(null);
  const activePointers = useRef<Map<number, { x: number; y: number }>>(new Map());

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNowSec(secOfDay(new Date())), 1000);
    return () => clearInterval(timer);
  }, []);

  const selectedTrain = useMemo(
    () => trains.find((t) => t.id === selectedTrainId) ?? null,
    [trains, selectedTrainId]
  );

  const allStations = useMemo(() => {
    const map = new Map<string, SchematicStation>();
    for (const { line } of BUILT_LINES) {
      for (const station of line.stations) {
        if (!map.has(station.id)) map.set(station.id, station);
      }
    }
    return Array.from(map.values());
  }, []);

  const interchangePairs = useMemo(() => {
    const renderedPairs = new Set<string>();
    const pairs: Array<{ id: string; s1: SchematicStation; s2: SchematicStation }> = [];

    for (const { line } of BUILT_LINES) {
      for (const station of line.stations) {
        if (!station.interchangeWith?.length) continue;
        for (const otherId of station.interchangeWith) {
          const other = allStations.find((o) => o.id === otherId);
          if (!other) continue;
          const pairKey = [station.id, otherId].sort().join('--');
          if (renderedPairs.has(pairKey)) continue;
          renderedPairs.add(pairKey);
          pairs.push({ id: pairKey, s1: station, s2: other });
        }
      }
    }
    return pairs;
  }, [allStations]);

  const selectedStation = selectedStationId
    ? allStations.find((s) => s.id === selectedStationId) ?? null
    : null;

  const stationArrivals = useMemo(() => {
    if (!selectedStationId) return [];
    return getUpcomingArrivalsForStation(selectedStationId, new Date(), 4);
  }, [selectedStationId, trains, nowSec]);

  const stationTimetable = useMemo(() => {
    if (!selectedStationId) return [];
    return getStationDayTimetable(selectedStationId, dayType);
  }, [selectedStationId, dayType]);

  const clampScale = (s: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));

  const onPointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const currentTransform = transformRef.current;
    if (activePointers.current.size === 1) {
      isDraggingRef.current = false;
      dragStartRef.current = { x: e.clientX, y: e.clientY, tx: currentTransform.x, ty: currentTransform.y };
    } else if (activePointers.current.size === 2) {
      const pts = Array.from(activePointers.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchState.current = { distance: dist, scale: currentTransform.scale };
      dragStartRef.current = null;
    }
  }, []);

  const onPointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (!activePointers.current.has(e.pointerId)) return;
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (activePointers.current.size === 2 && pinchState.current) {
      const pts = Array.from(activePointers.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const ratio = dist / (pinchState.current.distance || 1);
      setTransform((t) => ({ ...t, scale: clampScale(pinchState.current!.scale * ratio) }));
      return;
    }
    const drag = dragStartRef.current;
    if (drag) {
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (Math.hypot(dx, dy) > 4) {
        isDraggingRef.current = true;
        setTransform((t) => ({ ...t, x: drag.tx + dx, y: drag.ty + dy }));
      }
    }
  }, []);

  const endPointer = useCallback((e: PointerEvent<HTMLDivElement>) => {
    activePointers.current.delete(e.pointerId);
    if (activePointers.current.size === 0) dragStartRef.current = null;
    if (activePointers.current.size < 2) pinchState.current = null;
  }, []);

  const onWheel = useCallback((e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const delta = -e.deltaY * 0.0015;
    setTransform((t) => {
      const newScale = clampScale(t.scale * (1 + delta));
      const scaleRatio = newScale / t.scale;
      return {
        x: mouseX - (mouseX - t.x) * scaleRatio,
        y: mouseY - (mouseY - t.y) * scaleRatio,
        scale: newScale,
      };
    });
  }, []);

  const resetView = () => setTransform({ x: 60, y: 30, scale: 0.9 });

  const handleStationSelect = useCallback((stationId: string) => {
    if (isDraggingRef.current) return;
    setSelectedStationId((prev) => (prev === stationId ? null : stationId));
    setSelectedTrainId(null);
  }, []);

  const handleTrainSelect = useCallback((trainId: string) => {
    if (isDraggingRef.current) return;
    setSelectedTrainId((prev) => (prev === trainId ? null : trainId));
    setSelectedStationId(null);
  }, []);

  const currentTime = useMemo(() => {
    return new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }, [nowSec]);

  return (
    <div className="flex min-h-dvh flex-col bg-ink pb-20">
      <PageHeader title="Живе метро" subtitle="Позиції поїздів на схемі в реальному часі" />

      {/* Верхня панель */}
      <div className="mx-4 mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/10">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-mint">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-semibold text-white/90">Харківський метрополітен</span>
            <span className="text-[10px] text-white/40">30 станцій · 38.1 км · 3 лінії</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[12px] font-mono text-mint sm:block">
            {currentTime}
          </div>
          <div className="flex overflow-hidden rounded-full border border-ink-border bg-white/5">
            <button
              type="button"
              onClick={() => setDayType('weekday')}
              className={[
                'px-3 py-1.5 text-[12px] font-medium transition-all',
                dayType === 'weekday' ? 'bg-mint text-ink font-bold' : 'bg-transparent text-white/60 hover:text-white/90',
              ].join(' ')}
            >
              Будній
            </button>
            <button
              type="button"
              onClick={() => setDayType('weekend')}
              className={[
                'px-3 py-1.5 text-[12px] font-medium transition-all',
                dayType === 'weekend' ? 'bg-mint text-ink font-bold' : 'bg-transparent text-white/60 hover:text-white/90',
              ].join(' ')}
            >
              Вихідний
            </button>
          </div>
        </div>
      </div>

      {/* Контейнер карти */}
      <div
        ref={containerRef}
        className="relative mx-4 mb-4 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-[#0B120F] shadow-2xl touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onPointerLeave={endPointer}
        onWheel={onWheel}
        onClick={(e) => {
          if (e.target === e.currentTarget && !isDraggingRef.current) {
            setSelectedTrainId(null);
            setSelectedStationId(null);
          }
        }}
      >
        {isLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0B120F]">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-mint/20 border-t-mint" />
              <span className="text-sm text-white/60">Завантаження схеми...</span>
            </div>
          </div>
        )}

        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="h-full w-full select-none"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: '0 0',
          }}
        >
          <defs>
            <linearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0D1F17" />
              <stop offset="100%" stopColor="#0A1812" />
            </linearGradient>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="stationGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Фонова сітка */}
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1A2A22" strokeWidth="0.5" />
          </pattern>
          <rect width={VIEW_W} height={VIEW_H} fill="url(#grid)" opacity={0.3} />

          {/* Річки */}
          <g opacity={0.5}>
            <path d="M 200 50 C 250 200, 300 350, 400 450 C 480 520, 580 550, 700 530 C 820 510, 880 520, 950 600 C 1020 680, 950 800, 850 880" fill="none" stroke="#12211B" strokeWidth={28} strokeLinecap="round" />
            <path d="M 200 50 C 250 200, 300 350, 400 450 C 480 520, 580 550, 700 530 C 820 510, 880 520, 950 600 C 1020 680, 950 800, 850 880" fill="none" stroke="#1A3328" strokeWidth={18} strokeLinecap="round" />
            <path d="M 80 380 Q 260 390 400 450" fill="none" stroke="#12211B" strokeWidth={20} strokeLinecap="round" />
            <path d="M 80 380 Q 260 390 400 450" fill="none" stroke="#1A3328" strokeWidth={12} strokeLinecap="round" />
          </g>

          {/* Заголовок */}
          <g transform="translate(60, 70)">
            <path d="M 0 0 L 12 -24 L 24 0 L 36 -24 L 48 0 L 38 0 L 30 -16 L 24 -4 L 18 -16 L 10 0 Z" fill="#D92B27" />
            <text x={64} y={-5} className="font-display font-extrabold" fontSize={32} fill="#F5F7F6">Харківський метрополітен</text>
            <text x={64} y={18} className="font-sans font-medium" fontSize={16} fill="#9FB3A9">Kharkiv subway system · 30 stations · 38.1 km</text>
          </g>

          {/* Легенда */}
          {showLegend && (
            <g transform="translate(60, 820)">
              <rect x={-12} y={-12} width={300} height={270} rx={14} fill="#0F1A14" stroke="#1E2A24" strokeWidth={1} opacity={0.95} />
              <g transform="translate(10, 20)">
                <rect x={0} y={0} width={32} height={22} rx={5} fill="#D92B27" />
                <text x={16} y={15} textAnchor="middle" fill="#FFF" fontSize={13} fontWeight="bold">1</text>
                <text x={42} y={12} className="font-bold" fontSize={13} fill="#F5F7F6">Холодногірсько-Заводська</text>
                <text x={42} y={27} className="font-normal" fontSize={10} fill="#6E8377">Kholodnohirsko-Zavodska line · 13 станцій</text>
              </g>
              <g transform="translate(10, 80)">
                <rect x={0} y={0} width={32} height={22} rx={5} fill="#0072BC" />
                <text x={16} y={15} textAnchor="middle" fill="#FFF" fontSize={13} fontWeight="bold">2</text>
                <text x={42} y={12} className="font-bold" fontSize={13} fill="#F5F7F6">Салтівська лінія</text>
                <text x={42} y={27} className="font-normal" fontSize={10} fill="#6E8377">Saltivska line · 8 станцій</text>
              </g>
              <g transform="translate(10, 130)">
                <rect x={0} y={0} width={32} height={22} rx={5} fill="#009640" />
                <text x={16} y={15} textAnchor="middle" fill="#FFF" fontSize={13} fontWeight="bold">3</text>
                <text x={42} y={12} className="font-bold" fontSize={13} fill="#F5F7F6">Олексіївська лінія</text>
                <text x={42} y={27} className="font-normal" fontSize={10} fill="#6E8377">Oleksiivska line · 9 станцій</text>
              </g>
              <line x1={10} y1={175} x2={270} y2={175} stroke="#1E2A24" strokeWidth={1} />
              <g transform="translate(10, 195)">
                <text x={0} y={0} className="font-bold" fontSize={14} fill="#F5F7F6">Працюємо з 5:30 до 24:00</text>
                <text x={0} y={16} className="font-normal" fontSize={11} fill="#6E8377">Works from 5:30 to 24:00</text>
                <text x={0} y={38} className="font-medium" fontSize={11} fill="#9FB3A9">metro.kharkiv.ua</text>
                <text x={0} y={55} className="font-normal" fontSize={10} fill="#6E8377">eTicket: 0-800-505-685</text>
                <text x={0} y={75} className="font-normal" fontSize={9} fill="#4A5C52">Версія 5.2.0 · Оновлено 2026</text>
              </g>
            </g>
          )}

          {/* Лінії метро */}
          {BUILT_LINES.map(({ line }) => (
            <LineTracks key={line.id} line={line} />
          ))}

          {/* Пересадочні гантелі */}
          {interchangePairs.map((p) => (
            <InterchangeCapsule key={p.id} s1={p.s1} s2={p.s2} />
          ))}

          {/* Маркери станцій */}
          {BUILT_LINES.map(({ line }) =>
            line.stations.map((station) => (
              <StationMarker
                key={`${line.id}-${station.id}`}
                station={station}
                color={line.color}
                selected={selectedStationId === station.id}
                onClick={() => handleStationSelect(station.id)}
              />
            ))
          )}

          {/* Поїзди */}
          {trains.map((train) => (
            <TrainMarker
              key={train.id}
              train={train}
              selected={selectedTrainId === train.id}
              onClick={() => handleTrainSelect(train.id)}
            />
          ))}
        </svg>

        {/* Кнопки зума */}
        <div className="absolute right-4 top-4 flex flex-col gap-2">
          <ZoomButton label="+" onClick={() => setTransform((t) => ({ ...t, scale: clampScale(t.scale * 1.25) }))} />
          <ZoomButton label="−" onClick={() => setTransform((t) => ({ ...t, scale: clampScale(t.scale / 1.25) }))} />
          <ZoomButton label="⟲" onClick={resetView} small />
          <ZoomButton label="ⓘ" onClick={() => setShowLegend((v) => !v)} small />
        </div>

        {/* Картки інформації */}
        {selectedTrain && <TrainInfoCard train={selectedTrain} onClose={() => setSelectedTrainId(null)} />}
        {selectedStation && (
          <StationInfoCard
            station={selectedStation}
            arrivals={stationArrivals}
            timetable={stationTimetable}
            dayType={dayType}
            nowSec={nowSec}
            onClose={() => setSelectedStationId(null)}
          />
        )}
      </div>
    </div>
  );
}

// =============================================================================
// ПІДКОМПОНЕНТИ
// =============================================================================

function LineTracks({ line }: { line: SchematicLine }) {
  const stations = line.stations;
  if (!stations.length) return null;

  // Генеруємо path для лінії
  let d = '';
  stations.forEach((s, i) => {
    d += `${i === 0 ? 'M' : 'L'} ${s.point.x} ${s.point.y} `;
  });

  const first = stations[0].point;
  const last = stations[stations.length - 1].point;

  return (
    <g>
      {/* Тінь лінії */}
      <path d={d} fill="none" stroke="#000000" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" opacity={0.4} />
      {/* Основна лінія */}
      <path d={d} fill="none" stroke={line.color} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
      {/* Внутрішня лінія */}
      <path d={d} fill="none" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={0.15} />

      {/* Заглушки на кінцевих станціях */}
      {line.id === 'route-metro-1' && (
        <>
          <line x1={first.x} y1={first.y - 10} x2={first.x} y2={first.y + 10} stroke={line.color} strokeWidth={7} strokeLinecap="round" />
          <line x1={last.x} y1={last.y - 10} x2={last.x} y2={last.y + 10} stroke={line.color} strokeWidth={7} strokeLinecap="round" />
        </>
      )}
      {line.id === 'route-metro-2' && (
        <line x1={first.x - 10} y1={first.y} x2={first.x + 10} y2={first.y} stroke={line.color} strokeWidth={7} strokeLinecap="round" />
      )}
      {line.id === 'route-metro-3' && (
        <>
          <line x1={first.x} y1={first.y - 10} x2={first.x} y2={first.y + 10} stroke={line.color} strokeWidth={7} strokeLinecap="round" />
          <line x1={last.x} y1={last.y - 10} x2={last.x} y2={last.y + 10} stroke={line.color} strokeWidth={7} strokeLinecap="round" />
        </>
      )}
    </g>
  );
}

function InterchangeCapsule({ s1, s2 }: { s1: SchematicStation; s2: SchematicStation }) {
  const dx = s2.point.x - s1.point.x;
  const dy = s2.point.y - s1.point.y;
  const dist = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return (
    <g transform={`translate(${s1.point.x}, ${s1.point.y}) rotate(${angle})`}>
      <rect x={-10} y={-13} width={dist + 20} height={26} rx={13} fill="#FFFFFF" stroke="#111827" strokeWidth={4} />
      <rect x={-6} y={-9} width={dist + 12} height={18} rx={9} fill="none" stroke="#E5E7EB" strokeWidth={1} />
    </g>
  );
}

function StationMarker({
  station,
  color,
  selected,
  onClick,
}: {
  station: SchematicStation;
  color: string;
  selected: boolean;
  onClick: () => void;
}) {
  const isInterchange = !!station.interchangeWith?.length;
  const offsetX = station.labelOffset?.x ?? 0;
  const offsetY = station.labelOffset?.y ?? -18;

  const textAnchor = offsetX > 10 ? 'start' : offsetX < -10 ? 'end' : 'middle';

  return (
    <g
      transform={`translate(${station.point.x}, ${station.point.y})`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="cursor-pointer"
    >
      {/* Прозора зона для тапа */}
      <circle r={26} fill="transparent" />

      {/* Світіння при виборі */}
      {selected && (
        <circle r={isInterchange ? 16 : 14} fill="none" stroke="#C6A552" strokeWidth={3} opacity={0.8}>
          <animate attributeName="r" values={`${isInterchange ? 14 : 12};${isInterchange ? 18 : 16};${isInterchange ? 14 : 12}`} dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Маркер станції */}
      <circle r={isInterchange ? 7.5 : 6} fill="#FFFFFF" stroke={color} strokeWidth={3.5} />
      {isInterchange && (
        <circle r={4} fill={color} />
      )}

      {/* Підпис */}
      <g transform={`translate(${offsetX}, ${offsetY})`} className="pointer-events-none select-none">
        <text
          x={0} y={0}
          textAnchor={textAnchor}
          className="font-display font-extrabold"
          fontSize={13}
          fill="#F5F7F6"
          style={{ paintOrder: 'stroke', stroke: '#0B120F', strokeWidth: 4, strokeLinejoin: 'round' }}
        >
          {station.name}
        </text>
        <text
          x={0} y={13}
          textAnchor={textAnchor}
          className="font-sans font-medium"
          fontSize={9.5}
          fill="#9FB3A9"
          style={{ paintOrder: 'stroke', stroke: '#0B120F', strokeWidth: 3, strokeLinejoin: 'round' }}
        >
          {station.nameEn}
        </text>
      </g>
    </g>
  );
}

function TrainMarker({
  train,
  selected,
  onClick,
}: {
  train: LiveMetroTrain;
  selected: boolean;
  onClick: () => void;
}) {
  const spriteSrc = TRAIN_SPRITES[train.lineId] ?? assetUrl('/sprites/metro-red-line.jpg');
  const isDwell = train.phase === 'dwell';
  const facingLeft = train.headingDeg > 90 && train.headingDeg < 270;
  const size = selected ? 36 : 28;
  const clipId = `clip-${train.id.replace(/[^a-zA-Z0-9-_]/g, '')}`;

  return (
    <g
      transform={`translate(${train.point.x}, ${train.point.y})`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="cursor-pointer"
    >
      {/* Прозора зона для тапа */}
      <circle r={28} fill="transparent" />

      {/* Світіння при виборі */}
      {selected && (
        <circle r={size / 2 + 8} fill="none" stroke="#C6A552" strokeWidth={2.5} opacity={0.6}>
          <animate attributeName="r" values={`${size / 2 + 4};${size / 2 + 10};${size / 2 + 4}`} dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Основне коло */}
      <circle r={size / 2 + 2} fill={train.lineColor} stroke="#FFFFFF" strokeWidth={2.5} />

      <clipPath id={clipId}>
        <circle r={size / 2 - 2} />
      </clipPath>

      <image
        href={spriteSrc}
        x={-size / 2}
        y={-size / 2}
        width={size}
        height={size}
        clipPath={`url(#${clipId})`}
        preserveAspectRatio="xMidYMid slice"
        transform={facingLeft ? 'scale(-1,1)' : undefined}
        opacity={isDwell ? 0.8 : 1}
      />

      {/* Індикатор зупинки */}
      {isDwell && (
        <circle r={size / 2 + 5} fill="none" stroke="#C6A552" strokeWidth={2} opacity={0.5}>
          <animate attributeName="r" values={`${size / 2 + 3};${size / 2 + 8};${size / 2 + 3}`} dur="1.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0;0.6" dur="1.2s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Напрямок */}
      <text
        y={size / 2 + 14}
        textAnchor="middle"
        fontSize={8}
        fill="#FFFFFF"
        opacity={0.8}
        style={{ paintOrder: 'stroke', stroke: '#0B120F', strokeWidth: 2 }}
      >
        {train.headsign}
      </text>
    </g>
  );
}

function ZoomButton({ label, onClick, small }: { label: string; onClick: () => void; small?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex items-center justify-center rounded-full border border-black/10 bg-ink-surface/90 font-display font-bold text-white shadow-lg transition-all active:scale-95 hover:bg-white hover:text-ink',
        small ? 'h-8 w-8 text-sm' : 'h-10 w-10 text-xl',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

function TrainInfoCard({ train, onClose }: { train: LiveMetroTrain; onClose: () => void }) {
  const nowSec = secOfDay(new Date());
  const speedKmh = Math.round(train.speedRatio * 40);

  return (
    <InfoCardShell onClose={onClose}>
      <div className="flex items-center gap-2">
        <span className="h-3.5 w-3.5 rounded-full ring-2 ring-white/20" style={{ backgroundColor: train.lineColor }} />
        <span className="font-display text-base font-bold text-white">{train.lineNumber} лінія</span>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/70">{train.headsign}</span>
      </div>
      <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-[12px]">
        <dt className="text-white/50">Поточна станція</dt>
        <dd className="text-right font-medium text-white/90">
          {train.phase === 'dwell' ? train.nextStation.name : train.previousStation.name}
        </dd>
        <dt className="text-white/50">Наступна станція</dt>
        <dd className="text-right font-medium text-white/90">{train.nextStation.name}</dd>
        <dt className="text-white/50">Статус руху</dt>
        <dd className="text-right font-medium text-white/90">
          {train.phase === 'dwell' ? (
            <span className="text-gold-light">зупинка · двері відкриті</span>
          ) : (
            <span>у дорозі · ≈ {speedKmh} км/год</span>
          )}
        </dd>
        <dt className="text-white/50">Прибуття на {train.nextStation.name}</dt>
        <dd className="text-right font-bold text-mint">
          {formatEtaClock(train.etaNextStationSec)} · {formatEtaCountdown(train.etaNextStationSec, nowSec)}
        </dd>
        <dt className="text-white/50">Напрямок</dt>
        <dd className="text-right font-medium text-white/90">→ {train.headsign}</dd>
      </dl>
    </InfoCardShell>
  );
}

function StationInfoCard({
  station,
  arrivals,
  timetable,
  dayType,
  nowSec,
  onClose,
}: {
  station: SchematicStation;
  arrivals: ReturnType<typeof getUpcomingArrivalsForStation>;
  timetable: StationDayTimetableEntry[];
  dayType: LiveMetroDayType;
  nowSec: number;
  onClose: () => void;
}) {
  const photo = getStationPhoto(station.id);
  const [showFullTimetable, setShowFullTimetable] = useState(false);
  const [activeTab, setActiveTab] = useState<'arrivals' | 'timetable' | 'info'>('arrivals');

  const line = BUILT_LINES.find((l) => l.line.id === station.lineId)?.line;

  return (
    <InfoCardShell onClose={onClose}>
      {/* Шапка з фото */}
      <div className="flex gap-3">
        {photo ? (
          <img
            src={photo}
            alt={station.name}
            className="h-18 w-24 shrink-0 rounded-lg object-cover shadow-md ring-1 ring-white/15"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="flex h-18 w-24 shrink-0 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
            <span className="text-2xl">🚇</span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: line?.color }} />
            <span className="font-display text-base font-extrabold text-white">{station.name}</span>
          </div>
          <div className="text-[11px] text-white/60">{station.nameEn}</div>
          {station.interchangeWith?.length ? (
            <div className="mt-1 flex items-center gap-1.5">
              <span className="rounded bg-gold/20 px-1.5 py-0.5 text-[10px] font-bold text-gold-light">Пересадка</span>
              <span className="text-[10px] text-white/50">
                {station.interchangeWith.map((id) => ALL_STATIONS_MAP.get(id)?.name).filter(Boolean).join(' · ')}
              </span>
            </div>
          ) : null}
          {station.description && (
            <p className="mt-1 text-[11px] leading-relaxed text-white/50">{station.description}</p>
          )}
        </div>
      </div>

      {/* Таби */}
      <div className="mt-3 flex gap-1 border-b border-white/10 pb-2">
        {(
          [
            { key: 'arrivals', label: 'Прибуття' },
            { key: 'timetable', label: 'Розклад' },
            { key: 'info', label: 'Інфо' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={[
              'rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
              activeTab === tab.key ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Контент табів */}
      <div className="mt-2">
        {activeTab === 'arrivals' && (
          <div className="flex flex-col gap-1.5">
            {arrivals.length === 0 && (
              <p className="py-2 text-center text-[12px] text-white/40">Найближчим часом потягів немає</p>
            )}
            {arrivals.map((a, i) => (
              <div
                key={`${a.lineId}-${a.headsign}-${i}`}
                className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-[12px] transition-colors hover:bg-white/10"
              >
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-full shadow-sm" style={{ backgroundColor: a.lineColor }} />
                  <span className="text-white/90">{a.lineNumber} → {a.headsign}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-white/40">{formatEtaClock(a.etaSec)}</span>
                  <span className="min-w-[50px] text-right font-bold text-mint">{formatEtaCountdown(a.etaSec, nowSec)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'timetable' && timetable.length > 0 && (
          <div>
            <div className="mb-2 flex items-center justify-between text-[11px] text-white/50">
              <span>{dayType === 'weekday' ? 'Будній день' : 'Вихідний день'}</span>
              <button
                type="button"
                onClick={() => setShowFullTimetable((v) => !v)}
                className="text-white/40 hover:text-white/80"
              >
                {showFullTimetable ? '▲ Згорнути' : '▼ Розгорнути'}
              </button>
            </div>
            <div className={`flex flex-col gap-2 ${showFullTimetable ? '' : 'max-h-32 overflow-hidden'}`}>
              {timetable.map((entry, i) => (
                <TimetableBlock key={`${entry.lineId}-${entry.direction}-${i}`} entry={entry} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'info' && (
          <div className="space-y-2 text-[12px]">
            <div className="flex justify-between">
              <span className="text-white/50">Тип станції</span>
              <span className="text-white/80">
                {station.type === 'deep' && 'Глибокого закладення'}
                {station.type === 'shallow' && 'Мілкого закладення'}
                {station.type === 'single-vault' && 'Односклепінна'}
                {station.type === 'pylon' && 'Колонна'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Дата відкриття</span>
              <span className="text-white/80">{station.opened}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Лінія</span>
              <span className="text-white/80" style={{ color: line?.color }}>
                {line?.number} — {line?.name}
              </span>
            </div>
            {station.interchangeWith && station.interchangeWith.length > 0 && (
              <div className="flex justify-between">
                <span className="text-white/50">Пересадка на</span>
                <span className="text-gold-light">
                  {station.interchangeWith.map((id) => {
                    const s = ALL_STATIONS_MAP.get(id);
                    const l = BUILT_LINES.find((bl) => bl.line.id === s?.lineId)?.line;
                    return l ? `${l.number} лінію` : '';
                  }).filter(Boolean).join(', ')}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </InfoCardShell>
  );
}

function TimetableBlock({ entry }: { entry: StationDayTimetableEntry }) {
  return (
    <div className="mb-2">
      <div className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold text-white/80">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.lineColor }} />
        <span>{entry.lineNumber}</span>
        <span className="text-white/50">→</span>
        <span>{entry.headsign}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {entry.times.map((t, i) => (
          <span key={i} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] tabular-nums text-white/70">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function InfoCardShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="absolute inset-x-3 bottom-3 z-30 rounded-2xl border border-ink-border bg-black/90 p-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-4 duration-300">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Закрити"
      >
        ✕
      </button>
      {children}
    </div>
  );
}

// Карта всіх станцій для швидкого доступу
const ALL_STATIONS_MAP = new Map<string, SchematicStation>();
for (const { line } of BUILT_LINES) {
  for (const station of line.stations) {
    if (!ALL_STATIONS_MAP.has(station.id)) {
      ALL_STATIONS_MAP.set(station.id, station);
    }
  }
}
