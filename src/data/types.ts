import type { Tables, TablesInsert, TablesUpdate } from '@/lib/database.types';

export type Task = Tables<'tasks'>;
export type TaskInsert = TablesInsert<'tasks'>;
export type TaskUpdate = TablesUpdate<'tasks'>;

export type Routine = Tables<'routines'>;
export type RoutineInsert = TablesInsert<'routines'>;
export type RoutineUpdate = TablesUpdate<'routines'>;

export type Category = Tables<'categories'>;
export type CategoryInsert = TablesInsert<'categories'>;

export type TaskStatus = 'todo' | 'doing' | 'done';
export const TASK_STATUSES: TaskStatus[] = ['todo', 'doing', 'done'];
export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To do',
  doing: 'In progress',
  done: 'Done',
};

// 0 = low, 1 = medium, 2 = high
export const PRIORITY_LABELS = ['Low', 'Medium', 'High'];
export const PRIORITY_COLORS = ['#8E8E93', '#208AEF', '#FF3B30'];

export type Recurrence = 'daily' | 'weekly';
