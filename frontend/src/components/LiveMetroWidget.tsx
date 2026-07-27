import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BUILT_LINES, formatEtaCountdown, getActiveTrains, getUpcomingArrivalsForStation } from '@/liveMetro/liveMetroEngine';
import { localStops } from '@/data/localData';
import type { GeoPoint } from '@/types/transport';

interface LiveMetroWidgetProps {
  userPosition: GeoPoint | null;
}

/** Форматування відстані в метрах або кілометрах */
function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} м`;
  return `${(meters / 1000).toFixed(1)} км`;
}

/**
 * Ультраверсія віджета "Живе метро" для головної сторінки.
 */
export function LiveMetroWidget({ userPosition }: LiveMetroWidgetProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    // Оновлення кожні 5 секунд для точного зворотного відліку
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
      name: line.name,
      color: line.color,
      count: map.get(line.id) ?? 0
    }));
  }, [activeTrains]);

  const isServiceRunning = activeTrains.length > 0;

  const nearestMetroStation = useMemo(() => {
    if (!userPosition) return null;

    const allStationIds = new Set<string>();
    for (const { line } of BUILT_LINES) {
      for (const s of line.stations) allStationIds.add(s.id);
    }

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
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-4 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-white/20">
      {/* Декоративна неонова підсвітка */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-neon/10 blur-3xl" />

      {/* Шапка віджета */}
      <div className="mb-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2.5 w-2.5 items-center justify-center">
            {isServiceRunning && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon opacity-75" />
            )}
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${
                isServiceRunning ? 'bg-neon' : 'bg-white/30'
              }`}
            />
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-white/90">
            Живе метро
          </span>
          {isServiceRunning && (
            <span className="rounded-full border border-neon/30 bg-neon/10 px-2 py-0.5 text-[10px] font-bold text-neon shadow-sm">
              НАЖИВО
            </span>
          )}
        </div>

        <Link
          to="/metro/live"
          className="group flex items-center gap-1 text-[11px] font-semibold text-white/60 transition-colors hover:text-white"
        >
          <span>На схемі</span>
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
      </div>

      {/* Лічильники поїздів на лініях */}
      {!isServiceRunning ? (
        <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-center backdrop-blur-md">
          <p className="text-xs font-medium text-white/70">🌙 Нічна перерва у метрополітені</p>
          <p className="mt-0.5 text-[11px] text-white/40">Перші потяги відправляються о 05:30</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {lineCounts.map((l) => (
            <div
              key={l.id}
              className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] p-2.5 backdrop-blur-md transition-all hover:bg-white/[0.08]"
            >
              <div
                className="absolute left-0 top-0 h-full w-1 rounded-r"
                style={{ backgroundColor: l.color }}
              />
              <div className="pl-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                    Л{l.number}
                  </span>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: l.color }} />
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-base font-black tabular-nums text-white">{l.count}</span>
                  <span className="text-[10px] text-white/40">поїзд.</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Блок найближчої станції та прибуття */}
      <div className="mt-3.5 border-t border-white/10 pt-3">
        {nearestMetroStation ? (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 truncate text-[11px] font-bold text-white/90">
                <span className="text-neon">📍</span>
                <span className="truncate">{nearestMetroStation.name}</span>
              </div>
              <span className="shrink-0 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-white/70">
                {formatDistance(nearestMetroStation.distM)}
              </span>
            </div>

            {nextArrivals.length > 0 ? (
              <ul className="flex flex-col gap-1.5">
                {nextArrivals.map((a, i) => (
                  <li
                    key={`${a.lineId}-${a.direction}-${i}`}
                    className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.03] px-2.5 py-1.5 text-xs backdrop-blur-sm transition-colors hover:bg-white/[0.06]"
                  >
                    <div className="flex min-w-0 items-center gap-2 pr-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full ring-2 ring-white/10"
                        style={{ backgroundColor: a.lineColor }}
                      />
                      <span className="truncate font-medium text-white/80">{a.headsign}</span>
                    </div>
                    <span className="shrink-0 rounded-md border border-mint/20 bg-mint/10 px-2 py-0.5 text-[11px] font-bold tabular-nums text-mint">
                      {formatEtaCountdown(a.etaSec, nowSec)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[11px] italic text-white/40">Рейси очікуються незабаром...</p>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between text-[11px] text-white/50">
            <span className="flex items-center gap-1.5">
              <span>📍</span> Увімкніть геопозицію
            </span>
            <Link to="/metro/live" className="font-semibold text-neon hover:underline">
              Обрати станцію →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
