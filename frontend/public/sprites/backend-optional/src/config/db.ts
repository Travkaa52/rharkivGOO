import { Pool } from 'pg';
import { env } from './env.js';

export const pool = new Pool({
  connectionString: env.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

pool.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('Неочікувана помилка простою PostgreSQL клієнта', err);
});
