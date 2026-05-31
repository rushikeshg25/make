import { useMemo, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TaskEditor } from '@/components/task-editor';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useCategories, useSetTaskStatus, useTasks } from '@/data/hooks';
import type { Category, Task, TaskStatus } from '@/data/types';
import { PRIORITY_COLORS, STATUS_LABELS, TASK_STATUSES } from '@/data/types';
import { todayISO } from '@/lib/dates';
import { useTheme } from '@/hooks/use-theme';

const COLUMN_WIDTH = Dimensions.get('window').width * 0.8;

export default function BoardScreen() {
  const theme = useTheme();
  const today = todayISO();
  const tasks = useTasks(today);
  const categories = useCategories();
  const setStatus = useSetTaskStatus();

  const [editing, setEditing] = useState<Task | null>(null);

  const categoryById = useMemo(
    () => new Map((categories.data ?? []).map((c) => [c.id, c])),
    [categories.data],
  );

  const columns = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = { todo: [], doing: [], done: [] };
    for (const t of tasks.data ?? []) map[t.status as TaskStatus]?.push(t);
    return map;
  }, [tasks.data]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ThemedText type="subtitle" style={styles.title}>
          Board
        </ThemedText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={COLUMN_WIDTH + Spacing.three}
          contentContainerStyle={styles.columns}>
          {TASK_STATUSES.map((status) => (
            <View key={status} style={[styles.column, { width: COLUMN_WIDTH }]}>
              <View style={styles.columnHeader}>
                <ThemedText type="smallBold">{STATUS_LABELS[status]}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {columns[status].length}
                </ThemedText>
              </View>
              <ScrollView contentContainerStyle={styles.cards}>
                {columns[status].map((task) => (
                  <BoardCard
                    key={task.id}
                    task={task}
                    category={task.category_id ? categoryById.get(task.category_id) : undefined}
                    theme={theme}
                    onPress={() => setEditing(task)}
                    onMove={(to) => setStatus.mutate({ id: task.id, status: to })}
                  />
                ))}
                {columns[status].length === 0 ? (
                  <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
                    Empty
                  </ThemedText>
                ) : null}
              </ScrollView>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>

      {editing ? <TaskEditor task={editing} dueDate={today} onClose={() => setEditing(null)} /> : null}
    </ThemedView>
  );
}

function BoardCard({
  task,
  category,
  theme,
  onPress,
  onMove,
}: {
  task: Task;
  category?: Category;
  theme: ReturnType<typeof useTheme>;
  onPress: () => void;
  onMove: (to: TaskStatus) => void;
}) {
  const idx = TASK_STATUSES.indexOf(task.status as TaskStatus);
  const prev = TASK_STATUSES[idx - 1];
  const next = TASK_STATUSES[idx + 1];

  return (
    <Pressable onPress={onPress} style={[styles.card, { backgroundColor: theme.background }]}>
      <View style={[styles.priorityBar, { backgroundColor: PRIORITY_COLORS[task.priority] }]} />
      <View style={styles.cardBody}>
        <ThemedText numberOfLines={2} style={styles.cardTitle}>
          {task.title}
        </ThemedText>
        {category ? (
          <View style={styles.tagRow}>
            <View style={[styles.dot, { backgroundColor: category.color }]} />
            <ThemedText type="small" themeColor="textSecondary">
              {category.name}
            </ThemedText>
          </View>
        ) : null}
        <View style={styles.moveRow}>
          <Pressable
            hitSlop={8}
            disabled={!prev}
            onPress={() => prev && onMove(prev)}
            style={[styles.moveBtn, { backgroundColor: theme.backgroundSelected, opacity: prev ? 1 : 0.3 }]}>
            <ThemedText type="small">‹</ThemedText>
          </Pressable>
          <Pressable
            hitSlop={8}
            disabled={!next}
            onPress={() => next && onMove(next)}
            style={[styles.moveBtn, { backgroundColor: theme.backgroundSelected, opacity: next ? 1 : 0.3 }]}>
            <ThemedText type="small">›</ThemedText>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  title: { paddingHorizontal: Spacing.four, paddingTop: Spacing.three, paddingBottom: Spacing.two },
  columns: { paddingHorizontal: Spacing.four, gap: Spacing.three },
  column: { borderRadius: 12 },
  columnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  cards: { gap: Spacing.two, paddingBottom: Spacing.five },
  empty: { textAlign: 'center', marginTop: Spacing.four },
  card: { flexDirection: 'row', borderRadius: 12, overflow: 'hidden' },
  priorityBar: { width: 4, alignSelf: 'stretch' },
  cardBody: { flex: 1, padding: Spacing.three, gap: Spacing.two },
  cardTitle: { fontSize: 15, fontWeight: '600' },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  dot: { width: 8, height: 8, borderRadius: 4 },
  moveRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.two },
  moveBtn: { width: 32, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
