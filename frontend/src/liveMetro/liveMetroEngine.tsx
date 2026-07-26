/**
 * Аналітичний рушій "живого метро": чиста функція часу → позиції потягів.
 * Ніякого стану, ніякого GPS — просто розклад (SCHEMATIC_LINES + інтервали)
 * і поточний час. Це дає плавний детермінований рух без бекенду.
 */
import {
  SCHEMATIC_LINES,
  DWELL_SEC,
  SERVICE_START_SEC,
  SERVICE_END_SEC,
  type SchematicLine,
  type SchematicStation,
  type LiveMetroDayType
} from '@/liveMetro/schematicData';

export type TrainDirection = 'forward' | 'backward';
export type TrainPhase = 'dwell' | 'accelerating' | 'cruising' | 'braking';

export interface LiveMetroTrain {
  id: string;
  lineId: string;
  lineNumber: string;
  lineColor: string;
  direction: TrainDirection;
  headsign: string;
  point: { x: number; y: number };
  headingDeg: number;
  phase: TrainPhase;
  speedRatio: number;
  previousStation: SchematicStation;
  nextStation: SchematicStation;
  etaNextStationSec: number;
  etaTerminusSec: number;
}

export interface UpcomingDeparture {
  lineId: string;
  lineNumber: string;
  lineColor: string;
  headsign: string;
  etaSec: number;
}

export interface StationDayTimetableEntry {
  lineId: string;
  lineNumber: string;
  lineColor: string;
  direction: TrainDirection;
  headsign: string;
  times: string[];
}

/** { line } обгортка — зберігає форму, якою користується сторінка карти. */
export const BUILT_LINES = SCHEMATIC_LINES.map((line) => ({ line }));

export function secOfDay(date: Date): number {
  return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
}

