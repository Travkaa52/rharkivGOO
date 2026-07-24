const BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME as string | undefined;
const BOT_APP_NAME = import.meta.env.VITE_TELEGRAM_APP_NAME as string | undefined;

function getMiniAppLink(): string {
  if (BOT_USERNAME && BOT_APP_NAME) return `https://t.me/${BOT_USERNAME}/${BOT_APP_NAME}`;
  if (BOT_USERNAME) return `https://t.me/${BOT_USERNAME}`;
  return 'https://telegram.org/';
}

/**
 * Екран-заглушка, що показується, коли Kharkiv GO відкрито поза Telegram.
 * Основний інтерфейс застосунку не монтується, доки <App /> не отримає
 * підтвердження, що ми всередині Telegram WebApp — див. useTelegramEnvironment.
 */
export function TelegramGate() {
  const link = getMiniAppLink();

  return (
    <div className="relative flex h-dvh w-full items-center justify-center overflow-hidden bg-forest px-6">
      {/* Декоративне глибинне тло у кольорах герба/прапора Харкова */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-mint/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-gold/25 blur-3xl" />
      </div>

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-6 rounded-xl3 border border-white/15 bg-white/10 p-8 text-center shadow-glass-lg backdrop-blur-xs animate-slide-up">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/90 shadow-glass">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0B3D2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 4 3 6.5v14L9 18l6 2.5 6-2.5v-14L15 6.5 9 4Zm0 0v14m6-11.5V20.5" />
          </svg>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="font-display text-xl font-extrabold text-white">Kharkiv GO</h1>
          <p className="text-sm leading-relaxed text-white/80">Відкрийте Kharkiv GO через Telegram</p>
          <p className="text-xs leading-relaxed text-white/50">
            Застосунок працює лише як Telegram Mini App і використовує ваш профіль Telegram для персоналізації.
          </p>
        </div>

        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 font-display text-sm font-bold text-forest shadow-glass-lg transition hover:scale-[1.02] active:scale-95"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21.94 3.14a1.5 1.5 0 0 0-1.53-.26L2.86 9.9a1.35 1.35 0 0 0 .07 2.54l4.62 1.45 1.78 5.72a1.3 1.3 0 0 0 2.2.5l2.55-2.6 4.5 3.3a1.5 1.5 0 0 0 2.37-.9l3.02-14.4a1.5 1.5 0 0 0-.03-.87ZM9.6 14.35l-1.15 3.68-1.1-3.52 10.4-6.9-8.15 6.74Z" />
          </svg>
          Відкрити у Telegram
        </a>
      </div>
    </div>
  );
}
