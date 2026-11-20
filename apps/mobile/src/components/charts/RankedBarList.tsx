import { useState } from 'react';
import { Text, View, useColorScheme } from 'react-native';

interface RankedItem {
  label: string;
  count: number;
}

export function RankedBarList({ items }: { items: RankedItem[] }) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const [width, setWidth] = useState(0);
  const barColor = isDark ? '#3987e5' : '#2a78d6';
  const max = Math.max(1, ...items.map((i) => i.count));

  return (
    <View className="gap-3" onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {items.map((item) => {
        const pct = item.count / max;
        return (
          <View key={item.label} className="gap-1">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-neutral-700 dark:text-neutral-300" numberOfLines={1}>
                {item.label}
              </Text>
              <Text className="text-sm font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
                {item.count}
              </Text>
            </View>
            <View className="h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
              <View
                style={{
                  width: width > 0 ? Math.max(pct * width, 6) : 0,
                  backgroundColor: barColor,
                }}
                className="h-full rounded-full"
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}
