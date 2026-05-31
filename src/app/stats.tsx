import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTasksSince } from '@/data/hooks';
import { addDaysISO, todayISO, WEEKDAY_LABELS, weekdayOf } from '@/lib/dates';
import { computeStats } from '@/lib/stats';
import { useTheme } from '@/hooks/use-theme';

const RANGE = 30;
const CHART_DAYS = 14;

export default function StatsScreen() {
  const theme = useTheme();
  const today = todayISO();
  const since = addDaysISO(today, -(RANGE - 1));
  const tasks = useTasksSince(since);

  const stats = useMemo(
    () => computeStats(tasks.data ?? [], today, RANGE),
    [tasks.data, today],
  );

  const chart = stats.days.slice(-CHART_DAYS);
  const maxTotal = Math.max(1, ...chart.map((d) => d.total));
  const rate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="subtitle">Stats</ThemedText>

          <View style={styles.cards}>
            <StatCard label="🔥 Streak" value={`${stats.streak}`} sub="days" theme={theme} />
            <StatCard label="✓ Completed" value={`${stats.completed}`} sub={`of ${stats.total}`} theme={theme} />
            <StatCard label="📈 Rate" value={`${rate}%`} sub={`last ${RANGE}d`} theme={theme} />
          </View>

          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.section}>
            LAST {CHART_DAYS} DAYS
          </ThemedText>
          <View style={[styles.chartCard, { backgroundColor: theme.backgroundElement }]}>
            <View style={styles.chart}>
              {chart.map((d) => {
                const totalH = (d.total / maxTotal) * 100;
                const doneH = d.total > 0 ? (d.done / d.total) * totalH : 0;
                const allDone = d.total > 0 && d.done === d.total;
                return (
                  <View key={d.date} style={styles.barCol}>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barTotal,
                          { height: `${totalH}%`, backgroundColor: theme.backgroundSelected },
                        ]}>
                        <View
                          style={[
                            styles.barDone,
                            { height: `${d.total > 0 ? (doneH / totalH) * 100 : 0}%`, backgroundColor: allDone ? '#34C759' : '#208AEF' },
                          ]}
                        />
                      </View>
                    </View>
                    <ThemedText type="small" themeColor="textSecondary" style={styles.barLabel}>
                      {WEEKDAY_LABELS[weekdayOf(d.date)][0]}
                    </ThemedText>
                  </View>
                );
              })}
            </View>
          </View>

          {tasks.isLoading ? null : stats.total === 0 ? (
            <ThemedText themeColor="textSecondary" style={styles.empty}>
              Complete some tasks to see your stats grow.
            </ThemedText>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function StatCard({
  label,
  value,
  sub,
  theme,
}: {
  label: string;
  value: string;
  sub: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText style={styles.statValue}>{value}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {sub}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  content: { padding: Spacing.four, gap: Spacing.three },
  cards: { flexDirection: 'row', gap: Spacing.two },
  statCard: { flex: 1, padding: Spacing.three, borderRadius: 12, gap: Spacing.one },
  statValue: { fontSize: 28, fontWeight: '700' },
  section: { marginTop: Spacing.two },
  chartCard: { padding: Spacing.three, borderRadius: 12 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 140, gap: Spacing.one },
  barCol: { flex: 1, alignItems: 'center', gap: Spacing.one },
  barTrack: { width: '100%', height: 110, justifyContent: 'flex-end' },
  barTotal: { width: '70%', alignSelf: 'center', borderRadius: 4, justifyContent: 'flex-end', minHeight: 2 },
  barDone: { width: '100%', borderRadius: 4 },
  barLabel: { fontSize: 10 },
  empty: { textAlign: 'center', marginTop: Spacing.four },
});
