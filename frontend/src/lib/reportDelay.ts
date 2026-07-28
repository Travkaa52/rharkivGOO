import { getTelegramWebApp } from '@/lib/telegram';
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

/**
 * Надсилає звіт про затримку транспорту на власний бекенд (api_server.py),
 * який пише його в спільну з ботом таблицю transport_reports і сповіщає
 * адмінів напряму через Telegram Bot API. Токен бота більше НЕ потрапляє у
 * клієнтський бандл — авторизація відбувається через підписаний Telegram
 * WebApp initData, який бекенд перевіряє через HMAC (див. api_server.py).
 */
export async function sendDelayReport(input: DelayReportInput): Promise<DelayReportResult> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const initData = getTelegramWebApp()?.initData;

  if (!apiBaseUrl || !initData) {
    return { ok: false, reason: 'not-configured' };
  }

  try {
    const response = await fetch(`${apiBaseUrl}/api/delay-reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Init-Data': initData
      },
      body: JSON.stringify({
        kind: input.kind,
        routeNumber: input.routeNumber.trim() || '—',
        stopName: input.stopName?.trim() || undefined,
        comment: input.comment.trim()
      })
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.ok) {
      return { ok: false, reason: 'telegram-error', details: data?.detail };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, reason: 'network', details: error instanceof Error ? error.message : String(error) };
  }
}
