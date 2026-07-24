import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { RouteCard } from '@/components/RouteCard';
import { routesApi } from '@/api/routes';
import type { TransportKind, TransportRoute } from '@/types/transport';

const TITLES: Record<TransportKind, { title: string; subtitle: string }> = {
  metro: { title: 'Метро', subtitle: 'Харківський метрополітен, 3 лінії' },
  tram: { title: 'Трамваї', subtitle: 'Маршрути трамваїв міста' },
  trolleybus: { title: 'Тролейбуси', subtitle: 'Маршрути тролейбусів міста' },
  bus: { title: 'Автобуси', subtitle: 'Маршрути автобусів та маршруток' }
};

export function TransportKindPage({ kind }: { kind: TransportKind }) {
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { title, subtitle } = TITLES[kind];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    routesApi
      .getByKind(kind)
      .then((data) => {
        if (!cancelled) setRoutes(data);
      })
      .catch(() => {
        if (!cancelled) setErrorMsg('Не вдалося завантажити маршрути. Перевірте з’єднання.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [kind]);

  return (
    <div className="min-h-dvh bg-surface-soft pb-20">
      <PageHeader title={title} subtitle={subtitle} />
      <div className="flex flex-col gap-2 px-4">
        {loading && <p className="py-8 text-center text-sm text-graphite/50">Завантаження маршрутів…</p>}
        {errorMsg && <p className="py-8 text-center text-sm text-red-500">{errorMsg}</p>}
        {!loading && !errorMsg && routes.length === 0 && (
          <p className="py-8 text-center text-sm text-graphite/50">Маршрутів поки немає.</p>
        )}
        {routes.map((route) => (
          <RouteCard key={route.id} route={route} />
        ))}
      </div>
    </div>
  );
}
