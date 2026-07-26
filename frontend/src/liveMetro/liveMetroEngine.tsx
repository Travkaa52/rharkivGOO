import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  SCHEMATIC_LINES,
  type SchematicStation,
  type LiveMetroDayType
} from '@/liveMetro/schematicData';
import {
  getActiveTrains,
  getUpcomingArrivalsForStation,
  getStationDayTimetable,
  secOfDay,
  dayTypeOf,
  formatEtaCountdown,
  formatEtaClock,
  type LiveMetroTrain,
  type UpcomingDeparture,
  type StationDayTimetableEntry
} from '@/liveMetro/liveMetroEngine';

export const LiveMetroMap: React.FC = () => {
  // --- Стан та посилання ---
  const [now, setNow] = useState<Date>(new Date());
  const [trains, setTrains] = useState<LiveMetroTrain[]>([]);
  const [selectedStation, setSelectedStation] = useState<SchematicStation | null>(null);
  const [selectedTrain, setSelectedTrain] = useState<LiveMetroTrain | null>(null);
  const [activeLineId, setActiveLineId] = useState<string | null>(null);
  const [showTimetableTab, setShowTimetableTab] = useState<'arrivals' | 'timetable'>('arrivals');

  // Визначення автоматичного дня та можливість ручного вибору користувачем
  const autoDayType = useMemo(() => dayTypeOf(now), [now]);
  const [manualDayType, setManualDayType] = useState<LiveMetroDayType | null>(null);

  // Активний день (ручний або автоматичний)
  const activeDayType = manualDayType ?? autoDayType;

  const animFrameRef = useRef<number | null>(null);

  // --- Цикл анімації реального часу (60 FPS для плавності потягів) ---
  useEffect(() => {
    let lastUpdate = 0;

    const tick = (timestamp: number) => {
      if (timestamp - lastUpdate > 50) {
        const currentDate = new Date();
        setNow(currentDate);
        setTrains(getActiveTrains(currentDate));
        lastUpdate = timestamp;
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const nowSec = useMemo(() => secOfDay(now), [now]);

  // --- Найближчі прибуття для обраної станції ---
  const upcomingArrivals: UpcomingDeparture[] = useMemo(() => {
    if (!selectedStation) return [];
    return getUpcomingArrivalsForStation(selectedStation.id, now, 3);
  }, [selectedStation, now]);

  // --- Графік на день для обраної станції ---
  const stationTimetable: StationDayTimetableEntry[] = useMemo(() => {
    if (!selectedStation) return [];
    return getStationDayTimetable(selectedStation.id, activeDayType);
  }, [selectedStation, activeDayType]);

  // Генерація SVG Path для ліній
  const getLinePathD = (stations: SchematicStation[]) => {
    return stations.reduce((acc, st, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${st.point.x} ${st.point.y}`, '');
  };

  // Позначка фази потяга українською
  const getPhaseLabel = (phase: LiveMetroTrain['phase']) => {
    switch (phase) {
      case 'dwell': return 'На станції (посадка)';
      case 'accelerating': return 'Розгін';
      case 'cruising': return 'У дорозі';
      case 'braking': return 'Прибуття (гальмування)';
      default: return '';
    }
  };

  // Перевірка, чи день є вихідним (враховуємо можливі назви типу 'weekend' чи 'holiday')
  const isWeekend = activeDayType === 'weekend' || (activeDayType as string) === 'holiday';

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', backgroundColor: '#0B0F17', color: '#F3F4F6', overflow: 'hidden', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* 1. ВЕРХНІЙ ЛЕВИЙ КУТОК: Логотип, Годинник, Статус та Вибір Типу Дня */}
      <div style={{
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        maxWidth: 540
      }}>
        {/* Головна інфо-шапка */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          backgroundColor: 'rgba(15, 23, 42, 0.88)',
          padding: '10px 16px',
          borderRadius: 14,
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
        }}>
          <img 
            src="/icons/metro-logo.svg" 
            alt="Харківський Метрополітен" 
            style={{ width: 40, height: 40, objectFit: 'contain' }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '0.3px', color: '#FFFFFF' }}>
              Харківський Метрополітен
            </div>
            <div style={{ fontSize: 12, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#10B981', fontWeight: 600 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#10B981', boxShadow: '0 0 8px #10B981' }}></span>
                ЖИВЕ МЕТРО
              </span>
              <span>•</span>
              <span style={{ color: '#E5E7EB', fontFamily: 'monospace', fontSize: 13 }}>
                {now.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span>•</span>
              <span>Активно потягів: <strong style={{ color: '#FFF' }}>{trains.length}</strong></span>
            </div>
          </div>
        </div>

        {/* ПАНЕЛЬ ВИБОРУ ТИПУ ДНЯ ТА ПОВІДОМЛЕННЯ ПРО ІНТЕРВАЛ */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          backgroundColor: 'rgba(15, 23, 42, 0.88)',
          padding: '10px 14px',
          borderRadius: 14,
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
        }}>
          {/* Перемикач Будній / Вихідний */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600, marginRight: 2 }}>
              Режим розкладу:
            </span>

            <button
              onClick={() => setManualDayType('weekday' as LiveMetroDayType)}
              style={{
                backgroundColor: !isWeekend ? '#2563EB' : 'rgba(255, 255, 255, 0.06)',
                color: !isWeekend ? '#FFFFFF' : '#9CA3AF',
                border: !isWeekend ? '1px solid #60A5FA' : '1px solid rgba(255, 255, 255, 0.1)',
                padding: '5px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              💼 Будній день
            </button>

            <button
              onClick={() => setManualDayType('weekend' as LiveMetroDayType)}
              style={{
                backgroundColor: isWeekend ? '#D97706' : 'rgba(255, 255, 255, 0.06)',
                color: isWeekend ? '#FFFFFF' : '#9CA3AF',
                border: isWeekend ? '1px solid #FBBF24' : '1px solid rgba(255, 255, 255, 0.1)',
                padding: '5px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              ☕ Вихідний день
            </button>
          </div>

          {/* Інформаційне повідомлення біля кнопок */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            backgroundColor: isWeekend ? 'rgba(217, 119, 6, 0.15)' : 'rgba(37, 99, 235, 0.15)',
            borderLeft: `3px solid ${isWeekend ? '#F59E0B' : '#3B82F6'}`,
            padding: '8px 10px',
            borderRadius: '0 8px 8px 0',
            fontSize: 12,
            lineHeight: '1.4',
            color: '#F3F4F6',
            transition: 'all 0.3s ease'
          }}>
            <span style={{ fontSize: 14 }}>💡</span>
            <div>
              <strong>Зверніть увагу!</strong> Інтервал руху потягів між станціями у{' '}
              <span style={{ color: isWeekend ? '#FBBF24' : '#60A5FA', fontWeight: 700 }}>
                {isWeekend ? 'вихідний день складає 20 хв' : 'будній день складає 10 хв'}
              </span>.
            </div>
          </div>
        </div>
      </div>

      {/* 2. ВЕРХНІЙ ПРАВИЙ КУТОК: Фільтр ліній */}
      <div style={{
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 20,
        display: 'flex',
        gap: 8,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        padding: 6,
        borderRadius: 12,
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <button
          onClick={() => setActiveLineId(null)}
          style={{
            backgroundColor: activeLineId === null ? '#3B82F6' : 'transparent',
            color: '#FFF',
            border: 'none',
            padding: '6px 12px',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            transition: 'all 0.2s'
          }}
        >
          Усі лінії
        </button>
        {SCHEMATIC_LINES.map((line) => (
          <button
            key={line.id}
            onClick={() => setActiveLineId(activeLineId === line.id ? null : line.id)}
            style={{
              backgroundColor: activeLineId === line.id ? line.color : 'transparent',
              color: '#FFF',
              border: activeLineId === line.id ? 'none' : `1px solid ${line.color}66`,
              padding: '6px 12px',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: line.color }}></span>
            {line.number}
          </button>
        ))}
      </div>

      {/* 3. СХЕМА МЕТРО (SVG) */}
      <svg viewBox="0 0 1200 1000" style={{ width: '100%', height: '100%', cursor: 'grab' }}>
        <defs>
          <filter id="glow-line" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-train" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ПЕРЕСАДОЧНІ ВУЗЛИ */}
        <g id="interchanges" opacity={0.7}>
          {/* Держпром (Л3) <-> Університет (Л2) */}
          <line x1={555} y1={430} x2={560} y2={460} stroke="#FFFFFF" strokeWidth={12} strokeLinecap="round" />
          <line x1={555} y1={430} x2={560} y2={460} stroke="#0B0F17" strokeWidth={6} strokeLinecap="round" />

          {/* Майдан Конституції (Л1) <-> Історичний музей (Л2) */}
          <line x1={330} y1={540} x2={390} y2={560} stroke="#FFFFFF" strokeWidth={12} strokeLinecap="round" />
          <line x1={330} y1={540} x2={390} y2={560} stroke="#0B0F17" strokeWidth={6} strokeLinecap="round" />

          {/* Спортивна (Л1) <-> Метробудівників (Л3) */}
          <line x1={430} y1={660} x2={420} y2={660} stroke="#FFFFFF" strokeWidth={12} strokeLinecap="round" />
          <line x1={430} y1={660} x2={420} y2={660} stroke="#0B0F17" strokeWidth={6} strokeLinecap="round" />
        </g>

        {/* ЛІНІЇ МЕТРО */}
        {SCHEMATIC_LINES.map((line) => {
          const isDimmed = activeLineId && activeLineId !== line.id;
          const pathD = getLinePathD(line.stations);

          return (
            <g key={line.id} opacity={isDimmed ? 0.15 : 1} style={{ transition: 'opacity 0.3s' }}>
              <path d={pathD} fill="none" stroke={line.color} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" opacity={0.3} filter="url(#glow-line)" />
              <path d={pathD} fill="none" stroke={line.color} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          );
        })}

        {/* СТАНЦІЇ */}
        {SCHEMATIC_LINES.map((line) => {
          const isDimmed = activeLineId && activeLineId !== line.id;

          return line.stations.map((station) => {
            const isSelected = selectedStation?.id === station.id;
            const isInterchange = Boolean(station.interchangeWith?.length);

            return (
              <g
                key={station.id}
                transform={`translate(${station.point.x}, ${station.point.y})`}
                onClick={() => {
                  setSelectedStation(station);
                  setSelectedTrain(null);
                }}
                style={{ cursor: 'pointer' }}
                opacity={isDimmed ? 0.2 : 1}
              >
                {isSelected && (
                  <circle r={14} fill="none" stroke="#60A5FA" strokeWidth={3} filter="url(#glow-train)">
                    <animate attributeName="r" values="12;16;12" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}

                <circle
                  r={isInterchange ? 6.5 : 4.5}
                  fill="#FFFFFF"
                  stroke={line.color}
                  strokeWidth={isInterchange ? 3 : 2}
                />

                {isInterchange && (
                  <circle r={9} fill="none" stroke="#FFFFFF" strokeWidth={1.2} opacity={0.8} />
                )}

                <text
                  x={14}
                  y={4}
                  fill={isSelected ? '#60A5FA' : '#E5E7EB'}
                  fontSize={11}
                  fontWeight={isSelected || isInterchange ? 700 : 500}
                  style={{ userSelect: 'none', pointerEvents: 'none', letterSpacing: '0.2px' }}
                >
                  {station.name}
                </text>
              </g>
            );
          });
        })}

        {/* 4. РЕАЛЬНІ ПОТЯГИ */}
        {trains.map((train) => {
          if (activeLineId && activeLineId !== train.lineId) return null;
          const isSelected = selectedTrain?.id === train.id;

          return (
            <g
              key={train.id}
              transform={`translate(${train.point.x}, ${train.point.y})`}
              onClick={() => {
                setSelectedTrain(train);
                setSelectedStation(null);
              }}
              style={{ cursor: 'pointer', transition: 'transform 0.05s linear' }}
            >
              {train.phase === 'dwell' && (
                <circle r={12} fill={train.lineColor} opacity={0.4}>
                  <animate attributeName="r" values="8;18;8" dur="1.2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0;0.6" dur="1.2s" repeatCount="indefinite" />
                </circle>
              )}

              <g transform={`rotate(${train.headingDeg})`}>
                <rect
                  x={-6}
                  y={-10}
                  width={12}
                  height={20}
                  rx={5}
                  fill={train.lineColor}
                  stroke="#FFFFFF"
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  filter="url(#glow-train)"
                />
                <path d="M -3 -8 L 0 -12 L 3 -8 Z" fill="#FFFFFF" />
              </g>

              <text
                x={12}
                y={-10}
                fill="#FFFFFF"
                fontSize={9}
                fontWeight={700}
                style={{ userSelect: 'none', pointerEvents: 'none', textShadow: '0 1px 4px #000' }}
              >
                ➔ {train.headsign}
              </text>
            </g>
          );
        })}
      </svg>

      {/* 5. КАРТКА ОБРАНОЇ СТАНЦІЇ ТА ТАБЛО ПРИБУТТЯ */}
      {selectedStation && (
        <div style={{
          position: 'absolute',
          bottom: 24,
          left: 24,
          zIndex: 30,
          backgroundColor: 'rgba(15, 23, 42, 0.94)',
          padding: 20,
          borderRadius: 16,
          border: '1px solid rgba(255, 255, 255, 0.15)',
          minWidth: 340,
          maxWidth: 420,
          backdropFilter: 'blur(16px)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#FFF' }}>{selectedStation.name}</h2>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Станція метрополітену</div>
            </div>
            <button
              onClick={() => setSelectedStation(null)}
              style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: 20, padding: 0 }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: 'flex', gap: 6, marginBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8 }}>
            <button
              onClick={() => setShowTimetableTab('arrivals')}
              style={{
                background: showTimetableTab === 'arrivals' ? '#3B82F6' : 'transparent',
                color: '#FFF',
                border: 'none',
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 12,
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              ⏱ Найближчі потяги
            </button>
            <button
              onClick={() => setShowTimetableTab('timetable')}
              style={{
                background: showTimetableTab === 'timetable' ? '#3B82F6' : 'transparent',
                color: '#FFF',
                border: 'none',
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 12,
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              📅 Повний графік ({isWeekend ? 'Вихідний' : 'Будній'})
            </button>
          </div>

          {/* Вкладка 1: Табло найближчих прибуть */}
          {showTimetableTab === 'arrivals' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
              {upcomingArrivals.length === 0 ? (
                <div style={{ fontSize: 13, color: '#9CA3AF', fontStyle: 'italic', padding: '10px 0' }}>
                  На сьогодні рейсів більше немає або метро зачинено.
                </div>
              ) : (
                upcomingArrivals.map((arr, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      padding: '8px 12px',
                      borderRadius: 8,
                      borderLeft: `4px solid ${arr.lineColor}`
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>
                        до ст. {arr.headsign}
                      </div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                        {arr.lineNumber} • ЧАС: {formatEtaClock(arr.etaSec)}
                      </div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#10B981', fontFamily: 'monospace' }}>
                      {formatEtaCountdown(arr.etaSec, nowSec)}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Вкладка 2: Денний розклад */}
          {showTimetableTab === 'timetable' && (
            <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stationTimetable.map((entry, idx) => (
                <div key={idx} style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: entry.lineColor, marginBottom: 4 }}>
                    Напрямок: {entry.headsign}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {entry.times.map((t, tidx) => (
                      <span key={tidx} style={{ fontSize: 11, fontFamily: 'monospace', backgroundColor: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 4 }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. КАРТКА ОБРАНОГО ПОТЯГА */}
      {selectedTrain && (
        <div style={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          zIndex: 30,
          backgroundColor: 'rgba(15, 23, 42, 0.94)',
          padding: 18,
          borderRadius: 16,
          border: `1px solid ${selectedTrain.lineColor}`,
          minWidth: 280,
          backdropFilter: 'blur(16px)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: selectedTrain.lineColor, textTransform: 'uppercase' }}>
              Потяг {selectedTrain.lineNumber}
            </span>
            <button onClick={() => setSelectedTrain(null)} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>✕</button>
          </div>

          <h3 style={{ margin: '0 0 6px 0', fontSize: 16, color: '#FFF' }}>
            Прямує до: {selectedTrain.headsign}
          </h3>

          <div style={{ fontSize: 13, color: '#D1D5DB', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
            <div>Статус: <strong style={{ color: '#60A5FA' }}>{getPhaseLabel(selectedTrain.phase)}</strong></div>
            <div>Наступна станція: <strong>{selectedTrain.nextStation.name}</strong></div>
            <div>Прибуття на наступну: <strong style={{ color: '#10B981' }}>{formatEtaClock(selectedTrain.etaNextStationSec)}</strong></div>
            <div>Кінцева станція: <strong>{formatEtaClock(selectedTrain.etaTerminusSec)}</strong></div>
          </div>
        </div>
      )}

    </div>
  );
};
