import { useState } from 'react';
import clsx from 'clsx';
import { PageHeader } from '@/components/PageHeader';
import { SearchBar } from '@/components/SearchBar';
import { TransportKindPage } from '@/pages/TransportKindPage';
import type { TransportKind } from '@/types/transport';

const TABS: { kind: TransportKind; label: string }[] = [
  { kind: 'metro', label: 'Метро' },
  { kind: 'tram', label: 'Трамваї' },
  { kind: 'trolleybus', label: 'Тролейбуси' },
  { kind: 'bus', label: 'Автобуси' }
];

export function RoutesPage() {
  const [activeTab, setActiveTab] = useState<TransportKind>('bus');

  return (
    <div className="min-h-dvh bg-surface-soft pb-20">
      <PageHeader title="Маршрути" subtitle="Усі маршрути громадського транспорту Харкова" />
      <div className="px-4 pb-3">
        <SearchBar placeholder="Знайти маршрут за номером…" onSubmit={() => {}} />
      </div>
      <div className="flex gap-2 overflow-x-auto px-4 pb-3">
        {TABS.map((tab) => (
          <button
            key={tab.kind}
            onClick={() => setActiveTab(tab.kind)}
            className={clsx(
              'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition',
              activeTab === tab.kind ? 'bg-forest text-white shadow-glass' : 'bg-white/70 text-graphite/60'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <TransportKindPage kind={activeTab} />
    </div>
  );
}
