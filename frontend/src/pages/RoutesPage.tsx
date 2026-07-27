import { useState } from 'react';
import clsx from 'clsx';
import { TrainTrack, Bus, Zap } from 'lucide-react';
import { TransportKindPage } from '@/pages/TransportKindPage';
import type { TransportKind } from '@/types/transport';

interface TabItem {
  kind: TransportKind;
  label: string;
  icon: typeof TrainTrack;
  activeColor: string;
}

const TABS: TabItem[] = [
  { 
    kind: 'bus', 
    label: 'Автобуси', 
    icon: Bus, 
    activeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
  },
  { 
    kind: 'trolleybus', 
    label: 'Тролейбуси', 
    icon: Zap, 
    activeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30' 
  },
  { 
    kind: 'tram', 
    label: 'Трамваї', 
    icon: TrainTrack, 
    activeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30' 
  },
  { 
    kind: 'metro', 
    label: 'Метро', 
    icon: TrainTrack, 
    activeColor: 'bg-red-500/15 text-red-400 border-red-500/30' 
  },
];

export function RoutesPage() {
  const [activeTab, setActiveTab] = useState<TransportKind>('bus');

  return (
    <div className="min-h-dvh bg-bg text-ink-text selection:bg-primary/20">
      {/* Sticky Glassmorphic Navigation Bar */}
      <div className="sticky top-0 z-30 border-b border-border/40 bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center gap-2 overflow-x-auto px-4 py-3 no-scrollbar">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.kind;

            return (
              <button
                key={tab.kind}
                onClick={() => setActiveTab(tab.kind)}
                className={clsx(
                  'flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-body-sm font-semibold transition-all duration-200 active:scale-95',
                  isActive
                    ? clsx('shadow-sm backdrop-blur-md', tab.activeColor)
                    : 'border-border/40 bg-surface/50 text-ink-muted hover:bg-surface/80 hover:text-ink-text backdrop-blur-sm'
                )}
              >
                <Icon className={clsx('h-4 w-4', isActive ? 'opacity-100' : 'opacity-60')} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Tab Content */}
      <main className="relative">
        <TransportKindPage key={activeTab} kind={activeTab} />
      </main>
    </div>
  );
}
