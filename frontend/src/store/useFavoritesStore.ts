import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FavoriteRoute, FavoriteStop } from '@/types/transport';

interface FavoritesState {
  stops: FavoriteStop[];
  routes: FavoriteRoute[];
  addStop: (stopId: string) => void;
  removeStop: (stopId: string) => void;
  addRoute: (routeId: string) => void;
  removeRoute: (routeId: string) => void;
  isStopFavorite: (stopId: string) => boolean;
  isRouteFavorite: (routeId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      stops: [],
      routes: [],
      addStop: (stopId) =>
        set((state) => ({
          stops: state.stops.some((s) => s.stopId === stopId)
            ? state.stops
            : [...state.stops, { stopId, addedAt: new Date().toISOString() }]
        })),
      removeStop: (stopId) => set((state) => ({ stops: state.stops.filter((s) => s.stopId !== stopId) })),
      addRoute: (routeId) =>
        set((state) => ({
          routes: state.routes.some((r) => r.routeId === routeId)
            ? state.routes
            : [...state.routes, { routeId, addedAt: new Date().toISOString() }]
        })),
      removeRoute: (routeId) => set((state) => ({ routes: state.routes.filter((r) => r.routeId !== routeId) })),
      isStopFavorite: (stopId) => get().stops.some((s) => s.stopId === stopId),
      isRouteFavorite: (routeId) => get().routes.some((r) => r.routeId === routeId)
    }),
    { name: 'kharkivgo-favorites' }
  )
);
