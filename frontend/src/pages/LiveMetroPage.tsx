import { useCallback, useMemo, useRef, useState, type PointerEvent, type WheelEvent } from 'react';
import { PageHeader } from '@/components/PageHeader';
import {
  BUILT_LINES,
  dayTypeOf,
  formatEtaClock,
  formatEtaCountdown,
  getStationDayTimetable,
  getUpcomingArrivalsForStation,
  secOfDay,
  type LiveMetroTrain,
  type StationDayTimetableEntry
} from '@/liveMetro/liveMetroEngine';
import { useLiveMetroTrains } from '@/liveMetro/useLiveMetroTrains';
import type { LiveMetroDayType, SchematicLine, SchematicStation } from '@/liveMetro/schematicData';
import { getStationPhoto } from '@/data/stationPhotos';

const VIEW_W = 1200;
const VIEW_H = 1000;
const MIN_SCALE = 0.6;
const MAX_SCALE = 3.5;

/** Спрайти поїздів по лінії (public/sprites/*), по одному на колір лінії. */
const TRAIN_SPRITES: Record<string, string> = {
  'route-metro-1': '/sprites/metro-red-line.jpg',
  'route-metro-2': '/sprites/metro-blue-line.jpg',
  'route-metro-3': '/sprites/metro-green-line.jpg'
};

interface Transform {
  x: number;
  y: number;
  scale: number;
}

