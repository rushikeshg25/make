import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { Category, Task } from '@/data/types';
import { PRIORITY_COLORS } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  task: Task;
  category?: Category;
  onToggle: (task: Task) => void;
  onPress: (task: Task) => void;
  onLongPress?: (task: Task) => void;
  rightSlot?: ReactNode;
};

export function TaskRow({ task, category, onToggle, onPress, onLongPress, rightSlot }: Props) {
  const theme = useTheme();
  const done = task.status === 'done';

  return (
    <Pressable
      onPress={() => onPress(task)}
      onLongPress={onLongPress ? () => onLongPress(task) : undefined}
      style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
      <Pressable hitSlop={10} onPress={() => onToggle(task)} style={styles.checkbox}>
        <View
          style={[
            styles.circle,
            { borderColor: PRIORITY_COLORS[task.priority] },
            done && { backgroundColor: PRIORITY_COLORS[task.priority] },
          ]}>
          {done ? <ThemedText style={styles.check}>✓</ThemedText> : null}
        </View>
      </Pressable>

      <View style={styles.body}>
        <ThemedText
          numberOfLines={1}
          style={[styles.title, done && styles.titleDone]}
          themeColor={done ? 'textSecondary' : 'text'}>
          {task.title}
        </ThemedText>
        <View style={styles.meta}>
          {category ? (
            <View style={[styles.tag, { backgroundColor: category.color + '33' }]}>
              <View style={[styles.dot, { backgroundColor: category.color }]} />
              <ThemedText type="small" themeColor="textSecondary">
                {category.name}
              </ThemedText>
            </View>
          ) : null}
          {task.reminder_time ? (
            <ThemedText type="small" themeColor="textSecondary">
              ⏰ {task.reminder_time.slice(0, 5)}
            </ThemedText>
          ) : null}
          {task.rolled_over_count > 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              ↻ {task.rolled_over_count}
            </ThemedText>
          ) : null}
        </View>
      </View>
      {rightSlot}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 12,
    gap: Spacing.three,
  },
  checkbox: { padding: Spacing.half },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: { color: '#fff', fontSize: 14, fontWeight: '700', lineHeight: 16 },
  body: { flex: 1, gap: Spacing.one },
  title: { fontSize: 16, fontWeight: '600' },
  titleDone: { textDecorationLine: 'line-through' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flexWrap: 'wrap' },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: 8,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
