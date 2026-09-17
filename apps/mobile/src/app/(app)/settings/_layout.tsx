import { useColorScheme } from 'react-native';
import { Stack } from 'expo-router';

export default function SettingsStackLayout() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const bg = isDark ? '#0a0a0a' : '#fafafa';
  const ink = isDark ? '#fafafa' : '#171717';

  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: bg },
        headerTitleStyle: { color: ink, fontWeight: '700' },
        headerTintColor: ink,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Settings' }} />
      <Stack.Screen name="accounts" options={{ title: 'Switch account', presentation: 'modal' }} />
      <Stack.Screen name="add-account" options={{ title: 'Add account', presentation: 'modal' }} />
    </Stack>
  );
}
