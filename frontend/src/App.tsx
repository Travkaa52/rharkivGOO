import { Suspense, lazy, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import { TelegramGate } from '@/components/TelegramGate';
import { SplashScreen } from '@/components/SplashScreen';
import { useTelegramEnvironment } from '@/hooks/useTelegramEnvironment';
import { useThemeSync } from '@/hooks/useThemeSync';
import { useAppReady } from '@/hooks/useAppReady';
import { HomePage } from '@/pages/HomePage';

// Важкі екрани (карта тягне за собою maplibre-gl ~800кб, живе метро — власний
// SVG-рушій) підвантажуються лише при переході на них — на мобільному
// з'єднанні це помітно скорочує перше завантаження застосунку (Home більше
// не чекає на завантаження бандла карти).
const MapPage = lazy(() => import('@/pages/MapPage').then((m) => ({ default: m.MapPage })));
const RoutesPage = lazy(() => import('@/pages/RoutesPage').then((m) => ({ default: m.RoutesPage })));
const RouteDetailPage = lazy(() => import('@/pages/RouteDetailPage').then((m) => ({ default: m.RouteDetailPage })));
const TransportKindPage = lazy(() => import('@/pages/TransportKindPage').then((m) => ({ default: m.TransportKindPage })));
const LiveMetroPage = lazy(() => import('@/pages/LiveMetroPage').then((m) => ({ default: m.LiveMetroPage })));
const FavoritesPage = lazy(() => import('@/pages/FavoritesPage').then((m) => ({ default: m.FavoritesPage })));
const HistoryPage = lazy(() => import('@/pages/HistoryPage').then((m) => ({ default: m.HistoryPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));

/** Легкий фолбек під час довантаження екрана — миттєвий, без стрибків макета. */
function RouteFallback() {
  return <div className="min-h-dvh bg-bg" />;
}

export default function App() {
  const telegramStatus = useTelegramEnvironment();
  useThemeSync();

  const appReady = useAppReady();
  // Тримаємо SplashScreen у DOM ще на час animate-splash-out (450ms),
  // інакше React прибере його миттєво і анімація виходу не встигне програтись.
  const [splashMounted, setSplashMounted] = useState(true);

  return (
    <div className="relative">
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
      {/* Ненав'язливий банер (не блокує UI) — з'являється лише коли підтверджено, що застосунок відкрито поза Telegram. */}
      {telegramStatus === 'outside' && <TelegramGate />}
      <BottomNav />

      {splashMounted && (
        <SplashScreen
          leaving={appReady}
          onLeaveEnd={() => setSplashMounted(false)}
        />
      )}
    </div>
  );
}
