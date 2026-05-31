import { Tabs } from 'expo-router';
import { Text } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

export default function AppTabs() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.text,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: { backgroundColor: theme.background, borderTopColor: theme.backgroundElement },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Today', tabBarIcon: () => <TabIcon emoji="📋" /> }}
      />
      <Tabs.Screen
        name="board"
        options={{ title: 'Board', tabBarIcon: () => <TabIcon emoji="🗂️" /> }}
      />
      <Tabs.Screen
        name="routines"
        options={{ title: 'Routines', tabBarIcon: () => <TabIcon emoji="🔁" /> }}
      />
      <Tabs.Screen
        name="stats"
        options={{ title: 'Stats', tabBarIcon: () => <TabIcon emoji="📊" /> }}
      />
      <Tabs.Screen name="search" options={{ href: null }} />
    </Tabs>
  );
}
