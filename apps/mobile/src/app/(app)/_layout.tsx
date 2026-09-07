import { StyleSheet, useColorScheme, type ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { SymbolView } from 'expo-symbols';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const IONICON_FALLBACK: Record<string, keyof typeof Ionicons.glyphMap> = {
  house: 'home',
  bolt: 'flash',
  'chart.bar': 'bar-chart',
  gearshape: 'settings',
};

function TabIcon({ name, focused, color }: { name: string; focused: boolean; color: ColorValue }) {
  const tint = color as string;
  return (
    <SymbolView
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic but verified-valid SF Symbol name
      name={`${name}${focused ? '.fill' : ''}` as any}
      size={26}
      type="hierarchical"
      tintColor={tint}
      fallback={<Ionicons name={IONICON_FALLBACK[name]} size={24} color={tint} />}
    />
  );
}

export default function AppTabsLayout() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const bg = isDark ? '#0a0a0a' : '#fafafa';
  const ink = isDark ? '#fafafa' : '#171717';

  return (
    <Tabs
      screenListeners={{
        tabPress: () => Haptics.selectionAsync(),
      }}
      screenOptions={{
        headerShown: true,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: bg },
        headerTitleStyle: { color: ink, fontWeight: '700' },
        headerTintColor: ink,
        tabBarActiveTintColor: '#5e6ad2',
        tabBarInactiveTintColor: '#9a9a9a',
        tabBarStyle: { position: 'absolute', borderTopWidth: 0 },
        tabBarBackground: () => (
          <BlurView
            tint={isDark ? 'dark' : 'light'}
            intensity={90}
            style={StyleSheet.absoluteFill}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="house" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="automations"
        options={{
          title: 'Automations',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="bolt" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="chart.bar" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="gearshape" focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
