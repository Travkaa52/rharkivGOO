import type { GeoPoint } from '@/types/transport';

/**
 * Геометричні утиліти для розрахунку позицій транспорту на карті.
 * Використовуються насамперед для математичної симуляції руху метро
 * за розкладом (без GPS) — @see useMetroPositions.
 */

const EARTH_RADIUS_M = 6371000;

export function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function haversineMeters(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/** Азимут (0° = північ, за годинниковою стрілкою) від точки a до точки b. */
export function bearingDegrees(a: GeoPoint, b: GeoPoint): number {
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLng = toRad(b.lng - a.lng);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Лінійна інтерполяція точки між a і b, t ∈ [0,1]. Достатньо точно для коротких міських перегонів. */
export function interpolatePoint(a: GeoPoint, b: GeoPoint, t: number): GeoPoint {
  const clamped = Math.max(0, Math.min(1, t));
  return {
    lat: a.lat + (b.lat - a.lat) * clamped,
    lng: a.lng + (b.lng - a.lng) * clamped
  };
}

export interface TimedWaypoint {
  point: GeoPoint;
  /** Секунди від початку поїздки. */
  offsetSec: number;
}

export interface PathSample {
  position: GeoPoint;
  heading: number;
  /** true, якщо потяг зараз стоїть на зупинці (в межах вікна зупинки). */
  atStop: boolean;
  /** Індекс попередньої пройденої точки маршруту. */
  segmentIndex: number;
}

/**
 * Обчислює позицію та курс об'єкта, що рухається вздовж ламаної з відомими
 * часовими мітками проходження кожної точки (розклад).
 * elapsedSec — час з моменту відправлення першого потяга рейсу.
 */
export function sampleTimedPath(waypoints: TimedWaypoint[], elapsedSec: number, dwellSec = 25): PathSample {
  if (waypoints.length === 0) {
    throw new Error('sampleTimedPath: waypoints не можуть бути порожніми');
  }
  if (waypoints.length === 1 || elapsedSec <= waypoints[0].offsetSec) {
    return { position: waypoints[0].point, heading: 0, atStop: true, segmentIndex: 0 };
  }

  const last = waypoints[waypoints.length - 1];
  if (elapsedSec >= last.offsetSec) {
    const prev = waypoints[waypoints.length - 2] ?? waypoints[0];
    return {
      position: last.point,
      heading: bearingDegrees(prev.point, last.point),
      atStop: true,
      segmentIndex: waypoints.length - 1
    };
  }

  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = waypoints[i];
    const to = waypoints[i + 1];
    if (elapsedSec < from.offsetSec || elapsedSec > to.offsetSec) continue;

    const legDuration = Math.max(1, to.offsetSec - from.offsetSec);
    // Останні dwellSec перед прибуттям та перші dwellSec після відправлення
    // рахуємо як стоянку на зупинці (потяг гальмує/розганяється, а не летить крізь платформу).
    const dwellAtStart = Math.min(dwellSec, legDuration * 0.3);
    const dwellAtEnd = Math.min(dwellSec, legDuration * 0.3);
    const cruiseStart = from.offsetSec + dwellAtStart;
    const cruiseEnd = to.offsetSec - dwellAtEnd;

    if (elapsedSec <= cruiseStart || cruiseEnd <= cruiseStart) {
      const heading = bearingDegrees(from.point, to.point);
      return { position: from.point, heading, atStop: true, segmentIndex: i };
    }
    if (elapsedSec >= cruiseEnd) {
      const heading = bearingDegrees(from.point, to.point);
      return { position: to.point, heading, atStop: true, segmentIndex: i };
    }

    const t = (elapsedSec - cruiseStart) / (cruiseEnd - cruiseStart);
    const heading = bearingDegrees(from.point, to.point);
    return { position: interpolatePoint(from.point, to.point, t), heading, atStop: false, segmentIndex: i };
  }

  return { position: last.point, heading: 0, atStop: true, segmentIndex: waypoints.length - 1 };
}

/** Парсить "HH:MM" у секунди від півночі. */
export function timeStringToSeconds(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 3600 + (m || 0) * 60;
}

/** Поточний час доби у секундах (локальний час пристрою). */
export function secondsSinceMidnight(date: Date): number {
  return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
}