export function LiveMetroPage() {
  const trains = useLiveMetroTrains();
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const [selectedTrainId, setSelectedTrainId] = useState<string | null>(null);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [dayType, setDayType] = useState<LiveMetroDayType>(() => dayTypeOf(new Date()));

  const containerRef = useRef<HTMLDivElement | null>(null);
  const transformRef = useRef(transform);
  transformRef.current = transform;

  const dragState = useRef<{ pointerId: number; startX: number; startY: number; startTx: number; startTy: number } | null>(null);
  const pinchState = useRef<{ distance: number; scale: number } | null>(null);
  const activePointers = useRef<Map<number, { x: number; y: number }>>(new Map());

  const selectedTrain = useMemo(() => trains.find((t) => t.id === selectedTrainId) ?? null, [trains, selectedTrainId]);

  const allStations = useMemo(() => {
    const map = new Map<string, SchematicStation>();
    for (const { line } of BUILT_LINES) {
      for (const station of line.stations) {
        if (!map.has(station.id)) map.set(station.id, station);
      }
    }
    return Array.from(map.values());
  }, []);

  // Унікальні парні пересадочні лінії без дублювання
  const interchangeLines = useMemo(() => {
    const renderedPairs = new Set<string>();
    const lines: Array<{ id: string; x1: number; y1: number; x2: number; y2: number }> = [];

    for (const { line } of BUILT_LINES) {
      for (const station of line.stations) {
        if (!station.interchangeWith?.length) continue;
        for (const otherId of station.interchangeWith) {
          const other = allStations.find((o) => o.id === otherId);
          if (!other) continue;

          const pairKey = [station.id, otherId].sort().join('--');
          if (renderedPairs.has(pairKey)) continue;
          renderedPairs.add(pairKey);

          lines.push({
            id: pairKey,
            x1: station.point.x,
            y1: station.point.y,
            x2: other.point.x,
            y2: other.point.y
          });
        }
      }
    }
    return lines;
  }, [allStations]);

  const selectedStation = selectedStationId ? allStations.find((s) => s.id === selectedStationId) ?? null : null;

  const nowSec = secOfDay(new Date());
  const stationArrivals = useMemo(() => {
    if (!selectedStationId) return [];
    return getUpcomingArrivalsForStation(selectedStationId, new Date(), 3);
  }, [selectedStationId, trains]);

  const stationTimetable = useMemo(() => {
    if (!selectedStationId) return [];
    return getStationDayTimetable(selectedStationId, dayType);
  }, [selectedStationId, dayType]);

  const clampScale = (s: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));

  const onPointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const currentTransform = transformRef.current;

    if (activePointers.current.size === 1) {
      dragState.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        startTx: currentTransform.x,
        startTy: currentTransform.y
      };
    } else if (activePointers.current.size === 2) {
      const pts = Array.from(activePointers.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchState.current = { distance: dist, scale: currentTransform.scale };
      dragState.current = null;
    }
  }, []);

  const onPointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (!activePointers.current.has(e.pointerId)) return;
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointers.current.size === 2 && pinchState.current) {
      const pts = Array.from(activePointers.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const ratio = dist / (pinchState.current.distance || 1);
      setTransform((t) => ({ ...t, scale: clampScale(pinchState.current!.scale * ratio) }));
      return;
    }

    const drag = dragState.current;
    if (drag && drag.pointerId === e.pointerId) {
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      setTransform((t) => ({ ...t, x: drag.startTx + dx, y: drag.startTy + dy }));
    }
  }, []);

  const endPointer = useCallback((e: PointerEvent<HTMLDivElement>) => {
    activePointers.current.delete(e.pointerId);
    if (dragState.current?.pointerId === e.pointerId) dragState.current = null;
    if (activePointers.current.size < 2) pinchState.current = null;
  }, []);

  const onWheel = useCallback((e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    setTransform((t) => ({ ...t, scale: clampScale(t.scale * (1 + delta)) }));
  }, []);

  const resetView = () => setTransform({ x: 0, y: 0, scale: 1 });

  return (
    <div className="flex min-h-dvh flex-col bg-ink pb-20">
      <PageHeader title="Живе метро" subtitle="Позиції поїздів на схемі, у реальному часі" />

      <div className="mx-4 mb-2 flex items-center gap-2">
        <span className="text-[12px] text-white/50">Графік станції:</span>
        <div className="flex overflow-hidden rounded-full border border-white/15">
          <button
            type="button"
            onClick={() => setDayType('weekday')}
            className={[
              'px-3 py-1 text-[12px] font-medium transition-colors',
              dayType === 'weekday' ? 'bg-mint text-ink' : 'bg-transparent text-white/70'
            ].join(' ')}
          >
            Будній день
          </button>
          <button
            type="button"
            onClick={() => setDayType('weekend')}
            className={[
              'px-3 py-1 text-[12px] font-medium transition-colors',
              dayType === 'weekend' ? 'bg-mint text-ink' : 'bg-transparent text-white/70'
            ].join(' ')}
          >
            Вихідний
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative mx-4 mb-4 flex-1 overflow-hidden rounded-xl3 border border-ink-border bg-[#0c1310] shadow-glass-dark touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onPointerLeave={endPointer}
        onWheel={onWheel}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setSelectedTrainId(null);
            setSelectedStationId(null);
          }
        }}
      >
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="h-full w-full select-none"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: '50% 50%'
          }}
        >
          {/* Лінії колій */}
          {BUILT_LINES.map(({ line }) => (
            <SchemeLinePath key={line.id} line={line} />
          ))}

          {/* Пересадочні з'єднання */}
          {interchangeLines.map((l) => (
            <line
              key={l.id}
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              stroke="rgba(255,255,255,0.35)"
              strokeWidth={3}
              strokeDasharray="4 5"
            />
          ))}

          {/* Станції */}
          {BUILT_LINES.map(({ line }) =>
            line.stations.map((station) => (
              <StationMarker
                key={`${line.id}-${station.id}`}
                station={station}
                color={line.color}
                selected={selectedStationId === station.id}
                onClick={() => {
                  setSelectedStationId(station.id);
                  setSelectedTrainId(null);
                }}
              />
            ))
          )}

          {/* Поїзди */}
          {trains.map((train) => (
            <TrainMarker
              key={train.id}
              train={train}
              selected={selectedTrainId === train.id}
              onClick={() => {
                setSelectedTrainId(train.id);
                setSelectedStationId(null);
              }}
            />
          ))}
        </svg>

        {/* Керування масштабом */}
        <div className="absolute right-3 top-3 flex flex-col gap-1.5">
          <ZoomButton label="+" onClick={() => setTransform((t) => ({ ...t, scale: clampScale(t.scale * 1.25) }))} />
          <ZoomButton label="−" onClick={() => setTransform((t) => ({ ...t, scale: clampScale(t.scale / 1.25) }))} />
          <ZoomButton label="⟲" onClick={resetView} small />
        </div>

        {/* Легенда */}
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1 rounded-xl2 border border-white/10 bg-black/40 px-3 py-2 backdrop-blur-xs">
          {BUILT_LINES.map(({ line }) => (
            <div key={line.id} className="flex items-center gap-2 text-[11px] font-medium text-white/85">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: line.color }} />
              {line.number} · {line.headsignBackward} ↔ {line.headsignForward}
            </div>
          ))}
        </div>

        {selectedTrain && <TrainInfoCard train={selectedTrain} onClose={() => setSelectedTrainId(null)} />}
        {selectedStation && (
          <StationInfoCard
            station={selectedStation}
            arrivals={stationArrivals}
            timetable={stationTimetable}
            dayType={dayType}
            nowSec={nowSec}
            onClose={() => setSelectedStationId(null)}
          />
        )}
      </div>
    </div>
  );
}

