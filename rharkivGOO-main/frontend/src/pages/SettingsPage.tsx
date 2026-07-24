import { PageHeader } from '@/components/PageHeader';
import { useSettingsStore } from '@/store/useSettingsStore';
import type { AppSettings } from '@/types/user';

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-xl2 bg-white/90 px-4 py-3 shadow-glass">
      <span className="text-sm text-graphite">{label}</span>
      {children}
    </div>
  );
}

export function SettingsPage() {
  const settings = useSettingsStore();

  return (
    <div className="min-h-dvh bg-surface-soft pb-20">
      <PageHeader title="Налаштування" />
      <div className="flex flex-col gap-2 px-4">
        <SettingRow label="Тема оформлення">
          <select
            value={settings.theme}
            onChange={(e) => settings.setTheme(e.target.value as AppSettings['theme'])}
            className="rounded-full bg-surface-soft px-3 py-1 text-sm"
          >
            <option value="system">Системна</option>
            <option value="light">Світла</option>
            <option value="dark">Темна</option>
          </select>
        </SettingRow>

        <SettingRow label="Стиль карти">
          <select
            value={settings.mapStyle}
            onChange={(e) => settings.setMapStyle(e.target.value as AppSettings['mapStyle'])}
            className="rounded-full bg-surface-soft px-3 py-1 text-sm"
          >
            <option value="day">Денний</option>
            <option value="night">Нічний</option>
          </select>
        </SettingRow>

        <SettingRow label="Мова">
          <select
            value={settings.language}
            onChange={(e) => settings.setLanguage(e.target.value as AppSettings['language'])}
            className="rounded-full bg-surface-soft px-3 py-1 text-sm"
          >
            <option value="uk">Українська</option>
            <option value="ru">Русский</option>
            <option value="en">English</option>
          </select>
        </SettingRow>

        <SettingRow label="Push-сповіщення">
          <button
            onClick={settings.togglePushNotifications}
            className={`h-6 w-11 rounded-full transition ${settings.pushNotificationsEnabled ? 'bg-forest' : 'bg-graphite/20'}`}
          >
            <span
              className={`block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${
                settings.pushNotificationsEnabled ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </SettingRow>
      </div>
    </div>
  );
}
