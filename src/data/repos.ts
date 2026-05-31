import { supabase } from '@/lib/supabase';

import type {
  CategoryInsert,
  RoutineInsert,
  RoutineUpdate,
  TaskInsert,
  TaskStatus,
  TaskUpdate,
} from './types';

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export const tasksRepo = {
  async listByDate(date: string) {
    return unwrap(
      await supabase
        .from('tasks')
        .select('*')
        .eq('due_date', date)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true }),
    );
  },

  async search(term: string) {
    const pattern = `%${term}%`;
    return unwrap(
      await supabase
        .from('tasks')
        .select('*')
        .or(`title.ilike.${pattern},notes.ilike.${pattern}`)
        .order('due_date', { ascending: false })
        .limit(100),
    );
  },

  async create(input: TaskInsert) {
    return unwrap(await supabase.from('tasks').insert(input).select().single());
  },

  async update(id: string, patch: TaskUpdate) {
    return unwrap(await supabase.from('tasks').update(patch).eq('id', id).select().single());
  },

  async setStatus(id: string, status: TaskStatus) {
    return this.update(id, {
      status,
      completed_at: status === 'done' ? new Date().toISOString() : null,
    });
  },

  async remove(id: string) {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  // Bump past-due, unfinished one-off tasks (no routine) up to `today`.
  async rolloverTo(today: string) {
    const { error } = await supabase.rpc('rollover_tasks', { p_today: today });
    if (error) throw new Error(error.message);
  },
};

export const routinesRepo = {
  async list() {
    return unwrap(
      await supabase.from('routines').select('*').order('sort_order', { ascending: true }),
    );
  },

  async listActive() {
    return unwrap(await supabase.from('routines').select('*').eq('active', true));
  },

  async create(input: RoutineInsert) {
    return unwrap(await supabase.from('routines').insert(input).select().single());
  },

  async update(id: string, patch: RoutineUpdate) {
    return unwrap(await supabase.from('routines').update(patch).eq('id', id).select().single());
  },

  async remove(id: string) {
    const { error } = await supabase.from('routines').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  // Materialize today's instances for every active routine that matches `date`.
  async generateFor(date: string) {
    const { error } = await supabase.rpc('generate_routine_tasks', { p_date: date });
    if (error) throw new Error(error.message);
  },
};

export const categoriesRepo = {
  async list() {
    return unwrap(await supabase.from('categories').select('*').order('name'));
  },

  async create(input: CategoryInsert) {
    return unwrap(await supabase.from('categories').insert(input).select().single());
  },

  async remove(id: string) {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};