function SchemeLinePath({ line }: { line: SchematicLine }) {
  const d = line.stations.map((s, i) => `${i === 0 ? 'M' : 'L'} ${s.point.x} ${s.point.y}`).join(' ');
  return <path d={d} fill="none" stroke={line.color} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />;
}

function StationMarker({
  station,
  color,
  selected,
  onClick
}: {
  station: SchematicStation;
  color: string;
  selected: boolean;
  onClick: () => void;
}) {
  const isInterchange = !!station.interchangeWith?.length;
  return (
    <g
      transform={`translate(${station.point.x}, ${station.point.y})`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="cursor-pointer"
    >
      <circle r={isInterchange ? 13 : 9} fill="#0c1310" stroke={color} strokeWidth={isInterchange ? 5 : 4} />
      {selected && <circle r={isInterchange ? 19 : 15} fill="none" stroke="#C6A552" strokeWidth={2} />}
      <text
        x={0}
        y={-16}
        textAnchor="middle"
        className="pointer-events-none font-display"
        fontSize={13}
        fill="#F5F7F6"
        style={{ paintOrder: 'stroke', stroke: '#0A0F0D', strokeWidth: 3 }}
      >
        {station.name}
      </text>
    </g>
  );
}

function TrainMarker({ train, selected, onClick }: { train: LiveMetroTrain; selected: boolean; onClick: () => void }) {
  const spriteSrc = TRAIN_SPRITES[train.lineId] ?? '/sprites/metro-red-line.jpg';
  const isDwell = train.phase === 'dwell';
  const facingLeft = train.headingDeg > 90 && train.headingDeg < 270;
  const size = selected ? 30 : 22;

  return (
    <g
      transform={`translate(${train.point.x}, ${train.point.y})`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="cursor-pointer"
      style={{ transition: 'opacity 200ms ease' }}
    >
      <circle r={size / 2 + 3} fill={train.lineColor} opacity={selected ? 1 : 0.95} stroke="#fff" strokeWidth={2} />
      <clipPath id={`clip-${train.id}`}>
        <circle r={size / 2 - 1} />
      </clipPath>
      <image
        href={spriteSrc}
        x={-size / 2}
        y={-size / 2}
        width={size}
        height={size}
        clipPath={`url(#clip-${train.id})`}
        preserveAspectRatio="xMidYMid slice"
        transform={facingLeft ? 'scale(-1,1)' : undefined}
        opacity={isDwell ? 0.85 : 1}
      />
      {isDwell && <circle r={size / 2 + 3} fill="none" stroke="#C6A552" strokeWidth={2} className="animate-pulse-soft" />}
    </g>
  );
}

function ZoomButton({ label, onClick, small }: { label: string; onClick: () => void; small?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex items-center justify-center rounded-full border border-white/15 bg-black/50 font-display font-bold text-white shadow-glass-dark backdrop-blur-xs active:scale-95',
        small ? 'h-8 w-8 text-sm' : 'h-9 w-9 text-lg'
      ].join(' ')}
    >
      {label}
    </button>
  );
}

