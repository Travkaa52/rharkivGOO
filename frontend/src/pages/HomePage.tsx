import { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Star, 
  ChevronRight, 
  Map as MapIcon, 
  Navigation, 
  Bell, 
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
  ExternalLink
} from 'lucide-react';
import { localRoutes, localStops } from '@/data/localData';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useHistoryStore } from '@/store/useHistoryStore';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useAuthStore } from '@/store/useAuthStore';
import type { TransportKind } from '@/types/transport';

const metroIcon = '/metroicono.png';

const KIND_ICON: Record<TransportKind, string> = {
  metro: '🚇',
  tram: '🚊',
  trolleybus: '🚎',
  bus: '🚌'
};

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

export function HomePage() {
  const profile = useAuthStore((s) => s.profile);
  const favoriteRoutes = useFavoritesStore((s) => s.routes);
  const favoriteStops = useFavoritesStore((s) => s.stops);
  const { position, locate } = useGeolocation();
  
  const historyEntries = useHistoryStore((s) => s.entries);
  const addHistoryEntry = useHistoryStore((s) => s.addEntry);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Real-time clock & date
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

  // Search results calculation across routes, stops and metro
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { routes: [], stops: [], metro: [] };
    const q = searchQuery.toLowerCase().trim();

    const matchedRoutes = localRoutes.search(q).slice(0, 4);
    const matchedStops = localStops.search(q).slice(0, 4);
    
    // Search metro stations from routes/stops where kind is metro
    const matchedMetro: Array<{ id: string; name: string; lineName?: string }> = [];
    try {
      const allRoutes = localRoutes.search(q) || [];
      for (const r of allRoutes) {
        if (r.kind === 'metro') {
          matchedMetro.push({ id: r.id, name: r.name, lineName: r.number });
        }
      }
    } catch {
      // fallback
    }

    return {
      routes: matchedRoutes,
      stops: matchedStops,
      metro: matchedMetro.slice(0, 3)
    };
  }, [searchQuery]);

  const hasSearchResults = searchResults.routes.length > 0 || searchResults.stops.length > 0 || searchResults.metro.length > 0;

  // Favorites data
  const favoriteRouteDetails = useMemo(
    () => favoriteRoutes.map((f) => localRoutes.getById(f.routeId)).filter((r): r is NonNullable<typeof r> => !!r),
    [favoriteRoutes]
  );
  const favoriteStopDetails = useMemo(
    () => favoriteStops.map((f) => localStops.getById(f.stopId)).filter((s): s is NonNullable<typeof s> => !!s),
    [favoriteStops]
  );

  // Nearby stops
  const nearbyStopsWithDistance = useMemo(() => {
    if (!position) return [];
    const stops = localStops.getNearby(position.lat, position.lng, 1500).slice(0, 4);
    return stops.map((stop) => ({
      ...stop,
      distance: calculateDistanceMeters(position.lat, position.lng, stop.position.lat, stop.position.lng)
    }));
  }, [position]);

  const hour = currentTime.getHours();
  const greeting = hour < 6 ? 'Доброї ночі' : hour < 12 ? 'Доброго ранку' : hour < 18 ? 'Доброго дня' : 'Доброго вечора';
  const displayName = profile?.displayName || profile?.username || 'Гість';

  return (
    <div className="relative min-h-dvh bg-[#F8FAFC] pb-32 pt-[max(0.75rem,env(safe-area-inset-top))] text-slate-900 overflow-x-hidden font-sans antialiased selection:bg-emerald-500 selection:text-white">
      
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-md px-4 space-y-4">
        
        {/* 1. UPPER HEADER */}
        <header className="flex items-center justify-between pt-1 pb-1 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 font-black text-base tracking-tighter">
              GO
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-tight text-slate-900">
                  Kharkiv <span className="text-emerald-600">GO</span>
                </span>
                <span className="px-2 py-0.5 text-[9px] font-extrabold bg-emerald-500/10 text-emerald-700 rounded-full border border-emerald-500/20">
                  PRO
                </span>
              </div>
              <h1 className="text-lg font-black text-slate-900 mt-0.5 tracking-tight truncate max-w-[190px]">
                {greeting}, {displayName}! 👋
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden xs:flex flex-col items-end text-right mr-1">
              <span className="text-xs font-bold text-slate-800">{formattedTimeStr}</span>
              <span className="text-[10px] font-medium text-slate-400 capitalize">{formattedDate}</span>
            </div>
            
            <Link 
              to="/notifications"
              aria-label="Сповіщення"
              className="relative p-2.5 rounded-2xl bg-white border border-slate-100 hover:bg-slate-50 transition-all active:scale-95 text-slate-700 shadow-xs"
            >
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            </Link>

            <Link 
              to="/profile"
              aria-label="Налаштування"
              className="p-2.5 rounded-2xl bg-white border border-slate-100 hover:bg-slate-50 transition-all active:scale-95 text-slate-700 shadow-xs"
            >
              <Settings size={18} />
            </Link>
          </div>
        </header>

        {/* 2. ADVANCED REAL-TIME SEARCH BAR */}
        <div className="relative z-30">
          <div className={`relative flex items-center bg-white rounded-[22px] border transition-all duration-200 shadow-sm ${
            isSearchFocused ? 'border-emerald-500 ring-4 ring-emerald-500/10 shadow-md' : 'border-slate-100 hover:border-slate-200'
          }`}>
            <div className="pl-4 pr-2 text-slate-400">
              <SearchIcon size={18} />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="Пошук маршруту, зупинки, метро..."
              className="w-full py-3.5 pr-4 text-xs font-semibold text-slate-800 bg-transparent outline-none placeholder:text-slate-400 placeholder:font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-2 mr-2 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Search Dropdown Results Panel */}
          {isSearchFocused && searchQuery.trim().length > 0 && (
            <>
              {/* Backdrop to close search */}
              <div 
                className="fixed inset-0 z-20 bg-slate-900/20 backdrop-blur-xs"
                onClick={() => setIsSearchFocused(false)}
              />
              
              <div className="absolute left-0 right-0 top-14 z-30 bg-white rounded-[22px] border border-slate-100 shadow-2xl p-3 max-h-[380px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                {!hasSearchResults ? (
                  <div className="py-8 text-center">
                    <p className="text-xs font-bold text-slate-700 mb-1">Нічого не знайдено</p>
                    <p className="text-[11px] text-slate-400">Спробуйте змінити запит</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Routes */}
                    {searchResults.routes.length > 0 && (
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 mb-1.5">Маршрути</div>
                        <div className="space-y-1">
                          {searchResults.routes.map((r) => (
                            <Link
                              key={r.id}
                              to={`/routes/${r.id}`}
                              onClick={() => {
                                setIsSearchFocused(false);
                                addHistoryEntry({ query: `Маршрут ${r.number}`, type: 'route' });
                              }}
                              className="flex items-center justify-between p-2 rounded-xl hover:bg-emerald-50 transition-colors group"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="text-sm">{KIND_ICON[r.kind]}</span>
                                <span className="font-bold text-xs text-slate-800 group-hover:text-emerald-900">{r.number} — {r.name}</span>
                              </div>
                              <ChevronRight size={14} className="text-slate-400" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Stops */}
                    {searchResults.stops.length > 0 && (
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 mb-1.5">Зупинки</div>
                        <div className="space-y-1">
                          {searchResults.stops.map((s) => (
                            <Link
                              key={s.id}
                              to={`/map?q=${encodeURIComponent(s.name)}`}
                              onClick={() => {
                                setIsSearchFocused(false);
                                addHistoryEntry({ query: s.name, type: 'stop' });
                              }}
                              className="flex items-center justify-between p-2 rounded-xl hover:bg-emerald-50 transition-colors group"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">🚏</span>
                                <span className="font-bold text-xs text-slate-800 group-hover:text-emerald-900">{s.name}</span>
                              </div>
                              <ChevronRight size={14} className="text-slate-400" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Metro Stations */}
                    {searchResults.metro.length > 0 && (
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 mb-1.5">Метро</div>
                        <div className="space-y-1">
                          {searchResults.metro.map((m) => (
                            <Link
                              key={m.id}
                              to={`/metro/live`}
                              onClick={() => {
                                setIsSearchFocused(false);
                                addHistoryEntry({ query: m.name, type: 'route' });
                              }}
                              className="flex items-center justify-between p-2 rounded-xl hover:bg-emerald-50 transition-colors group"
                            >
                              <div className="flex items-center gap-2.5">
                                <img src={metroIcon} alt="Метро" className="w-6 h-6 rounded-lg object-contain bg-amber-100 p-0.5" />
                                <div>
                                  <span className="font-bold text-xs text-slate-800 group-hover:text-emerald-900 block">{m.name}</span>
                                  {m.lineName && <span className="text-[10px] text-slate-400">{m.lineName}</span>}
                                </div>
                              </div>
                              <ChevronRight size={14} className="text-slate-400" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* 3. QUICK ACTIONS GRID (2x2) */}
        <section className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {[
            { label: 'Маршрути', icon: Navigation, to: '/routes', color: 'bg-blue-50 text-blue-600 border-blue-100', isImage: false },
            { label: 'Карта', icon: MapIcon, to: '/map', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', isImage: false },
            { label: 'Метро', icon: null, to: '/metro/live', color: 'bg-amber-50 text-amber-600 border-amber-100', isImage: true },
            { label: 'Обране', icon: Star, to: '/favorites', color: 'bg-purple-50 text-purple-600 border-purple-100', isImage: false },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                key={index}
                to={item.to}
                className="bg-white rounded-[22px] p-4 flex items-center gap-3.5 border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 active:scale-[0.98] transition-all duration-200 group"
              >
                <div className={`w-11 h-11 rounded-2xl ${item.color} border flex items-center justify-center transition-transform group-hover:scale-110 shadow-2xs`}>
                  {item.isImage ? (
                    <img src={metroIcon} alt="Метро" className="w-6 h-6 object-contain" />
                  ) : (
                    Icon && <Icon size={21} />
                  )}
                </div>
                <span className="font-extrabold text-slate-800 text-xs tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </section>

        {/* 4. LIVE METRO CARD */}
        <section className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 text-white p-5 shadow-xl shadow-emerald-900/10 transition-transform duration-300">
          <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
              <span className="text-[11px] font-bold tracking-wide uppercase">Метро онлайн</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold bg-white/10 px-2.5 py-1 rounded-full text-emerald-100">
              <CheckCircle2 size={13} className="text-emerald-300" />
              <span>Працює штатно</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-[18px] p-3.5 border border-white/10">
              <div className="text-2xl font-black tracking-tight">3</div>
              <div className="text-[11px] text-emerald-100 font-medium">Діючі лінії</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-[18px] p-3.5 border border-white/10">
              <div className="text-2xl font-black tracking-tight">30</div>
              <div className="text-[11px] text-emerald-100 font-medium">Станцій всього</div>
            </div>
          </div>

          <Link
            to="/metro/live"
            className="w-full py-3.5 px-4 bg-white text-emerald-900 rounded-[18px] font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg hover:bg-emerald-50 active:scale-[0.98] transition-all duration-200"
          >
            <img src={metroIcon} alt="Метро" className="w-4 h-4 object-contain" />
            <span>Відкрити карту метро</span>
            <ArrowUpRight size={16} className="text-emerald-700" />
          </Link>
        </section>

        {/* 5. NEAREST STOPS WITH GEO PERMISSION/STATE */}
        <section className="bg-white rounded-[22px] p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <Navigation size={16} />
              </div>
              <h2 className="font-extrabold text-slate-900 text-xs">Ближайшие остановки</h2>
            </div>
            <Link 
              to="/map"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 active:scale-95 transition-transform"
            >
              <span>На карті</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          {!position ? (
            <div className="flex flex-col items-center justify-center py-6 text-center bg-slate-50 rounded-[18px] border border-dashed border-slate-200 px-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
                <Compass size={20} className="animate-spin" />
              </div>
              <p className="text-xs font-bold text-slate-800 mb-1">Геолокація вимкнена або не дозволена</p>
              <p className="text-[11px] text-slate-400 mb-3 max-w-[240px]">Увімкніть доступ до GPS, щоб бачити зупинки поруч з вами</p>
              <button
                onClick={() => locate()}
                className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-emerald-700 active:scale-95 transition-all inline-flex items-center gap-1.5"
              >
                <MapPin size={14} />
                <span>Увімкнути геолокацію</span>
              </button>
            </div>
          ) : nearbyStopsWithDistance.length === 0 ? (
            <div className="py-4 text-center bg-slate-50 rounded-[18px] border border-slate-100">
              <p className="text-xs font-medium text-slate-500">Поблизу зупинок не знайдено</p>
            </div>
          ) : (
            <div className="space-y-2">
              {nearbyStopsWithDistance.map((stop) => (
                <Link
                  key={stop.id}
                  to={`/map?q=${encodeURIComponent(stop.name)}`}
                  onClick={() => addHistoryEntry({ query: stop.name, type: 'stop' })}
                  className="flex items-center justify-between p-3 rounded-[18px] bg-slate-50 hover:bg-emerald-50/50 transition-colors border border-transparent hover:border-emerald-100 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white shadow-xs flex items-center justify-center text-emerald-600 font-bold text-xs shrink-0 border border-slate-100">
                      🚏
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 text-xs truncate group-hover:text-emerald-900">{stop.name}</div>
                      <div className="text-[10px] text-slate-400 font-medium">Зупинка громадського транспорту</div>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100/70 px-3 py-1 rounded-full shrink-0">
                    {formatDistance(stop.distance)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* 6. FAVORITES SECTION */}
        <section className="bg-white rounded-[22px] p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-50 text-amber-600 rounded-xl">
                <Star size={16} className="fill-amber-400 text-amber-400" />
              </div>
              <h2 className="font-extrabold text-slate-900 text-xs">Обране</h2>
            </div>
            {(favoriteRouteDetails.length > 0 || favoriteStopDetails.length > 0) && (
              <Link to="/favorites" className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-0.5">
                <span>Усі ({favoriteRouteDetails.length + favoriteStopDetails.length})</span>
                <ChevronRight size={14} />
              </Link>
            )}
          </div>

          {favoriteRouteDetails.length === 0 && favoriteStopDetails.length === 0 ? (
            <div className="text-center py-6 px-4 bg-slate-50 rounded-[18px] border border-dashed border-slate-200">
              <div className="text-2xl mb-1">⭐</div>
              <p className="text-xs font-extrabold text-slate-800 mb-1">У вас ще немає обраного</p>
              <p className="text-[11px] text-slate-400 mb-3 max-w-[220px]">Закріплюйте маршрути та зупинки для швидкого доступу</p>
              <Link 
                to="/routes"
                className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-emerald-700 active:scale-95 transition-all inline-flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>Додати маршрути</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {favoriteRouteDetails.slice(0, 3).map((r) => (
                <Link
                  key={r.id}
                  to={`/routes/${r.id}`}
                  onClick={() => addHistoryEntry({ query: `Маршрут ${r.number}`, type: 'route' })}
                  className="flex items-center justify-between p-3 rounded-[18px] bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {r.kind === 'metro' ? (
                      <img src={metroIcon} alt="Метро" className="w-5 h-5 object-contain" />
                    ) : (
                      <span className="text-base">{KIND_ICON[r.kind]}</span>
                    )}
                    <div className="truncate">
                      <span className="font-extrabold text-slate-800 text-xs truncate block">{r.number} — {r.name}</span>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-400 shrink-0" />
                </Link>
              ))}

              {favoriteStopDetails.slice(0, 2).map((s) => (
                <Link
                  key={s.id}
                  to={`/map?q=${encodeURIComponent(s.name)}`}
                  onClick={() => addHistoryEntry({ query: s.name, type: 'stop' })}
                  className="flex items-center justify-between p-3 rounded-[18px] bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">🚏</span>
                    <span className="font-extrabold text-slate-800 text-xs truncate">{s.name}</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-400 shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* 7. RECENT HISTORY SECTION */}
        {historyEntries.length > 0 && (
          <section className="bg-white rounded-[22px] p-4 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-slate-100 text-slate-700 rounded-xl">
                  <History size={16} />
                </div>
                <h2 className="font-extrabold text-slate-900 text-xs">Останні переглянуті</h2>
              </div>
            </div>

            <div className="space-y-1.5 max-h-52 overflow-y-auto no-scrollbar">
              {historyEntries.slice(0, 5).map((entry, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-[16px] bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Clock size={14} className="text-slate-400 shrink-0" />
                    <span className="font-bold text-xs text-slate-800 truncate">{entry.query}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Щойно</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 8. TRANSPORT NEWS & ANNOUNCEMENTS */}
        <section className="bg-white rounded-[22px] p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-xl">
              <AlertCircle size={16} />
            </div>
            <h2 className="font-extrabold text-slate-900 text-xs">Новини транспорту</h2>
          </div>

          <div className="p-3.5 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-[18px] border border-blue-100/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-700">Офіційно</span>
              <span className="text-[10px] font-semibold text-slate-400">Сьогодні, 08:00</span>
            </div>
            <h3 className="font-extrabold text-slate-900 text-xs">Зміни в розкладі рухів тролейбусів у місті</h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Інформація щодо оновлення маршрутів громадського транспорту Харкова в умовах воєнного стану.
            </p>
            <div className="pt-1">
              <button 
                onClick={() => alert('Детальна інформація доступна в офіційному Telegram каналі Kharkiv GO.')}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                <span>Детальніше</span>
                <ExternalLink size={13} />
              </button>
            </div>
          </div>
        </section>

        {/* 9. FOOTER */}
        <footer className="text-center py-4 space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700">
            <span>Kharkiv GO</span>
            <span>•</span>
            <span className="text-emerald-600">v1.3.0 Pro</span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">Найнадійніший міський навігатор Харкова</p>
        </footer>

      </div>
    </div>
  );
}
