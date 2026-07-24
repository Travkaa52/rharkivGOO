import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { HttpError } from '../middleware/errorHandler.js';

export const routesRouter = Router();

function mapRouteRow(row: any) {
  return {
    id: row.id,
    kind: row.kind,
    number: row.number,
    name: row.name,
    color: row.color,
    headsignForward: row.headsign_forward,
    headsignBackward: row.headsign_backward,
    firstDeparture: row.first_departure,
    lastDeparture: row.last_departure,
    intervalMinutes: row.interval_minutes,
    stopIds: row.stop_ids ?? []
  };
}

const ROUTE_SELECT = `
  SELECT r.*, array_agg(rs.stop_id ORDER BY rs.sequence_order) AS stop_ids
  FROM routes r
  LEFT JOIN route_stops rs ON rs.route_id = r.id
`;

routesRouter.get('/', async (req, res, next) => {
  try {
    const kind = z.enum(['metro', 'tram', 'trolleybus', 'bus']).optional().parse(req.query.kind);
    const result = kind
      ? await pool.query(`${ROUTE_SELECT} WHERE r.kind = $1 GROUP BY r.id ORDER BY r.number`, [kind])
      : await pool.query(`${ROUTE_SELECT} GROUP BY r.id ORDER BY r.kind, r.number`);
    res.json(result.rows.map(mapRouteRow));
  } catch (err) {
    next(err);
  }
});

routesRouter.get('/search', async (req, res, next) => {
  try {
    const query = z.string().min(1).parse(req.query.q);
    const result = await pool.query(
      `${ROUTE_SELECT}
       WHERE r.number ILIKE $1 || '%' OR r.name ILIKE '%' || $1 || '%'
       GROUP BY r.id
       ORDER BY r.number
       LIMIT 25`,
      [query]
    );
    res.json(result.rows.map(mapRouteRow));
  } catch (err) {
    next(err);
  }
});

routesRouter.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(`${ROUTE_SELECT} WHERE r.id = $1 GROUP BY r.id`, [req.params.id]);
    if (!result.rowCount) throw new HttpError(404, 'Маршрут не знайдено');
    res.json(mapRouteRow(result.rows[0]));
  } catch (err) {
    next(err);
  }
});
