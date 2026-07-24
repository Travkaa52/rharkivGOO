import { Route, Routes } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import { TelegramGate } from '@/components/TelegramGate';
import { useTelegramEnvironment } from '@/hooks/useTelegramEnvironment';
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

  return (
    <div className="relative">
      <Routes>
        {/* Карта — головний екран застосунку: користувач одразу потрапляє сюди після відкриття, без затримок на визначення середовища. */}
        <Route path="/" element={<MapPage />} />
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
      {/* Ненав'язливий банер (не блокує UI) — з'являється лише коли підтверджено, що застосунок відкрито поза Telegram. */}
      {telegramStatus === 'outside' && <TelegramGate />}
      <BottomNav />
    </div>
  );
}
