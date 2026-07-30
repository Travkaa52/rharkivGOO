import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Star, 
  ChevronRight, 
  Map as MapIcon, 
  Navigation, 
  Settings, 
  Plus, 
  ArrowUpRight, 
  AlertCircle,
  Search as SearchIcon,
  X,
  History,
  Clock,
  MapPin,
  Compass,
  CheckCircle2,
  ExternalLink,
  AlertTriangle,
  TrainTrack,
  Zap,
  TrendingUp,
  Sunrise,
  Sunset,
  Moon
} from 'lucide-react';
import { ReportDelayModal } from '@/components/ReportDelayModal';
import { RouteDetailModal } from '@/components/RouteDetailModal';
import { TrainWishSprite } from '@/components/TrainWishSprite';
import { NotificationsBell, NotificationsSection } from '@/components/NotificationsSection';
import { localRoutes, localStops } from '@/data/localData';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useHistoryStore } from '@/store/useHistoryStore';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useAuthStore } from '@/store/useAuthStore';
import { useToastStore } from '@/store/useToastStore';
import { assetUrl } from '@/lib/assetUrl';
import {
  BUILT_LINES,
  getActiveTrains,
  getUpcomingArrivalsForStation,
  formatEtaCountdown
} from '@/liveMetro/liveMetroEngine';
import { METRO_STATION_GEO } from '@/liveMetro/metroStationsGeo';
import type { TransportKind, TransportRoute } from '@/types/transport';

const metroIconPrimary = assetUrl('/icons/metroicono.png');
const metroIconFallback = assetUrl('/icons/kharkiv-metro-logo.png');
const metroIcon = metroIconFallback;
const routesIcon = assetUrl('/icons/marshryticono.png');
const mapIcon = assetUrl('/icons/kartaicono.png');
const favoritesIcon = assetUrl('/icons/obraneicono.png');

const KIND_ICON: Record<TransportKind, string> = {
  metro: '🚇',
  tram: '🚊',
  trolleybus: '🚎',
  bus: '🚌'
};

const KIND_GRADIENT: Record<TransportKind, string> = {
  metro: 'from-blue-500 to-cyan-400',
  tram: 'from-red-500 to-orange-400',
  trolleybus: 'from-emerald-500 to-teal-400',
  bus: 'from-violet-500 to-purple-400'
};

/* ─── UTILS ─────────────────────────────────────────────────────── */

function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} м`;
  return `${(m / 1000).toFixed(1)} км`;
}

function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function timeAgo(date: Date): string {
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return 'Щойно';
  if (sec < 3600) return `${Math.floor(sec / 60)} хв тому`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} год тому`;
  return `${Math.floor(sec / 86400)} дн тому`;
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* ─── HOOKS ─────────────────────────────────────────────────────── */

function useInView<T extends HTMLElement>(threshold = 0.1) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function usePrevious<T>(value: T) {
  const ref = useRef<T>(value);
  useEffect(() => { ref.current = value; });
  return ref.current;
}

function useAnimatedNumber(target: number, duration = 600) {
  const [display, setDisplay] = useState(target);
  const startRef = useRef<number>(0);
  const fromRef = useRef(target);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    fromRef.current = display;
    startRef.current = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(fromRef.current + (target - fromRef.current) * eased));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return display;
}

/* ─── SUB-COMPONENTS ────────────────────────────────────────────── */

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-primary/20 text-primary rounded px-0.5 font-extrabold">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function AnimatedSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, inView } = useInView<HTMLDivElement>(0.05);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${className}`}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.98)',
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)'
      }}
    >
      {children}
    </div>
  );
}

function StaggerContainer({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`space-y-2 ${className}`}>{children}</div>;
}

function StaggerItem({ children, index = 0 }: { children: React.ReactNode; index?: number }) {
  const { ref, inView } = useInView<HTMLDivElement>(0.05);
  return (
    <div
      ref={ref}
      className="transition-all duration-500"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateX(0)' : 'translateX(-12px)',
        transitionDelay: `${index * 80}ms`,
        transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)'
      }}
    >
      {children}
    </div>
  );
}

function LiveBadge({ text = 'LIVE', color = 'bg-emerald-500' }: { text?: string; color?: string }) {
  return (
    <span className="relative inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-md border border-white/10 text-[10px] font-black tracking-widest uppercase">
      <span className={`relative flex h-1.5 w-1.5`}>
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-75`} />
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${color}`} />
      </span>
      {text}
    </span>
  );
}

