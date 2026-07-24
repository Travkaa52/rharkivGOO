import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings } from '@/types/user';
import type { TransportKind } from '@/types/transport';

const ALL_KINDS: TransportKind[] = ['metro', 'tram', 'trolleybus', 'bus'];

interface SettingsState extends AppSettings {
  setTheme: (theme: AppSettings['theme']) => void;
  setMapStyle: (style: AppSettings['mapStyle']) => void;
  setLanguage: (lang: AppSettings['language']) => void;
  togglePushNotifications: () => void;
  /** Панель керування шарами карти: увімкнути/вимкнути показ виду транспорту. */
  toggleTransportKind: (kind: TransportKind) => void;
  /** Показати всі види транспорту одночасно. */
  showAllTransportKinds: () => void;
  toggleStopsOnMap: () => void;
  toggle3DMode: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      mapStyle: 'day',
      units: 'metric',
      pushNotificationsEnabled: false,
      language: 'uk',
      visibleTransportKinds: ALL_KINDS,
      showStopsOnMap: true,
      is3DMode: true,
      setTheme: (theme) => set({ theme }),
      setMapStyle: (mapStyle) => set({ mapStyle }),
      setLanguage: (language) => set({ language }),
      togglePushNotifications: () => set((state) => ({ pushNotificationsEnabled: !state.pushNotificationsEnabled })),
      toggleTransportKind: (kind) =>
        set((state) => {
          const isVisible = state.visibleTransportKinds.includes(kind);
          const next = isVisible
            ? state.visibleTransportKinds.filter((k) => k !== kind)
            : [...state.visibleTransportKinds, kind];
          // Хоча б один вид транспорту завжди лишається увімкненим.
          return next.length > 0 ? { visibleTransportKinds: next } : state;
        }),
      showAllTransportKinds: () => set({ visibleTransportKinds: ALL_KINDS }),
      toggleStopsOnMap: () => set((state) => ({ showStopsOnMap: !state.showStopsOnMap })),
      toggle3DMode: () => set((state) => ({ is3DMode: !state.is3DMode }))
    }),
    { name: 'kharkivgo-settings' }
  )
);
