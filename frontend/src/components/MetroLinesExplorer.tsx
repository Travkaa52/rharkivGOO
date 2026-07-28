import { useMemo, useState } from 'react';
import { Clock3, MapPin, TrainFront, CalendarDays } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import {
  BUILT_LINES,
  LINE_COLORS,
  getStationDayTimetable,
  dayTypeOf,
  secOfDay,
  formatEtaClock,
  type LiveMetroDayType,
  type StationDayTimetableEntry,
} from '@/pages/LiveMetroPage';

function timeStrToSec(time: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!m) return -1;
  return Number(m[1]) * 3600 + Number(m[2]) * 60;
}

/** Одна колонка розкладу (один напрямок) з підсвіткою відносно поточного часу. */
function DirectionTimetable({
  entry,
  nowSec,
}: {
  entry: StationDayTimetableEntry;
  nowSec: number;
}) {
  // Індекс найближчого рейсу, що ще не відправився.
  const nextIdx = entry.times.findIndex((t) => timeStrToSec(t) >= nowSec);

  return (
    <div className="rounded-2xl border border-border/50 bg-surface/50 p-3">
      <div className="mb-2 flex items-center gap-2">
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold text-white"
          style={{ backgroundColor: entry.lineColor }}
        >
          {entry.lineNumber}
        </span>
        <div className="min-w-0">
          <p className="truncate text-body-sm font-bold text-ink-text">→ {entry.headsign}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {entry.times.map((t, idx) => {
          const isPast = idx < nextIdx || nextIdx === -1;
          const isNext = idx === nextIdx;
          return (
            <span
              key={`${t}-${idx}`}
              className={
                isNext
                  ? 'rounded-md border-2 px-2 py-1 text-caption font-extrabold shadow-sm'
                  : isPast
                  ? 'rounded-md border border-border/30 bg-surface/40 px-2 py-1 text-caption font-semibold text-ink-muted opacity-40'
                  : 'rounded-md border border-border/40 bg-surface/80 px-2 py-1 text-caption font-semibold text-ink-text'
              }
              style={
                isNext
                  ? { borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.12)', color: '#16a34a' }
                  : undefined
              }
            >
              {t}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function StationTimetableSheet({
  stationId,
  stationName,
  onClose,
}: {
  stationId: string;
  stationName: string;
  onClose: () => void;
}) {
  const [dayType, setDayType] = useState<LiveMetroDayType>(() => dayTypeOf(new Date()));
  const nowSec = secOfDay(new Date());

  const entries = useMemo(() => getStationDayTimetable(stationId, dayType), [stationId, dayType]);

  return (
    <Sheet open onClose={onClose} title={stationName}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-caption font-semibold text-ink-muted">
            <Clock3 className="h-3.5 w-3.5" />
            Зараз {formatEtaClock(nowSec)}
          </span>

          <div className="inline-flex items-center rounded-xl border border-border/40 bg-surface/60 p-1">
            <button
              onClick={() => setDayType('weekday')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-caption font-bold transition-all ${
                dayType === 'weekday' ? 'bg-primary text-primary-foreground shadow-2xs' : 'text-ink-muted'
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Будні
            </button>
            <button
              onClick={() => setDayType('weekend')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-caption font-bold transition-all ${
                dayType === 'weekend' ? 'bg-primary text-primary-foreground shadow-2xs' : 'text-ink-muted'
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Вихідні
            </button>
          </div>
        </div>

        {entries.length === 0 ? (
          <p className="rounded-xl border border-border/40 bg-surface/50 p-3 text-body-sm text-ink-muted">
            Немає даних розкладу для цієї станції.
          </p>
        ) : (
          <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
            {entries.map((entry, idx) => (
              <DirectionTimetable key={`${entry.lineId}-${idx}`} entry={entry} nowSec={nowSec} />
            ))}
          </div>
        )}

        <p className="px-1 text-caption text-ink-muted">
          Затемнені рейси вже відправились. Рейс у зеленій рамці — наступний.
        </p>
      </div>
    </Sheet>
  );
}

export function MetroLinesExplorer() {
  const [activeLineId, setActiveLineId] = useState(BUILT_LINES[0].line.id);
  const [selectedStation, setSelectedStation] = useState<{ id: string; name: string } | null>(null);

  const activeLine = BUILT_LINES.find((l) => l.line.id === activeLineId)?.line ?? BUILT_LINES[0].line;
  const color = LINE_COLORS[activeLine.id];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-body font-bold text-ink-text flex items-center gap-2">
          <TrainFront className="h-4 w-4" style={{ color }} />
          Лінії метро
        </h2>
        <span className="text-caption font-semibold text-ink-muted">Оберіть гілку</span>
      </div>

      {/* Line tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {BUILT_LINES.map(({ line }) => {
          const isActive = line.id === activeLineId;
          const lineColor = LINE_COLORS[line.id];
          return (
            <button
              key={line.id}
              onClick={() => setActiveLineId(line.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-caption font-bold transition-all active:scale-95 ${
                isActive ? 'text-white shadow-sm' : 'border-border/40 bg-surface/50 text-ink-muted'
              }`}
              style={isActive ? { backgroundColor: lineColor, borderColor: lineColor } : undefined}
            >
              <span
                className="flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-extrabold"
                style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : lineColor, color: isActive ? '#fff' : '#fff' }}
              >
                {line.number}
              </span>
              <span className="truncate max-w-[8.5rem]">{line.name}</span>
            </button>
          );
        })}
      </div>

      {/* Station list for the active line */}
      <div className="rounded-3xl border border-border/60 bg-surface/50 p-3 backdrop-blur-xl shadow-sm">
        <ol className="relative flex flex-col">
          <div
            className="absolute left-[1.15rem] top-4 bottom-4 w-0.5 rounded-full opacity-60"
            style={{ backgroundColor: color }}
          />
          {activeLine.stations.map((station, idx) => (
            <li key={station.id}>
              <button
                onClick={() => setSelectedStation({ id: station.id, name: station.name })}
                className="relative flex w-full items-center gap-3 rounded-2xl p-2 text-left transition-colors hover:bg-surface/80 active:scale-[0.99]"
              >
                <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center">
                  <div
                    className={`h-3.5 w-3.5 rounded-full border-2 border-surface shadow-2xs ${
                      idx === 0 || idx === activeLine.stations.length - 1 ? 'scale-125' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="truncate text-body-sm font-semibold text-ink-text">{station.name}</span>
                  {station.interchangeWith && station.interchangeWith.length > 0 && (
                    <span className="ml-2 text-caption font-semibold text-ink-muted">пересадка</span>
                  )}
                </div>
                <MapPin className="h-4 w-4 shrink-0 text-ink-muted/50" />
              </button>
            </li>
          ))}
        </ol>
      </div>

      {selectedStation && (
        <StationTimetableSheet
          stationId={selectedStation.id}
          stationName={selectedStation.name}
          onClose={() => setSelectedStation(null)}
        />
      )}
    </div>
  );
}
