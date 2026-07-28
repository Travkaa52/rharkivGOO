import { useState, type FormEvent } from 'react';
import {
  Info,
  Award,
  FileText,
  LifeBuoy,
  Heart,
  Send,
  Loader2,
  Check,
  Copy,
  ExternalLink
} from 'lucide-react';
import { Modal } from '@/components/Modal';
import { useToastStore } from '@/store/useToastStore';

/**
 * НАЛАШТУВАННЯ, ЯКІ ТРЕБА ЗАМІНИТИ НА СВОЇ:
 * - SUPPORT_API_ENDPOINT — адреса свого бекенду, який відправляє
 *   повідомлення адміну через бота (sendMessage у Telegram Bot API).
 *   Приклад бекенду (Node/Express і Python/FastAPI) — в окремому
 *   файлі support-backend-example.md, який я віддав поруч.
 * - TELEGRAM_BOT_URL — юзернейм свого бота.
 * - DONATION_CARD_NUMBER / DONATION_JAR_URL — реквізити для донатів.
 */
const SUPPORT_API_ENDPOINT = '/api/support';
const TELEGRAM_BOT_URL = 'https://t.me/your_bot_username';
const DONATION_CARD_NUMBER = '0000 0000 0000 0000';
const DONATION_JAR_URL = 'https://send.monobank.ua/';

interface SendSupportPayload {
  message: string;
  contact?: string;
}

async function sendSupportMessage(payload: SendSupportPayload) {
  // Якщо застосунок відкритий у Telegram Mini App — беремо initData,
  // щоб бекенд міг перевірити підпис і дістати user id/username без
  // додаткових полів у формі.
  const tg = (window as unknown as { Telegram?: { WebApp?: { initData?: string } } }).Telegram?.WebApp;
  const initData = tg?.initData ?? '';

  const res = await fetch(SUPPORT_API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: payload.message,
      contact: payload.contact || null,
      initData
    })
  });

  if (!res.ok) {
    throw new Error(`Support request failed: ${res.status}`);
  }

  return res.json().catch(() => ({}));
}

interface SimpleModalProps {
  open: boolean;
  onClose: () => void;
}

/* ---------------------------------------------------------------------- */
/* Про програму                                                            */
/* ---------------------------------------------------------------------- */
export function AboutAppModal({ open, onClose }: SimpleModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Про програму" icon={<Info className="h-4 w-4" />}>
      <div className="space-y-3 text-xs leading-relaxed text-ink-text">
        <p>
          <strong>Kharkiv GO</strong> — застосунок для навігації громадським транспортом Харкова:
          маршрути, зупинки поруч, живе метро та карта в реальному часі.
        </p>
        <p className="text-ink-muted">
          Якщо помітили неточність у розкладі чи маршруті — скористайтеся кнопкою «Повідомити про
          затримку» на головній або напишіть у підтримку нижче.
        </p>
        <div className="grid grid-cols-2 gap-y-2 border-t border-border/40 pt-3 text-[11px]">
          <span className="font-medium text-ink-muted">Версія</span>
          <span className="text-right font-bold text-ink-text">v1.2.0 (Build 420)</span>
          <span className="font-medium text-ink-muted">Карта</span>
          <span className="text-right font-bold text-ink-text">Leaflet / OpenStreetMap</span>
        </div>
      </div>
    </Modal>
  );
}

/* ---------------------------------------------------------------------- */
/* Оцінити застосунок                                                       */
/* ---------------------------------------------------------------------- */
export function RateAppModal({ open, onClose }: SimpleModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Оцінити застосунок" icon={<Award className="h-4 w-4" />}>
      <div className="space-y-4">
        <p className="text-xs leading-relaxed text-ink-muted">
          Дякуємо, що користуєтесь Kharkiv GO! Оцінка та відгук у Telegram Bot допомагають нам
          розвивати застосунок швидше.
        </p>
        <a
          href={TELEGRAM_BOT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5 text-xs font-extrabold text-primary-foreground shadow-md transition-all hover:bg-primary/90 active:scale-98"
        >
          <Send className="h-4 w-4" />
          <span>Залишити відгук у боті</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </Modal>
  );
}

