import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Task } from '@/data/types';

let configured = false;

async function configure() {
  if (configured) return;
  configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Task reminders',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
}

export async function cancelReminder(id: string | null | undefined) {
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // already fired or unknown id — nothing to do
  }
}

// Schedule a one-off reminder for `task` on its due date at reminder_time.
// Returns the notification id, or null if nothing was scheduled (no time set,
// task already done, time already passed, or permission denied).
export async function scheduleTaskReminder(task: Task): Promise<string | null> {
  if (!task.reminder_time || task.status === 'done') return null;

  const [h, m] = task.reminder_time.split(':').map(Number);
  const when = new Date(`${task.due_date}T00:00:00`);
  when.setHours(h, m, 0, 0);
  if (when.getTime() <= Date.now()) return null;

  await configure();
  if (!(await ensurePermission())) return null;

  return Notifications.scheduleNotificationAsync({
    content: { title: 'Task reminder', body: task.title },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: when,
      channelId: 'reminders',
    },
  });
}
