import type { Task } from '@/data/types';

import { addDaysISO } from './dates';

export type DayStat = { date: string; total: number; done: number };
export type Stats = {
  days: DayStat[]; // oldest -> newest, length = `days`
  streak: number;
  completed: number;
  total: number;
};

// Build per-day completion for the last `days` days plus the current streak of
// fully-completed days. A day with no tasks is a neutral "rest day": it neither
// adds to nor breaks the streak. Today is also neutral until everything is done.
export function computeStats(tasks: Task[], today: string, days: number): Stats {
  const byDay = new Map<string, DayStat>();
  for (const t of tasks) {
    const s = byDay.get(t.due_date) ?? { date: t.due_date, total: 0, done: 0 };
    s.total += 1;
    if (t.status === 'done') s.done += 1;
    byDay.set(t.due_date, s);
  }

  const series: DayStat[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = addDaysISO(today, -i);
    series.push(byDay.get(date) ?? { date, total: 0, done: 0 });
  }

  let streak = 0;
  for (let i = 0; i < days; i++) {
    const date = addDaysISO(today, -i);
    const s = byDay.get(date);
    if (!s || s.total === 0) continue; // rest day: neutral
    if (s.done === s.total) {
      streak += 1;
    } else if (i === 0) {
      continue; // today still in progress
    } else {
      break;
    }
  }

  const completed = tasks.filter((t) => t.status === 'done').length;
  return { days: series, streak, completed, total: tasks.length };
}
