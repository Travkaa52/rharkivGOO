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
const DONATION_JAR_URL = 'https://send.monobank.ua/jar/6S34HzcLMS';

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
          <strong>Kharkiv GO</strong> — Kharkiv GO — незалежний проєкт, створений командою ентузіастів, які прагнуть зробити громадський транспорт Харкова сучаснішим, доступнішим і зручнішим для кожного.

Наша мета — створити швидкий, надійний та інтуїтивно зрозумілий сервіс, який допомагає мешканцям і гостям міста легко орієнтуватися в транспортній мережі.

Ми постійно працюємо над покращенням застосунку, додаємо нові можливості, оптимізуємо продуктивність і вдосконалюємо дизайн, щоб забезпечити найкращий користувацький досвід.

Дякуємо, що користуєтеся Kharkiv GO! 💚
        </p>
        <p className="text-ink-muted">
          Якщо помітили неточність у розкладі чи маршруті — скористайтеся кнопкою «Повідомити про
          затримку» на головній або напишіть у підтримку нижче.
        </p>
        <div className="grid grid-cols-2 gap-y-2 border-t border-border/40 pt-3 text-[11px]">
          <span className="font-medium text-ink-muted">Версія</span>
          <span className="text-right font-bold text-ink-text">v1.4.8.8 (Build 4.5.0.)</span>
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
          <strong>1. Призначення застосунку.</strong> 1. 
Kharkiv GO є інформаційним сервісом, створеним для зручної навігації громадським транспортом міста Харкова.
        </p>
        <p>
          <strong>2. Достовірність інформації</strong> Ми прагнемо підтримувати інформацію актуальною, однак не гарантуємо її абсолютну точність.

Маршрути, схеми руху, зупинки та інші дані можуть змінюватися без попереднього повідомлення.
        </p>
        <p>
          <strong>3. Відповідальність користувача.</strong> Користувач самостійно приймає рішення щодо використання отриманої інформації.

Розробник не несе відповідальності за:

зміну маршрутів;
затримки громадського транспорту;
скасування рейсів;
помилки у відкритих джерелах даних;
тимчасову недоступність сервісу;
будь-які збитки, що виникли внаслідок використання застосунку..
        </p>
        <p>
          <strong>4. Доступність сервісу.</strong> Робота застосунку залежить від:

доступності мережі Інтернет;
роботи сторонніх сервісів;
технічного стану пристрою користувача.
Можливі тимчасові перебої або профілактичні роботи.
        </p>
        <p>
          <strong>5. Геолокація</strong> За згодою користувача застосунок може використовувати геолокацію для:

визначення найближчих зупинок;
покращення навігації;
відображення місцезнаходження на карті.
Доступ до геолокації можна вимкнути у будь-який момент через налаштування пристрою.
        </p>
        <p>
          <strong>6. Конфіденційність</strong> Kharkiv GO не збирає персональні дані без згоди користувача.

Для роботи окремих функцій можуть локально зберігатися:

обрані маршрути;
обрані зупинки;
історія переглядів;
налаштування застосунку;
параметри теми оформлення.
Ці дані використовуються виключно для роботи застосунку.
        </p>
        <p>
          <strong>7. Інтелектуальна власність</strong> Програмний код, дизайн, логотипи, інтерфейс та інші матеріали Kharkiv GO захищені законодавством про авторське право.

Забороняється:

копіювання застосунку;
модифікація без дозволу;
поширення змінених версій;
використання елементів дизайну без дозволу розробника.
        </p>
        <p>
          <strong>8. Оновлення</strong> Розробник залишає за собою право:

змінювати функціональність застосунку;
оновлювати інтерфейс;
змінювати умови використання;
виправляти помилки без попереднього повідомлення.
        </p>
        <p>
          <strong>9. Відмова від відповідальності</strong> Kharkiv GO не є офіційним застосунком Харківського метрополітену, КП «Міськелектротранссервіс», КП «Харківпасс» чи будь-якого іншого комунального підприємства або органу місцевого самоврядування.

Застосунок є незалежним інформаційним проєктом і використовує відкриті або загальнодоступні дані.

Інформація надається «як є», без будь-яких гарантій щодо її повноти, точності чи безперервної доступності.
        </p>
        <p>
          <strong>10. Контакти</strong> Якщо ви знайшли помилку, маєте пропозиції щодо розвитку застосунку або бажаєте повідомити про проблему, скористайтеся офіційними каналами зв'язку проєкту Kharkiv GO.


        </p>
        <p className="text-ink-muted">
          Це загальний опис для ознайомлення. З конкретними питаннями звертайтесь через кнопку
          «Зв'язок з підтримкою».© Kharkiv GO. Усі права захищені.
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
