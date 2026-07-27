import { Suspense, lazy, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import { TelegramGate } from '@/components/TelegramGate';
import { SplashScreen } from '@/components/SplashScreen';
import { useTelegramEnvironment } from '@/hooks/useTelegramEnvironment';
import { useThemeSync } from '@/hooks/useThemeSync';
import { useAppReady } from '@/hooks/useAppReady';
import { HomePage } from '@/pages/HomePage';

// Важкі екрани підвантажуються динамічно, щоб скоротити час первинного завантаження застосунку
const MapPage = lazy(() => import('@/pages/MapPage').then((m) => ({ default: m.MapPage })));
const RoutesPage = lazy(() => import('@/pages/RoutesPage').then((m) => ({ default: m.RoutesPage })));
const RouteDetailPage = lazy(() => import('@/pages/RouteDetailPage').then((m) => ({ default: m.RouteDetailPage })));
const TransportKindPage = lazy(() => import('@/pages/TransportKindPage').then((m) => ({ default: m.TransportKindPage })));
const LiveMetroPage = lazy(() => import('@/pages/LiveMetroPage').then((m) => ({ default: m.LiveMetroPage })));
const FavoritesPage = lazy(() => import('@/pages/FavoritesPage').then((m) => ({ default: m.FavoritesPage })));
const HistoryPage = lazy(() => import('@/pages/HistoryPage').then((m) => ({ default: m.HistoryPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));

/**
 * Преміальний легкий фолбек під час довантаження чанків —
 * миттєвий, без стрибків макета та з елегантним неоновим індикатором.
 */
function RouteFallback() {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-bg">
      <div className="relative flex items-center justify-center">
        {/* Ambient glow effect */}
        <div className="absolute h-16 w-16 rounded-full bg-primary/20 blur-xl animate-pulse" />
        {/* Animated spinner ring */}
        <div className="h-8 w-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      </div>
    </div>
  );
}

export default function App() {
  const telegramStatus = useTelegramEnvironment();
  useThemeSync();

  const appReady = useAppReady();
  // Тримаємо SplashScreen у DOM ще на час animate-splash-out (450ms),
  // інакше React прибере його миттєво і анімація виходу не встигне програтись.
  const [splashMounted, setSplashMounted] = useState(true);

  return (
    <div className="relative min-h-dvh w-full overflow-x-hidden bg-bg text-ink-text antialiased selection:bg-primary/20">
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Головна — дашборд (обране/поруч/швидкі дії); Карта — окремий повноекранний маршрут. */}
          <Route path="/" element={<HomePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/routes" element={<RoutesPage />} />
          <Route path="/routes/:routeId" element={<RouteDetailPage />} />
          <Route path="/metro" element={<TransportKindPage kind="metro" />} />
          <Route path="/metro/live" element={<LiveMetroPage />} />
          <Route path="/trams" element={<TransportKindPage kind="tram" />} />
          <Route path="/trolleybuses" element={<TransportKindPage kind="trolleybus" />} />
          <Route path="/buses" element={<TransportKindPage kind="bus" />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </Suspense>

      {/* Ненав'язливий банер — з'являється лише коли підтверджено, що застосунок відкрито поза Telegram */}
      {telegramStatus === 'outside' && <TelegramGate />}

      {/* Нижня панель навігації */}
      <BottomNav />

      {/* Сплеш-скрін з анімацією закриття */}
      {splashMounted && (
        <SplashScreen
          leaving={appReady}
          onLeaveEnd={() => setSplashMounted(false)}
        />
      )}
    </div>
  );
}
