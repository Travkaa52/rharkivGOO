export interface NotificationItem {
  id: string;
  channel: string;
  channelTitle: string;
  text: string;
  date: string;
  link: string;
  hasMedia: boolean;
  /** Тип сповіщення: 'alert' для термінових оголошень метро або 'info' (опціонально) */
  kind?: 'alert' | 'info' | string;
}

interface NotificationsFeed {
  updatedAt: string;
  items: NotificationItem[];
}

/**
 * Стрічка сповіщень генерується GitHub Actions (scripts/parse-telegram-channels.mjs,
 * .github/workflows/telegram-notifications.yml) окремо, без жодного бекенда:
 * скрипт читає ПУБЛІЧНІ прев'ю-сторінки Telegram-каналів (t.me/s/<канал>,
 * без входу в акаунт) і комітить готовий public/data/notifications.json назад
 * у репозиторій. Vite сам роздає цей файл як звичайний статичний файл, тому
 * тут просто fetch — жодних заголовків авторизації, initData тощо.
 *
 * VITE_NOTIFICATIONS_URL можна задати, якщо фронтенд і файл живуть не в
 * одному деплої (наприклад, файл роздається з іншого домену/GitHub Pages) —
 * за замовчуванням береться відносний шлях "/data/notifications.json".
 */
export async function fetchNotifications(): Promise<NotificationItem[] | null> {
  const url = import.meta.env.VITE_NOTIFICATIONS_URL || '/data/notifications.json';
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = (await res.json()) as NotificationsFeed;
    return Array.isArray(data.items) ? data.items : null;
  } catch {
    return null;
  }
}