function TrainInfoCard({ train, onClose }: { train: LiveMetroTrain; onClose: () => void }) {
  const nowSec = secOfDay(new Date());
  const directionLabel = `→ ${train.headsign}`;
  const speedKmh = Math.round(train.speedRatio * 40);

  return (
    <InfoCardShell onClose={onClose}>
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: train.lineColor }} />
        <span className="font-display text-sm font-bold text-white">{train.lineNumber}</span>
        <span className="text-sm text-white/70">{directionLabel}</span>
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[12px]">
        <dt className="text-white/50">Поточна станція</dt>
        <dd className="text-right text-white/90">
          {train.phase === 'dwell' ? train.nextStation.name : train.previousStation.name}
        </dd>
        <dt className="text-white/50">Наступна станція</dt>
        <dd className="text-right text-white/90">{train.nextStation.name}</dd>
        <dt className="text-white/50">Напрямок</dt>
        <dd className="text-right text-white/90">{train.headsign}</dd>
        <dt className="text-white/50">Швидкість</dt>
        <dd className="text-right text-white/90">
          {train.phase === 'dwell' ? 'зупинка · двері відкриті' : `≈ ${speedKmh} км/год`}
        </dd>
        <dt className="text-white/50">Прибуття на {train.nextStation.name}</dt>
        <dd className="text-right text-white/90">
          {formatEtaClock(train.etaNextStationSec)} · {formatEtaCountdown(train.etaNextStationSec, nowSec)}
        </dd>
      </dl>
    </InfoCardShell>
  );
}

function StationInfoCard({
  station,
  arrivals,
  timetable,
  dayType,
  nowSec,
  onClose
}: {
  station: SchematicStation;
  arrivals: ReturnType<typeof getUpcomingArrivalsForStation>;
  timetable: StationDayTimetableEntry[];
  dayType: LiveMetroDayType;
  nowSec: number;
  onClose: () => void;
}) {
  const photo = getStationPhoto(station.id);
  const [showFullTimetable, setShowFullTimetable] = useState(false);

  return (
    <InfoCardShell onClose={onClose}>
      <div className="flex gap-3">
        {photo && (
          <img
            src={photo}
            alt={station.name}
            className="h-16 w-20 shrink-0 rounded-lg object-cover shadow-glass-dark ring-1 ring-white/15"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="font-display text-sm font-bold text-white">{station.name}</div>
          {station.interchangeWith?.length ? (
            <p className="mt-0.5 text-[11px] text-gold-light">Пересадка на іншу лінію</p>
          ) : null}
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-1.5">
        {arrivals.length === 0 && <p className="text-[12px] text-white/50">Найближчим часом поїздів немає.</p>}
        {arrivals.map((a, i) => (
          <div key={`${a.lineNumber}-${a.headsign}-${i}`} className="flex items-center justify-between rounded-lg bg-white/5 px-2 py-1.5 text-[12px]">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: a.lineColor }} />
              <span className="text-white/85">{a.lineNumber} → {a.headsign}</span>
            </div>
            <span className="font-medium text-mint">{formatEtaCountdown(a.etaSec, nowSec)}</span>
          </div>
        ))}
      </div>

      {timetable.length > 0 && (
        <div className="mt-3 border-t border-white/10 pt-2">
          <button
            type="button"
            onClick={() => setShowFullTimetable((v) => !v)}
            className="flex w-full items-center justify-between text-[12px] font-medium text-white/70"
          >
            <span>
              Повний графік · {dayType === 'weekday' ? 'будній день' : 'вихідний'}
            </span>
            <span className="text-white/40">{showFullTimetable ? '▲' : '▼'}</span>
          </button>

          {showFullTimetable && (
            <div className="mt-2 max-h-48 overflow-y-auto pr-1">
              {timetable.map((entry, i) => (
                <TimetableBlock key={`${entry.lineId}-${entry.direction}-${i}`} entry={entry} />
              ))}
            </div>
          )}
        </div>
      )}
    </InfoCardShell>
  );
}

function TimetableBlock({ entry }: { entry: StationDayTimetableEntry }) {
  return (
    <div className="mb-2">
      <div className="mb-1 flex items-center gap-2 text-[11px] font-medium text-white/80">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.lineColor }} />
        {entry.lineNumber} → {entry.headsign}
      </div>
      <div className="flex flex-wrap gap-1">
        {entry.times.map((t, i) => (
          <span key={i} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] tabular-nums text-white/70">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function InfoCardShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="absolute inset-x-3 bottom-3 z-30 animate-slide-up rounded-xl2 border border-white/10 bg-black/70 p-3 shadow-glass-dark backdrop-blur-md">
      <button type="button" onClick={onClose} className="absolute right-2 top-2 text-white/40 hover:text-white/80" aria-label="Закрити">
        ✕
      </button>
      {children}
    </div>
  );
}