/* ---------------------------------------------------------------------- */
/* Політика конфіденційності                                               */
/* ---------------------------------------------------------------------- */
export function PrivacyPolicyModal({ open, onClose }: SimpleModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Політика конфіденційності" icon={<FileText className="h-4 w-4" />}>
      <div className="max-h-[55dvh] space-y-3 overflow-y-auto pr-1 text-xs leading-relaxed text-ink-text">
        <p>
          <strong>1. Які дані ми зберігаємо.</strong> Обране, історія переглядів та налаштування
          зберігаються локально на вашому пристрої. Дані профілю (ім'я, юзернейм, аватар)
          отримуються через Telegram-авторизацію.
        </p>
        <p>
          <strong>2. Геолокація.</strong> Використовується лише для показу найближчих зупинок і
          станцій, на сервері не зберігається.
        </p>
        <p>
          <strong>3. Звернення в підтримку.</strong> Текст повідомлень передається адміністратору
          проекту через Telegram-бота для відповіді.
        </p>
        <p>
          <strong>4. Треті сторони.</strong> Карти надаються через OpenStreetMap / Leaflet, дані
          про рух транспорту — з відкритих джерел.
        </p>
        <p className="text-ink-muted">
          Це загальний опис для ознайомлення. З конкретними питаннями звертайтесь через кнопку
          «Зв'язок з підтримкою».
        </p>
      </div>
    </Modal>
  );
}

/* ---------------------------------------------------------------------- */
/* Зв'язок з підтримкою — надсилає повідомлення адміну через бота          */
/* ---------------------------------------------------------------------- */
export function SupportModal({ open, onClose }: SimpleModalProps) {
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const showToast = useToastStore((s) => s.show);

  const resetAndClose = () => {
    onClose();
    window.setTimeout(() => {
      setMessage('');
      setContact('');
      setStatus('idle');
    }, 200);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || status === 'sending') return;

    setStatus('sending');
    try {
      await sendSupportMessage({ message: message.trim(), contact: contact.trim() });
      setStatus('sent');
      showToast('Повідомлення надіслано! Ми відповімо найближчим часом.', 'success');
      window.setTimeout(resetAndClose, 1200);
    } catch {
      setStatus('error');
      showToast('Не вдалося надіслати. Спробуйте ще раз трохи пізніше.', 'error');
    }
  };

  return (
    <Modal open={open} onClose={resetAndClose} title="Зв'язок з підтримкою" icon={<LifeBuoy className="h-4 w-4" />}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <p className="text-xs leading-relaxed text-ink-muted">
          Опишіть проблему, ідею чи запитання — повідомлення одразу піде адміну в особисті через
          бота.
        </p>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ваше повідомлення..."
          rows={5}
          maxLength={1000}
          required
          className="w-full resize-none rounded-2xl border border-border/60 bg-surface-muted/40 p-3 text-xs font-medium text-ink-text outline-none transition-all placeholder:text-ink-muted/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
        />

        <input
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="Контакт для відповіді (необов'язково)"
          className="w-full rounded-2xl border border-border/60 bg-surface-muted/40 p-3 text-xs font-medium text-ink-text outline-none transition-all placeholder:text-ink-muted/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
        />

        <button
          type="submit"
          disabled={!message.trim() || status === 'sending'}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5 text-xs font-extrabold text-primary-foreground shadow-md transition-all hover:bg-primary/90 active:scale-98 disabled:pointer-events-none disabled:opacity-50"
        >
          {status === 'sending' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Надсилаємо...</span>
            </>
          ) : status === 'sent' ? (
            <>
              <Check className="h-4 w-4" />
              <span>Надіслано</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>Надіслати повідомлення</span>
            </>
          )}
        </button>
      </form>
    </Modal>
  );
}

/* ---------------------------------------------------------------------- */
/* Підтримати проект — донати                                              */
/* ---------------------------------------------------------------------- */
export function SupportProjectModal({ open, onClose }: SimpleModalProps) {
  const [copied, setCopied] = useState(false);
  const showToast = useToastStore((s) => s.show);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(DONATION_CARD_NUMBER.replace(/\s/g, ''));
      setCopied(true);
      showToast('Номер картки скопійовано', 'success');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Не вдалося скопіювати номер', 'error');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Підтримати проект" icon={<Heart className="h-4 w-4" />}>
      <div className="space-y-4">
        <p className="text-xs leading-relaxed text-ink-muted">
          Kharkiv GO розвивається завдяки підтримці користувачів. Будь-яка сума допомагає
          оплачувати сервери та розвивати застосунок.
        </p>

        <div className="rounded-2xl border border-border/60 bg-surface-muted/40 p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted/80">
            Картка для донату
          </span>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-sm font-extrabold tabular-nums text-ink-text">
              {DONATION_CARD_NUMBER}
            </span>
            <button
              onClick={handleCopy}
              aria-label="Скопіювати номер картки"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <a
          href={DONATION_JAR_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5 text-xs font-extrabold text-primary-foreground shadow-md transition-all hover:bg-primary/90 active:scale-98"
        >
          <Heart className="h-4 w-4" />
          <span>Відкрити банку monobank</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>

        <p className="text-center text-[10px] text-ink-muted/70">Дякуємо за кожну гривню! 💙💛</p>
      </div>
    </Modal>
  );
}
