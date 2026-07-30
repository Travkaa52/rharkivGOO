import { useState } from 'react';
import { Plus, BellRing } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button, EmptyState } from '@/components/ui';
import { ReminderCard } from '@/components/reminder/ReminderCard';
import { ReminderFormSheet } from '@/components/reminder/ReminderFormSheet';
import { useReminderStore } from '@/store/useReminderStore';
import { useSettingsStore } from '@/store/useSettingsStore';

export function RemindersPage() {
  const reminders = useReminderStore((s) => s.reminders);
  const pushEnabled = useSettingsStore((s) => s.pushNotificationsEnabled);
  const togglePush = useSettingsStore((s) => s.togglePushNotifications);
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-surface-soft pb-24">
      <PageHeader
        title="Нагадування про вихід"
        subtitle="Розумний будильник: сам порахує, коли треба вийти з дому"
        action={
          <Button size="sm" icon={<Plus size={16} />} onClick={() => setFormOpen(true)}>
            Нове
          </Button>
        }
      />

      <div className="flex flex-col gap-3 px-4">
        {!pushEnabled && (
          <button
            type="button"
            onClick={togglePush}
            className="flex items-center gap-2.5 rounded-xl2 border border-primary/30 bg-primary/10 px-3.5 py-3 text-left"
          >
            <BellRing size={18} className="shrink-0 text-primary" />
            <span className="text-xs font-semibold text-ink-text">
              Push-сповіщення вимкнено. Увімкніть, щоб отримувати нагадування навіть коли застосунок згорнутий.
            </span>
          </button>
        )}

        {reminders.length === 0 ? (
          <EmptyState
            title="Ще немає нагадувань"
            description="Додайте дім і маршрут — застосунок сам порахує, коли пора виходити."
            action={
              <Button icon={<Plus size={16} />} onClick={() => setFormOpen(true)}>
                Додати нагадування
              </Button>
            }
          />
        ) : (
          reminders.map((reminder) => <ReminderCard key={reminder.id} reminder={reminder} />)
        )}
      </div>

      <ReminderFormSheet open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}
