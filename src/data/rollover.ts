import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { todayISO } from '@/lib/dates';
import { scheduleTaskReminder } from '@/lib/notifications';

import { routinesRepo, tasksRepo } from './repos';

// On app open (and when returning to the foreground on a new day) we:
//   1. roll unfinished one-off tasks from past dates up to today, and
//   2. materialize today's routine instances.
// Both server functions are idempotent, so running them repeatedly is safe.
export function useDailySetup() {
  const qc = useQueryClient();
  const lastRun = useRef<string | null>(null);

  useEffect(() => {
    async function run() {
      const today = todayISO();
      if (lastRun.current === today) return;
      lastRun.current = today;
      try {
        await tasksRepo.rolloverTo(today);
        await routinesRepo.generateFor(today);
        await scheduleTodaysReminders(today);
        qc.invalidateQueries({ queryKey: ['tasks'] });
      } catch {
        lastRun.current = null; // allow a retry on the next foreground
      }
    }

    run();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') run();
    });
    return () => sub.remove();
  }, [qc]);
}

// Schedule local reminders for today's tasks that have a time but no pending
// notification yet (e.g. instances just generated from a routine).
async function scheduleTodaysReminders(today: string) {
  const tasks = await tasksRepo.listByDate(today);
  for (const task of tasks) {
    if (!task.reminder_time || task.reminder_notification_id || task.status === 'done') continue;
    const id = await scheduleTaskReminder(task);
    if (id) await tasksRepo.update(task.id, { reminder_notification_id: id });
  }
}
