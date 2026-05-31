import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import {
  useCategories,
  useCreateRoutine,
  useDeleteRoutine,
  useUpdateRoutine,
} from '@/data/hooks';
import type { Recurrence, Routine } from '@/data/types';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '@/data/types';
import { WEEKDAY_LABELS } from '@/lib/dates';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  visible: boolean;
  routine: Routine | null;
  onClose: () => void;
};

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function RoutineEditor({ visible, routine, onClose }: Props) {
  const theme = useTheme();
  const categories = useCategories();
  const createRoutine = useCreateRoutine();
  const updateRoutine = useUpdateRoutine();
  const deleteRoutine = useDeleteRoutine();

  const [title, setTitle] = useState('');
  const [recurrence, setRecurrence] = useState<Recurrence>('daily');
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [priority, setPriority] = useState(1);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [reminder, setReminder] = useState('');

  useEffect(() => {
    if (!visible) return;
    setTitle(routine?.title ?? '');
    setRecurrence((routine?.recurrence as Recurrence) ?? 'daily');
    setWeekdays(routine?.weekdays ?? []);
    setPriority(routine?.priority ?? 1);
    setCategoryId(routine?.category_id ?? null);
    setReminder(routine?.reminder_time?.slice(0, 5) ?? '');
  }, [visible, routine]);

  const reminderValid = reminder === '' || TIME_RE.test(reminder);
  const weeklyValid = recurrence === 'daily' || weekdays.length > 0;
  const canSave = title.trim().length > 0 && reminderValid && weeklyValid;

  function toggleWeekday(d: number) {
    setWeekdays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b),
    );
  }

  async function save() {
    const fields = {
      title: title.trim(),
      recurrence,
      weekdays: recurrence === 'weekly' ? weekdays : [],
      priority,
      category_id: categoryId,
      reminder_time: reminder === '' ? null : `${reminder}:00`,
    };
    if (routine) {
      await updateRoutine.mutateAsync({ id: routine.id, patch: fields });
    } else {
      await createRoutine.mutateAsync(fields);
    }
    onClose();
  }

  async function remove() {
    if (routine) await deleteRoutine.mutateAsync(routine.id);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.background }]}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <ThemedText type="subtitle">{routine ? 'Edit routine' : 'New routine'}</ThemedText>
              <Pressable hitSlop={10} onPress={onClose}>
                <ThemedText type="link" themeColor="textSecondary">
                  Close
                </ThemedText>
              </Pressable>
            </View>

            <TextInput
              placeholder="Routine name"
              placeholderTextColor={theme.textSecondary}
              value={title}
              onChangeText={setTitle}
              autoFocus={!routine}
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            />

            <ThemedText type="smallBold" themeColor="textSecondary">
              Repeats
            </ThemedText>
            <View style={styles.segment}>
              {(['daily', 'weekly'] as Recurrence[]).map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setRecurrence(r)}
                  style={[
                    styles.segmentItem,
                    { backgroundColor: theme.backgroundElement },
                    recurrence === r && { backgroundColor: theme.backgroundSelected },
                  ]}>
                  <ThemedText
                    type="smallBold"
                    themeColor={recurrence === r ? 'text' : 'textSecondary'}>
                    {r === 'daily' ? 'Every day' : 'Weekly'}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            {recurrence === 'weekly' ? (
              <View style={styles.weekdays}>
                {WEEKDAY_LABELS.map((label, d) => (
                  <Pressable
                    key={label}
                    onPress={() => toggleWeekday(d)}
                    style={[
                      styles.day,
                      { backgroundColor: theme.backgroundElement },
                      weekdays.includes(d) && { backgroundColor: '#208AEF' },
                    ]}>
                    <ThemedText
                      type="small"
                      style={weekdays.includes(d) ? { color: '#fff' } : undefined}
                      themeColor={weekdays.includes(d) ? undefined : 'textSecondary'}>
                      {label[0]}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            ) : null}

            <ThemedText type="smallBold" themeColor="textSecondary">
              Priority
            </ThemedText>
            <View style={styles.segment}>
              {PRIORITY_LABELS.map((label, i) => (
                <Pressable
                  key={label}
                  onPress={() => setPriority(i)}
                  style={[
                    styles.segmentItem,
                    { backgroundColor: theme.backgroundElement },
                    priority === i && { backgroundColor: PRIORITY_COLORS[i] },
                  ]}>
                  <ThemedText
                    type="smallBold"
                    style={priority === i ? { color: '#fff' } : undefined}
                    themeColor={priority === i ? undefined : 'textSecondary'}>
                    {label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            {categories.data && categories.data.length > 0 ? (
              <>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  Category
                </ThemedText>
                <View style={styles.chips}>
                  <Pressable
                    onPress={() => setCategoryId(null)}
                    style={[
                      styles.chip,
                      { backgroundColor: theme.backgroundElement },
                      categoryId === null && { backgroundColor: theme.backgroundSelected },
                    ]}>
                    <ThemedText type="small">None</ThemedText>
                  </Pressable>
                  {categories.data.map((c) => (
                    <Pressable
                      key={c.id}
                      onPress={() => setCategoryId(c.id)}
                      style={[
                        styles.chip,
                        { backgroundColor: c.color + (categoryId === c.id ? 'FF' : '33') },
                      ]}>
                      <ThemedText
                        type="small"
                        style={categoryId === c.id ? { color: '#fff' } : undefined}>
                        {c.name}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}

            <ThemedText type="smallBold" themeColor="textSecondary">
              Reminder time (HH:MM, 24h)
            </ThemedText>
            <TextInput
              placeholder="e.g. 08:00"
              placeholderTextColor={theme.textSecondary}
              value={reminder}
              onChangeText={setReminder}
              keyboardType="numbers-and-punctuation"
              style={[
                styles.input,
                {
                  color: theme.text,
                  backgroundColor: theme.backgroundElement,
                  borderWidth: reminderValid ? 0 : 1,
                  borderColor: '#FF3B30',
                },
              ]}
            />

            <Pressable
              disabled={!canSave}
              onPress={save}
              style={[styles.save, { backgroundColor: '#208AEF', opacity: canSave ? 1 : 0.5 }]}>
              <ThemedText style={styles.saveText}>{routine ? 'Save' : 'Add routine'}</ThemedText>
            </Pressable>

            {routine ? (
              <Pressable onPress={remove} style={styles.delete}>
                <ThemedText type="smallBold" style={{ color: '#FF3B30' }}>
                  Delete routine
                </ThemedText>
              </Pressable>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000066' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  content: { padding: Spacing.four, gap: Spacing.two },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  input: { borderRadius: 12, padding: Spacing.three, fontSize: 16 },
  segment: { flexDirection: 'row', gap: Spacing.two },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: Spacing.two, borderRadius: 10 },
  weekdays: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.one },
  day: { flex: 1, aspectRatio: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: 10 },
  save: { marginTop: Spacing.three, paddingVertical: Spacing.three, borderRadius: 12, alignItems: 'center' },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  delete: { alignItems: 'center', paddingVertical: Spacing.three },
});
