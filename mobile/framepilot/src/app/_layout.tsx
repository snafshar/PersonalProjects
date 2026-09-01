import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { AppProvider } from '@/contexts/app-context';
import { palette } from '@/theme';

function ProtectedNavigator() {
  const { session } = useAuth();
  return <AppProvider>
    <StatusBar style="light" />
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.ink }, animation: 'fade' }}>
      <Stack.Protected guard={!session}><Stack.Screen name="index" /></Stack.Protected>
      <Stack.Protected guard={Boolean(session)}><Stack.Screen name="(app)" /></Stack.Protected>
    </Stack>
  </AppProvider>;
}

export default function RootLayout() {
  return <SafeAreaProvider><AuthProvider><ProtectedNavigator /></AuthProvider></SafeAreaProvider>;
}
