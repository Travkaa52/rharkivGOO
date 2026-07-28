import { getTelegramUser } from '@/lib/telegram';
import type { TransportKind } from '@/types/transport';

export interface DelayReportInput {
  kind: TransportKind | null;
  routeNumber: string;
  stopName?: string;
  comment: string;
}

export type DelayReportResult =
  | { ok: true }
  | { ok: false; reason: 'not-configured' | 'network' | 'telegram-error'; details?: string };

const KIND_LABEL: Record<TransportKind, string> = {
  metro: 'Метро',
  tram: 'Трамвай',
  trolleybus: 'Тролейбус',
  bus: 'Автобус'
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Формує текст повідомлення, яке піде адміну в Telegram (HTML parse_mode). */
function buildMessageText(input: DelayReportInput): string {
  const tgUser = getTelegramUser();
  const kindLabel = input.kind ? KIND_LABEL[input.kind] : 'Не вказано';

  const reporterLine = tgUser
    ? `${escapeHtml([tgUser.first_name, tgUser.last_name].filter(Boolean).join(' '))}` +
      (tgUser.username ? ` (@${escapeHtml(tgUser.username)})` : '') +
      ` — id ${tgUser.id}`
    : 'Гість (поза Telegram, id невідомий)';

  const lines = [
    '🚨 <b>Нове повідомлення про затримку</b>',
    '',
    `<b>Вид транспорту:</b> ${escapeHtml(kindLabel)}`,
    `<b>Маршрут:</b> ${escapeHtml(input.routeNumber.trim() || '—')}`
  ];

  if (input.stopName?.trim()) {
    lines.push(`<b>Зупинка:</b> ${escapeHtml(input.stopName.trim())}`);
  }

  if (input.comment.trim()) {
    lines.push('', `<b>Коментар:</b> ${escapeHtml(input.comment.trim())}`);
  }

  lines.push('', `<b>Від:</b> ${reporterLine}`, `<b>Час:</b> ${escapeHtml(new Date().toLocaleString('uk-UA'))}`);

  return lines.join('\n');
}

/**
 * Надсилає звіт про затримку транспорту адміну в ЛС через Telegram Bot API
 * (метод sendMessage, https://core.telegram.org/bots/api#sendmessage).
 *
 * Це пряме звернення з клієнта до api.telegram.org — бекенду в проєкті
 * немає. Токен бота і chat_id адміна беруться зі змінних оточення
 * VITE_TELEGRAM_BOT_TOKEN / VITE_TELEGRAM_ADMIN_CHAT_ID (див. vite-env.d.ts
 * і .env.example). Токен потрапляє у публічний бандл — для чутливих
 * сценаріїв варто замінити на виклик власного бекенд-проксі з тим самим
 * інтерфейсом (сигнатура функції нижче не зміниться).
 */
export async function sendDelayReport(input: DelayReportInput): Promise<DelayReportResult> {
  const token = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
  const chatId = import.meta.env.VITE_TELEGRAM_ADMIN_CHAT_ID;

  if (!token || !chatId) {
    return { ok: false, reason: 'not-configured' };
  }

  const text = buildMessageText(input);

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.ok) {
      return { ok: false, reason: 'telegram-error', details: data?.description };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, reason: 'network', details: error instanceof Error ? error.message : String(error) };
  }
}
