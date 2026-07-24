/**
 * Профіль користувача без бекенду: підтягується напряму з Telegram Web App
 * (initDataUnsafe.user), коли застосунок відкрито як Telegram Mini App.
 * Жодного пароля/токена немає — "автентифікація" це просто наявність
 * telegramId, довіряти їй для серйозних дій (платежі тощо) не можна
 * без серверної перевірки initData.
 */
export interface UserProfile {
  telegramId: number;
  displayName: string;
  username?: string;
  avatarUrl?: string;
  languageCode?: string;
  createdAt: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  mapStyle: 'day' | 'night';
  units: 'metric';
  pushNotificationsEnabled: boolean;
  language: 'uk' | 'ru' | 'en';
}
