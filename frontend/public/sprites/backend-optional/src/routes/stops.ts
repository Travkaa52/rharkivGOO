import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { redis } from '../config/redis.js';
import { HttpError } from '../middleware/errorHandler.js';

export const stopsRouter = Router();

function mapStopRow(row: any) {
  return {
    id: row.id,
    name: row.name,
    position: { lat: row.lat, lng: row.lng },
    kinds: row.kinds,
    isAccessible: row.is_accessible,
    routeIds: row.route_ids ?? []
  };
}

const STOP_SELECT = `
  SELECT s.id, s.name, s.lat, s.lng, s.kinds, s.is_accessible,
         array_agg(DISTINCT rs.route_id) FILTER (WHERE rs.route_id IS NOT NULL) AS route_ids
  FROM stops s
  LEFT JOIN route_stops rs ON rs.stop_id = s.id
`;

stopsRouter.get('/search', async (req, res, next) => {
  try {
    const query = z.string().min(1).parse(req.query.q);
    const result = await pool.query(
      `${STOP_SELECT}
       WHERE to_tsvector('simple', s.name) @@ plainto_tsquery('simple', $1)
          OR s.name ILIKE '%' || $1 || '%'
       GROUP BY s.id
       ORDER BY s.name
       LIMIT 25`,
      [query]
    );
    res.json(result.rows.map(mapStopRow));
  } catch (err) {
    next(err);
  }
});

stopsRouter.get('/nearby', async (req, res, next) => {
  try {
    const schema = z.object({
      lat: z.coerce.number(),
      lng: z.coerce.number(),
      radius: z.coerce.number().default(500)
    });
    const { lat, lng, radius } = schema.parse(req.query);

    // Наближена перевірка відстані в градусах для простоти;
    // у продакшн-версії варто перейти на PostGIS ST_DWithin(geography).
    const degreeRadius = radius / 111_000;

    const result = await pool.query(
      `${STOP_SELECT}
       WHERE s.lat BETWEEN $1 - $3 AND $1 + $3
         AND s.lng BETWEEN $2 - $3 AND $2 + $3
       GROUP BY s.id
       LIMIT 50`,
      [lat, lng, degreeRadius]
    );
    res.json(result.rows.map(mapStopRow));
  } catch (err) {
    next(err);
  }
});

stopsRouter.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(`${STOP_SELECT} WHERE s.id = $1 GROUP BY s.id`, [req.params.id]);
    if (!result.rowCount) throw new HttpError(404, 'Зупинку не знайдено');
    res.json(mapStopRow(result.rows[0]));
  } catch (err) {
    next(err);
  }
});

stopsRouter.get('/:id/arrivals', async (req, res, next) => {
  try {
    const cacheKey = `arrivals:${req.params.id}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(JSON.parse(cached));
    }

    const result = await pool.query(
      `SELECT v.id AS vehicle_id, v.route_id,
              GREATEST(0, EXTRACT(EPOCH FROM (rs.arrival_offset_sec * interval '1 second' - now()))) / 60 AS eta_minutes
       FROM vehicles v
       JOIN route_stops rs ON rs.route_id = v.route_id AND rs.stop_id = $1
       WHERE v.state != 'offline'
       ORDER BY eta_minutes ASC
       LIMIT 10`,
      [req.params.id]
    );

    const payload = result.rows.map((r) => ({
      routeId: r.route_id,
      vehicleId: r.vehicle_id,
      etaMinutes: Math.round(Number(r.eta_minutes))
    }));

    await redis.set(cacheKey, JSON.stringify(payload), 'EX', 15); // короткий TTL — дані живі
    res.json(payload);
  } catch (err) {
    next(err);
  }
});
