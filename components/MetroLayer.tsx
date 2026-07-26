import { memo, useEffect, useRef, useState } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { useMetroSimulation } from '@/hooks/useMetroSimulation';
import type { MetroRenderFrame } from '@/metro/MetroRenderer';

interface ScreenFrame {
  frame: MetroRenderFrame;
  x: number;
  y: number;
}

interface MetroLayerProps {
  /** Інстанс MapLibre-карти (з <MapView />). Поки null (карта ще не завантажилась) шар нічого не рендерить. */
  map: MapLibreMap | null;
  /** Показувати шар метро — керується панеллю фільтрів транспорту. Симуляція рахується завжди, незалежно від видимості. */
  visible: boolean;
  selectedTrainId?: string | null;
  onTrainSelect?: (trainId: string) => void;
}

/**
 * Шар потягів метро на карті.
 *
 * Дані про рух (позиція/курс/швидкість/фаза) повністю надходять з
 * useMetroSimulation() — детермінований аналітичний рушій за розкладом,
 * БЕЗ GPS. Цей компонент відповідає лише за проєкцію геокоординат у
 * пікселі поточного вигляду карти (map.project) та відображення
 * плейсхолдер-маркера (кружечок з кольором лінії, номером і стрілкою
 * напрямку) — до підключення PNG Sprite Sheet.
 */
export function MetroLayer({ map, visible, selectedTrainId, onTrainSelect }: MetroLayerProps) {
  const frames = useMetroSimulation();
  const [screenFrames, setScreenFrames] = useState<ScreenFrame[]>([]);
  const framesRef = useRef(frames);
  framesRef.current = frames;

  // Перепроєктовуємо геопозиції потягів у пікселі щоразу, коли з'являється
  // новий кадр симуляції (~60 разів/сек через MetroRenderer) АБО коли
  // користувач рухає/масштабує карту.
  useEffect(() => {
    if (!map) {
      setScreenFrames([]);
      return;
    }

    function project() {
      if (!map) return;
      const next: ScreenFrame[] = [];
      for (const frame of framesRef.current) {
        const point = map.project([frame.snapshot.position.lng, frame.snapshot.position.lat]);
        next.push({ frame, x: point.x, y: point.y });
      }
      setScreenFrames(next);
    }

    project();
    map.on('move', project);
    return () => {
      map.off('move', project);
    };
  }, [map, frames]);

  if (!visible || !map) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20" aria-hidden={screenFrames.length === 0}>
      {screenFrames.map(({ frame, x, y }) => (
        <MetroTrainMarker
          key={frame.snapshot.id}
          frame={frame}
          x={x}
          y={y}
          selected={selectedTrainId === frame.snapshot.id}
          onClick={onTrainSelect ? () => onTrainSelect(frame.snapshot.id) : undefined}
        />
      ))}
    </div>
  );
}

interface MetroTrainMarkerProps {
  frame: MetroRenderFrame;
  x: number;
  y: number;
  selected: boolean;
  onClick?: () => void;
}

/**
 * Плейсхолдер-маркер потяга метро: кольоровий кружечок лінії з номером +
 * стрілка напрямку руху + компактне табло "номер -> кінцева". Геометрія й
 * розмір навмисно прості — компонент буде замінено на <TransportSprite />-
 * подібний рендер PNG Sprite Sheet, коли власник проєкту додасть спрайти
 * (див. /public/sprites/README.md), без зміни логіки симуляції.
 */
const MetroTrainMarker = memo(function MetroTrainMarker({ frame, x, y, selected, onClick }: MetroTrainMarkerProps) {
  const { snapshot } = frame;
  const isDwell = snapshot.phase === 'dwell';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Метро, лінія ${snapshot.lineNumber}, прямує до ${snapshot.headsign}, ${Math.round(snapshot.speedKmh)} км/год`}
      className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 select-none transition-[left,top] duration-100 ease-linear will-change-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      style={{ left: x, top: y, opacity: frame.opacity, zIndex: selected ? 30 : 20 }}
    >
      <div className="relative flex flex-col items-center gap-1">
        <div
          data-placeholder="metro-train"
          className={[
            'flex items-center justify-center rounded-full border-2 border-white font-display text-[11px] font-bold text-white shadow-glass transition-transform duration-200',
            isDwell ? 'animate-pulse-soft' : ''
          ].join(' ')}
          style={{
            width: selected ? 30 : 24,
            height: selected ? 30 : 24,
            backgroundColor: snapshot.lineColor,
            transform: `scale(${selected ? 1.1 : 1})`
          }}
        >
          {/* Стрілка напрямку — обертається за фактичним курсом руху (headingDeg), не показується під час стоянки. */}
          {!isDwell && (
            <span
              className="absolute -top-2.5 h-2.5 w-2.5"
              style={{ transform: `rotate(${snapshot.headingDeg}deg)`, transformOrigin: '50% 14px' }}
            >
              <span
                className="block h-full w-full"
                style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)', backgroundColor: snapshot.lineColor }}
              />
            </span>
          )}
          {snapshot.lineNumber.replace(/^M/, '')}
        </div>

        {selected && (
          <div className="flex flex-col items-center rounded-lg border border-ink-border bg-ink-surface/95 px-2 py-1 text-center shadow-glass backdrop-blur-xs">
            <span className="font-display text-[11px] font-bold text-white">{snapshot.lineNumber} → {snapshot.headsign}</span>
            <span className="text-[10px] text-white/60">
              {isDwell ? 'на станції' : `${Math.round(snapshot.speedKmh)} км/год`} · далі: {snapshot.nextStation.name}
            </span>
          </div>
        )}
      </div>
    </button>
  );
});
