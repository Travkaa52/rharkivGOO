import { useEffect, useRef, useState } from 'react';
import { getActiveTrains, type LiveMetroTrain } from '@/liveMetro/liveMetroEngine';

/**
 * Підписка на "живий" стан потягів метро: кожен кадр (requestAnimationFrame)
 * бере поточний реальний час і аналітично перераховує позицію/швидкість/фазу
 * всіх активних потягів (getActiveTrains — чиста функція часу, без GPS і
 * випадковості). Дає плавний рух на 60 FPS без додаткової інтерполяції між
 * "тіками" — оскільки кожен кадр рахує точну позицію на актуальну мить.
 */
export function useLiveMetroTrains(): LiveMetroTrain[] {
  const [trains, setTrains] = useState<LiveMetroTrain[]>(() => getActiveTrains(new Date()));
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const loop = () => {
      setTrains(getActiveTrains(new Date()));
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return trains;
}
