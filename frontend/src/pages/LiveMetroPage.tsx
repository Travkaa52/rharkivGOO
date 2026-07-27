import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useLiveMetroTrains } from '../hooks/useLiveMetroTrains';
import { BUILT_LINES, STATIONS, METRO_LINES, MetroStation, secOfDay } from '../data/metroData';

const VIEW_W = 1000;
const VIEW_H = 800;

interface Transform {
  x: number;
  y: number;
  scale: number;
}

export const LiveMetroPage: React.FC = () => {
  // 1. Отримуємо дані з хука. Працюємо як з об'єктом { trains }, так і з масивом напряму
  const liveTrainsResult = useLiveMetroTrains();
  
  const trains = useMemo(() => {
    if (Array.isArray(liveTrainsResult)) {
      return liveTrainsResult;
    }
    if (liveTrainsResult && Array.isArray((liveTrainsResult as any).trains)) {
      return (liveTrainsResult as any).trains;
    }
    return [];
  }, [liveTrainsResult]);

  const [selectedTrainId, setSelectedTrainId] = useState<string | null>(null);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [nowSec, setNowSec] = useState<number>(() => secOfDay(new Date()));

  // Оновлюємо поточний час щосекунди
  useEffect(() => {
    const timer = setInterval(() => {
      setNowSec(secOfDay(new Date()));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Трансформація (pan/zoom)
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const transformRef = useRef<Transform>(transform);
  transformRef.current = transform;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const activePointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchState = useRef<{ dist: number; scale: number; center: { x: number; y: number } } | null>(null);

  // Знаходимо обраний потяг (з типізацією t)
  const selectedTrain = useMemo(() => {
    if (!selectedTrainId) return null;
    return trains.find((t: any) => t.id === selectedTrainId) || null;
  }, [trains, selectedTrainId]);

  // Знаходимо обрану станцію
  const selectedStation = useMemo(() => {
    if (!selectedStationId) return null;
    return STATIONS.find((s: MetroStation) => s.id === selectedStationId) || null;
  }, [selectedStationId]);

  const clampScale = (s: number) => Math.min(Math.max(s, 0.6), 4);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture(e.pointerId);

    if (activePointers.current.size === 1) {
      isDraggingRef.current = false;
      dragStartRef.current = {
        x: e.clientX - transformRef.current.x,
        y: e.clientY - transformRef.current.y,
      };
    } else if (activePointers.current.size === 2) {
      const pts = Array.from(activePointers.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchState.current = {
        dist,
        scale: transformRef.current.scale,
        center: { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 },
      };
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activePointers.current.has(e.pointerId)) return;
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointers.current.size === 1) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      if (Math.hypot(dx - transformRef.current.x, dy - transformRef.current.y) > 3) {
        isDraggingRef.current = true;
      }

      setTransform((t) => ({ ...t, x: dx, y: dy }));
    } else if (activePointers.current.size === 2 && pinchState.current) {
      const pts = Array.from(activePointers.current.values());
      const newDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const ratio = newDist / pinchState.current.dist;
      const currentPinch = pinchState.current;

      setTransform((t) => ({
        ...t,
        scale: clampScale(currentPinch.scale * ratio),
      }));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    activePointers.current.delete(e.pointerId);
    if (activePointers.current.size < 2) {
      pinchState.current = null;
    }
  };

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;

    setTransform((t) => {
      const newScale = clampScale(t.scale * zoomFactor);
      if (!containerRef.current) return { ...t, scale: newScale };

      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newX = mouseX - (mouseX - t.x) * (newScale / t.scale);
      const newY = mouseY - (mouseY - t.y) * (newScale / t.scale);

      return { x: newX, y: newY, scale: newScale };
    });
  }, []);

  return (
    <div className="relative w-full h-screen bg-[#0B120F] overflow-hidden select-none font-sans text-white">
      {/* Інтерактивна карта */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
      >
        <svg
          className="w-full h-full"
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Фоновий прямокутник для скидання виділення при кліку поза об'єктами */}
          <rect
            width={VIEW_W}
            height={VIEW_H}
            fill="transparent"
            onClick={() => {
              if (!isDraggingRef.current) {
                setSelectedTrainId(null);
                setSelectedStationId(null);
              }
            }}
          />

          <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
            {/* Лінії метро */}
            {BUILT_LINES.map((lineData) => (
              <LineTracks key={lineData.id} line={lineData} />
            ))}

            {/* Станції */}
            {STATIONS.map((station) => (
              <StationMarker
                key={station.id}
                station={station}
                isSelected={selectedStationId === station.id}
                onSelect={() => {
                  if (!isDraggingRef.current) {
                    setSelectedStationId(station.id);
                    setSelectedTrainId(null);
                  }
                }}
              />
            ))}

            {/* Потяги (з безпечним .map) */}
            {trains.map((train: any) => (
              <TrainMarker
                key={train.id}
                train={train}
                isSelected={selectedTrainId === train.id}
                onSelect={() => {
                  if (!isDraggingRef.current) {
                    setSelectedTrainId(train.id);
                    setSelectedStationId(null);
                  }
                }}
              />
            ))}
          </g>
        </svg>
      </div>

      {/* Інформаційні картки */}
      {selectedTrain && (
        <TrainInfoCard
          train={selectedTrain}
          nowSec={nowSec}
          onClose={() => setSelectedTrainId(null)}
        />
      )}

      {selectedStation && (
        <StationInfoCard
          station={selectedStation}
          onClose={() => setSelectedStationId(null)}
        />
      )}
    </div>
  );
};

// --- Допоміжні компоненти ---

// Виправлено типізацію line
function LineTracks({ line }: { line: (typeof BUILT_LINES)[number] }) {
  const lineInfo = METRO_LINES.find((l) => l.id === line.id);
  const strokeColor = lineInfo?.color || '#888';

  return (
    <g>
      <path
        d={line.path}
        fill="none"
        stroke={strokeColor}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
    </g>
  );
}

function StationMarker({
  station,
  isSelected,
  onSelect,
}: {
  station: MetroStation;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <g
      transform={`translate(${station.x}, ${station.y})`}
      className="cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <circle
        r={isSelected ? '9' : '6'}
        fill="#0B120F"
        stroke={isSelected ? '#34D399' : '#FFFFFF'}
        strokeWidth={isSelected ? '3' : '2'}
        className="transition-all duration-150"
      />
      <circle r={isSelected ? '4' : '2.5'} fill={isSelected ? '#34D399' : '#FFFFFF'} />
      
      {/* Виправлено stroke на темно-зелений/чорний фон #0B120F для чіткості контуру */}
      <text
        y="18"
        textAnchor="middle"
        fontSize="11"
        fontWeight={isSelected ? 'bold' : 'normal'}
        fill={isSelected ? '#34D399' : '#F5F7F6'}
        style={{
          paintOrder: 'stroke',
          stroke: '#0B120F',
          strokeWidth: 3.5,
          strokeLinejoin: 'round',
        }}
      >
        {station.name}
      </text>
    </g>
  );
}

function TrainMarker({
  train,
  isSelected,
  onSelect,
}: {
  train: any;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const lineInfo = METRO_LINES.find((l) => l.id === train.lineId);
  const color = lineInfo?.color || '#34D399';

  return (
    <g
      transform={`translate(${train.x}, ${train.y})`}
      className="cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {isSelected && (
        <circle r="16" fill={color} opacity="0.25" className="animate-ping" />
      )}
      <circle
        r="10"
        fill={color}
        stroke="#FFFFFF"
        strokeWidth="2"
        className="shadow-lg transition-transform duration-200 hover:scale-125"
      />
      <text
        y="3.5"
        textAnchor="middle"
        fontSize="9"
        fontWeight="bold"
        fill="#FFFFFF"
      >
        {train.label || 'M'}
      </text>
    </g>
  );
}

function TrainInfoCard({
  train,
  nowSec,
  onClose,
}: {
  train: any;
  nowSec: number;
  onClose: () => void;
}) {
  return (
    <div className="absolute bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-80 bg-[#16221D] border border-[#24352E] p-4 rounded-xl shadow-2xl backdrop-blur-md">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-lg text-emerald-400">
          Потяг {train.label || train.id}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-lg leading-none p-1"
        >
          ✕
        </button>
      </div>
      <p className="text-sm text-gray-300">
        Напрямок: <span className="font-medium text-white">{train.destination || 'В дорозі'}</span>
      </p>
      {train.nextStation && (
        <p className="text-sm text-gray-300 mt-1">
          Наступна станція: <span className="font-medium text-white">{train.nextStation}</span>
        </p>
      )}
      {train.etaSec && (
        <p className="text-xs text-emerald-400/80 mt-2">
          Прибуття через: {Math.max(0, train.etaSec - nowSec)} сек.
        </p>
      )}
    </div>
  );
}

function StationInfoCard({
  station,
  onClose,
}: {
  station: MetroStation;
  onClose: () => void;
}) {
  return (
    <div className="absolute bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-80 bg-[#16221D] border border-[#24352E] p-4 rounded-xl shadow-2xl backdrop-blur-md">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-lg text-white">{station.name}</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-lg leading-none p-1"
        >
          ✕
        </button>
      </div>
      <p className="text-sm text-gray-300">
        Лінія: <span className="font-medium text-white">{station.lineId}</span>
      </p>
    </div>
  );
}
