import { useCallback, useEffect, useRef, useState } from 'react';
import { assetUrl } from '@/lib/assetUrl';

const trainSprite = assetUrl('/images/train-wish-banner.png');

/**
 * Спрайт: 2172×724, полотно транспаранту (заміряно програмно по пікселях зображення):
 *  left: 81.95%, width: 16.11%, top: 42.68%, height: 15.47%
 * Якщо картинку колись заміните на іншу — перевимірте координати заново.
 */
const BANNER_RECT = { left: 81.95, width: 16.11, top: 42.68, height: 15.47 };

const SPRITE_ASPECT_RATIO = 2172 / 724; // ширина / висота
const SPRITE_HEIGHT_PX = 112; // висота спрайту на екрані; ширина рахується з аспекту

const WISHES: string[] = [
  'Гарного дня, Харків! 🌤️',
  'Хай усі поїздки будуть вчасними',
  'Мирного неба над головою 🕊️',
  'Легкої дороги і без заторів',
  'Успіху у всіх твоїх справах сьогодні',
  'Хай сьогодні щастить у всьому',
  'Теплого настрою в будь-яку погоду',
  'Нехай день буде добрим і спокійним',
  'До зустрічі на своїй зупинці 🚏',
  'Гарного тобі маршруту сьогодні',
  'Дякуємо, що їдеш з Kharkiv GO',
  'Хай транспорт завжди приходить вчасно',
  'Бережи себе в дорозі',
  'Усмішок тобі більше, ніж пересадок',
  'Нехай усе складеться якнайкраще',
  'Хорошого настрою на весь день',
  'Місто тримається — і ти тримайся',
  'Швидкої та безпечної дороги додому',
  'Нехай сьогодні щастить на зелене світло',
  'Тепла і затишку у твоєму дні',
  'Хай кожна поїздка буде приємною',
  'Слава Україні! Гарної дороги 🇺🇦',
  'Віримо, чекаємо, їдемо далі разом',
  'Нехай день буде продуктивним і легким'
];

const MIN_INTERVAL_MS = 2 * 60 * 60 * 1000; // 2 години
const MAX_INTERVAL_MS = 3 * 60 * 60 * 1000; // 3 години
const FIRST_RUN_DELAY_MS = 3000; // невелика пауза після завантаження сторінки
const ANIMATION_DURATION_MS = 13000; // час проїзду через екран
const STORAGE_KEY = 'kharkivgo_train_wish_last_shown_at';

function randomInterval(): number {
  return MIN_INTERVAL_MS + Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS);
}

function pickWish(): string {
  return WISHES[Math.floor(Math.random() * WISHES.length)];
}

function readLastShown(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
}

function writeLastShown(ts: number) {
  try {
    localStorage.setItem(STORAGE_KEY, String(ts));
  } catch {
    // localStorage недоступний (приватний режим тощо) — просто ігноруємо
  }
}

/**
 * Потяг із транспарантом, що зрідка (раз на 2–3 години) проїжджає через
 * головний екран одразу після заходу, з випадковим побажанням на банері.
 * Поки неактивний — не рендериться і не займає місця в лейауті.
 */
export function TrainWishSprite() {
  const [visible, setVisible] = useState(false);
  const [wish, setWish] = useState('');
  const scheduleTimeoutRef = useRef<number | null>(null);
  const hideTimeoutRef = useRef<number | null>(null);

  const scheduleNextRun = useCallback((delayMs: number) => {
    if (scheduleTimeoutRef.current) window.clearTimeout(scheduleTimeoutRef.current);
    scheduleTimeoutRef.current = window.setTimeout(runTrain, delayMs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runTrain = useCallback(() => {
    setWish(pickWish());
    setVisible(true);
    writeLastShown(Date.now());

    if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = window.setTimeout(() => setVisible(false), ANIMATION_DURATION_MS);

    scheduleNextRun(randomInterval());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleNextRun]);

  useEffect(() => {
    const lastShown = readLastShown();
    const elapsed = Date.now() - lastShown;
    const interval = randomInterval();

    if (!lastShown || elapsed >= interval) {
      scheduleNextRun(FIRST_RUN_DELAY_MS);
    } else {
      scheduleNextRun(interval - elapsed);
    }

    return () => {
      if (scheduleTimeoutRef.current) window.clearTimeout(scheduleTimeoutRef.current);
      if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;

  return (
    <div
      className="relative left-1/2 right-1/2 -mx-[50vw] w-screen overflow-hidden pointer-events-none z-30"
      style={{ height: SPRITE_HEIGHT_PX }}
      aria-hidden="true"
    >
      <style>{`
        @keyframes train-wish-move {
          0% { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
        .train-wish-track {
          animation: train-wish-move ${ANIMATION_DURATION_MS}ms linear forwards;
        }
      `}</style>

      <div className="absolute top-0 left-0 inline-block train-wish-track">
        <div
          className="relative inline-block"
          style={{ height: SPRITE_HEIGHT_PX, width: SPRITE_HEIGHT_PX * SPRITE_ASPECT_RATIO }}
        >
          <img
            src={trainSprite}
            alt=""
            draggable={false}
            className="block h-full w-full select-none"
          />
          <div
            className="absolute flex items-center justify-center text-center px-1"
            style={{
              left: `${BANNER_RECT.left}%`,
              width: `${BANNER_RECT.width}%`,
              top: `${BANNER_RECT.top}%`,
              height: `${BANNER_RECT.height}%`
            }}
          >
            <span className="text-[7px] font-extrabold text-slate-800 leading-[1.15] line-clamp-3">
              {wish}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
