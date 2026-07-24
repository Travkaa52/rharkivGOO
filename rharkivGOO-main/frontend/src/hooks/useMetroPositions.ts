import { useEffect, useMemo, useState } from 'react';
import { localRoutes, localStops } from '@/data/localData';
import { bearingDegrees, haversineMeters, sampleTimedPath, secondsSinceMidnight, timeStringToSeconds } from '@/lib/geo';
import type { TimedWaypoint } from '@/lib/geo';
import type { GeoPoint, TransportRoute, Vehicle, VehicleState } from '@/types/transport';

/**
 * Симуляція руху метро БЕЗ GPS — суворо за офіційним розкладом.
 * Позиція кожного потяга обчислюється математично з:
 *  - часу доби (годинник пристрою);
 *  - розкладу маршруту (schedule: зупинка → offset у секундах від початку рейсу);
 *  - координат зупинок (реальна географія, не по прямій "з нізвідки").
 *
 * На лінії одночасно може перебувати кілька потягів — вони відправляються
 * кожні `intervalMinutes` (інтервал руху) від першого до останнього рейсу.
 * Це не GPS-трекінг, а детермінована модель розкладу: у будь-який момент
 * часу результат однаковий для всіх користувачів і повністю відтворюваний.
 */

const TICK_MS = 1000;
const DWELL_SEC = 25; // час стоянки на зупинці, закладений у розрахунок швидкості

interface DirectionPlan {
  waypoints: TimedWaypoint[];
  tripDurationSec: number;
  headsign: string;
  /** Зсув часу відправлення відносно прямого напрямку (щоб потяги не йшли "в лоб" одночасно). */
  departureOffsetSec: number;
}

function buildDirectionPlan(route: TransportRoute, direction: 'forward' | 'backward'): DirectionPlan | null {
  const orderedStopIds = direction === 'forward' ? route.stopIds : [...route.stopIds].reverse();
  const points: GeoPoint[] = [];
  for (const stopId of orderedStopIds) {
    const stop = localStops.getById(stopId);
    if (!stop) return null;
    points.push(stop.position);
  }

  const scheduleByStop = new Map(route.schedule.map((s) => [s.stopId, s.arrivalOffsetSec]));
  const tripDurationSec = route.schedule[route.schedule.length - 1]?.arrivalOffsetSec ?? 0;
  if (tripDurationSec <= 0) return null;

  const waypoints: TimedWaypoint[] = orderedStopIds.map((stopId, idx) => {
    const forwardOffset = scheduleByStop.get(stopId);
    const offsetSec =
      direction === 'forward' && forwardOffset !== undefined
        ? forwardOffset
        : tripDurationSec - (scheduleByStop.get(route.stopIds[route.stopIds.length - 1 - idx]) ?? 0);
    return { point: points[idx], offsetSec };
  });

  return {
    waypoints,
    tripDurationSec,
    headsign: direction === 'forward' ? route.headsignForward : route.headsignBackward,
    departureOffsetSec: direction === 'forward' ? 0 : (route.intervalMinutes * 60) / 2
  };
}

function vehicleStateFromSample(atStop: boolean, speedKmh: number): VehicleState {
  if (atStop) return 'stopped';
  return speedKmh > 5 ? 'moving' : 'accelerating';
}

function computeDirectionVehicles(route: TransportRoute, plan: DirectionPlan, direction: 'forward' | 'backward', nowSec: number): Vehicle[] {
  const serviceStart = timeStringToSeconds(route.firstDeparture) + plan.departureOffsetSec;
  const serviceEnd = timeStringToSeconds(route.lastDeparture);
  const headwaySec = Math.max(60, route.intervalMinutes * 60);

  if (nowSec < serviceStart || nowSec > serviceEnd + plan.tripDurationSec) return [];

  const vehicles: Vehicle[] = [];
  const firstDepartureIndex = Math.max(0, Math.floor((nowSec - plan.tripDurationSec - serviceStart) / headwaySec));
  const lastDepartureIndex = Math.floor((nowSec - serviceStart) / headwaySec) + 1;

  for (let i = firstDepartureIndex; i <= lastDepartureIndex; i++) {
    const departureAt = serviceStart + i * headwaySec;
    if (departureAt > Math.min(nowSec, serviceEnd)) continue;

    const elapsed = nowSec - departureAt;
    if (elapsed < 0 || elapsed > plan.tripDurationSec) continue;

    const sample = sampleTimedPath(plan.waypoints, elapsed, DWELL_SEC);

    // Швидкість оцінюємо з довжини поточного перегону та його тривалості за розкладом.
    const from = plan.waypoints[sample.segmentIndex];
    const to = plan.waypoints[sample.segmentIndex + 1];
    let speedKmh = 0;
    if (from && to && !sample.atStop) {
      const legMeters = haversineMeters(from.point, to.point);
      const legSeconds = Math.max(1, to.offsetSec - from.offsetSec - DWELL_SEC * 0.6);
      speedKmh = (legMeters / legSeconds) * 3.6;
    }

    vehicles.push({
      id: `${route.id}-${direction}-${departureAt}`,
      kind: 'metro',
      routeNumber: route.number,
      headsign: plan.headsign,
      position: sample.position,
      heading: sample.heading || bearingDegrees(plan.waypoints[0].point, plan.waypoints[plan.waypoints.length - 1].point),
      speedKmh: Math.round(speedKmh),
      state: vehicleStateFromSample(sample.atStop, speedKmh),
      lastUpdatedAt: new Date().toISOString()
    });
  }

  return vehicles;
}

/**
 * Повертає позиції всіх потягів метро, що зараз мають бути в русі згідно
 * з розкладом. Перераховується щосекунди — без мережевих запитів,
 * без GPS, повністю на клієнті.
 */
export function useMetroPositions(): Vehicle[] {
  const metroRoutes = useMemo(() => localRoutes.getByKind('metro'), []);
  const plans = useMemo(() => {
    return metroRoutes
      .map((route) => ({
        route,
        forward: buildDirectionPlan(route, 'forward'),
        backward: buildDirectionPlan(route, 'backward')
      }))
      .filter((p) => p.forward && p.backward);
  }, [metroRoutes]);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    function tick() {
      const nowSec = secondsSinceMidnight(new Date());
      const next: Vehicle[] = [];
      for (const { route, forward, backward } of plans) {
        if (forward) next.push(...computeDirectionVehicles(route, forward, 'forward', nowSec));
        if (backward) next.push(...computeDirectionVehicles(route, backward, 'backward', nowSec));
      }
      setVehicles(next);
    }

    tick();
    const interval = setInterval(tick, TICK_MS);
    return () => clearInterval(interval);
  }, [plans]);

  return vehicles;
}
