import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings } from '@/types/user';

interface SettingsState extends AppSettings {
  setTheme: (theme: AppSettings['theme']) => void;
  setMapStyle: (style: AppSettings['mapStyle']) => void;
  setLanguage: (lang: AppSettings['language']) => void;
  togglePushNotifications: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      mapStyle: 'day',
      units: 'metric',
      pushNotificationsEnabled: false,
      language: 'uk',
      setTheme: (theme) => set({ theme }),
      setMapStyle: (mapStyle) => set({ mapStyle }),
      setLanguage: (language) => set({ language }),
      togglePushNotifications: () => set((state) => ({ pushNotificationsEnabled: !state.pushNotificationsEnabled }))
    }),
    { name: 'kharkivgo-settings' }
  )
);
