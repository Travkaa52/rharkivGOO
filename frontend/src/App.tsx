import { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import { TelegramGate } from '@/components/TelegramGate';
import { SplashScreen } from '@/components/SplashScreen';
import { useTelegramEnvironment } from '@/hooks/useTelegramEnvironment';
import { useThemeSync } from '@/hooks/useThemeSync';
import { useAppReady } from '@/hooks/useAppReady';
import { MapPage } from '@/pages/MapPage';
import { HomePage } from '@/pages/HomePage';
import { RoutesPage } from '@/pages/RoutesPage';
import { RouteDetailPage } from '@/pages/RouteDetailPage';
import { TransportKindPage } from '@/pages/TransportKindPage';
import { LiveMetroPage } from '@/pages/LiveMetroPage';
import { FavoritesPage } from '@/pages/FavoritesPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ProfilePage } from '@/pages/ProfilePage';

export default function App() {
  const telegramStatus = useTelegramEnvironment();
  useThemeSync();

  const appReady = useAppReady();
  // Тримаємо SplashScreen у DOM ще на час animate-splash-out (450ms),
  // інакше React прибере його миттєво і анімація виходу не встигне програтись.
  const [splashMounted, setSplashMounted] = useState(true);

  return (
    <div className="relative">
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
