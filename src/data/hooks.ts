import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { categoriesRepo, routinesRepo, tasksRepo } from './repos';
import type {
  CategoryInsert,
  RoutineInsert,
  RoutineUpdate,
  TaskInsert,
  TaskStatus,
  TaskUpdate,
} from './types';

export const keys = {
  tasksByDate: (date: string) => ['tasks', 'date', date] as const,
  search: (term: string) => ['tasks', 'search', term] as const,
  routines: ['routines'] as const,
  categories: ['categories'] as const,
};

function invalidateTasks(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['tasks'] });
}

export function useTasks(date: string) {
  return useQuery({
    queryKey: keys.tasksByDate(date),
    queryFn: () => tasksRepo.listByDate(date),
  });
}

export function useTasksSince(date: string) {
  return useQuery({
    queryKey: ['tasks', 'since', date] as const,
    queryFn: () => tasksRepo.listSince(date),
  });
}

export function useSearchTasks(term: string) {
  return useQuery({
    queryKey: keys.search(term),
    queryFn: () => tasksRepo.search(term),
    enabled: term.trim().length > 0,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TaskInsert) => tasksRepo.create(input),
    onSuccess: () => invalidateTasks(qc),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: TaskUpdate }) => tasksRepo.update(id, patch),
    onSuccess: () => invalidateTasks(qc),
  });
}

export function useSetTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      tasksRepo.setStatus(id, status),
    onSuccess: () => invalidateTasks(qc),
  });
}

export function useReorderTasks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) => tasksRepo.setOrder(orderedIds),
    onSuccess: () => invalidateTasks(qc),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksRepo.remove(id),
    onSuccess: () => invalidateTasks(qc),
  });
}

export function useRoutines() {
  return useQuery({ queryKey: keys.routines, queryFn: () => routinesRepo.list() });
}

export function useCreateRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RoutineInsert) => routinesRepo.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.routines }),
  });
}

export function useUpdateRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: RoutineUpdate }) =>
      routinesRepo.update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.routines }),
  });
}

export function useDeleteRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => routinesRepo.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.routines });
      invalidateTasks(qc);
    },
  });
}

export function useCategories() {
  return useQuery({ queryKey: keys.categories, queryFn: () => categoriesRepo.list() });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CategoryInsert) => categoriesRepo.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.categories }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoriesRepo.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.categories }),
  });
}
