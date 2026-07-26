import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent, type WheelEvent } from 'react';
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
import type { LiveMetroDayType, SchematicStation } from '@/liveMetro/schematicData';
import { getStationPhoto } from '@/data/stationPhotos';
import { assetUrl } from '@/lib/assetUrl';

const VIEW_W = 1200;
const VIEW_H = 1100;
const MIN_SCALE = 0.5;
const MAX_SCALE = 4.0;

const TRAIN_SPRITES: Record<string, string> = {
  'route-metro-1': assetUrl('/sprites/metro-red-line.jpg'),
  'route-metro-2': assetUrl('/sprites/metro-blue-line.jpg'),
  'route-metro-3': assetUrl('/sprites/metro-green-line.jpg')
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
  const [nowSec, setNowSec] = useState<number>(() => secOfDay(new Date()));

  const containerRef = useRef<HTMLDivElement | null>(null);
  const transformRef = useRef(transform);
  transformRef.current = transform;

  // Інтелектуальний трекінг перетягування для надійних кліків
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const pinchState = useRef<{ distance: number; scale: number } | null>(null);
  const activePointers = useRef<Map<number, { x: number; y: number }>>(new Map());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowSec(secOfDay(new Date()));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  const interchangePairs = useMemo(() => {
    const renderedPairs = new Set<string>();
    const pairs: Array<{ id: string; s1: SchematicStation; s2: SchematicStation }> = [];

    for (const { line } of BUILT_LINES) {
      for (const station of line.stations) {
        if (!station.interchangeWith?.length) continue;
        for (const otherId of station.interchangeWith) {
          const other = allStations.find((o) => o.id === otherId);
          if (!other) continue;

          const pairKey = [station.id, otherId].sort().join('--');
          if (renderedPairs.has(pairKey)) continue;
          renderedPairs.add(pairKey);

          pairs.push({ id: pairKey, s1: station, s2: other });
        }
      }
    }
    return pairs;
  }, [allStations]);

  const selectedStation = selectedStationId ? allStations.find((s) => s.id === selectedStationId) ?? null : null;

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
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const currentTransform = transformRef.current;

    if (activePointers.current.size === 1) {
      isDraggingRef.current = false;
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        tx: currentTransform.x,
        ty: currentTransform.y
      };
    } else if (activePointers.current.size === 2) {
      const pts = Array.from(activePointers.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchState.current = { distance: dist, scale: currentTransform.scale };
      dragStartRef.current = null;
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

    const drag = dragStartRef.current;
    if (drag) {
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (Math.hypot(dx, dy) > 4) {
        isDraggingRef.current = true;
        setTransform((t) => ({ ...t, x: drag.tx + dx, y: drag.ty + dy }));
      }
    }
  }, []);

  const endPointer = useCallback((e: PointerEvent<HTMLDivElement>) => {
    activePointers.current.delete(e.pointerId);
    if (activePointers.current.size === 0) {
      dragStartRef.current = null;
    }
    if (activePointers.current.size < 2) {
      pinchState.current = null;
    }
  }, []);

  const onWheel = useCallback((e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = -e.deltaY * 0.0015;
    setTransform((t) => {
      const newScale = clampScale(t.scale * (1 + delta));
      const scaleRatio = newScale / t.scale;

      const newX = mouseX - (mouseX - t.x) * scaleRatio;
      const newY = mouseY - (mouseY - t.y) * scaleRatio;

      return { x: newX, y: newY, scale: newScale };
    });
  }, []);

  const resetView = () => setTransform({ x: 0, y: 0, scale: 1 });

  const handleStationSelect = useCallback((stationId: string) => {
    if (isDraggingRef.current) return;
    setSelectedStationId((prev) => (prev === stationId ? null : stationId));
    setSelectedTrainId(null);
  }, []);

  const handleTrainSelect = useCallback((trainId: string) => {
    if (isDraggingRef.current) return;
    setSelectedTrainId((prev) => (prev === trainId ? null : trainId));
    setSelectedStationId(null);
  }, []);

  return (
    <div className="flex min-h-dvh flex-col bg-ink pb-20">
      <PageHeader title="Живе метро" subtitle="Позиції поїздів на схемі, у реальному часі" />

      {/* Перемикач дня тижня */}
      <div className="mx-4 mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src={assetUrl('/icons/metro-logo.svg')}
            alt="Харківський метрополітен"
            className="h-7 w-7 shrink-0 rounded-md"
          />
          <span className="text-[13px] font-semibold text-white/90">Харківський метрополітен</span>
        </div>

        <div className="flex overflow-hidden rounded-full border border-white/15 bg-white/5">
          <button
            type="button"
            onClick={() => setDayType('weekday')}
            className={[
              'px-3 py-1 text-[12px] font-medium transition-colors',
              dayType === 'weekday' ? 'bg-mint text-ink font-bold' : 'bg-transparent text-white/70'
            ].join(' ')}
          >
            Будній
          </button>
          <button
            type="button"
            onClick={() => setDayType('weekend')}
            className={[
              'px-3 py-1 text-[12px] font-medium transition-colors',
              dayType === 'weekend' ? 'bg-mint text-ink font-bold' : 'bg-transparent text-white/70'
            ].join(' ')}
          >
            Вихідний
          </button>
        </div>
      </div>

      {/* Головний векторний полотно-контейнер */}
      <div
        ref={containerRef}
        className="relative mx-4 mb-4 flex-1 overflow-hidden rounded-xl3 border border-white/10 bg-[#FAFBFD] shadow-2xl touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onPointerLeave={endPointer}
        onWheel={onWheel}
        onClick={(e) => {
          if (e.target === e.currentTarget && !isDraggingRef.current) {
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
            transformOrigin: '0 0'
          }}
        >
          {/* Декоративні траси річок (Харків та Лопань) */}
          <path
            d="M 180 80 C 220 220, 260 380, 350 460 C 420 520, 500 560, 620 540 C 740 520, 780 520, 820 580 C 870 640, 820 750, 720 820"
            fill="none"
            stroke="#E3F0F8"
            strokeWidth={22}
            strokeLinecap="round"
          />
          <path
            d="M 100 420 Q 240 430 350 460"
            fill="none"
            stroke="#E3F0F8"
            strokeWidth={16}
            strokeLinecap="round"
          />

          {/* Заголовок карти у стилі плаката */}
          <g transform="translate(60, 70)">
            <path
              d="M 0 0 L 12 -24 L 24 0 L 36 -24 L 48 0 L 38 0 L 30 -16 L 24 -4 L 18 -16 L 10 0 Z"
              fill="#D92B27"
            />
            <text x={64} y={-5} className="font-display font-extrabold" fontSize={32} fill="#111827">
              Харківський метрополітен
            </text>
            <text x={64} y={18} className="font-sans font-medium" fontSize={18} fill="#6B7280">
              Kharkiv subway system
            </text>
          </g>

          {/* Легенда ліній та інфо-блок у лівому нижньому кутку */}
          <g transform="translate(60, 740)">
            {/* Червона лінія */}
            <g transform="translate(0, 0)">
              <rect x={0} y={0} width={28} height={20} rx={4} fill="#D92B27" />
              <text x={14} y={14} textAnchor="middle" fill="#FFF" fontSize={13} fontWeight="bold">1</text>
              <text x={38} y={10} className="font-bold" fontSize={14} fill="#111827">Холодногірсько-</text>
              <text x={38} y={25} className="font-bold" fontSize={14} fill="#111827">Заводська лінія</text>
              <text x={38} y={38} className="font-normal" fontSize={11} fill="#6B7280">Kholodnohirsko-Zavodska line</text>
            </g>

            {/* Синя лінія */}
            <g transform="translate(0, 60)">
              <rect x={0} y={0} width={28} height={20} rx={4} fill="#0072BC" />
              <text x={14} y={14} textAnchor="middle" fill="#FFF" fontSize={13} fontWeight="bold">2</text>
              <text x={38} y={12} className="font-bold" fontSize={14} fill="#111827">Салтівська лінія</text>
              <text x={38} y={27} className="font-normal" fontSize={11} fill="#6B7280">Saltivska line</text>
            </g>

            {/* Зелена лінія */}
            <g transform="translate(0, 110)">
              <rect x={0} y={0} width={28} height={20} rx={4} fill="#009640" />
              <text x={14} y={14} textAnchor="middle" fill="#FFF" fontSize={13} fontWeight="bold">3</text>
              <text x={38} y={12} className="font-bold" fontSize={14} fill="#111827">Олексіївська лінія</text>
              <text x={38} y={27} className="font-normal" fontSize={11} fill="#6B7280">Oleksiyivska line</text>
            </g>

            {/* Години роботи та контакти */}
            <g transform="translate(0, 175)">
              <text x={0} y={0} className="font-bold" fontSize={15} fill="#111827">Працюємо з 5:30 до 24:00</text>
              <text x={0} y={16} className="font-normal" fontSize={12} fill="#9CA3AF">Works from 5:30 to 24:00</text>
              <line x1={0} y1={28} x2={220} y2={28} stroke="#E5E7EB" strokeWidth={1} />
              <text x={0} y={45} className="font-medium" fontSize={12} fill="#6B7280">www.metro.kharkov.ua</text>
              <text x={0} y={62} className="font-normal" fontSize={11} fill="#9CA3AF">Підтримка eTicket: 0-800-505-685</text>
              <text x={0} y={85} className="font-normal" fontSize={10} fill="#9CA3AF">Дизайн: Білецький Тимофій · Версія 5.1.1</text>
            </g>
          </g>

          {/* Лінії метро */}
          {BUILT_LINES.map(({ line }) => (
            <LineTracks key={line.id} line={line} />
          ))}

          {/* Пересадочні гантелі */}
          {interchangePairs.map((p) => (
            <InterchangeCapsule key={p.id} s1={p.s1} s2={p.s2} />
          ))}

          {/* Маркери станцій та підписи */}
          {BUILT_LINES.map(({ line }) =>
            line.stations.map((station) => (
              <StationMarker
                key={`${line.id}-${station.id}`}
                station={station}
                color={line.color}
                selected={selectedStationId === station.id}
                onClick={() => handleStationSelect(station.id)}
              />
            ))
          )}

          {/* Поїзди у реальному часі */}
          {trains.map((train) => (
            <TrainMarker
              key={train.id}
              train={train}
              selected={selectedTrainId === train.id}
              onClick={() => handleTrainSelect(train.id)}
            />
          ))}
        </svg>

        {/* Кнопки зума */}
        <div className="absolute right-4 top-4 flex flex-col gap-2">
          <ZoomButton label="+" onClick={() => setTransform((t) => ({ ...t, scale: clampScale(t.scale * 1.25) }))} />
          <ZoomButton label="−" onClick={() => setTransform((t) => ({ ...t, scale: clampScale(t.scale / 1.25) }))} />
          <ZoomButton label="⟲" onClick={resetView} small />
        </div>

        {/* Картки інформації про об'єкт */}
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

function LineTracks({ line }: { line: any }) {
  const stations = line.stations as SchematicStation[];
  if (!stations.length) return null;

  let d = '';
  if (line.id === 'route-metro-1') {
    // Холодногірсько-Заводська
    d = `M 120 480 L 340 480 L 430 550 L 540 710 L 810 980 L 910 1010 L 1110 1010`;
  } else if (line.id === 'route-metro-2') {
    // Салтівська
    d = `M 880 110 L 630 410 L 550 440 L 490 530`;
  } else if (line.id === 'route-metro-3') {
    // Олексіївська
    d = `M 330 110 L 490 350 L 510 440 L 590 520 L 570 620 L 510 700`;
  } else {
    d = stations.map((s, i) => `${i === 0 ? 'M' : 'L'} ${s.point.x} ${s.point.y}`).join(' ');
  }

  const pFirst = stations[0].point;
  const pLast = stations[stations.length - 1].point;

  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke={line.color}
        strokeWidth={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Офіційні T-подібні заглушки на кінцевих станціях */}
      {line.id === 'route-metro-1' && (
        <>
          <line x1={120} y1={466} x2={120} y2={494} stroke={line.color} strokeWidth={6} strokeLinecap="round" />
          <line x1={1110} y1={996} x2={1110} y2={1024} stroke={line.color} strokeWidth={6} strokeLinecap="round" />
        </>
      )}
      {line.id === 'route-metro-2' && (
        <line x1={pFirst.x - 9} y1={pFirst.y - 9} x2={pFirst.x + 9} y2={pFirst.y + 9} stroke={line.color} strokeWidth={6} strokeLinecap="round" />
      )}
      {line.id === 'route-metro-3' && (
        <>
          <line x1={pFirst.x - 9} y1={pFirst.y - 9} x2={pFirst.x + 9} y2={pFirst.y + 9} stroke={line.color} strokeWidth={6} strokeLinecap="round" />
          <line x1={pLast.x - 9} y1={pLast.y - 9} x2={pLast.x + 9} y2={pLast.y + 9} stroke={line.color} strokeWidth={6} strokeLinecap="round" />
        </>
      )}
    </g>
  );
}

function InterchangeCapsule({ s1, s2 }: { s1: SchematicStation; s2: SchematicStation }) {
  const dx = s2.point.x - s1.point.x;
  const dy = s2.point.y - s1.point.y;
  const dist = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return (
    <g transform={`translate(${s1.point.x}, ${s1.point.y}) rotate(${angle})`}>
      <rect
        x={-9}
        y={-11}
        width={dist + 18}
        height={22}
        rx={11}
        fill="#FFFFFF"
        stroke="#111827"
        strokeWidth={3.5}
      />
    </g>
  );
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
  const offsetX = station.labelOffset?.x ?? 0;
  const offsetY = station.labelOffset?.y ?? -16;

  return (
    <g
      transform={`translate(${station.point.x}, ${station.point.y})`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="cursor-pointer"
    >
      {/* Велика прозора зона натискання для мобільних */}
      <circle r={22} fill="transparent" />

      {/* Маркер станції */}
      <circle
        r={isInterchange ? 6.5 : 5.5}
        fill="#FFFFFF"
        stroke={color}
        strokeWidth={3.5}
      />
      {selected && (
        <circle r={isInterchange ? 13 : 11} fill="none" stroke="#C6A552" strokeWidth={3} className="animate-pulse" />
      )}

      {/* Текст назви станції (Українська + English) */}
      <g transform={`translate(${offsetX}, ${offsetY})`} className="pointer-events-none select-none">
        <text
          x={0}
          y={0}
          textAnchor={offsetX > 0 ? 'start' : offsetX < 0 ? 'end' : 'middle'}
          className="font-display font-extrabold"
          fontSize={13}
          fill="#111827"
          style={{ paintOrder: 'stroke', stroke: '#FFFFFF', strokeWidth: 3.5, strokeLinejoin: 'round' }}
        >
          {station.name}
        </text>
        <text
          x={0}
          y={12}
          textAnchor={offsetX > 0 ? 'start' : offsetX < 0 ? 'end' : 'middle'}
          className="font-sans font-medium"
          fontSize={9.5}
          fill="#6B7280"
          style={{ paintOrder: 'stroke', stroke: '#FFFFFF', strokeWidth: 2.5, strokeLinejoin: 'round' }}
        >
          {station.nameEn}
        </text>
      </g>
    </g>
  );
}

function TrainMarker({ train, selected, onClick }: { train: LiveMetroTrain; selected: boolean; onClick: () => void }) {
  const spriteSrc = TRAIN_SPRITES[train.lineId] ?? assetUrl('/sprites/metro-red-line.jpg');
  const isDwell = train.phase === 'dwell';
  const facingLeft = train.headingDeg > 90 && train.headingDeg < 270;
  const size = selected ? 32 : 24;
  const clipId = `clip-${train.id.replace(/[^a-zA-Z0-9-_]/g, '')}`;

  return (
    <g
      transform={`translate(${train.point.x}, ${train.point.y})`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="cursor-pointer"
      style={{ transition: 'transform 300ms linear' }}
    >
      {/* Прозора зона для легкого тапа */}
      <circle r={24} fill="transparent" />

      <circle r={size / 2 + 3} fill={train.lineColor} stroke="#FFFFFF" strokeWidth={2.5} className="shadow-md" />
      <clipPath id={clipId}>
        <circle r={size / 2 - 1} />
      </clipPath>
      <image
        href={spriteSrc}
        x={-size / 2}
        y={-size / 2}
        width={size}
        height={size}
        clipPath={`url(#${clipId})`}
        preserveAspectRatio="xMidYMid slice"
        transform={facingLeft ? 'scale(-1,1)' : undefined}
        opacity={isDwell ? 0.85 : 1}
      />
      {isDwell && <circle r={size / 2 + 4} fill="none" stroke="#C6A552" strokeWidth={2.5} className="animate-ping" />}
    </g>
  );
}

function ZoomButton({ label, onClick, small }: { label: string; onClick: () => void; small?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex items-center justify-center rounded-full border border-black/10 bg-white/90 font-display font-bold text-gray-800 shadow-lg transition-transform active:scale-95 hover:bg-white',
        small ? 'h-8 w-8 text-sm' : 'h-10 w-10 text-xl'
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
        <span className="h-3.5 w-3.5 rounded-full ring-2 ring-white/20" style={{ backgroundColor: train.lineColor }} />
        <span className="font-display text-base font-bold text-white">{train.lineNumber} лінія</span>
        <span className="text-sm text-white/70">{directionLabel}</span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12px]">
        <dt className="text-white/50">Поточна станція</dt>
        <dd className="text-right font-medium text-white/90">
          {train.phase === 'dwell' ? train.nextStation.name : train.previousStation.name}
        </dd>
        <dt className="text-white/50">Наступна станція</dt>
        <dd className="text-right font-medium text-white/90">{train.nextStation.name}</dd>
        <dt className="text-white/50">Статус руху</dt>
        <dd className="text-right font-medium text-white/90">
          {train.phase === 'dwell' ? 'зупинка · двері відкриті' : `у дорозі · ≈ ${speedKmh} км/год`}
        </dd>
        <dt className="text-white/50">Прибуття на {train.nextStation.name}</dt>
        <dd className="text-right font-bold text-mint">
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
            className="h-16 w-20 shrink-0 rounded-lg object-cover shadow-md ring-1 ring-white/15"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="font-display text-base font-extrabold text-white">{station.name}</div>
          <div className="text-[11px] text-white/60">{station.nameEn}</div>
          {station.interchangeWith?.length ? (
            <p className="mt-1 text-[11px] font-semibold text-gold-light">Пересадочний вузол</p>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-1.5">
        {arrivals.length === 0 && <p className="text-[12px] text-white/50">Найближчим часом потягів немає.</p>}
        {arrivals.map((a, i) => (
          <div key={`${a.lineNumber}-${a.headsign}-${i}`} className="flex items-center justify-between rounded-lg bg-white/10 px-2.5 py-1.5 text-[12px]">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: a.lineColor }} />
              <span className="text-white/90">{a.lineNumber} → {a.headsign}</span>
            </div>
            <span className="font-bold text-mint">{formatEtaCountdown(a.etaSec, nowSec)}</span>
          </div>
        ))}
      </div>

      {timetable.length > 0 && (
        <div className="mt-3 border-t border-white/10 pt-2">
          <button
            type="button"
            onClick={() => setShowFullTimetable((v) => !v)}
            className="flex w-full items-center justify-between text-[12px] font-medium text-white/70 hover:text-white"
          >
            <span>
              Графік руху · {dayType === 'weekday' ? 'будній день' : 'вихідний'}
            </span>
            <span className="text-white/40">{showFullTimetable ? '▲' : '▼'}</span>
          </button>

          {showFullTimetable && (
            <div className="mt-2 max-h-44 overflow-y-auto pr-1">
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
          <span key={i} className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] tabular-nums text-white/80">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function InfoCardShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="absolute inset-x-3 bottom-3 z-30 animate-slide-up rounded-2xl border border-white/15 bg-black/85 p-3.5 shadow-2xl backdrop-blur-xl">
      <button type="button" onClick={onClose} className="absolute right-3 top-3 text-white/50 hover:text-white" aria-label="Закрити">
        ✕
      </button>
      {children}
    </div>
  );
}
