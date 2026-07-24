import Redis from 'ioredis';
import { env } from './env.js';

export const redis = new Redis(env.redisUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: false
});

redis.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('Помилка з’єднання Redis', err);
});
