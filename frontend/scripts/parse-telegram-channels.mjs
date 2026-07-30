#!/usr/bin/env node
/**
 * Парсер публічних Telegram-каналів БЕЗ будь-якої авторизації.
 *
 * Як це працює: у Telegram кожен публічний канал має відкриту "прев'ю"
 * версію за адресою https://t.me/s/<username> — звичайну HTML-сторінку,
 * яку Telegram показує будь-кому без входу в акаунт (це те, що бачить
 * людина, коли переходить за посиланням на канал з браузера, не маючи
 * Telegram). Тому тут НЕМАЄ: api_id, api_hash, номера телефону, коду
 * підтвердження, пароля, сесії — просто звичайний HTTP-запит і розбір
 * готової HTML-сторінки. Це навмисно: скрипт призначений для запуску в
 * GitHub Actions за розкладом, де ніхто не може ввести код підтвердження
 * вручну, а користувачам застосунку взагалі не потрібно знати, що
 * сповіщення беруться саме так.
 *
 * Результат — plain JSON-файл (public/data/notifications.json), який потім
 * коміситься назад у репозиторій (див. .github/workflows/telegram-notifications.yml)
 * і роздається як звичайний статичний файл (GitHub Pages / raw.githubusercontent.com) —
 * окремий бекенд-сервер тримати не треба.
 */

import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const CHANNELS = (process.env.TELEGRAM_CHANNELS || '')
  .split(',')
  .map((c) => c.trim().replace(/^@/, ''))
  .filter(Boolean);

const LIMIT_PER_CHANNEL = Number(process.env.NOTIFICATIONS_LIMIT || '15');
const OUTPUT_PATH = process.env.OUTPUT_PATH || 'public/data/notifications.json';

if (CHANNELS.length === 0) {
  console.error(
    'TELEGRAM_CHANNELS порожній. Задайте у GitHub → Settings → Secrets and variables → ' +
      'Actions → Variables (або Secrets) змінну TELEGRAM_CHANNELS, через кому, напр.: kharkivgo_news,kharkiv_transport'
  );
  process.exit(1);
}

function decodeHtmlEntities(str) {
  return str
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Дуже проста, але надійна для стабільної розмітки t.me/s/ регулярка:
 * розбиває сторінку на блоки повідомлень по data-post="username/id" і в
 * кожному блоці шукає текст і час.
 */
function parseChannelHtml(html, username) {
  const titleMatch = html.match(/<meta property="og:title" content="([^"]*)"/);
  const channelTitle = titleMatch ? decodeHtmlEntities(titleMatch[1]) : username;

  const messages = [];
  const blockRegex = /data-post="([^"/]+\/(\d+))"([\s\S]*?)(?=data-post="|$)/g;
  let match;

  while ((match = blockRegex.exec(html)) !== null) {
    const [, , id, block] = match;

    const textMatch = block.match(/<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    const dateMatch = block.match(/<time[^>]*datetime="([^"]+)"/);
    if (!dateMatch) continue;

    const text = textMatch ? decodeHtmlEntities(textMatch[1]) : '';
    const hasMedia = /tgme_widget_message_(photo|video|document|voice|round)/.test(block);

    if (!text && !hasMedia) continue;

    messages.push({
      id: `${username}:${id}`,
      channel: username,
      channelTitle,
      text,
      date: new Date(dateMatch[1]).toISOString(),
      link: `https://t.me/${username}/${id}`,
      hasMedia
    });
  }

  return messages.slice(-LIMIT_PER_CHANNEL).reverse();
}

async function fetchChannel(username) {
  const url = `https://t.me/s/${username}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; KharkivGoBot/1.0; +https://github.com)' }
    });
    if (!res.ok) {
      console.error(`[${username}] HTTP ${res.status} — можливо, канал приватний або не існує`);
      return [];
    }
    const html = await res.text();
    return parseChannelHtml(html, username);
  } catch (err) {
    console.error(`[${username}] Помилка запиту:`, err.message);
    return [];
  }
}

async function main() {
  const all = [];
  for (const username of CHANNELS) {
    const messages = await fetchChannel(username);
    console.log(`[${username}] знайдено повідомлень: ${messages.length}`);
    all.push(...messages);
  }

  all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const payload = {
    updatedAt: new Date().toISOString(),
    items: all
  };

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(payload, null, 2), 'utf-8');
  console.log(`Записано ${all.length} повідомлень у ${OUTPUT_PATH}`);
}

main();
