import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import {
  useCategories,
  useCreateTask,
  useDeleteTask,
  useUpdateTask,
} from '@/data/hooks';
import { tasksRepo } from '@/data/repos';
import type { Task, TaskStatus } from '@/data/types';
import { PRIORITY_COLORS, PRIORITY_LABELS, STATUS_LABELS, TASK_STATUSES } from '@/data/types';
import { cancelReminder, scheduleTaskReminder } from '@/lib/notifications';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  task: Task | null;
  dueDate: string;
  onClose: () => void;
};

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

// Rendered only while open (parent gates on mount), so initial state can be
// seeded straight from props without an effect.
export function TaskEditor({ task, dueDate, onClose }: Props) {
  const theme = useTheme();
  const categories = useCategories();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [title, setTitle] = useState(task?.title ?? '');
  const [notes, setNotes] = useState(task?.notes ?? '');
  const [priority, setPriority] = useState(task?.priority ?? 1);
  const [status, setStatus] = useState<TaskStatus>((task?.status as TaskStatus) ?? 'todo');
  const [categoryId, setCategoryId] = useState<string | null>(task?.category_id ?? null);
  const [reminder, setReminder] = useState(task?.reminder_time?.slice(0, 5) ?? '');

  const reminderValid = reminder === '' || TIME_RE.test(reminder);
  const canSave = title.trim().length > 0 && reminderValid && !createTask.isPending;

  async function save() {
    const reminder_time = reminder === '' ? null : `${reminder}:00`;
    const fields = {
      title: title.trim(),
      notes: notes.trim() || null,
      priority,
      status,
      category_id: categoryId,
      reminder_time,
      completed_at: status === 'done' ? new Date().toISOString() : null,
    };
    const saved: Task = task
      ? await updateTask.mutateAsync({ id: task.id, patch: fields })
      : await createTask.mutateAsync({ ...fields, due_date: dueDate });

    // Re-sync the local reminder: drop the old one, schedule a fresh one, and
    // persist the resulting notification id (or null) back onto the task.
    await cancelReminder(task?.reminder_notification_id);
    const notifId = await scheduleTaskReminder(saved);
    if (notifId !== saved.reminder_notification_id) {
      await tasksRepo.update(saved.id, { reminder_notification_id: notifId });
    }
    onClose();
  }

  async function remove() {
    if (task) {
      await cancelReminder(task.reminder_notification_id);
      await deleteTask.mutateAsync(task.id);
    }
    onClose();
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.background }]}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <ThemedText type="subtitle">{task ? 'Edit task' : 'New task'}</ThemedText>
              <Pressable hitSlop={10} onPress={onClose}>
                <ThemedText type="link" themeColor="textSecondary">
                  Close
                </ThemedText>
              </Pressable>
            </View>

            <TextInput
              placeholder="What needs doing?"
              placeholderTextColor={theme.textSecondary}
              value={title}
              onChangeText={setTitle}
              autoFocus={!task}
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            />

            <TextInput
              placeholder="Notes (optional)"
              placeholderTextColor={theme.textSecondary}
              value={notes}
              onChangeText={setNotes}
              multiline
              style={[
                styles.input,
                styles.notes,
                { color: theme.text, backgroundColor: theme.backgroundElement },
              ]}
            />

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

            <ThemedText type="smallBold" themeColor="textSecondary">
              Status
            </ThemedText>
            <View style={styles.segment}>
              {TASK_STATUSES.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => setStatus(s)}
                  style={[
                    styles.segmentItem,
                    { backgroundColor: theme.backgroundElement },
                    status === s && { backgroundColor: theme.backgroundSelected },
                  ]}>
                  <ThemedText type="smallBold" themeColor={status === s ? 'text' : 'textSecondary'}>
                    {STATUS_LABELS[s]}
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
              placeholder="e.g. 09:30"
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
              <ThemedText style={styles.saveText}>{task ? 'Save' : 'Add task'}</ThemedText>
            </Pressable>

            {task ? (
              <Pressable onPress={remove} style={styles.delete}>
                <ThemedText type="smallBold" style={{ color: '#FF3B30' }}>
                  Delete task
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
  notes: { minHeight: 64, textAlignVertical: 'top' },
  segment: { flexDirection: 'row', gap: Spacing.two },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: Spacing.two, borderRadius: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: 10 },
  save: { marginTop: Spacing.three, paddingVertical: Spacing.three, borderRadius: 12, alignItems: 'center' },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  delete: { alignItems: 'center', paddingVertical: Spacing.three },
});
