import { localRoutes } from '@/data/localData';
import type { TransportKind, TransportRoute } from '@/types/transport';

/**
 * Без бекенду: дані читаються з локального JSON (src/data/routes.json).
 */
export const routesApi = {
  search: (query: string): Promise<TransportRoute[]> => Promise.resolve(localRoutes.search(query)),
  getById: (id: string): Promise<TransportRoute | undefined> => Promise.resolve(localRoutes.getById(id)),
  getByKind: (kind: TransportKind): Promise<TransportRoute[]> => Promise.resolve(localRoutes.getByKind(kind)),
  buildTrip: (fromLat: number, fromLng: number, toLat: number, toLng: number) =>
    localRoutes.buildTrip(fromLat, fromLng, toLat, toLng)
};
