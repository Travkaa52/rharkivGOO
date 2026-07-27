import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BUILT_LINES, formatEtaCountdown, getActiveTrains, getUpcomingArrivalsForStation } from '@/liveMetro/liveMetroEngine';
import { localStops } from '@/data/localData';
import type { GeoPoint } from '@/types/transport';

interface LiveMetroWidgetProps {
  userPosition: GeoPoint | null;
}

/**
 * Прев'ю "живого метро" на Головній — займає місце, де раніше пропонувалось
 * одразу йти на карту. Показує скільки потягів зараз реально в русі на кожній
 * лінії (за розкладом — вночі тут буде 0, а не примарні потяги 24/7) і
 * найближчі прибуття на станцію поруч із користувачем.
 */
export function LiveMetroWidget({ userPosition }: LiveMetroWidgetProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    // Раз на 5с достатньо для зведення на Головній — це не анімація на схемі,
    // де потрібні 60 FPS, а лише лічильники й зворотний відлік хвилинами.
    const id = window.setInterval(() => setNow(new Date()), 5000);
    return () => window.clearInterval(id);
  }, []);

  const activeTrains = useMemo(() => getActiveTrains(now), [now]);

  const lineCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of activeTrains) map.set(t.lineId, (map.get(t.lineId) ?? 0) + 1);
    return BUILT_LINES.map(({ line }) => ({
      id: line.id,
      number: line.number,
      color: line.color,
      count: map.get(line.id) ?? 0
    }));
  }, [activeTrains]);

  const isServiceRunning = activeTrains.length > 0;

  const nearestMetroStation = useMemo(() => {
    if (!userPosition) return null;
    // Станції метро в BUILT_LINES мають лише схематичні x/y — реальні координати
    // беремо з localStops за тим самим id (обидві бази узгоджені по id зупинки).
    const allStationIds = new Set<string>();
    for (const { line } of BUILT_LINES) for (const s of line.stations) allStationIds.add(s.id);

    let best: { id: string; name: string; distM: number } | null = null;
    for (const id of allStationIds) {
      const stop = localStops.getById(id);
      if (!stop) continue;
      const dLat = ((stop.position.lat - userPosition.lat) * Math.PI) / 180;
      const dLng = ((stop.position.lng - userPosition.lng) * Math.PI) / 180;
      const lat1 = (userPosition.lat * Math.PI) / 180;
      const lat2 = (stop.position.lat * Math.PI) / 180;
      const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
      const distM = 2 * 6371000 * Math.asin(Math.min(1, Math.sqrt(h)));
      if (!best || distM < best.distM) best = { id, name: stop.name, distM };
    }
    return best;
  }, [userPosition]);

  const nextArrivals = useMemo(() => {
    if (!nearestMetroStation) return [];
    return getUpcomingArrivalsForStation(nearestMetroStation.id, now, 1).slice(0, 3);
  }, [nearestMetroStation, now]);

  const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  return (
    <section className="rounded-xl2 border border-ink-border bg-ink-surface p-4 shadow-glass-dark">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-neon">
          <span
            className={`h-1.5 w-1.5 rounded-full ${isServiceRunning ? 'bg-neon animate-pulse-soft' : 'bg-white/30'}`}
            aria-hidden
          />
          Живе метро
        </h2>
        <Link to="/metro/live" className="text-[11px] font-semibold text-white/50 hover:text-white">
          На схемі →
        </Link>
      </div>

      {!isServiceRunning ? (
        <p className="text-xs text-white/50">Метро зараз не курсує (нічна перерва). Рух відновиться зранку.</p>
      ) : (
        <div className="flex items-center gap-2">
          {lineCounts.map((l) => (
            <div key={l.id} className="flex flex-1 items-center gap-1.5 rounded-lg bg-white/5 px-2 py-1.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: l.color }} aria-hidden />
              <span className="text-[11px] text-white/60">Л{l.number}</span>
              <span className="ml-auto text-sm font-bold text-white">{l.count}</span>
            </div>
          ))}
        </div>
      )}

      {nearestMetroStation && nextArrivals.length > 0 && (
        <div className="mt-3 border-t border-ink-border pt-3">
          <p className="mb-1.5 truncate text-[11px] font-semibold text-white/50">
            Найближча станція · {nearestMetroStation.name}
          </p>
          <ul className="flex flex-col gap-1">
            {nextArrivals.map((a, i) => (
              <li key={`${a.lineId}-${a.direction}-${i}`} className="flex items-center gap-2 text-xs">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: a.lineColor }} aria-hidden />
                <span className="truncate text-white/70">{a.headsign}</span>
                <span className="ml-auto shrink-0 font-semibold text-mint">{formatEtaCountdown(a.etaSec, nowSec)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
