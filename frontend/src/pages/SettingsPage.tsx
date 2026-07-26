import { useState, type ReactNode } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card, SegmentedControl, Switch, Button, Emblem } from '@/components/ui';
import { useSettingsStore } from '@/store/useSettingsStore';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-caption px-1 text-ink-muted">{title}</h2>
      <Card padding="none" className="divide-y divide-border overflow-hidden">
        {children}
      </Card>
    </section>
  );
}

function Row({ label, hint, control }: { label: string; hint?: string; control: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5">
      <div className="min-w-0">
        <p className="text-body text-ink-text">{label}</p>
        {hint && <p className="text-body-sm text-ink-muted">{hint}</p>}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

export function SettingsPage() {
  const settings = useSettingsStore();
  const [clearing, setClearing] = useState<'idle' | 'done'>('idle');
  const [notifStatus, setNotifStatus] = useState<NotificationPermission | 'unsupported'>(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );

  const handleTogglePush = async () => {
    if (!settings.pushNotificationsEnabled && notifStatus !== 'granted' && typeof Notification !== 'undefined') {
      const result = await Notification.requestPermission();
      setNotifStatus(result);
      if (result !== 'granted') return;
    }
    settings.togglePushNotifications();
  };

  const handleClearCache = async () => {
    await settings.clearCache();
    setClearing('done');
    setTimeout(() => setClearing('idle'), 2000);
  };

  return (
    <div className="min-h-dvh bg-bg pb-24">
      <PageHeader title="Налаштування" />

      <div className="flex flex-col items-center gap-2 px-4 pb-2 pt-1 text-center">
        <Emblem size={48} glow />
        <p className="text-body-sm text-ink-muted">Kharkiv GO · офіційний вигляд транспорту Харкова</p>
      </div>

      <div className="flex flex-col gap-5 px-4 pt-3">
        <Section title="Оформлення">
          <Row
            label="Тема"
            control={
              <SegmentedControl
                value={settings.theme}
                onChange={settings.setTheme}
                options={[
                  { value: 'system', label: 'Авто' },
                  { value: 'light', label: 'Світла' },
                  { value: 'dark', label: 'Темна' }
                ]}
                className="w-44"
              />
            }
          />
          <Row
            label="Стиль карти"
            control={
              <SegmentedControl
                value={settings.mapStyle}
                onChange={settings.setMapStyle}
                options={[
                  { value: 'day', label: 'Денний' },
                  { value: 'night', label: 'Нічний' }
                ]}
                className="w-32"
              />
            }
          />
        </Section>

        <Section title="Мова та одиниці">
          <Row
            label="Мова застосунку"
            control={
              <SegmentedControl
                value={settings.language}
                onChange={settings.setLanguage}
                options={[
                  { value: 'uk', label: 'Українська' },
                  { value: 'en', label: 'English' }
                ]}
                className="w-44"
              />
            }
          />
          <Row
            label="Одиниці виміру"
            control={
              <SegmentedControl
                value={settings.units}
                onChange={settings.setUnits}
                options={[
                  { value: 'metric', label: 'км' },
                  { value: 'imperial', label: 'mi' }
                ]}
                className="w-24"
              />
            }
          />
        </Section>

        <Section title="Сповіщення">
          <Row
            label="Push-сповіщення"
            hint={notifStatus === 'denied' ? 'Заблоковано в налаштуваннях браузера' : 'Про затримки та зміни маршрутів'}
            control={
              <Switch
                checked={settings.pushNotificationsEnabled}
                onChange={handleTogglePush}
                disabled={notifStatus === 'denied'}
                label="Push-сповіщення"
              />
            }
          />
        </Section>

        <Section title="Карта">
          <Row
            label="Зупинки на карті"
            control={<Switch checked={settings.showStopsOnMap} onChange={settings.toggleStopsOnMap} label="Зупинки на карті" />}
          />
          <Row label="3D-будівлі" control={<Switch checked={settings.is3DMode} onChange={settings.toggle3DMode} label="3D-будівлі" />} />
        </Section>

        <Section title="Дані">
          <div className="px-4 py-3.5">
            <Button variant="secondary" size="sm" fullWidth onClick={handleClearCache} disabled={clearing === 'done'}>
              {clearing === 'done' ? 'Кеш очищено ✓' : 'Очистити кеш'}
            </Button>
          </div>
        </Section>
      </div>
    </div>
  );
}
