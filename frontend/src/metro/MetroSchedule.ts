import { timeStringToSeconds } from '@/metro/geometry';
import type { MetroLineJson, MetroLineScheduleEntry } from '@/metro/types';

/**
 * Стоянка на станції за замовчуванням, секунд — застосовується ЛИШЕ якщо
 * конкретний запис розкладу (MetroLineScheduleEntry.dwellSec) не задає
 * власного значення. Це константа з реального орієнтовного часу зупинки
 * харківського метро, а не випадкове число.
 */
export const DEFAULT_DWELL_SEC = 25;

/** Мінімально допустимий інтервал руху (захист від некоректних даних: 0 чи від'ємний інтервал). */
const MIN_HEADWAY_SEC = 60;

export interface ResolvedDeparture {
  /** Секунда відправлення рейсу з першої станції напрямку, від півночі поточної доби. */
  departureAtSec: number;
}

/**
 * Розклад одного напрямку однієї лінії метро.
 *
 * Розклад НІКОЛИ не генерується випадково: він або береться дослівно з
 * `explicitDepartures` (якщо в даних є точний перелік рейсів), або
 * детерміновано обчислюється за формулою `firstDeparture + i * headwaySec`
 * (рівномірний інтервал руху, як у реальних розкладах метро) з урахуванням
 * `peakIntervals`, якщо вони задані для лінії.
 */
export class MetroSchedule {
  readonly firstDepartureSec: number;
  readonly lastDepartureSec: number;
  readonly tripDurationSec: number;
  readonly stationTiming: ReadonlyMap<string, { arrivalOffsetSec: number; dwellSec: number }>;

  private readonly explicitDepartureSecs: number[] | null;
  private readonly baseHeadwaySec: number;
  private readonly peakIntervals: { fromSec: number; toSec: number; headwaySec: number }[];

  constructor(line: MetroLineJson, schedule: MetroLineScheduleEntry[]) {
    if (schedule.length < 2) {
      throw new Error(`MetroSchedule: лінія "${line.id}" повинна мати щонайменше 2 записи розкладу зупинок`);
    }

    this.firstDepartureSec = timeStringToSeconds(line.firstDeparture);
    this.lastDepartureSec = timeStringToSeconds(line.lastDeparture);
    if (this.lastDepartureSec <= this.firstDepartureSec) {
      throw new Error(`MetroSchedule: lastDeparture повинен бути пізніше firstDeparture для лінії "${line.id}"`);
    }

    this.tripDurationSec = schedule[schedule.length - 1].arrivalOffsetSec;
    if (this.tripDurationSec <= 0) {
      throw new Error(`MetroSchedule: некоректна тривалість рейсу для лінії "${line.id}"`);
    }

    const timing = new Map<string, { arrivalOffsetSec: number; dwellSec: number }>();
    for (const entry of schedule) {
      timing.set(entry.stopId, {
        arrivalOffsetSec: entry.arrivalOffsetSec,
        dwellSec: entry.dwellSec ?? DEFAULT_DWELL_SEC
      });
    }
    this.stationTiming = timing;

    this.baseHeadwaySec = Math.max(MIN_HEADWAY_SEC, Math.round(line.intervalMinutes * 60));

    this.peakIntervals = (line.peakIntervals ?? [])
      .map((p) => ({
        fromSec: timeStringToSeconds(p.fromTime),
        toSec: timeStringToSeconds(p.toTime),
        headwaySec: Math.max(MIN_HEADWAY_SEC, Math.round(p.intervalMinutes * 60))
      }))
      .sort((a, b) => a.fromSec - b.fromSec);

    this.explicitDepartureSecs = line.explicitDepartures
      ? line.explicitDepartures.map(timeStringToSeconds).sort((a, b) => a - b)
      : null;
  }

  /** Інтервал руху (секунд), чинний у момент часу `atSec` — з урахуванням пікових періодів. */
  private headwayAt(atSec: number): number {
    for (const period of this.peakIntervals) {
      if (atSec >= period.fromSec && atSec < period.toSec) return period.headwaySec;
    }
    return this.baseHeadwaySec;
  }

  /**
   * Детерміновано генерує повний перелік часу відправлень за добу для
   * цього напрямку. Обчислюється один раз при побудові лінії й кешується
   * викликачем (MetroRoute) — це чиста функція від даних розкладу.
   */
  buildDailyDepartures(): ResolvedDeparture[] {
    if (this.explicitDepartureSecs) {
      return this.explicitDepartureSecs
        .filter((sec) => sec >= this.firstDepartureSec && sec <= this.lastDepartureSec)
        .map((departureAtSec) => ({ departureAtSec }));
    }

    const departures: ResolvedDeparture[] = [];
    let cursor = this.firstDepartureSec;
    // Захист від нескінченного циклу при пошкоджених даних (headway <= 0 неможливий через Math.max вище).
    let safetyCounter = 0;
    const maxIterations = Math.ceil((this.lastDepartureSec - this.firstDepartureSec) / MIN_HEADWAY_SEC) + 2;

    while (cursor <= this.lastDepartureSec && safetyCounter <= maxIterations) {
      departures.push({ departureAtSec: cursor });
      cursor += this.headwayAt(cursor);
      safetyCounter += 1;
    }

    return departures;
  }
}
