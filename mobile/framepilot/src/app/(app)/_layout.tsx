import { Tabs } from 'expo-router';
import { Text, type ColorValue } from 'react-native';

import { palette } from '@/theme';

function TabIcon({ symbol, color }: { symbol: string; color: ColorValue }) {
  return <Text style={{ color, fontSize: 18, fontWeight: '700' }}>{symbol}</Text>;
}

export default function AppLayout() {
  return <Tabs screenOptions={{
    headerShown: false,
    tabBarActiveTintColor: palette.accent,
    tabBarInactiveTintColor: '#738084',
    tabBarStyle: { position: 'absolute', height: 74, paddingTop: 8, paddingBottom: 9, borderTopColor: palette.line, backgroundColor: '#0E1518F7' },
    tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
    sceneStyle: { backgroundColor: palette.ink },
  }}>
    <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarIcon: ({ color }) => <TabIcon symbol="⌂" color={color} /> }} />
    <Tabs.Screen name="scenarios" options={{ title: 'Scenarios', tabBarIcon: ({ color }) => <TabIcon symbol="◎" color={color} /> }} />
    <Tabs.Screen name="calculator" options={{ title: 'Adjust', tabBarIcon: ({ color }) => <TabIcon symbol="◑" color={color} /> }} />
    <Tabs.Screen name="saved" options={{ title: 'Saved', tabBarIcon: ({ color }) => <TabIcon symbol="◇" color={color} /> }} />
    <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <TabIcon symbol="◉" color={color} /> }} />
    <Tabs.Screen name="scenario/[id]" options={{ href: null }} />
  </Tabs>;
}
