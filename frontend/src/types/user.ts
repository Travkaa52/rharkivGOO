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
  /** Емодзі-аватар, використовується як запасний варіант, якщо немає avatarUrl. */
  avatarEmoji?: string;
  languageCode?: string;
  createdAt: string;
  /** true, якщо профіль створено локально (поза Telegram Mini App). */
  isLocal?: boolean;
  /** Контактні дані для локального профілю (телефон/email тощо). */
  contact?: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'amoled' | 'auto';
  mapStyle: 'day' | 'night';
  units: 'metric' | 'imperial';
  pushNotificationsEnabled: boolean;
  language: 'uk' | 'en';
  /** Які види транспорту показувати на карті (лінії маршрутів + рух метро). */
  visibleTransportKinds: import('./transport').TransportKind[];
  /** Показувати шар зупинок на карті. */
  showStopsOnMap: boolean;
  /** Режим відображення карти: об'ємні будівлі (3D) чи плаский вигляд (2D). */
  is3DMode: boolean;
}
