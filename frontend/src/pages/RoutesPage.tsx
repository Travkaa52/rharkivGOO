import { useState } from 'react';
import clsx from 'clsx';
import { TransportKindPage } from '@/pages/TransportKindPage';
import { TransportKindIcon } from '@/components/TransportKindIcon';
import type { TransportKind } from '@/types/transport';

interface TabItem {
  kind: TransportKind;
  label: string;
  activeColor: string;
  /** Файл іконки виду транспорту з /public/icons — авторські PNG без фону. */
  icon: string;
}

const TABS: TabItem[] = [
  {
    kind: 'bus',
    label: 'Автобуси',
    activeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    icon: 'avtobusicono.png'
  },
  {
    kind: 'trolleybus',
    label: 'Тролейбуси',
    activeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    icon: 'troleyicono.png'
  },
  {
    kind: 'tram',
    label: 'Трамваї',
    activeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    icon: 'tramwaiicono.png'
  },
  {
    kind: 'metro',
    label: 'Метро',
    activeColor: 'bg-red-500/15 text-red-400 border-red-500/30',
    icon: 'metroicono.png'
  },
];

export function RoutesPage() {
  const [activeTab, setActiveTab] = useState<TransportKind>('bus');

  return (
    <div className="min-h-dvh bg-bg text-ink-text selection:bg-primary/20">
      {/* Sticky Glassmorphic Navigation Bar */}
      <div className="sticky top-0 z-30 border-b border-border/40 bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center gap-1.5 overflow-x-auto px-4 py-1.5 no-scrollbar">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.kind;

            return (
              <button
                key={tab.kind}
                onClick={() => setActiveTab(tab.kind)}
                className={clsx(
                  'flex shrink-0 items-center gap-1 rounded-lg border px-1.5 py-0.5 text-[11px] font-semibold transition-all duration-200 active:scale-95',
                  isActive
                    ? clsx('shadow-sm backdrop-blur-md', tab.activeColor)
                    : 'border-border/40 bg-surface/50 text-ink-muted hover:bg-surface/80 hover:text-ink-text backdrop-blur-sm'
                )}
              >
                <TransportKindIcon kind={tab.kind} size={34} className={isActive ? 'opacity-100' : 'opacity-70'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Дисклеймер про точність даних */}
      <div className="mx-auto max-w-md px-4 pt-3">
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[11px] leading-snug text-amber-700">
          Дані про маршрути можуть бути неточними — дані взяті з відкритих джерел і можуть відрізнятися від
          фактичного руху транспорту.
        </div>
      </div>

      {/* Active Tab Content */}
      <main className="relative">
        <TransportKindPage key={activeTab} kind={activeTab} />
      </main>
    </div>
  );
}