function QuickActionCard({
  item
}: {
  item: {
    label: string;
    icon: React.ElementType;
    image?: string;
    imageFallback?: string;
    to: string;
    imageScale?: string;
    overflowVisible?: boolean;
    gradient?: string;
  };
}) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [pressed, setPressed] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -12, y: x * 12 });
  }, []);

  const handleMouseLeave = useCallback(() => setTilt({ x: 0, y: 0 }), []);

  const Icon = item.icon;

  return (
    <Link
      ref={cardRef}
      to={item.to}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      className="group relative bg-surface-raised rounded-2xl p-2.5 flex items-center gap-2.5 border border-border/40 shadow-sm hover:shadow-xl active:scale-[0.96] transition-all duration-200 overflow-hidden"
      style={{
        transform: `perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${pressed ? 0.96 : 1})`,
        transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)'
      }}
    >
      {/* Hover glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-primary/5 to-transparent" />
      
      <div className={`w-16 h-16 shrink-0 rounded-2xl ${item.gradient || 'bg-surface-soft'} border border-border/40 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:shadow-lg overflow-hidden relative`}>
        {item.image ? (
          <img
            src={item.image}
            alt={item.label}
            className={`w-[4.5rem] h-[4.5rem] object-contain ${item.imageScale || 'scale-125'} ${item.overflowVisible ? 'relative z-10' : ''}`}
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement & { dataset: { triedFallback?: string } };
              if (item.imageFallback && img.dataset.triedFallback !== '1') {
                img.dataset.triedFallback = '1';
                img.src = item.imageFallback;
                return;
              }
              img.style.display = 'none';
              const iconFallback = img.nextElementSibling as HTMLElement | null;
              if (iconFallback) iconFallback.style.display = 'flex';
            }}
          />
        ) : null}
        <Icon size={28} className="text-ink-text opacity-80" style={item.image ? { display: 'none' } : undefined} />
      </div>
      <div className="relative">
        <span className="font-extrabold text-ink-text text-xs tracking-tight block">{item.label}</span>
        <span className="text-[10px] text-ink-muted font-medium">Натисніть для переходу</span>
      </div>
      <ChevronRight size={14} className="ml-auto text-ink-muted opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function MetroTrainVisualizer({ arrivals, lineColor }: { arrivals: Array<{ direction: string; etaSec: number }>; lineColor?: string }) {
  // ✅ Префікс "_" заспокоює tsc compiler
  const _nowSec = useMemo(() => {
    const d = new Date();
    return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
  }, []);

  return (
    <div className="relative h-8 mt-2 mb-1">
      {/* Track line */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 rounded-full bg-white/20" />
      <div 
        className="absolute left-0 top-1/2 -translate-y-1/2 h-1 rounded-full transition-all duration-1000"
        style={{ 
          width: '100%',
          background: `linear-gradient(90deg, ${lineColor || '#fff'}40 0%, ${lineColor || '#fff'} 50%, ${lineColor || '#fff'}40 100%)`
        }}
      />
      {/* Stations dots */}
      {[0, 50, 100].map((pos) => (
        <div
          key={pos}
          className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/60 border border-white/30"
          style={{ left: `${pos}%`, transform: 'translate(-50%, -50%)' }}
        />
      ))}

      {/* Trains */}
      {arrivals.slice(0, 2).map((arr, idx) => {
        const progress = Math.max(0, Math.min(1, 1 - arr.etaSec / 900));
        const leftPos = idx === 0 ? progress * 50 : 50 + progress * 50;
        return (
          <div
            key={idx}
            className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000 ease-linear"
            style={{ left: `${leftPos}%`, transform: 'translate(-50%, -50%)' }}
          >
            <div className="relative">
              <div className="w-5 h-5 rounded-full bg-white shadow-lg shadow-white/30 flex items-center justify-center animate-pulse">
                <TrainTrack size={10} className="text-emerald-700" />
              </div>
              {/* Tooltip */}
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold text-white bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
                {arr.etaSec <= 5 ? 'На станції' : formatEtaCountdown(arr.etaSec, nowSec)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FlipNumber({ value }: { value: number }) {
  const prev = usePrevious(value);
  const changed = prev !== value;
  return (
    <span className={`inline-block tabular-nums transition-all duration-300 ${changed ? 'animate-in zoom-in' : ''}`}>
      {value.toString().padStart(2, '0')}
    </span>
  );
}

function CountdownTimer({ etaSec, nowSec }: { etaSec: number; nowSec: number }) {
  const totalSec = Math.max(0, etaSec);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  const isUrgent = totalSec < 60;

  return (
    <div className={`flex items-center gap-0.5 font-black text-[13px] tabular-nums ${isUrgent ? 'text-amber-300' : 'text-white'}`}>
      <FlipNumber value={mins} />
      <span className="opacity-60">:</span>
      <FlipNumber value={secs} />
    </div>
  );
}

/* ─── MAIN PAGE ─────────────────────────────────────────────────── */

export function HomePage() {
  const profile = useAuthStore((s) => s.profile);
  const showToast = useToastStore((s) => s.show);
  const favoriteRoutes = useFavoritesStore((s) => s.routes);
  const favoriteStops = useFavoritesStore((s) => s.stops);
  const { position, locate } = useGeolocation();
  
  const historyEntries = useHistoryStore((s) => s.entries);
  const addHistoryEntry = useHistoryStore((s) => s.addEntry);

  const [isReportDelayOpen, setIsReportDelayOpen] = useState(false);
  const [activeRoute, setActiveRoute] = useState<TransportRoute | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchIndex, setSearchIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = useMemo(() => {
    return currentTime.toLocaleDateString('uk-UA', { 
      day: 'numeric', 
      month: 'long', 
      weekday: 'short' 
    });
  }, [currentTime]);

  const formattedTimeStr = useMemo(() => {
    return currentTime.toLocaleTimeString('uk-UA', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }, [currentTime]);

  /* Time-aware theme */
  const hour = currentTime.getHours();
  const theme = useMemo(() => {
    if (hour < 6) return { name: 'night', accent: 'from-indigo-500 to-violet-600', ambient: 'bg-indigo-500/10', icon: Moon, greeting: 'Доброї ночі' };
    if (hour < 12) return { name: 'morning', accent: 'from-amber-400 to-orange-500', ambient: 'bg-amber-500/10', icon: Sunrise, greeting: 'Доброго ранку' };
    if (hour < 18) return { name: 'day', accent: 'from-emerald-500 to-teal-600', ambient: 'bg-emerald-500/10', icon: Zap, greeting: 'Доброго дня' };
    return { name: 'evening', accent: 'from-orange-500 to-rose-600', ambient: 'bg-orange-500/10', icon: Sunset, greeting: 'Доброго вечора' };
  }, [hour]);

  const greeting = theme.greeting;
  const displayName = profile?.displayName || profile?.username || 'Гість';
  const ThemeIcon = theme.icon;

  /* ── Metro data ─────────────────────────────────────────────── */
  const activeMetroTrains = useMemo(() => getActiveTrains(currentTime), [currentTime]);
  const isMetroServiceRunning = activeMetroTrains.length > 0;

  const nearestMetroStation = useMemo(() => {
    if (!position) return null;
    let best: { id: string; name: string; distM: number; lineColor?: string } | null = null;
    for (const { line } of BUILT_LINES) {
      for (const s of line.stations) {
        const geo = METRO_STATION_GEO[s.id];
        if (!geo) continue;
        const distM = calculateDistanceMeters(position.lat, position.lng, geo.lat, geo.lng);
        if (!best || distM < best.distM) {
          best = { id: s.id, name: s.name, distM, lineColor: line.color };
        }
      }
    }
    return best;
  }, [position]);

  const nearestMetroArrivals = useMemo(() => {
    if (!nearestMetroStation) return [];
    return getUpcomingArrivalsForStation(nearestMetroStation.id, currentTime, 2);
  }, [nearestMetroStation, currentTime]);

  const metroTrackArrivals = useMemo(() => {
    if (nearestMetroArrivals.length === 0) return { track1: null, track2: null };
    const track1 = nearestMetroArrivals.find((a) => a.direction === 'forward') ?? nearestMetroArrivals[0] ?? null;
    const track2 = nearestMetroArrivals.find((a) => a.direction === 'backward' && a !== track1) ?? null;
    return { track1, track2 };
  }, [nearestMetroArrivals]);

  const metroNowSec = currentTime.getHours() * 3600 + currentTime.getMinutes() * 60 + currentTime.getSeconds();

  /* ── Search ─────────────────────────────────────────────────── */
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { routes: [], stops: [], metro: [] };
    const q = searchQuery.toLowerCase().trim();
    const matchedRoutes = localRoutes.search(q).slice(0, 4);
    const matchedStops = localStops.search(q).slice(0, 4);
    const matchedMetro: Array<{ id: string; name: string; lineName?: string }> = [];
    try {
      const allRoutes = localRoutes.search(q) || [];
      for (const r of allRoutes) {
        if (r.kind === 'metro') {
          matchedMetro.push({ id: r.id, name: r.name, lineName: r.number });
        }
      }
    } catch { /* fallback */ }
    return { routes: matchedRoutes, stops: matchedStops, metro: matchedMetro.slice(0, 3) };
  }, [searchQuery]);

  const allSearchItems = useMemo(() => {
    const items: Array<{ type: 'route' | 'stop' | 'metro'; data: any }> = [];
    searchResults.routes.forEach(r => items.push({ type: 'route', data: r }));
    searchResults.stops.forEach(s => items.push({ type: 'stop', data: s }));
    searchResults.metro.forEach(m => items.push({ type: 'metro', data: m }));
    return items;
  }, [searchResults]);

  const hasSearchResults = allSearchItems.length > 0;

  useEffect(() => {
    setSearchIndex(-1);
  }, [searchQuery]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isSearchFocused) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSearchIndex(i => Math.min(i + 1, allSearchItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSearchIndex(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && searchIndex >= 0) {
      e.preventDefault();
      const item = allSearchItems[searchIndex];
      if (!item) return;
      setIsSearchFocused(false);
      if (item.type === 'route' || item.type === 'metro') {
        if (item.type === 'metro') {
          addHistoryEntry({ query: item.data.name, type: 'route' });
          window.location.href = '/metro/live';
        } else {
          addHistoryEntry({ query: `Маршрут ${item.data.number}`, type: 'route' });
          setActiveRoute(item.data);
        }
      } else {
        addHistoryEntry({ query: item.data.name, type: 'stop' });
        window.location.href = `/map?q=${encodeURIComponent(item.data.name)}`;
      }
    } else if (e.key === 'Escape') {
      setIsSearchFocused(false);
      searchInputRef.current?.blur();
    }
  }, [isSearchFocused, searchIndex, allSearchItems, addHistoryEntry]);

  /* ── Favorites ──────────────────────────────────────────────── */
  const favoriteRouteDetails = useMemo(
    () => favoriteRoutes.map((f) => localRoutes.getById(f.routeId)).filter((r): r is NonNullable<typeof r> => !!r),
    [favoriteRoutes]
  );
  const favoriteStopDetails = useMemo(
    () => favoriteStops.map((f) => localStops.getById(f.stopId)).filter((s): s is NonNullable<typeof s> => !!s),
    [favoriteStops]
  );

  /* ── Nearby stops ───────────────────────────────────────────── */
  const nearbyStopsWithDistance = useMemo(() => {
    if (!position) return [];
    const stops = localStops.getNearby(position.lat, position.lng, 1500).slice(0, 4);
    return stops.map((stop) => ({
      ...stop,
      distance: calculateDistanceMeters(position.lat, position.lng, stop.position.lat, stop.position.lng)
    }));
  }, [position]);

  /* ── Animated distances ─────────────────────────────────────── */
  const animatedDistances = nearbyStopsWithDistance.map(s => useAnimatedNumber(Math.round(s.distance)));

  /* ── Scroll search index into view ──────────────────────────── */
  useEffect(() => {
    if (searchIndex >= 0 && searchResultsRef.current) {
      const buttons = searchResultsRef.current.querySelectorAll('button, a');
      const el = buttons[searchIndex] as HTMLElement | undefined;
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [searchIndex]);

  return (
    <div className="relative min-h-dvh bg-bg pb-32 pt-[max(0.75rem,env(safe-area-inset-top))] text-ink-text overflow-x-hidden font-sans antialiased selection:bg-primary selection:text-white">
      
      {/* Inline keyframes for advanced animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          33% { transform: translateY(-20px) rotate(2deg); }
          66% { transform: translateY(10px) rotate(-1deg); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes shine {
          0% { left: -100%; }
          100% { left: 200%; }
        }
        .animate-shimmer {
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        .animate-gradient-shift {
          background-size: 200% 200%;
          animation: gradient-shift 6s ease infinite;
        }
        .shine-effect {
          position: relative;
          overflow: hidden;
        }
        .shine-effect::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          animation: shine 3s infinite;
        }
      `}</style>

      {/* Ambient living background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div 
          className={`absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full ${theme.ambient} blur-[100px] opacity-60`}
          style={{ animation: 'float 20s ease-in-out infinite' }}
        />
        <div 
          className={`absolute top-1/3 -right-40 h-[400px] w-[400px] rounded-full ${theme.accent.includes('emerald') ? 'bg-teal-500/10' : theme.accent.includes('amber') ? 'bg-orange-500/10' : 'bg-violet-500/10'} blur-[100px] opacity-50`}
          style={{ animation: 'float 25s ease-in-out infinite reverse' }}
        />
        <div 
          className="absolute -bottom-20 left-1/3 h-[300px] w-[300px] rounded-full bg-primary/5 blur-[80px] opacity-40"
          style={{ animation: 'float 18s ease-in-out infinite 2s' }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-md px-4 space-y-5">
        
        {/* ═══ 1. UPPER HEADER ═══ */}
        <AnimatedSection>
          <header className="flex items-center justify-between pt-1 pb-1">
            <div className="flex items-center gap-3">
              <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-forest-dark flex items-center justify-center text-white shadow-lg shadow-primary/25 font-black text-base tracking-tighter overflow-hidden group">
                <span className="relative z-10">GO</span>
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm tracking-tight text-ink-text">
                    Kharkiv <span className="text-primary">GO</span>
                  </span>
                  <span className="px-2 py-0.5 text-[9px] font-extrabold bg-primary/10 text-primary rounded-full border border-primary/20">
                    PRO
                  </span>
                </div>
                <h1 className="font-display text-lg font-black text-ink-text mt-0.5 tracking-tight truncate max-w-[190px] flex items-center gap-1.5">
                  {greeting}, {displayName}! 
                  <span className="inline-block animate-bounce" style={{ animationDuration: '2s' }}>👋</span>
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden xs:flex flex-col items-end text-right mr-1">
                <span className="text-xs font-bold text-ink-text tabular-nums tracking-tight">{formattedTimeStr}</span>
                <span className="text-[10px] font-medium text-ink-muted capitalize flex items-center gap-1">
                  <ThemeIcon size={10} className="text-primary" />
                  {formattedDate}
                </span>
              </div>
              
              <NotificationsBell />

              <Link 
                to="/profile"
                aria-label="Налаштування"
                className="relative p-2.5 rounded-2xl bg-surface-raised border border-border/40 hover:bg-surface-soft hover:border-primary/30 hover:shadow-md hover:shadow-primary/10 transition-all active:scale-95 text-ink-text group overflow-hidden"
              >
                <Settings size={18} className="relative z-10 transition-transform group-hover:rotate-90 duration-500" />
              </Link>
            </div>
          </header>
        </AnimatedSection>

        {/* ═══ 2. ADVANCED SEARCH ═══ */}
        <AnimatedSection delay={50}>
          <div className="relative z-30">
            <div className={`relative flex items-center bg-surface-raised rounded-[22px] border transition-all duration-300 shadow-sm ${
              isSearchFocused ? 'border-primary/50 ring-[6px] ring-primary/10 shadow-xl scale-[1.02]' : 'border-border/40 hover:border-border/70 hover:shadow-md'
            }`}>
              <div className="pl-4 pr-2 text-ink-muted">
                <SearchIcon size={18} className={`transition-colors duration-300 ${isSearchFocused ? 'text-primary' : ''}`} />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onKeyDown={handleKeyDown}
                placeholder="Пошук маршруту, зупинки, метро..."
                className="w-full py-3.5 pr-4 text-xs font-semibold text-ink-text bg-transparent outline-none placeholder:text-ink-muted placeholder:font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); searchInputRef.current?.focus(); }}
                  className="p-2 mr-2 text-ink-muted hover:text-ink-text hover:bg-surface-soft rounded-full transition-all active:scale-90"
                >
                  <X size={16} />
                </button>
              )}
              {isSearchFocused && !searchQuery && (
                <div className="pr-3 text-[10px] font-bold text-ink-muted bg-surface-soft px-2 py-1 rounded-lg mr-2 hidden sm:block">
                  ESC
                </div>
              )}
            </div>

            {/* Search Dropdown */}
            {isSearchFocused && searchQuery.trim().length > 0 && (
              <>
                <div 
                  className="fixed inset-0 z-20 bg-ink-text/20 backdrop-blur-sm transition-opacity"
                  onClick={() => setIsSearchFocused(false)}
                />
                
                <div 
                  ref={searchResultsRef}
                  className="absolute left-0 right-0 top-14 z-30 bg-surface-raised/95 backdrop-blur-xl rounded-[22px] border border-border/40 shadow-2xl p-3 max-h-[420px] overflow-y-auto"
                  style={{
                    animation: 'fadeInUp 0.2s ease-out',
                  }}
                >
                  {!hasSearchResults ? (
                    <div className="py-10 text-center">
                      <div className="w-12 h-12 rounded-full bg-surface-soft flex items-center justify-center mx-auto mb-3">
                        <SearchIcon size={20} className="text-ink-muted" />
                      </div>
                      <p className="text-xs font-bold text-ink-text mb-1">Нічого не знайдено</p>
                      <p className="text-[11px] text-ink-muted">Спробуйте інший запит</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Routes */}
                      {searchResults.routes.length > 0 && (
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-wider text-ink-muted px-2 mb-1.5 flex items-center gap-1">
                            <Navigation size={10} /> Маршрути
                          </div>
                          <div className="space-y-0.5">
                            {searchResults.routes.map((r, idx) => {
                              const globalIdx = idx;
                              return (
                                <button
                                  key={r.id}
                                  type="button"
                                  onClick={() => {
                                    setIsSearchFocused(false);
                                    addHistoryEntry({ query: `Маршрут ${r.number}`, type: 'route' });
                                    setActiveRoute(r);
                                  }}
                                  className={`flex w-full items-center justify-between p-2.5 rounded-xl transition-all duration-150 group ${
                                    searchIndex === globalIdx 
                                      ? 'bg-primary/15 border border-primary/20 shadow-sm' 
                                      : 'hover:bg-primary/10 border border-transparent'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <span className={`w-8 h-8 rounded-lg bg-gradient-to-br ${KIND_GRADIENT[r.kind]} flex items-center justify-center text-white text-xs shadow-sm`}>
                                      {KIND_ICON[r.kind]}
                                    </span>
                                    <span className="font-bold text-xs text-ink-text group-hover:text-primary truncate">
                                      <Highlight text={`${r.number} — ${r.name}`} query={searchQuery} />
                                    </span>
                                  </div>
                                  <ChevronRight size={14} className="text-ink-muted shrink-0" />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Stops */}
                      {searchResults.stops.length > 0 && (
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-wider text-ink-muted px-2 mb-1.5 flex items-center gap-1">
                            <MapPin size={10} /> Зупинки
                          </div>
                          <div className="space-y-0.5">
                            {searchResults.stops.map((s, idx) => {
                              const globalIdx = searchResults.routes.length + idx;
                              return (
                                <Link
                                  key={s.id}
                                  to={`/map?q=${encodeURIComponent(s.name)}`}
                                  onClick={() => {
                                    setIsSearchFocused(false);
                                    addHistoryEntry({ query: s.name, type: 'stop' });
                                  }}
                                  className={`flex items-center justify-between p-2.5 rounded-xl transition-all duration-150 group ${
                                    searchIndex === globalIdx 
                                      ? 'bg-primary/15 border border-primary/20 shadow-sm' 
                                      : 'hover:bg-primary/10 border border-transparent'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <span className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-xs">🚏</span>
                                    <span className="font-bold text-xs text-ink-text group-hover:text-primary truncate">
                                      <Highlight text={s.name} query={searchQuery} />
                                    </span>
                                  </div>
                                  <ChevronRight size={14} className="text-ink-muted" />
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Metro */}
                      {searchResults.metro.length > 0 && (
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-wider text-ink-muted px-2 mb-1.5 flex items-center gap-1">
                            <TrainTrack size={10} /> Метро
                          </div>
                          <div className="space-y-0.5">
                            {searchResults.metro.map((m, idx) => {
                              const globalIdx = searchResults.routes.length + searchResults.stops.length + idx;
                              return (
                                <Link
                                  key={m.id}
                                  to={`/metro/live`}
                                  onClick={() => {
                                    setIsSearchFocused(false);
                                    addHistoryEntry({ query: m.name, type: 'route' });
                                  }}
                                  className={`flex items-center justify-between p-2.5 rounded-xl transition-all duration-150 group ${
                                    searchIndex === globalIdx 
                                      ? 'bg-primary/15 border border-primary/20 shadow-sm' 
                                      : 'hover:bg-primary/10 border border-transparent'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <img src={metroIcon} alt="Метро" className="w-8 h-8 rounded-lg object-contain bg-gold/15 p-1" />
                                    <div>
                                      <span className="font-bold text-xs text-ink-text group-hover:text-primary block truncate">
                                        <Highlight text={m.name} query={searchQuery} />
                                      </span>
                                      {m.lineName && <span className="text-[10px] text-ink-muted">{m.lineName}</span>}
                                    </div>
                                  </div>
                                  <ChevronRight size={14} className="text-ink-muted" />
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="pt-1 text-center">
                        <span className="text-[10px] text-ink-muted font-medium">
                          ↑↓ навігація • Enter вибір • Esc закрити
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </AnimatedSection>

        {/* ═══ 2.5. TRAIN WISH SPRITE ═══ */}
        <TrainWishSprite />

        {/* ═══ 3. QUICK ACTIONS (3D Tilt) ═══ */}
        <AnimatedSection delay={100}>
          <section className="grid grid-cols-2 gap-2.5">
            {[
              { label: 'Маршрути', icon: Navigation, image: routesIcon, to: '/routes', imageScale: 'scale-125', gradient: 'from-blue-500/10 to-blue-600/5' },
              { label: 'Карта', icon: MapIcon, image: mapIcon, to: '/map', imageScale: 'scale-125', gradient: 'from-emerald-500/10 to-emerald-600/5' },
              { label: 'Метро', icon: TrainTrack, image: metroIconPrimary, imageFallback: metroIconFallback, to: '/metro/live', imageScale: 'scale-150', overflowVisible: true, gradient: 'from-gold/10 to-amber-500/5' },
              { label: 'Обране', icon: Star, image: favoritesIcon, to: '/favorites', imageScale: 'scale-125', gradient: 'from-rose-500/10 to-rose-600/5' },
            ].map((item, index) => (
              <QuickActionCard key={index} item={item} index={index} />
            ))}
          </section>
        </AnimatedSection>

        {/* ═══ 4. LIVE METRO CARD (Ultra) ═══ */}
        <AnimatedSection delay={150}>
          <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 text-white p-5 shadow-2xl shadow-emerald-900/20 border border-emerald-400/20">
            {/* Animated background mesh */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-400 rounded-full blur-[60px] animate-pulse" style={{ animationDuration: '4s' }} />
              <div className="absolute -left-10 bottom-0 w-32 h-32 bg-teal-400 rounded-full blur-[50px] animate-pulse" style={{ animationDuration: '6s' }} />
            </div>

            {/* Header */}
            <div className="relative flex items-center justify-between mb-4">
              <LiveBadge text="Метро онлайн" color="bg-emerald-300" />
              <div className="flex items-center gap-1.5 text-[11px] font-bold bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                <CheckCircle2 size={13} className="text-emerald-300" />
                <span>Працює штатно</span>
              </div>
            </div>

            {!isMetroServiceRunning ? (
              <div className="relative bg-white/10 backdrop-blur-md rounded-[20px] p-4 border border-white/10 mb-4 text-center space-y-1">
                <div className="text-xs font-bold text-emerald-100 flex items-center justify-center gap-2">
                  <Moon size={14} /> Нічна перерва
                </div>
                <div className="text-[11px] text-emerald-100/70">Перші потяги о 05:30</div>
                <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-emerald-300/50 rounded-full animate-shimmer" style={{ width: '30%' }} />
                </div>
              </div>
            ) : !position ? (
              <div className="relative bg-white/10 backdrop-blur-md rounded-[20px] p-4 border border-white/10 mb-4 flex items-center justify-between gap-3">
                <span className="text-[11px] font-medium text-emerald-100 flex items-center gap-2">
                  <MapPin size={14} className="text-emerald-200 shrink-0" />
                  Увімкніть геопозицію для рейсів з найближчої станції
                </span>
                <button
                  onClick={() => locate()}
                  className="shrink-0 text-[11px] font-bold text-white bg-white/20 px-3 py-1.5 rounded-full hover:bg-white/30 active:scale-95 transition-all border border-white/10"
                >
                  Дозволити
                </button>
              </div>
            ) : nearestMetroStation ? (
              <div className="relative bg-white/10 backdrop-blur-md rounded-[20px] p-4 border border-white/10 mb-4 space-y-3">
                <Link
                  to={`/metro/live?station=${nearestMetroStation.id}&tab=timetable`}
                  className="flex items-center justify-between group/station"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white/30 shadow-lg shadow-current/30"
                      style={{ backgroundColor: nearestMetroStation.lineColor ?? '#ffffff' }}
                    />
                    <span className="truncate text-xs font-bold text-white group-hover/station:text-emerald-200 transition-colors">ст. {nearestMetroStation.name}</span>
                  </div>
                  <span className="shrink-0 text-[10px] font-bold bg-white/15 px-2.5 py-1 rounded-full text-emerald-100 border border-white/10">
                    {formatDistance(nearestMetroStation.distM)}
                  </span>
                </Link>

                {/* Train track visualization */}
                <MetroTrainVisualizer 
                  arrivals={nearestMetroArrivals} 
                  lineColor={nearestMetroStation.lineColor} 
                />

                <div className="space-y-2 pt-1">
                  <MetroTrackRowUltra label="Колія 1" arrival={metroTrackArrivals.track1} nowSec={metroNowSec} />
                  <MetroTrackRowUltra label="Колія 2" arrival={metroTrackArrivals.track2} nowSec={metroNowSec} />
                </div>
              </div>
            ) : (
              <div className="relative bg-white/10 backdrop-blur-md rounded-[20px] p-4 border border-white/10 mb-4 text-center">
                <div className="text-[11px] text-emerald-100">Не вдалось визначити найближчу станцію</div>
              </div>
            )}

            <Link
              to={nearestMetroStation ? `/metro/live?station=${nearestMetroStation.id}&tab=timetable` : '/metro/live'}
              className="relative w-full py-3.5 px-4 bg-white text-emerald-700 rounded-[18px] font-extrabold text-xs flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shine-effect overflow-hidden group"
            >
              <img src={metroIcon} alt="Метро" className="w-4 h-4 object-contain group-hover:scale-110 transition-transform" />
              <span>{nearestMetroStation ? 'Розклад найближчої станції' : 'Відкрити карту метро'}</span>
              <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </section>
        </AnimatedSection>

        <NotificationsSection />

        {/* ═══ 5. NEAREST STOPS ═══ */}
        <AnimatedSection delay={200}>
          <section className="bg-surface-raised rounded-[24px] p-4 border border-border/40 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 text-primary rounded-xl">
                  <Navigation size={16} />
                </div>
                <h2 className="font-extrabold text-ink-text text-xs">Найближчі зупинки</h2>
              </div>
              <Link 
                to="/map"
                className="text-xs font-bold text-primary hover:text-primary flex items-center gap-0.5 active:scale-95 transition-transform group"
              >
                <span>На карті</span>
                <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {!position ? (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-surface-soft rounded-[20px] border border-dashed border-border/60 px-4 relative overflow-hidden">
                <div className="absolute inset-0 animate-shimmer opacity-30" />
                <div className="w-12 h-12 rounded-full bg-primary/15 text-primary flex items-center justify-center mb-3 relative">
                  <Compass size={24} className="animate-spin" style={{ animationDuration: '3s' }} />
                </div>
                <p className="text-xs font-bold text-ink-text mb-1">Геолокація вимкнена</p>
                <p className="text-[11px] text-ink-muted mb-4 max-w-[240px]">Увімкніть GPS, щоб бачити зупинки поруч</p>
                <button
                  onClick={() => locate()}
                  className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:brightness-110 hover:shadow-xl hover:shadow-primary/30 active:scale-95 transition-all inline-flex items-center gap-2 relative overflow-hidden"
                >
                  <MapPin size={14} />
                  <span>Увімкнути геолокацію</span>
                </button>
              </div>
            ) : nearbyStopsWithDistance.length === 0 ? (
              <div className="py-6 text-center bg-surface-soft rounded-[20px] border border-border/40">
                <p className="text-xs font-medium text-ink-muted">Поблизу зупинок не знайдено</p>
                <p className="text-[10px] text-ink-muted mt-1">Спробуйте пізніше або змініть локацію</p>
              </div>
            ) : (
              <StaggerContainer>
                {nearbyStopsWithDistance.map((stop, idx) => (
                  <StaggerItem key={stop.id} index={idx}>
                    <Link
                      to={`/map?q=${encodeURIComponent(stop.name)}`}
                      onClick={() => addHistoryEntry({ query: stop.name, type: 'stop' })}
                      className="flex items-center justify-between p-3.5 rounded-[18px] bg-surface-soft hover:bg-primary/10 transition-all duration-300 border border-transparent hover:border-primary/15 group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      <div className="flex items-center gap-3 min-w-0 relative">
                        <div className="w-10 h-10 rounded-xl bg-surface-raised shadow-sm flex items-center justify-center text-primary font-bold text-sm shrink-0 border border-border/40 group-hover:scale-110 group-hover:shadow-md transition-all">
                          🚏
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-ink-text text-xs truncate group-hover:text-primary transition-colors">{stop.name}</div>
                          <div className="text-[10px] text-ink-muted font-medium flex items-center gap-1">
                            <MapPin size={9} /> Зупинка громадського транспорту
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-primary bg-primary/15 px-3 py-1.5 rounded-full shrink-0 border border-primary/10 group-hover:bg-primary group-hover:text-white transition-all">
                        {formatDistance(animatedDistances[idx] || stop.distance)}
                      </span>
                    </Link>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            )}
          </section>
        </AnimatedSection>

        {/* ═══ 6. FAVORITES ═══ */}
        <AnimatedSection delay={250}>
          <section className="bg-surface-raised rounded-[24px] p-4 border border-border/40 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gold/10 text-gold rounded-xl">
                  <Star size={16} className="fill-gold text-gold" />
                </div>
                <h2 className="font-extrabold text-ink-text text-xs">Обране</h2>
              </div>
              {(favoriteRouteDetails.length > 0 || favoriteStopDetails.length > 0) && (
                <Link to="/favorites" className="text-xs font-bold text-gold hover:brightness-110 flex items-center gap-0.5 group">
                  <span>Усі ({favoriteRouteDetails.length + favoriteStopDetails.length})</span>
                  <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              )}
            </div>

            {favoriteRouteDetails.length === 0 && favoriteStopDetails.length === 0 ? (
              <div className="text-center py-8 px-4 bg-surface-soft rounded-[20px] border border-dashed border-border/60 relative overflow-hidden">
                <div className="absolute inset-0 animate-shimmer opacity-20" />
                <div className="text-3xl mb-2 animate-bounce" style={{ animationDuration: '3s' }}>⭐</div>
                <p className="text-xs font-extrabold text-ink-text mb-1">У вас ще немає обраного</p>
                <p className="text-[11px] text-ink-muted mb-4 max-w-[220px] mx-auto">Закріплюйте маршрути та зупинки для швидкого доступу</p>
                <Link 
                  to="/routes"
                  className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:brightness-110 hover:shadow-xl active:scale-95 transition-all inline-flex items-center gap-2"
                >
                  <Plus size={14} />
                  <span>Додати маршрути</span>
                </Link>
              </div>
            ) : (
              <StaggerContainer>
                {favoriteRouteDetails.slice(0, 3).map((r, idx) => (
                  <StaggerItem key={r.id} index={idx}>
                    <button
                      type="button"
                      onClick={() => {
                        addHistoryEntry({ query: `Маршрут ${r.number}`, type: 'route' });
                        setActiveRoute(r);
                      }}
                      className="flex w-full items-center justify-between p-3.5 rounded-[18px] bg-surface-soft hover:bg-surface transition-all duration-300 border border-border/40 hover:border-primary/20 hover:shadow-sm group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      <div className="flex items-center gap-3 min-w-0 relative">
                        {r.kind === 'metro' ? (
                          <img src={metroIcon} alt="Метро" className="w-6 h-6 object-contain group-hover:scale-110 transition-transform" />
                        ) : (
                          <span className={`w-8 h-8 rounded-lg bg-gradient-to-br ${KIND_GRADIENT[r.kind]} flex items-center justify-center text-white text-xs shadow-sm`}>
                            {KIND_ICON[r.kind]}
                          </span>
                        )}
                        <div className="truncate text-left">
                          <span className="font-extrabold text-ink-text text-xs truncate block group-hover:text-primary transition-colors">{r.number} — {r.name}</span>
                          <span className="text-[10px] text-ink-muted font-medium capitalize">{r.kind}</span>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-ink-muted shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </StaggerItem>
                ))}

                {favoriteStopDetails.slice(0, 2).map((s, idx) => (
                  <StaggerItem key={s.id} index={idx + favoriteRouteDetails.length}>
                    <Link
                      to={`/map?q=${encodeURIComponent(s.name)}`}
                      onClick={() => addHistoryEntry({ query: s.name, type: 'stop' })}
                      className="flex items-center justify-between p-3.5 rounded-[18px] bg-surface-soft hover:bg-surface transition-all duration-300 border border-border/40 hover:border-primary/20 hover:shadow-sm group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-sm group-hover:scale-110 transition-transform">🚏</span>
                        <span className="font-extrabold text-ink-text text-xs truncate group-hover:text-primary transition-colors">{s.name}</span>
                      </div>
                      <ChevronRight size={14} className="text-ink-muted shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            )}
          </section>
        </AnimatedSection>

        {/* ═══ 7. RECENT HISTORY ═══ */}
        {historyEntries.length > 0 && (
          <AnimatedSection delay={300}>
            <section className="bg-surface-raised rounded-[24px] p-4 border border-border/40 shadow-sm backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-surface text-ink-text rounded-xl">
                    <History size={16} />
                  </div>
                  <h2 className="font-extrabold text-ink-text text-xs">Останні переглянуті</h2>
                </div>
              </div>

              <StaggerContainer>
                {historyEntries.slice(0, 5).map((entry, idx) => (
                  <StaggerItem key={idx} index={idx}>
                    <div className="flex items-center justify-between p-3 rounded-[16px] bg-surface-soft hover:bg-surface transition-all duration-200 group cursor-pointer border border-transparent hover:border-border/40">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Clock size={12} className="text-primary" />
                        </div>
                        <span className="font-bold text-xs text-ink-text truncate group-hover:text-primary transition-colors">{entry.query}</span>
                      </div>
                      <span className="text-[10px] text-ink-muted font-medium tabular-nums">{timeAgo(new Date(entry.searchedAt || Date.now()))}</span>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </section>
          </AnimatedSection>
        )}

        {/* ═══ 8. TRANSPORT NEWS ═══ */}
        <AnimatedSection delay={350}>
          <section className="bg-surface-raised rounded-[24px] p-4 border border-border/40 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-surface-soft text-ink-muted rounded-xl">
                <AlertCircle size={16} />
              </div>
              <h2 className="font-extrabold text-ink-text text-xs">Новини транспорту</h2>
              <span className="ml-auto flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
            </div>

            <div className="p-4 bg-surface-soft rounded-[20px] border border-border/40 space-y-3 relative overflow-hidden group hover:border-primary/20 transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
              
              <div className="flex items-center justify-between relative">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-surface-raised text-ink-text border border-border/40 flex items-center gap-1">
                  <TrendingUp size={10} className="text-primary" /> Офіційно
                </span>
                <span className="text-[10px] font-semibold text-ink-muted tabular-nums">Сьогодні, 08:00</span>
              </div>
              <h3 className="font-extrabold text-ink-text text-xs leading-snug group-hover:text-primary transition-colors">Зміни в розкладі рухів тролейбусів у місті</h3>
              <p className="text-[11px] text-ink-muted leading-relaxed">
                Інформація щодо оновлення маршрутів громадського транспорту Харкова в умовах воєнного стану.
              </p>
              <div className="pt-1">
                <button 
                  onClick={() => showToast('Детальна інформація доступна в офіційному Telegram каналі Kharkiv GO.')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:brightness-110 active:scale-95 transition-all group/btn"
                >
                  <span>Детальніше</span>
                  <ExternalLink size={13} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* ═══ 9. REPORT DELAY CTA ═══ */}
        <AnimatedSection delay={400}>
          <button
            onClick={() => setIsReportDelayOpen(true)}
            className="group relative flex w-full items-center justify-center gap-2.5 rounded-[22px] border border-gold/30 bg-gradient-to-r from-gold/10 via-amber-500/10 to-gold/10 py-4 text-xs font-extrabold text-gold shadow-lg shadow-gold/10 transition-all active:scale-[0.97] hover:shadow-xl hover:shadow-gold/20 hover:border-gold/50 overflow-hidden shine-effect"
          >
            <AlertTriangle size={18} className="group-hover:animate-bounce" style={{ animationDuration: '2s' }} />
            <span className="relative z-10">Повідомити про затримку</span>
            <Zap size={14} className="relative z-10 opacity-60 group-hover:opacity-100 transition-opacity" />
          </button>
        </AnimatedSection>

        {/* ═══ 10. FOOTER ═══ */}
        <AnimatedSection delay={450}>
          <footer className="text-center py-6 space-y-2">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-ink-text">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span>Kharkiv GO</span>
              <span className="text-ink-muted">•</span>
              <span className="text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">v1.3.0 Pro</span>
            </div>
            <p className="text-[10px] text-ink-muted font-medium">Найнадійніший міський навігатор Харкова</p>
            <div className="flex items-center justify-center gap-3 pt-1">
              {['telegram', 'instagram'].map((social) => (
                <div key={social} className="w-7 h-7 rounded-full bg-surface-soft border border-border/40 flex items-center justify-center hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all cursor-pointer active:scale-90">
                  <ExternalLink size={12} />
                </div>
              ))}
            </div>
          </footer>
        </AnimatedSection>

      </div>

      <ReportDelayModal open={isReportDelayOpen} onClose={() => setIsReportDelayOpen(false)} />
      <RouteDetailModal route={activeRoute} open={!!activeRoute} onClose={() => setActiveRoute(null)} />
    </div>
  );
}

/* ═══ METRO TRACK ROW (Ultra) ═══ */

interface MetroTrackRowProps {
  label: string;
  arrival: ReturnType<typeof getUpcomingArrivalsForStation>[number] | null;
  nowSec: number;
}

function MetroTrackRowUltra({ label, arrival, nowSec }: MetroTrackRowProps) {
  if (!arrival) {
    return (
      <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-[10px] text-emerald-100/50 border border-white/5">
        <span className="font-semibold">{label}</span>
        <span className="italic flex items-center gap-1">
          <Clock size={10} /> Рейсів не очікується
        </span>
      </div>
    );
  }

  const isAtStation = arrival.etaSec <= 5 && arrival.etaSec >= -15;
  const isUrgent = arrival.etaSec < 60 && !isAtStation;

  return (
    <div className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 border transition-all duration-300 ${
      isAtStation ? 'bg-emerald-300/20 border-emerald-300/30' : isUrgent ? 'bg-amber-500/10 border-amber-500/20' : 'bg-white/5 border-white/5'
    }`}>
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="h-2 w-2 shrink-0 rounded-full shadow-lg"
          style={{ backgroundColor: arrival.lineColor, boxShadow: `0 0 8px ${arrival.lineColor}` }}
        />
        <span className="text-[10px] font-semibold text-emerald-100/70 shrink-0">{label}:</span>
        <span className="truncate text-[11px] font-bold text-white flex items-center gap-1">
          → {arrival.headsign}
          {isAtStation && <span className="text-[9px] bg-emerald-300/30 px-1.5 py-0.5 rounded-full text-emerald-200 animate-pulse">ТУТ</span>}
        </span>
      </div>
      {isAtStation ? (
        <span className="shrink-0 text-[11px] font-black text-emerald-200 animate-pulse">
          На станції
        </span>
      ) : (
        <CountdownTimer etaSec={arrival.etaSec} nowSec={nowSec} />
      )}
    </div>
  );
}
