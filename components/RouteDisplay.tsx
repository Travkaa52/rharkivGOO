import { memo, useLayoutEffect, useRef, useState } from 'react';
import { TRANSPORT_COLORS } from '@/config/map';
import type { TransportKind } from '@/types/transport';

export interface RouteDisplayProps {
  kind: TransportKind;
  routeNumber: string;
  headsign: string;
  /** Масштаб відносно базового розміру табло (напр. при наближенні карти). */
  scale?: number;
  compact?: boolean;
}

const MARQUEE_THRESHOLD_CH = 11; // якщо кінцева не влазить приблизно в стільки символів — вмикаємо біжучий рядок

/**
 * Маршрутне табло транспорту — НЕ частина зображення (PNG спрайту).
 * Малюється програмно поверх <TransportSprite />: номер маршруту завжди
 * вміщується, а кінцева зупинка переноситься/масштабується або йде
 * біжучим рядком, якщо текст задовгий для статичного відображення.
 */
function RouteDisplayComponent({ kind, routeNumber, headsign, scale = 1, compact = false }: RouteDisplayProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [needsMarquee, setNeedsMarquee] = useState(false);
  const color = TRANSPORT_COLORS[kind] ?? '#2B2F31';

  useLayoutEffect(() => {
    setNeedsMarquee(headsign.length > MARQUEE_THRESHOLD_CH);
  }, [headsign]);

  const boardWidth = compact ? 64 : 88;

  return (
    <div
      className="pointer-events-none flex select-none flex-col items-center gap-0.5 rounded-md border border-white/70 bg-graphite/95 px-1.5 py-1 shadow-glass"
      style={{
        width: boardWidth * scale,
        transform: `scale(${scale})`,
        transformOrigin: 'center bottom'
      }}
      aria-hidden="true"
    >
      <div
        className="rounded-sm px-1 font-display text-[10px] font-extrabold leading-none text-white"
        style={{ backgroundColor: color }}
      >
        {routeNumber}
      </div>
      <div ref={trackRef} className="w-full overflow-hidden">
        {needsMarquee ? (
          <div className="flex w-max animate-marquee whitespace-nowrap text-[8px] font-semibold leading-tight text-amber-300">
            <span ref={textRef} className="pr-4">
              {headsign}
            </span>
            <span className="pr-4">{headsign}</span>
          </div>
        ) : (
          <span
            ref={textRef}
            className="block w-full text-center text-[8px] font-semibold leading-tight text-amber-300"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              wordBreak: 'break-word'
            }}
          >
            {headsign}
          </span>
        )}
      </div>
    </div>
  );
}

export const RouteDisplay = memo(RouteDisplayComponent);
