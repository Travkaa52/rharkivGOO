/**
 * Мінімальна типізація Telegram Web App SDK (https://core.telegram.org/bots/webapps).
 * Підключається у index.html через <script src="https://telegram.org/js/telegram-web-app.js">.
 * Ми навмисно НЕ довіряємо initDataUnsafe для серверної перевірки (бекенду немає) —
 * профіль використовується лише для відображення (ім'я, фото), без "серйозної" авторизації.
 */
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  is_premium?: boolean;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: { user?: TelegramUser; start_param?: string };
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  ready: () => void;
  expand: () => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  enableClosingConfirmation?: () => void;
  HapticFeedback?: { impactOccurred: (style: string) => void };
  openTelegramLink?: (url: string) => void;
  close: () => void;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

export function getTelegramWebApp(): TelegramWebApp | null {
  return window.Telegram?.WebApp ?? null;
}

export function isInsideTelegram(): boolean {
  return !!getTelegramWebApp()?.initData;
}

export function getTelegramUser(): TelegramUser | null {
  return getTelegramWebApp()?.initDataUnsafe?.user ?? null;
}

/** Викликати один раз при старті застосунку. */
export function initTelegramApp() {
  const tg = getTelegramWebApp();
  if (!tg) return;
  tg.ready();
  tg.expand();
  try {
    tg.setHeaderColor('#0B3D2E');
    tg.setBackgroundColor('#F4F7F5');
  } catch {
    // деякі клієнти Telegram не підтримують кастомізацію кольорів — не критично
  }
}
