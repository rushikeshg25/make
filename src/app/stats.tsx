import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function StatsScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']}>
        <ThemedText type="subtitle">Stats</ThemedText>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, padding: 24 } });
