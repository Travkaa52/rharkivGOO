import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { localRoutes, localStops } from '@/data/localData';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useHistoryStore } from '@/store/useHistoryStore';
import { useGeolocation } from '@/hooks/useGeolocation';
import { LiveMetroWidget } from '@/components/LiveMetroWidget';
import type { TransportKind } from '@/types/transport';

const KIND_ICON: Record<TransportKind, string> = { metro: '🚇', tram: '🚊', trolleybus: '🚎', bus: '🚌' };

function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} м`;
  return `${(m / 1000).toFixed(1)} км`;
}

/**
 * Головна — дашборд застосунку (окремо від карти, як у мокапі): привітання,
 * прев'ю живого метро (замість прев'ю карти — головний акцент екрана),
 * обрані маршрути/зупинки, найближчі зупинки, продовження останньої дії
 * з історії, і сітка швидких дій. Карта лишається окремим повноекранним
 * екраном за вкладкою "Карта" (тепер трохи менш пріоритетним пунктом меню).
 */
export function HomePage() {
  const favoriteRoutes = useFavoritesStore((s) => s.routes);
  const historyEntries = useHistoryStore((s) => s.entries);
  const { position } = useGeolocation();

  const favoriteRouteDetails = useMemo(
    () => favoriteRoutes.slice(0, 3).map((f) => localRoutes.getById(f.routeId)).filter((r): r is NonNullable<typeof r> => !!r),
    [favoriteRoutes]
  );
  const nearbyStops = useMemo(
    () => (position ? localStops.getNearby(position.lat, position.lng, 900).slice(0, 3) : []),
    [position]
  );
  const lastEntry = historyEntries[0];

  const hour = new Date().getHours();
  const greeting = hour < 6 ? 'Доброї ночі' : hour < 12 ? 'Доброго ранку' : hour < 18 ? 'Доброго дня' : 'Доброго вечора';

  return (
    <div className="min-h-dvh bg-ink pb-28 pt-[max(1rem,env(safe-area-inset-top))] text-white">
      <div className="mx-auto max-w-md px-4">
        <header className="mb-5">
          <h1 className="font-display text-2xl font-extrabold">{greeting}! 👋</h1>
          <p className="mt-1 text-sm text-white/50">Ваш персональний помічник у громадському транспорті Харкова.</p>
        </header>

        {/* Живе метро — головний акцент екрана замість прев'ю карти: реальний
            стан руху потягів по розкладу і найближчі прибуття поруч. */}
        <div className="mb-3">
          <LiveMetroWidget userPosition={position} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <section className="rounded-xl2 border border-ink-border bg-ink-surface p-3 shadow-glass-dark">
            <h2 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gold">
              <span>★</span> Улюблені маршрути
            </h2>
            {favoriteRouteDetails.length === 0 ? (
              <p className="text-xs text-white/40">Ще немає улюблених.</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {favoriteRouteDetails.map((r) => (
                  <li key={r.id}>
                    <Link to={`/routes/${r.id}`} className="flex items-center gap-1.5 text-xs text-white/80 hover:text-white">
                      <span>{KIND_ICON[r.kind]}</span>
                      <span className="font-semibold">{r.number}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/favorites" className="mt-2 block rounded-lg bg-white/5 py-1.5 text-center text-[11px] font-semibold text-white/70 hover:bg-white/10">
              Усі улюблені
            </Link>
          </section>

          <section className="rounded-xl2 border border-ink-border bg-ink-surface p-3 shadow-glass-dark">
            <h2 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-mint">
              <span>📍</span> Поруч зараз
            </h2>
            {nearbyStops.length === 0 ? (
              <p className="text-xs text-white/40">Увімкніть геолокацію на карті.</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {nearbyStops.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 text-xs text-white/80">
                    <span className="truncate">{s.name}</span>
                    <span className="shrink-0 text-white/40">{formatDistance(0)}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/map" className="mt-2 block rounded-lg bg-white/5 py-1.5 text-center text-[11px] font-semibold text-white/70 hover:bg-white/10">
              Усі поруч
            </Link>
          </section>
        </div>

        {lastEntry && (
          <section className="mt-3 rounded-xl2 border border-ink-border bg-forest/20 p-3 shadow-glass-dark">
            <h2 className="mb-1 text-xs font-bold uppercase tracking-wide text-white/50">Продовжити останній маршрут</h2>
            <Link to={lastEntry.type === 'route' && lastEntry.resultId ? `/routes/${lastEntry.resultId}` : '/map'} className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-white">{lastEntry.query}</span>
              <span className="text-white/40">›</span>
            </Link>
          </section>
        )}

        <section className="mt-3">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-white/50">Швидкі дії</h2>
          <div className="grid grid-cols-4 gap-2">
            <QuickAction to="/metro/live" icon="🚇" label="Живе метро" />
            <QuickAction to="/routes" icon="🔍" label="Пошук" />
            <QuickAction to="/favorites" icon="⭐" label="Улюблене" />
            <QuickAction to="/map" icon="🗺️" label="Карта" />
          </div>
        </section>
      </div>
    </div>
  );
}

function QuickAction({ to, icon, label }: { to: string; icon: string; label: string }) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-1 rounded-xl2 border border-ink-border bg-ink-surface py-3 text-center shadow-glass-dark transition hover:bg-white/10"
    >
      <span className="text-lg">{icon}</span>
      <span className="text-[10px] font-medium text-white/70">{label}</span>
    </Link>
  );
}
