import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db.js';

export const tripsRouter = Router();

const WALK_SPEED_M_PER_S = 1.3;

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * СПРОЩЕНИЙ алгоритм побудови маршруту: знаходить найближчу до точки А зупинку
 * та найближчу до точки Б зупинку, що лежать на одному маршруті, і збирає
 * "пішки → транспорт → пішки". Це базова версія для MVP; для повноцінного
 * мультимодального роутингу (пересадки, кілька гілок) варто підключити
 * окремий сервіс на кшталт OpenTripPlanner або RAPTOR-реалізацію.
 */
tripsRouter.post('/build', async (req, res, next) => {
  try {
    const schema = z.object({
      fromLat: z.number(),
      fromLng: z.number(),
      toLat: z.number(),
      toLng: z.number()
    });
    const { fromLat, fromLng, toLat, toLng } = schema.parse(req.body);

    const candidateStops = await pool.query(
      `SELECT s.id, s.name, s.lat, s.lng, array_agg(DISTINCT rs.route_id) AS route_ids
       FROM stops s
       JOIN route_stops rs ON rs.stop_id = s.id
       GROUP BY s.id`
    );

    let best: { fromStop: any; toStop: any; routeId: string; score: number } | null = null;

    for (const fromStop of candidateStops.rows) {
      const dFrom = haversineMeters(fromLat, fromLng, fromStop.lat, fromStop.lng);
      if (dFrom > 1200) continue; // не йдемо пішки більше ~15 хв

      for (const toStop of candidateStops.rows) {
        if (toStop.id === fromStop.id) continue;
        const sharedRoute = (fromStop.route_ids as string[]).find((r) => (toStop.route_ids as string[]).includes(r));
        if (!sharedRoute) continue;

        const dTo = haversineMeters(toLat, toLng, toStop.lat, toStop.lng);
        if (dTo > 1200) continue;

        const score = dFrom + dTo;
        if (!best || score < best.score) {
          best = { fromStop, toStop, routeId: sharedRoute, score };
        }
      }
    }

    if (!best) {
      return res.json({
        legs: [
          {
            mode: 'walk',
            durationSec: Math.round(haversineMeters(fromLat, fromLng, toLat, toLng) / WALK_SPEED_M_PER_S),
            distanceM: Math.round(haversineMeters(fromLat, fromLng, toLat, toLng))
          }
        ],
        totalDurationSec: Math.round(haversineMeters(fromLat, fromLng, toLat, toLng) / WALK_SPEED_M_PER_S)
      });
    }

    const walk1Distance = haversineMeters(fromLat, fromLng, best.fromStop.lat, best.fromStop.lng);
    const walk2Distance = haversineMeters(toLat, toLng, best.toStop.lat, best.toStop.lng);
    const transitDistance = haversineMeters(best.fromStop.lat, best.fromStop.lng, best.toStop.lat, best.toStop.lng);
    const transitDurationSec = Math.round(transitDistance / (25 / 3.6)); // умовна швидкість 25 км/год

    const legs = [
      { mode: 'walk' as const, durationSec: Math.round(walk1Distance / WALK_SPEED_M_PER_S), distanceM: Math.round(walk1Distance) },
      { mode: 'bus' as const, routeId: best.routeId, durationSec: transitDurationSec, distanceM: Math.round(transitDistance) },
      { mode: 'walk' as const, durationSec: Math.round(walk2Distance / WALK_SPEED_M_PER_S), distanceM: Math.round(walk2Distance) }
    ];

    res.json({
      legs,
      totalDurationSec: legs.reduce((sum, leg) => sum + leg.durationSec, 0)
    });
  } catch (err) {
    next(err);
  }
});
