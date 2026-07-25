import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRouter } from './routes/auth.js';
import { stopsRouter } from './routes/stops.js';
import { routesRouter } from './routes/routes.js';
import { tripsRouter } from './routes/trips.js';
import { favoritesRouter } from './routes/favorites.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json());
  app.use(pinoHttp({ logger }));

  app.get('/health', (_req, res) => res.json({ status: 'ok', env: env.nodeEnv }));

  app.use('/api/auth', authRouter);
  app.use('/api/stops', stopsRouter);
  app.use('/api/routes', routesRouter);
  app.use('/api/trips', tripsRouter);
  app.use('/api/me', favoritesRouter);

  app.use(errorHandler);

  return app;
}
