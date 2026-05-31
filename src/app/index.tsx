import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TaskEditor } from '@/components/task-editor';
import { TaskRow } from '@/components/task-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import {
  useCategories,
  useCreateTask,
  useReorderTasks,
  useSetTaskStatus,
  useTasks,
} from '@/data/hooks';
import { useDailySetup } from '@/data/rollover';
import type { Task } from '@/data/types';
import { formatLongDate, todayISO } from '@/lib/dates';
import { quoteForDate } from '@/lib/quotes';
import { useTheme } from '@/hooks/use-theme';

export default function TodayScreen() {
  useDailySetup();
  const theme = useTheme();
  const router = useRouter();
  const today = todayISO();

  const tasks = useTasks(today);
  const categories = useCategories();
  const createTask = useCreateTask();
  const setStatus = useSetTaskStatus();
  const reorderTasks = useReorderTasks();

  const [quickAdd, setQuickAdd] = useState('');
  const [editing, setEditing] = useState<Task | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [order, setOrder] = useState<Task[]>([]);

  const categoryById = useMemo(
    () => new Map((categories.data ?? []).map((c) => [c.id, c])),
    [categories.data],
  );

  const quote = quoteForDate(today);
  const items = tasks.data ?? [];
  const doneCount = items.filter((t) => t.status === 'done').length;

  function openEditor(task: Task | null) {
    setEditing(task);
    setEditorOpen(true);
  }

  function startReorder() {
    setOrder(items);
    setReordering(true);
  }

  function finishReorder() {
    setReordering(false);
    reorderTasks.mutate(order.map((t) => t.id));
  }

  function move(index: number, dir: -1 | 1) {
    setOrder((prev) => {
      const j = index + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  }

  async function submitQuickAdd() {
    const title = quickAdd.trim();
    if (!title) return;
    setQuickAdd('');
    await createTask.mutateAsync({ title, due_date: today });
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <View>
            <ThemedText type="subtitle">Today</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {formatLongDate(today)}
            </ThemedText>
          </View>
          <View style={styles.headerActions}>
            {items.length > 1 ? (
              <Pressable
                hitSlop={10}
                onPress={reordering ? finishReorder : startReorder}
                style={[styles.iconBtn, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="smallBold">{reordering ? 'Done' : '↕'}</ThemedText>
              </Pressable>
            ) : null}
            <Pressable
              hitSlop={10}
              onPress={() => router.push('/search')}
              style={[styles.iconBtn, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText style={{ fontSize: 18 }}>🔍</ThemedText>
            </Pressable>
          </View>
        </View>

        <FlatList
          data={reordering ? order : items}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <View style={[styles.quote, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText style={styles.quoteText}>“{quote.text}”</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  — {quote.author}
                </ThemedText>
              </View>
              {items.length > 0 ? (
                <ThemedText type="smallBold" themeColor="textSecondary">
                  {doneCount}/{items.length} done
                </ThemedText>
              ) : null}
            </View>
          }
          renderItem={({ item, index }) => (
            <TaskRow
              task={item}
              category={item.category_id ? categoryById.get(item.category_id) : undefined}
              onPress={reordering ? () => {} : openEditor}
              onToggle={
                reordering
                  ? () => {}
                  : (t) =>
                      setStatus.mutate({
                        id: t.id,
                        status: t.status === 'done' ? 'todo' : 'done',
                        reminderId: t.reminder_notification_id,
                      })
              }
              rightSlot={
                reordering ? (
                  <View style={styles.reorderControls}>
                    <Pressable
                      hitSlop={6}
                      disabled={index === 0}
                      onPress={() => move(index, -1)}
                      style={[
                        styles.reorderBtn,
                        { backgroundColor: theme.backgroundSelected, opacity: index === 0 ? 0.3 : 1 },
                      ]}>
                      <ThemedText type="smallBold">▲</ThemedText>
                    </Pressable>
                    <Pressable
                      hitSlop={6}
                      disabled={index === order.length - 1}
                      onPress={() => move(index, 1)}
                      style={[
                        styles.reorderBtn,
                        {
                          backgroundColor: theme.backgroundSelected,
                          opacity: index === order.length - 1 ? 0.3 : 1,
                        },
                      ]}>
                      <ThemedText type="smallBold">▼</ThemedText>
                    </Pressable>
                  </View>
                ) : undefined
              }
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.two }} />}
          ListEmptyComponent={
            tasks.isLoading ? null : (
              <ThemedText themeColor="textSecondary" style={styles.empty}>
                Nothing planned yet. Add your first task below.
              </ThemedText>
            )
          }
        />

        <View style={[styles.quickAddBar, { backgroundColor: theme.backgroundElement }]}>
          <TextInput
            placeholder="Quick add a task…"
            placeholderTextColor={theme.textSecondary}
            value={quickAdd}
            onChangeText={setQuickAdd}
            onSubmitEditing={submitQuickAdd}
            returnKeyType="done"
            style={[styles.quickInput, { color: theme.text }]}
          />
          <Pressable
            hitSlop={8}
            onPress={() => openEditor(null)}
            style={[styles.detailBtn, { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText type="smallBold">＋ Details</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>

      <TaskEditor
        visible={editorOpen}
        task={editing}
        dueDate={today}
        onClose={() => setEditorOpen(false)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  headerActions: { flexDirection: 'row', gap: Spacing.two },
  iconBtn: { minWidth: 40, height: 40, paddingHorizontal: Spacing.two, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  reorderControls: { flexDirection: 'row', gap: Spacing.one },
  reorderBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.five },
  listHeader: { gap: Spacing.three, marginBottom: Spacing.three },
  quote: { padding: Spacing.three, borderRadius: 12, gap: Spacing.one },
  quoteText: { fontSize: 16, fontStyle: 'italic', lineHeight: 22 },
  empty: { textAlign: 'center', marginTop: Spacing.five },
  quickAddBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.four,
    marginTop: 0,
    borderRadius: 12,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.two,
    gap: Spacing.two,
  },
  quickInput: { flex: 1, paddingVertical: Spacing.three, fontSize: 16 },
  detailBtn: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: 10 },
});
