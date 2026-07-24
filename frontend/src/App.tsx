import { Route, Routes } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import { TelegramGate } from '@/components/TelegramGate';
import { useTelegramEnvironment } from '@/hooks/useTelegramEnvironment';
import { HomePage } from '@/pages/HomePage';
import { MapPage } from '@/pages/MapPage';
import { RoutesPage } from '@/pages/RoutesPage';
import { RouteDetailPage } from '@/pages/RouteDetailPage';
import { TransportKindPage } from '@/pages/TransportKindPage';
import { FavoritesPage } from '@/pages/FavoritesPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ProfilePage } from '@/pages/ProfilePage';

export default function App() {
  const telegramStatus = useTelegramEnvironment();

  // Основний інтерфейс не монтується, доки не підтверджено середовище Telegram.
  if (telegramStatus === 'checking') {
    return <div className="h-dvh w-full bg-forest" aria-hidden="true" />;
  }

  if (telegramStatus === 'outside') {
    return <TelegramGate />;
  }

  return (
    <div className="relative">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/routes" element={<RoutesPage />} />
        <Route path="/routes/:routeId" element={<RouteDetailPage />} />
        <Route path="/metro" element={<TransportKindPage kind="metro" />} />
        <Route path="/trams" element={<TransportKindPage kind="tram" />} />
        <Route path="/trolleybuses" element={<TransportKindPage kind="trolleybus" />} />
        <Route path="/buses" element={<TransportKindPage kind="bus" />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
      <BottomNav />
    </div>
  );
}
