import type { Server as HttpServer } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { pool } from '../config/db.js';
import { logger } from '../config/logger.js';

interface ClientState {
  socket: WebSocket;
  routeFilter: Set<string> | null; // null = підписка на всі маршрути
}

const POLL_INTERVAL_MS = 3000;

/**
 * Розсилає позиції транспорту всім підключеним клієнтам раз на POLL_INTERVAL_MS.
 * У продакшн-версії варто замінити періодичний опитувальний запит до БД на
 * LISTEN/NOTIFY від PostgreSQL або чергу оновлень з GPS-шлюзу транспортних засобів.
 */
export function attachVehicleWebSocketServer(httpServer: HttpServer) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/vehicles' });
  const clients = new Set<ClientState>();

  wss.on('connection', (socket, request) => {
    const url = new URL(request.url ?? '', 'http://localhost');
    const routesParam = url.searchParams.get('routes');
    const routeFilter = routesParam ? new Set(routesParam.split(',')) : null;

    const clientState: ClientState = { socket, routeFilter };
    clients.add(clientState);
    logger.debug({ clientsCount: clients.size }, 'Новий WebSocket-клієнт підключився до трекінгу транспорту');

    socket.on('close', () => {
      clients.delete(clientState);
    });

    socket.on('error', (err) => {
      logger.warn({ err }, 'Помилка WebSocket-зʼєднання клієнта');
      clients.delete(clientState);
    });
  });

  const interval = setInterval(async () => {
    if (clients.size === 0) return;

    try {
      const result = await pool.query(
        `SELECT v.id, v.route_id, r.kind, r.number, r.headsign_forward, v.lat, v.lng, v.heading,
                v.speed_kmh, v.state, v.occupancy, v.last_updated_at
         FROM vehicles v
         JOIN routes r ON r.id = v.route_id
         WHERE v.state != 'offline'`
      );

      const vehicles = result.rows.map((row) => ({
        id: row.id,
        kind: row.kind,
        routeNumber: row.number,
        headsign: row.headsign_forward,
        position: { lat: row.lat, lng: row.lng },
        heading: row.heading,
        speedKmh: row.speed_kmh,
        state: row.state,
        occupancy: row.occupancy ?? undefined,
        lastUpdatedAt: row.last_updated_at
      }));

      for (const client of clients) {
        if (client.socket.readyState !== WebSocket.OPEN) continue;

        const payload = client.routeFilter
          ? vehicles.filter((v) => client.routeFilter!.has(v.routeNumber))
          : vehicles;

        client.socket.send(JSON.stringify(payload));
      }
    } catch (err) {
      logger.error({ err }, 'Не вдалося опитати позиції транспорту для WebSocket-розсилки');
    }
  }, POLL_INTERVAL_MS);

  wss.on('close', () => clearInterval(interval));

  return wss;
}
