import React, { useState, useEffect, useMemo } from 'react';
import {
  SCHEMATIC_LINES,
  SchematicStation,
  SchematicLine,
  LiveMetroDayType,
  DWELL_SEC
} from '../data/metroData'; // Укажите ваш путь к TS-файлу с данными

interface TrainPosition {
  lineId: string;
  color: string;
  x: number;
  y: number;
  direction: 'forward' | 'backward';
  nextStationName: string;
}

export const LiveMetroMap: React.FC = () => {
  const [selectedStation, setSelectedStation] = useState<SchematicStation | null>(null);
  const [activeLineId, setActiveLineId] = useState<string | null>(null);
  const [dayType, setDayType] = useState<LiveMetroDayType>('weekday');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [trains, setTrains] = useState<TrainPosition[]>([]);

  // Часы реального времени
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Вычисление всех станций для быстрого поиска
  const allStationsMap = useMemo(() => {
    const map = new Map<string, { station: SchematicStation; line: SchematicLine }>();
    SCHEMATIC_LINES.forEach((line) => {
      line.stations.forEach((st) => {
        map.set(st.id, { station: st, line });
      });
    });
    return map;
  }, []);

  // Расчет живых поездов на линиях на основе интервалов и таймингов
  useEffect(() => {
    const calculatedTrains: TrainPosition[] = [];
    const nowSec = currentTime.getHours() * 3600 + currentTime.getMinutes() * 60 + currentTime.getSeconds();

    SCHEMATIC_LINES.forEach((line) => {
      const intervalSec = (line.intervalMinutes[dayType] || 10) * 60;
      const totalLineTime = line.stations[line.stations.length - 1].arrivalOffsetSec;

      if (totalLineTime === 0) return;

      // Симуляция поездов для прямого и обратного направления
      ['forward', 'backward'].forEach((dir) => {
        const isForward = dir === 'forward';
        
        for (let offset = 0; offset < totalLineTime + intervalSec; offset += intervalSec) {
          const trainProgressSec = (nowSec + offset) % (totalLineTime + intervalSec);

          if (trainProgressSec <= totalLineTime) {
            // Находим сегмент между двумя станциями
            for (let i = 0; i < line.stations.length - 1; i++) {
              const stA = isForward ? line.stations[i] : line.stations[line.stations.length - 1 - i];
              const stB = isForward ? line.stations[i + 1] : line.stations[line.stations.length - 2 - i];

              const tA = isForward ? stA.arrivalOffsetSec : totalLineTime - stA.arrivalOffsetSec;
              const tB = isForward ? stB.arrivalOffsetSec : totalLineTime - stB.arrivalOffsetSec;

              const minT = Math.min(tA, tB);
              const maxT = Math.max(tA, tB);

              if (trainProgressSec >= minT && trainProgressSec <= maxT) {
                const ratio = maxT === minT ? 0 : (trainProgressSec - minT) / (maxT - minT);
                const x = stA.point.x + (stB.point.x - stA.point.x) * ratio;
                const y = stA.point.y + (stB.point.y - stA.point.y) * ratio;

                calculatedTrains.push({
                  lineId: line.id,
                  color: line.color,
                  x,
                  y,
                  direction: isForward ? 'forward' : 'backward',
                  nextStationName: stB.name
                });
                break;
              }
            }
          }
        }
      });
    });

    setTrains(calculatedTrains);
  }, [currentTime, dayType]);

  // Генерация точек для SVG Path линий
  const getLinePathD = (stations: SchematicStation[]) => {
    return stations.reduce((acc, st, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${st.point.x} ${st.point.y}`, '');
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', backgroundColor: '#111827', color: '#fff', overflow: 'hidden', fontFamily: 'sans-serif' }}>
      
      {/* ВЕРХНИЙ ЛЕВЫЙ УГОЛ: Логотип и заголовок */}
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, display: 'flex', alignItems: 'center', gap: 14, backgroundColor: 'rgba(17, 24, 39, 0.85)', padding: '12px 18px', borderRadius: 12, backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <img 
          src="/icons/metro-logo.svg" 
          alt="Логотип Харьковского Метрополитена" 
          style={{ width: 42, height: 42, objectFit: 'contain' }}
          onError={(e) => {
            // Резервная иконка, если SVG еще не добавлен в public/icons
            e.currentTarget.style.display = 'none';
          }}
        />
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 'bold', color: '#fff' }}>Харківський Метрополітен</h1>
          <div style={{ fontSize: 12, color: '#9CA3AF', display: 'flex', gap: 10, marginTop: 2 }}>
            <span>Живе метро</span>
            <span>•</span>
            <span style={{ color: '#3B82F6' }}>
              {currentTime.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      {/* ПАНЕЛЬ УПРАВЛЕНИЯ И ФИЛЬТРОВ */}
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10, display: 'flex', gap: 8 }}>
        <button
          onClick={() => setDayType(dayType === 'weekday' ? 'weekend' : 'weekday')}
          style={{ backgroundColor: '#1F2937', color: '#E5E7EB', border: '1px solid #374151', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
        >
          {dayType === 'weekday' ? '📅 Будні дні' : '🏖 Вихідні дні'}
        </button>
        <button
          onClick={() => setActiveLineId(null)}
          style={{ backgroundColor: activeLineId === null ? '#3B82F6' : '#1F2937', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
        >
          Усі лінії
        </button>
      </div>

      {/* SVG КАРТА (СХЕМА) */}
      <svg viewBox="0 0 1200 1000" style={{ width: '100%', height: '100%', cursor: 'grab' }}>
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. ПЕРЕСАДОЧНЫЕ УЗЛЫ (Капсулы между связями) */}
        <g id="interchanges" opacity={0.6}>
          {/* Держпром <-> Університет */}
          <line x1={555} y1={430} x2={560} y2={460} stroke="#FFF" strokeWidth={14} strokeLinecap="round" />
          <line x1={555} y1={430} x2={560} y2={460} stroke="#111827" strokeWidth={8} strokeLinecap="round" />

          {/* Майдан Конституції <-> Історичний музей */}
          <line x1={330} y1={540} x2={390} y2={560} stroke="#FFF" strokeWidth={14} strokeLinecap="round" />
          <line x1={330} y1={540} x2={390} y2={560} stroke="#111827" strokeWidth={8} strokeLinecap="round" />

          {/* Спортивна <-> Метробудівників */}
          <line x1={430} y1={660} x2={420} y2={660} stroke="#FFF" strokeWidth={14} strokeLinecap="round" />
          <line x1={430} y1={660} x2={420} y2={660} stroke="#111827" strokeWidth={8} strokeLinecap="round" />
        </g>

        {/* 2. ЛИНИИ МЕТРО */}
        {SCHEMATIC_LINES.map((line) => {
          const isDimmed = activeLineId && activeLineId !== line.id;
          return (
            <g key={line.id} opacity={isDimmed ? 0.2 : 1} style={{ transition: 'opacity 0.3s' }}>
              {/* Внешняя подсветка линии */}
              <path
                d={getLinePathD(line.stations)}
                fill="none"
                stroke={line.color}
                strokeWidth={12}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.3}
              />
              {/* Основная линия */}
              <path
                d={getLinePathD(line.stations)}
                fill="none"
                stroke={line.color}
                strokeWidth={7}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          );
        })}

        {/* 3. СТАНЦИИ */}
        {SCHEMATIC_LINES.map((line) => {
          const isDimmed = activeLineId && activeLineId !== line.id;
          return line.stations.map((station) => {
            const isSelected = selectedStation?.id === station.id;
            const isInterchange = Boolean(station.interchangeWith?.length);

            return (
              <g
                key={station.id}
                transform={`translate(${station.point.x}, ${station.point.y})`}
                onClick={() => setSelectedStation(station)}
                style={{ cursor: 'pointer' }}
                opacity={isDimmed ? 0.2 : 1}
              >
                {/* Внешнее кольцо выделения */}
                {isSelected && <circle r={14} fill="none" stroke="#60A5FA" strokeWidth={3} filter="url(#glow)" />}

                {/* Точка станции */}
                <circle
                  r={isInterchange ? 7 : 5}
                  fill="#FFF"
                  stroke={line.color}
                  strokeWidth={isInterchange ? 3 : 2.5}
                />

                {/* Название станции */}
                <text
                  x={12}
                  y={4}
                  fill={isSelected ? '#60A5FA' : '#E5E7EB'}
                  fontSize={12}
                  fontWeight={isSelected || isInterchange ? 'bold' : 'normal'}
                  style={{ userSelect: 'none', pointerEvents: 'none' }}
                >
                  {station.name}
                </text>
              </g>
            );
          });
        })}

        {/* 4. ЖИВЫЕ ПОЕЗДА В РЕАЛЬНОМ ВРЕМЕНИ */}
        {trains.map((train, idx) => {
          if (activeLineId && activeLineId !== train.lineId) return null;
          return (
            <g key={`train-${idx}`} transform={`translate(${train.x}, ${train.y})`}>
              <circle r={8} fill="#FFF" filter="url(#glow)" />
              <circle r={5} fill={train.color} />
            </g>
          );
        })}
      </svg>

      {/* КАРТОЧКА ВЫБРАННОЙ СТАНЦИИ */}
      {selectedStation && (
        <div style={{ position: 'absolute', bottom: 25, left: 25, zIndex: 20, backgroundColor: '#1F2937', padding: '16px 20px', borderRadius: 12, border: '1px solid #374151', minWidth: 280, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, color: '#FFF' }}>{selectedStation.name}</h3>
            <button onClick={() => setSelectedStation(null)} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: 18 }}>×</button>
          </div>

          {(() => {
            const data = allStationsMap.get(selectedStation.id);
            if (!data) return null;
            const { line } = data;

            return (
              <div style={{ marginTop: 12, fontSize: 13, color: '#D1D5DB' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: line.color, display: 'inline-block' }}></span>
                  <span>{line.name} ({line.number})</span>
                </div>

                <div style={{ backgroundColor: '#111827', padding: 10, borderRadius: 8, marginTop: 8 }}>
                  <div>Интервал: <b>{line.intervalMinutes[dayType]} хв</b></div>
                  <div>Первый рейс: <b>{line.firstDepartureForward[dayType]}</b></div>
                  <div>Последний рейс: <b>{line.lastDeparture}</b></div>
                </div>

                {selectedStation.interchangeWith && (
                  <div style={{ marginTop: 10, color: '#60A5FA', fontSize: 12 }}>
                    🔄 Пересадка на: {selectedStation.interchangeWith.map(id => allStationsMap.get(id)?.station.name).join(', ')}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
