import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getTelegramUser, isInsideTelegram } from '@/lib/telegram';
import type { UserProfile } from '@/types/user';

interface AuthState {
  profile: UserProfile | null;
  isTelegramEnv: boolean;
  /** Підтягує профіль з Telegram Web App. Викликається один раз при старті застосунку. */
  hydrateFromTelegram: () => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      profile: null,
      isTelegramEnv: false,
      hydrateFromTelegram: () => {
        const inTelegram = isInsideTelegram();
        const tgUser = getTelegramUser();

        if (!tgUser) {
          set({ isTelegramEnv: inTelegram });
          return;
        }

        const profile: UserProfile = {
          telegramId: tgUser.id,
          displayName: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' '),
          username: tgUser.username,
          avatarUrl: tgUser.photo_url,
          languageCode: tgUser.language_code,
          createdAt: new Date().toISOString()
        };

        set({ profile, isTelegramEnv: true });
      },
      signOut: () => set({ profile: null })
    }),
    { name: 'kharkivgo-auth', partialize: (state) => ({ profile: state.profile }) }
  )
);
