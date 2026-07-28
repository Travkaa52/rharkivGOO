/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAP_STYLE_DAY_URL?: string;
  readonly VITE_MAP_STYLE_NIGHT_URL?: string;
  /** Username бота без @, напр. "kharkivgo_bot" — для кнопки на екрані TelegramGate. */
  readonly VITE_TELEGRAM_BOT_USERNAME?: string;
  /** Назва Mini App, задана через BotFather /newapp, напр. "app". */
  readonly VITE_TELEGRAM_APP_NAME?: string;
  /**
   * Токен бота (від @BotFather), яким надсилаються повідомлення "Повідомити
   * про затримку" адміну в ЛС. УВАГА: це фронтенд без бекенду, тому токен
   * потрапляє у клієнтський бандл і технічно видимий будь-кому, хто відкриє
   * DevTools. Для продакшна безпечніше винести відправку на невеликий
   * серверний проксі (Cloudflare Worker / Vercel Function) і токен туди не
   * світити. Тут зроблено пряме звернення до Telegram Bot API як
   * найпростіший робочий варіант "з коробки".
   */
  readonly VITE_TELEGRAM_BOT_TOKEN?: string;
  /** chat_id адміна (свій Telegram user id), кому прилітають звіти про затримки. */
  readonly VITE_TELEGRAM_ADMIN_CHAT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
