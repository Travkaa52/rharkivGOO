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
      <span className="relative flex h-1.5 w-1.5">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-75`} />
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${color}`} />
      </span>
      {text}
    </span>
  );
}

function QuickActionCard({
  item,
  index: _index
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
  index?: number;
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
  const nowSec = useMemo(() => {
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

function CountdownTimer({ etaSec }: { etaSec: number }) {
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

  const _metroNowSec = currentTime.getHours() * 3600 + currentTime.getMinutes() * 60 + currentTime.getSeconds();

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
              <NotificationsBell />
              <Link
                to="/settings"
                className="w-10 h-10 rounded-2xl bg-surface-raised border border-border/40 flex items-center justify-center text-ink-muted hover:text-ink-text hover:border-border transition-all shadow-sm active:scale-95"
                aria-label="Налаштування"
              >
                <Settings size={18} />
              </Link>
            </div>
          </header>
        </AnimatedSection>

        {/* ═══ 2. TIME & WEATHER HEROBANNER ═══ */}
        <AnimatedSection delay={50}>
          <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${theme.accent} p-4 text-white shadow-xl shadow-primary/10 border border-white/20`}>
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20">
                  <ThemeIcon size={22} className="text-white animate-pulse" />
                </div>
                <div>
                  <div className="text-2xl font-black tracking-tight tabular-nums flex items-baseline gap-2">
                    {formattedTimeStr}
                    <span className="text-xs font-semibold opacity-80 uppercase tracking-widest">{formattedDate}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium opacity-90 mt-0.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Транспорт працює за розкладом</span>
                  </div>
                </div>
              </div>
              <LiveBadge text="ХАРКІВ" color="bg-white" />
            </div>
          </div>
        </AnimatedSection>

        {/* ═══ 3. SEARCH BAR ═══ */}
        <AnimatedSection delay={100}>
          <div className="relative z-30" onKeyDown={handleKeyDown}>
            <div className={`relative flex items-center rounded-2xl bg-surface-raised border transition-all duration-300 shadow-sm ${isSearchFocused ? 'border-primary ring-4 ring-primary/15 shadow-lg scale-[1.01]' : 'border-border/40 hover:border-border'}`}>
              <SearchIcon size={18} className="absolute left-3.5 text-ink-muted pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                placeholder="Пошук зупинки або маршруту..."
                className="w-full bg-transparent py-3.5 pl-10 pr-10 text-sm font-semibold text-ink-text placeholder:text-ink-muted/70 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 p-1 rounded-full text-ink-muted hover:text-ink-text hover:bg-surface-soft transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Dropdown Results */}
            {isSearchFocused && (searchQuery.trim() || historyEntries.length > 0) && (
              <div
                ref={searchResultsRef}
                className="absolute left-0 right-0 top-full mt-2 rounded-2xl bg-surface-raised border border-border/50 shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200"
              >
                {searchQuery.trim() ? (
                  hasSearchResults ? (
                    <div className="p-2 space-y-1">
                      {searchResults.metro.map((m, idx) => (
                        <Link
                          key={`metro-${m.id}`}
                          to="/metro/live"
                          onClick={() => addHistoryEntry({ query: m.name, type: 'route' })}
                          className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${searchIndex === idx ? 'bg-primary/10 text-primary' : 'hover:bg-surface-soft'}`}
                        >
                          <span className="text-lg">🚇</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold truncate">
                              <Highlight text={m.name} query={searchQuery} />
                            </div>
                            <div className="text-[10px] text-ink-muted">Метрополітен • {m.lineName || 'Лінія'}</div>
                          </div>
                          <ChevronRight size={14} className="text-ink-muted" />
                        </Link>
                      ))}

                      {searchResults.routes.map((r, idx) => {
                        const globalIdx = searchResults.metro.length + idx;
                        return (
                          <button
                            key={`route-${r.id}`}
                            onClick={() => {
                              addHistoryEntry({ query: `Маршрут ${r.number}`, type: 'route' });
                              setActiveRoute(r);
                            }}
                            className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors ${searchIndex === globalIdx ? 'bg-primary/10 text-primary' : 'hover:bg-surface-soft'}`}
                          >
                            <span className="text-lg">{KIND_ICON[r.kind] || '🚌'}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold truncate">
                                Маршрут <Highlight text={r.number} query={searchQuery} />
                              </div>
                              <div className="text-[10px] text-ink-muted truncate">{r.name}</div>
                            </div>
                            <ChevronRight size={14} className="text-ink-muted" />
                          </button>
                        );
                      })}

                      {searchResults.stops.map((s, idx) => {
                        const globalIdx = searchResults.metro.length + searchResults.routes.length + idx;
                        return (
                          <Link
                            key={`stop-${s.id}`}
                            to={`/map?q=${encodeURIComponent(s.name)}`}
                            onClick={() => addHistoryEntry({ query: s.name, type: 'stop' })}
                            className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${searchIndex === globalIdx ? 'bg-primary/10 text-primary' : 'hover:bg-surface-soft'}`}
                          >
                            <MapPin size={16} className="text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold truncate">
                                <Highlight text={s.name} query={searchQuery} />
                              </div>
                              <div className="text-[10px] text-ink-muted truncate">Зупинка транспорту</div>
                            </div>
                            <ChevronRight size={14} className="text-ink-muted" />
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-ink-muted text-xs font-medium">
                      Нічого не знайдено за запитом "{searchQuery}"
                    </div>
                  )
                ) : (
                  <div className="p-3">
                    <div className="flex items-center justify-between px-2 pb-2 text-[10px] font-extrabold uppercase tracking-wider text-ink-muted border-b border-border/30">
                      <span>Історія пошуку</span>
                      <History size={12} />
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {historyEntries.slice(0, 5).map((entry, i) => (
                        <button
                          key={i}
                          onClick={() => setSearchQuery(entry.query)}
                          className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-medium text-ink-text hover:bg-surface-soft transition-colors text-left"
                        >
                          <span className="truncate">{entry.query}</span>
                          <Clock size={12} className="text-ink-muted opacity-60 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </AnimatedSection>

        {/* ═══ 4. QUICK ACTIONS GRID ═══ */}
        <AnimatedSection delay={150}>
          <div className="grid grid-cols-2 gap-2.5">
            <QuickActionCard
              item={{
                label: 'Живе Метро',
                icon: TrainTrack,
                image: metroIcon,
                imageFallback: metroIconFallback,
                to: '/metro/live',
                gradient: 'bg-gradient-to-br from-blue-500/10 to-indigo-500/10'
              }}
            />
            <QuickActionCard
              item={{
                label: 'Всі Маршрути',
                icon: Navigation,
                image: routesIcon,
                to: '/routes',
                gradient: 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10'
              }}
            />
            <QuickActionCard
              item={{
                label: 'Карта Онлайн',
                icon: MapIcon,
                image: mapIcon,
                to: '/map',
                gradient: 'bg-gradient-to-br from-amber-500/10 to-orange-500/10'
              }}
            />
            <QuickActionCard
              item={{
                label: 'Обране',
                icon: Star,
                image: favoritesIcon,
                to: '/favorites',
                gradient: 'bg-gradient-to-br from-rose-500/10 to-purple-500/10'
              }}
            />
          </div>
        </AnimatedSection>

        {/* ═══ 5. NEAREST METRO WIDGET ═══ */}
        {nearestMetroStation && (
          <AnimatedSection delay={200}>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-4 text-white shadow-xl border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🚇</span>
                  <div>
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Ближча станція</div>
                    <h3 className="text-sm font-black text-white tracking-tight">{nearestMetroStation.name}</h3>
                  </div>
                </div>
                <Link
                  to="/metro/live"
                  className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-[10px] font-bold tracking-wide transition-colors flex items-center gap-1"
                >
                  Табло <ArrowUpRight size={10} />
                </Link>
              </div>

              {isMetroServiceRunning ? (
                <>
                  <MetroTrainVisualizer arrivals={nearestMetroArrivals} lineColor={nearestMetroStation.lineColor} />

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/10">
                    <div className="bg-white/5 rounded-2xl p-2.5 border border-white/5">
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Напрямок 1</div>
                      {metroTrackArrivals.track1 ? (
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold truncate max-w-[80px]">Потяг</span>
                          <CountdownTimer etaSec={metroTrackArrivals.track1.etaSec} />
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Немає даних</span>
                      )}
                    </div>

                    <div className="bg-white/5 rounded-2xl p-2.5 border border-white/5">
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Напрямок 2</div>
                      {metroTrackArrivals.track2 ? (
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold truncate max-w-[80px]">Потяг</span>
                          <CountdownTimer etaSec={metroTrackArrivals.track2.etaSec} />
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Немає даних</span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-3 rounded-2xl bg-white/5 text-center text-xs font-medium text-slate-300">
                  Метрополітен зачинено на нічний перерву
                </div>
              )}
            </div>
          </AnimatedSection>
        )}

        {/* ═══ 6. NOTIFICATIONS SECTION ═══ */}
        <AnimatedSection delay={250}>
          <NotificationsSection />
        </AnimatedSection>

        {/* ═══ 7. NEARBY STOPS ═══ */}
        {nearbyStopsWithDistance.length > 0 && (
          <AnimatedSection delay={300}>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Compass size={16} className="text-primary animate-spin" style={{ animationDuration: '8s' }} />
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-ink-muted">Зупинки поруч</h2>
                </div>
                <button
                  onClick={locate}
                  className="text-[10px] font-extrabold text-primary hover:underline flex items-center gap-1"
                >
                  Оновити <Navigation size={10} />
                </button>
              </div>

              <StaggerContainer>
                {nearbyStopsWithDistance.map((stop, idx) => (
                  <StaggerItem key={stop.id} index={idx}>
                    <Link
                      to={`/map?q=${encodeURIComponent(stop.name)}`}
                      className="group flex items-center justify-between p-3 rounded-2xl bg-surface-raised border border-border/40 hover:border-border shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          <MapPin size={18} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-ink-text truncate">{stop.name}</h4>
                          <span className="text-[10px] text-ink-muted font-medium">~{animatedDistances[idx]} м від вас</span>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-ink-muted group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
          </AnimatedSection>
        )}

        {/* ═══ 8. FAVORITES QUICK BAR ═══ */}
        {(favoriteRouteDetails.length > 0 || favoriteStopDetails.length > 0) && (
          <AnimatedSection delay={350}>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-amber-500 fill-amber-500" />
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-ink-muted">Ваше обране</h2>
                </div>
                <Link to="/favorites" className="text-[10px] font-extrabold text-primary hover:underline">
                  Усі ({favoriteRouteDetails.length + favoriteStopDetails.length})
                </Link>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
                {favoriteRouteDetails.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setActiveRoute(r)}
                    className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-raised border border-border/40 hover:border-primary/50 shadow-sm text-xs font-bold text-ink-text transition-all active:scale-95"
                  >
                    <span>{KIND_ICON[r.kind]}</span>
                    <span>№{r.number}</span>
                  </button>
                ))}
                {favoriteStopDetails.map((s) => (
                  <Link
                    key={s.id}
                    to={`/map?q=${encodeURIComponent(s.name)}`}
                    className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-raised border border-border/40 hover:border-primary/50 shadow-sm text-xs font-bold text-ink-text transition-all active:scale-95"
                  >
                    <MapPin size={12} className="text-primary" />
                    <span className="truncate max-w-[100px]">{s.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </AnimatedSection>
        )}

        {/* ═══ 9. REPORT DELAY CALLOUT ═══ */}
        <AnimatedSection delay={400}>
          <button
            onClick={() => setIsReportDelayOpen(true)}
            className="w-full shine-effect group relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 p-4 text-white shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all text-left"
          >
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 group-hover:rotate-12 transition-transform">
                  <AlertTriangle size={20} className="text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-black tracking-tight">Повідомити про затримку</h4>
                  <p className="text-[10px] font-medium opacity-90 mt-0.5">Допоможіть іншим пасажирам актуальною інформацією</p>
                </div>
              </div>
              <Plus size={18} className="text-white/80 group-hover:scale-125 transition-transform" />
            </div>
          </button>
        </AnimatedSection>

      </div>

      {/* Modals */}
      <ReportDelayModal isOpen={isReportDelayOpen} onClose={() => setIsReportDelayOpen(false)} />
      {activeRoute && <RouteDetailModal route={activeRoute} onClose={() => setActiveRoute(null)} />}
    </div>
  );
}

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
