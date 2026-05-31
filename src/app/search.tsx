import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TaskEditor } from '@/components/task-editor';
import { TaskRow } from '@/components/task-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useCategories, useSearchTasks, useSetTaskStatus } from '@/data/hooks';
import type { Task } from '@/data/types';
import { formatLongDate } from '@/lib/dates';
import { useTheme } from '@/hooks/use-theme';

export default function SearchScreen() {
  const theme = useTheme();
  const router = useRouter();
  const setStatus = useSetTaskStatus();
  const categories = useCategories();

  const [input, setInput] = useState('');
  const [term, setTerm] = useState('');
  const [editing, setEditing] = useState<Task | null>(null);

  // Debounce so we don't query on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => setTerm(input.trim()), 250);
    return () => clearTimeout(id);
  }, [input]);

  const results = useSearchTasks(term);
  const categoryById = useMemo(
    () => new Map((categories.data ?? []).map((c) => [c.id, c])),
    [categories.data],
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable hitSlop={10} onPress={() => router.back()}>
            <ThemedText type="link" themeColor="textSecondary">
              ‹ Back
            </ThemedText>
          </Pressable>
        </View>

        <TextInput
          placeholder="Search tasks…"
          placeholderTextColor={theme.textSecondary}
          value={input}
          onChangeText={setInput}
          autoFocus
          style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
        />

        <FlatList
          data={results.data ?? []}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.result}>
              <ThemedText type="small" themeColor="textSecondary">
                {formatLongDate(item.due_date)}
              </ThemedText>
              <TaskRow
                task={item}
                category={item.category_id ? categoryById.get(item.category_id) : undefined}
                onPress={setEditing}
                onToggle={(t) =>
                  setStatus.mutate({
                    id: t.id,
                    status: t.status === 'done' ? 'todo' : 'done',
                    reminderId: t.reminder_notification_id,
                  })
                }
              />
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.two }} />}
          ListEmptyComponent={
            <ThemedText themeColor="textSecondary" style={styles.empty}>
              {term.length === 0 ? 'Type to search your tasks.' : 'No matching tasks.'}
            </ThemedText>
          }
          keyboardShouldPersistTaps="handled"
        />
      </SafeAreaView>

      <TaskEditor
        visible={editing !== null}
        task={editing}
        dueDate={editing?.due_date ?? ''}
        onClose={() => setEditing(null)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: { paddingHorizontal: Spacing.four, paddingTop: Spacing.three },
  input: {
    margin: Spacing.four,
    marginTop: Spacing.two,
    borderRadius: 12,
    padding: Spacing.three,
    fontSize: 16,
  },
  list: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.five },
  result: { gap: Spacing.one },
  empty: { textAlign: 'center', marginTop: Spacing.five },
});