export function dayTypeOf(date: Date): LiveMetroDayType {
  const day = date.getDay();
  return day === 0 || day === 6 ? 'weekend' : 'weekday';
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

/** Форматує секунди-від-півночі як "ГГ:ХХ". */
export function formatEtaClock(sec: number): string {
  const s = ((sec % 86400) + 86400) % 86400;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${pad2(h)}:${pad2(m)}`;
}

/** Форматує зворотний відлік до прибуття у зручному вигляді ("3 хв", "<1 хв"). */
export function formatEtaCountdown(etaSec: number, nowSec: number): string {
  const diff = etaSec - nowSec;
  if (diff <= 20) return 'зараз';
  const mins = Math.round(diff / 60);
  if (mins < 1) return '<1 хв';
  return `${mins} хв`;
}

/** Хронологічна послідовність станцій у напрямку руху разом з часом прибуття (сек від старту рейсу). */
function timelineFor(line: SchematicLine, direction: TrainDirection): Array<{ station: SchematicStation; t: number }> {
  const total = line.stations[line.stations.length - 1].arrivalOffsetSec;
  if (direction === 'forward') {
    return line.stations.map((station) => ({ station, t: station.arrivalOffsetSec }));
  }
  return line.stations
    .slice()
    .reverse()
    .map((station) => ({ station, t: total - station.arrivalOffsetSec }));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function headingBetween(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
}

interface Candidate {
  line: SchematicLine;
  direction: TrainDirection;
  departureSec: number;
}

/** Знаходить усі рейси лінії/напрямку, що потенційно активні "зараз" (nowSec, можна дробове). */
function candidatesFor(line: SchematicLine, direction: TrainDirection, nowSec: number, dayType: LiveMetroDayType): Candidate[] {
  const timeline = timelineFor(line, direction);
  const total = timeline[timeline.length - 1].t;
  const interval = Math.max(60, line.intervalMinutes[dayType] * 60);
  const out: Candidate[] = [];

  for (let offset = 0; offset < total; offset += interval) {
    let mod = (nowSec - SERVICE_START_SEC - offset) % interval;
    if (mod < 0) mod += interval;
    const elapsed = offset + mod;
    if (elapsed > total) continue;
    const departureSec = nowSec - elapsed;
    if (departureSec < SERVICE_START_SEC - 1 || departureSec > SERVICE_END_SEC) continue;
    out.push({ line, direction, departureSec });
  }
  return out;
}

function positionAtElapsed(
  line: SchematicLine,
  direction: TrainDirection,
  elapsed: number
): {
  point: { x: number; y: number };
  headingDeg: number;
  phase: TrainPhase;
  speedRatio: number;
  previousStation: SchematicStation;
  nextStation: SchematicStation;
  etaNextStationSec: number;
} | null {
  const timeline = timelineFor(line, direction);
  for (let i = 0; i < timeline.length - 1; i++) {
    const a = timeline[i];
    const b = timeline[i + 1];
    if (elapsed < a.t || elapsed > b.t) continue;

    const travelStart = a.t + DWELL_SEC;
    const travelEnd = b.t;

    if (elapsed <= travelStart || travelEnd <= travelStart) {
      return {
        point: a.station.point,
        headingDeg: headingBetween(a.station.point, b.station.point),
        phase: 'dwell',
        speedRatio: 0,
        previousStation: a.station,
        nextStation: b.station,
        etaNextStationSec: travelEnd
      };
    }

    const ratio = Math.min(1, Math.max(0, (elapsed - travelStart) / (travelEnd - travelStart)));
    const phase: TrainPhase = ratio < 0.18 ? 'accelerating' : ratio > 0.82 ? 'braking' : 'cruising';
    return {
      point: { x: lerp(a.station.point.x, b.station.point.x, ratio), y: lerp(a.station.point.y, b.station.point.y, ratio) },
      headingDeg: headingBetween(a.station.point, b.station.point),
      phase,
      speedRatio: phase === 'cruising' ? 1 : 0.5,
      previousStation: a.station,
      nextStation: b.station,
      etaNextStationSec: travelEnd
    };
  }

  // Потяг досяг кінцевої — стоїть там до кінця рейсу.
  const last = timeline[timeline.length - 1];
  const prev = timeline[timeline.length - 2] ?? last;
  return {
    point: last.station.point,
    headingDeg: headingBetween(prev.station.point, last.station.point),
    phase: 'dwell',
    speedRatio: 0,
    previousStation: prev.station,
    nextStation: last.station,
    etaNextStationSec: last.t
  };
}

/** Усі потяги, що зараз їдуть по мережі, для довільного моменту часу. */
export function getActiveTrains(now: Date): LiveMetroTrain[] {
  const nowSec = secOfDay(now);
  const dayType = dayTypeOf(now);
  if (nowSec < SERVICE_START_SEC - 60 || nowSec > SERVICE_END_SEC + 60) return [];

  const trains: LiveMetroTrain[] = [];

  for (const line of SCHEMATIC_LINES) {
    (['forward', 'backward'] as TrainDirection[]).forEach((direction) => {
      const candidates = candidatesFor(line, direction, nowSec, dayType);
      const total = timelineFor(line, direction)[timelineFor(line, direction).length - 1].t;

      candidates.forEach((c) => {
        const elapsed = nowSec - c.departureSec;
        const pos = positionAtElapsed(line, direction, elapsed);
        if (!pos) return;

        trains.push({
          id: `${line.id}-${direction}-${c.departureSec}`,
          lineId: line.id,
          lineNumber: line.number,
          lineColor: line.color,
          direction,
          headsign: direction === 'forward' ? line.headsignForward : line.headsignBackward,
          point: pos.point,
          headingDeg: pos.headingDeg,
          phase: pos.phase,
          speedRatio: pos.speedRatio,
          previousStation: pos.previousStation,
          nextStation: pos.nextStation,
          etaNextStationSec: c.departureSec + pos.etaNextStationSec,
          etaTerminusSec: c.departureSec + total
        });
      });
    });
  }

  return trains;
}

/** Найближчі прибуття потягів на задану станцію. */
export function getUpcomingArrivalsForStation(stationId: string, now: Date, count: number): UpcomingDeparture[] {
  const nowSec = secOfDay(now);
  const dayType = dayTypeOf(now);
  const results: UpcomingDeparture[] = [];

  for (const line of SCHEMATIC_LINES) {
    (['forward', 'backward'] as TrainDirection[]).forEach((direction) => {
      const timeline = timelineFor(line, direction);
      const entry = timeline.find((e) => e.station.id === stationId);
      if (!entry) return;

      const interval = Math.max(60, line.intervalMinutes[dayType] * 60);
      let k = Math.floor((nowSec - SERVICE_START_SEC - entry.t) / interval);
      for (let guard = 0; guard < count + 4; guard++, k++) {
        const departureSec = SERVICE_START_SEC + k * interval;
        if (departureSec < SERVICE_START_SEC) continue;
        if (departureSec > SERVICE_END_SEC) break;
        const arrival = departureSec + entry.t;
        if (arrival < nowSec) continue;

        results.push({
          lineId: line.id,
          lineNumber: line.number,
          lineColor: line.color,
          headsign: direction === 'forward' ? line.headsignForward : line.headsignBackward,
          etaSec: arrival
        });
        if (results.filter((r) => r.lineId === line.id).length >= count) break;
      }
    });
  }

  return results.sort((a, b) => a.etaSec - b.etaSec).slice(0, count);
}

/** Повний денний розклад прибуттів на станцію (для обраного типу дня). */
export function getStationDayTimetable(stationId: string, dayType: LiveMetroDayType): StationDayTimetableEntry[] {
  const entries: StationDayTimetableEntry[] = [];

  for (const line of SCHEMATIC_LINES) {
    (['forward', 'backward'] as TrainDirection[]).forEach((direction) => {
      const timeline = timelineFor(line, direction);
      const stationEntry = timeline.find((e) => e.station.id === stationId);
      if (!stationEntry) return;

      const interval = Math.max(60, line.intervalMinutes[dayType] * 60);
      const times: string[] = [];
      for (let departureSec = SERVICE_START_SEC; departureSec <= SERVICE_END_SEC; departureSec += interval) {
        times.push(formatEtaClock(departureSec + stationEntry.t));
      }

      entries.push({
        lineId: line.id,
        lineNumber: line.number,
        lineColor: line.color,
        direction,
        headsign: direction === 'forward' ? line.headsignForward : line.headsignBackward,
        times
      });
    });
  }

  return entries;
}
