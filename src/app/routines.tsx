import { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RoutineEditor } from '@/components/routine-editor';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useRoutines,
  useUpdateRoutine,
} from '@/data/hooks';
import type { Routine } from '@/data/types';
import { PRIORITY_COLORS } from '@/data/types';
import { WEEKDAY_LABELS } from '@/lib/dates';
import { useTheme } from '@/hooks/use-theme';

const SWATCHES = ['#208AEF', '#FF3B30', '#34C759', '#FF9500', '#AF52DE', '#5AC8FA'];

function recurrenceSummary(r: Routine): string {
  if (r.recurrence === 'daily') return 'Every day';
  if (r.weekdays.length === 0) return 'Weekly';
  return r.weekdays.map((d) => WEEKDAY_LABELS[d]).join(', ');
}

export default function RoutinesScreen() {
  const theme = useTheme();
  const routines = useRoutines();
  const categories = useCategories();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const updateRoutine = useUpdateRoutine();

  const [editing, setEditing] = useState<Routine | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [catName, setCatName] = useState('');
  const [catColor, setCatColor] = useState(SWATCHES[0]);

  function openEditor(routine: Routine | null) {
    setEditing(routine);
    setEditorOpen(true);
  }

  async function addCategory() {
    const name = catName.trim();
    if (!name) return;
    setCatName('');
    await createCategory.mutateAsync({ name, color: catColor });
  }

  function confirmDeleteCategory(id: string, name: string) {
    Alert.alert('Delete category', `Delete "${name}"? Tasks keep their data but lose this tag.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteCategory.mutate(id) },
    ]);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <ThemedText type="subtitle">Routines</ThemedText>
          <Pressable
            onPress={() => openEditor(null)}
            style={[styles.addBtn, { backgroundColor: '#208AEF' }]}>
            <ThemedText style={styles.addBtnText}>＋ New</ThemedText>
          </Pressable>
        </View>

        <FlatList
          data={routines.data ?? []}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.catSection}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                CATEGORIES
              </ThemedText>
              <View style={styles.chips}>
                {(categories.data ?? []).map((c) => (
                  <Pressable
                    key={c.id}
                    onLongPress={() => confirmDeleteCategory(c.id, c.name)}
                    style={[styles.chip, { backgroundColor: c.color + '33' }]}>
                    <View style={[styles.dot, { backgroundColor: c.color }]} />
                    <ThemedText type="small">{c.name}</ThemedText>
                  </Pressable>
                ))}
              </View>
              <View style={styles.catAdd}>
                <TextInput
                  placeholder="New category"
                  placeholderTextColor={theme.textSecondary}
                  value={catName}
                  onChangeText={setCatName}
                  onSubmitEditing={addCategory}
                  style={[
                    styles.catInput,
                    { color: theme.text, backgroundColor: theme.backgroundElement },
                  ]}
                />
                <Pressable
                  onPress={addCategory}
                  style={[styles.catAddBtn, { backgroundColor: theme.backgroundSelected }]}>
                  <ThemedText type="smallBold">Add</ThemedText>
                </Pressable>
              </View>
              <View style={styles.swatches}>
                {SWATCHES.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => setCatColor(s)}
                    style={[
                      styles.swatch,
                      { backgroundColor: s },
                      catColor === s && styles.swatchActive,
                    ]}
                  />
                ))}
              </View>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.routinesLabel}>
                RECURRING TASKS
              </ThemedText>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => openEditor(item)}
              style={[styles.routineRow, { backgroundColor: theme.backgroundElement }]}>
              <View style={[styles.priorityBar, { backgroundColor: PRIORITY_COLORS[item.priority] }]} />
              <View style={styles.routineBody}>
                <ThemedText style={styles.routineTitle} themeColor={item.active ? 'text' : 'textSecondary'}>
                  {item.title}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {recurrenceSummary(item)}
                  {item.reminder_time ? ` · ⏰ ${item.reminder_time.slice(0, 5)}` : ''}
                </ThemedText>
              </View>
              <Pressable
                hitSlop={8}
                onPress={() => updateRoutine.mutate({ id: item.id, patch: { active: !item.active } })}
                style={[
                  styles.toggle,
                  { backgroundColor: item.active ? '#34C759' : theme.backgroundSelected },
                ]}>
                <ThemedText type="small" style={item.active ? { color: '#fff' } : undefined}>
                  {item.active ? 'On' : 'Off'}
                </ThemedText>
              </Pressable>
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.two }} />}
          ListEmptyComponent={
            routines.isLoading ? null : (
              <ThemedText themeColor="textSecondary" style={styles.empty}>
                No routines yet. Create one to auto-add it each day.
              </ThemedText>
            )
          }
        />
      </SafeAreaView>

      {editorOpen ? (
        <RoutineEditor routine={editing} onClose={() => setEditorOpen(false)} />
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  addBtn: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: 10 },
  addBtnText: { color: '#fff', fontWeight: '700' },
  list: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.five },
  catSection: { gap: Spacing.two, marginBottom: Spacing.three },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 10,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  catAdd: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.one },
  catInput: { flex: 1, borderRadius: 10, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, fontSize: 15 },
  catAddBtn: { paddingHorizontal: Spacing.three, justifyContent: 'center', borderRadius: 10 },
  swatches: { flexDirection: 'row', gap: Spacing.two },
  swatch: { width: 28, height: 28, borderRadius: 14 },
  swatchActive: { borderWidth: 3, borderColor: '#ffffff99' },
  routinesLabel: { marginTop: Spacing.three },
  routineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    paddingRight: Spacing.three,
  },
  priorityBar: { width: 4, alignSelf: 'stretch' },
  routineBody: { flex: 1, padding: Spacing.three, gap: Spacing.one },
  routineTitle: { fontSize: 16, fontWeight: '600' },
  toggle: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.one, borderRadius: 8 },
  empty: { textAlign: 'center', marginTop: Spacing.five },
});
