import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';

export const favoritesRouter = Router();
favoritesRouter.use(requireAuth);

favoritesRouter.get('/stops', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT stop_id, added_at FROM favorite_stops WHERE user_id = $1 ORDER BY added_at DESC',
      [req.user!.userId]
    );
    res.json(result.rows.map((r) => ({ stopId: r.stop_id, addedAt: r.added_at })));
  } catch (err) {
    next(err);
  }
});

favoritesRouter.post('/stops/:stopId', async (req, res, next) => {
  try {
    await pool.query(
      `INSERT INTO favorite_stops (user_id, stop_id) VALUES ($1, $2)
       ON CONFLICT (user_id, stop_id) DO NOTHING`,
      [req.user!.userId, req.params.stopId]
    );
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

favoritesRouter.delete('/stops/:stopId', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM favorite_stops WHERE user_id = $1 AND stop_id = $2', [
      req.user!.userId,
      req.params.stopId
    ]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

favoritesRouter.get('/routes', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT route_id, added_at FROM favorite_routes WHERE user_id = $1 ORDER BY added_at DESC',
      [req.user!.userId]
    );
    res.json(result.rows.map((r) => ({ routeId: r.route_id, addedAt: r.added_at })));
  } catch (err) {
    next(err);
  }
});

favoritesRouter.post('/routes/:routeId', async (req, res, next) => {
  try {
    await pool.query(
      `INSERT INTO favorite_routes (user_id, route_id) VALUES ($1, $2)
       ON CONFLICT (user_id, route_id) DO NOTHING`,
      [req.user!.userId, req.params.routeId]
    );
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

favoritesRouter.delete('/routes/:routeId', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM favorite_routes WHERE user_id = $1 AND route_id = $2', [
      req.user!.userId,
      req.params.routeId
    ]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

const historyEntrySchema = z.object({
  query: z.string().min(1),
  type: z.enum(['stop', 'route', 'address']),
  resultId: z.string().uuid().optional()
});

favoritesRouter.get('/history', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, query, type, result_id, searched_at FROM search_history WHERE user_id = $1 ORDER BY searched_at DESC LIMIT 30',
      [req.user!.userId]
    );
    res.json(
      result.rows.map((r) => ({ id: r.id, query: r.query, type: r.type, resultId: r.result_id, searchedAt: r.searched_at }))
    );
  } catch (err) {
    next(err);
  }
});

favoritesRouter.post('/history', async (req, res, next) => {
  try {
    const { query, type, resultId } = historyEntrySchema.parse(req.body);
    await pool.query(
      'INSERT INTO search_history (user_id, query, type, result_id) VALUES ($1, $2, $3, $4)',
      [req.user!.userId, query, type, resultId ?? null]
    );
    res.status(201).end();
  } catch (err) {
    next(err);
  }
});
