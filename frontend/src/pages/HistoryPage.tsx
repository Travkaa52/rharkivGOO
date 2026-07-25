import { PageHeader } from '@/components/PageHeader';
import { useHistoryStore } from '@/store/useHistoryStore';

const TYPE_LABELS: Record<string, string> = { stop: 'Зупинка', route: 'Маршрут', address: 'Адреса' };

export function HistoryPage() {
  const entries = useHistoryStore((s) => s.entries);
  const removeEntry = useHistoryStore((s) => s.removeEntry);
  const clear = useHistoryStore((s) => s.clear);

  return (
    <div className="min-h-dvh bg-surface-soft pb-20">
      <PageHeader title="Історія" subtitle="Останні пошукові запити" />
      <div className="px-4">
        {entries.length === 0 ? (
          <p className="py-12 text-center text-sm text-graphite/50">Історія пошуку порожня.</p>
        ) : (
          <>
            <div className="mb-2 flex justify-end">
              <button onClick={clear} className="text-xs text-graphite/40 hover:text-red-500">
                Очистити все
              </button>
            </div>
            <ul className="flex flex-col gap-2">
              {entries.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between rounded-xl2 bg-white/90 p-3 shadow-glass">
                  <div>
                    <p className="text-sm text-graphite">{entry.query}</p>
                    <p className="text-xs text-graphite/40">{TYPE_LABELS[entry.type]}</p>
                  </div>
                  <button onClick={() => removeEntry(entry.id)} className="text-xs text-graphite/40 hover:text-red-500">
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
