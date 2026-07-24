import { createServer } from 'node:http';
import { createApp } from './app.js';
import { attachVehicleWebSocketServer } from './services/vehicleWebSocketServer.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

const app = createApp();
const httpServer = createServer(app);

attachVehicleWebSocketServer(httpServer);

httpServer.listen(env.port, () => {
  logger.info(`Kharkiv GO API запущено на порту ${env.port} (${env.nodeEnv})`);
});

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Необроблене відхилення Promise');
});
