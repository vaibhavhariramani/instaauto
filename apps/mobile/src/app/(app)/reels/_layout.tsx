import { useColorScheme } from 'react-native';
import { Stack } from 'expo-router';

import { HeaderBackButton } from '@/components/ui/HeaderBackButton';

export default function ReelsStackLayout() {
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
      <Stack.Screen
        name="index"
        options={{ title: 'Reels', headerLeft: () => <HeaderBackButton /> }}
      />
    </Stack>
  );
}
