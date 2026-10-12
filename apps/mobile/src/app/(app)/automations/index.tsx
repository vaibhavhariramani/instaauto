import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AutomationTile } from '@/components/automations/AutomationTile';
import { useAutomations } from '@/api/automations';

export default function AutomationsListScreen() {
  const { data, isLoading, refetch } = useAutomations();
  const insets = useSafeAreaInsets();
  const reelAutomations = useMemo(() => (data ?? []).filter((a) => a.postType === 'REEL'), [data]);

  const [manualRefreshing, setManualRefreshing] = useState(false);
  const onManualRefresh = async () => {
    setManualRefreshing(true);
    try {
      await refetch();
    } finally {
      setManualRefreshing(false);
    }
  };

  // The list returns whatever reel thumbnail URL was last stored, then kicks off a background
  // refresh against the live Graph API (see automationService.listAutomations) - that refresh
  // can't land in THIS response, only the next fetch. Older automations' stored URLs are usually
  // already-expired signed CDN links by the time anyone reopens this screen, so without this the
  // thumbnails stay broken until a manual pull-to-refresh. One silent refetch, timed past the
  // backend's refresh window, is enough to pick up the freshened URLs automatically.
  useEffect(() => {
    const t = setTimeout(() => refetch(), 3000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <ActivityIndicator color="#5e6ad2" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-950">
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          Haptics.selectionAsync();
          router.push('/automations/posts');
        }}
        className="mx-4 mt-3 flex-row items-center justify-between rounded-2xl border border-neutral-200/70 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <View className="flex-row items-center gap-2.5">
          <Ionicons name="images-outline" size={18} color="#5e6ad2" />
          <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
            Post automations
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#a3a3a3" />
      </Pressable>

      <FlatList
        data={reelAutomations}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerClassName="p-2.5"
        contentContainerStyle={{ paddingBottom: 150 }}
        refreshing={manualRefreshing}
        onRefresh={onManualRefresh}
        renderItem={({ item }) => <AutomationTile automation={item} />}
        ListEmptyComponent={
          <View className="items-center gap-2 py-16">
            <View className="mb-2 h-14 w-14 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/10">
              <Ionicons name="flash-outline" size={26} color="#5e6ad2" />
            </View>
            <Text className="text-[15px] font-medium text-neutral-700 dark:text-neutral-300">
              No automations yet
            </Text>
            <Text className="px-8 text-center text-xs text-neutral-600 dark:text-neutral-500">
              Create one from a Reel on your connected Instagram account.
            </Text>
          </View>
        }
      />

      <Pressable
        accessibilityRole="button"
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/automations/new');
        }}
        className="absolute right-4 flex-row items-center gap-2 rounded-full bg-brand-500 py-3.5 pl-4 pr-5 active:bg-brand-600"
        style={{
          bottom: insets.bottom + 65,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 10,
          elevation: 6,
        }}
      >
        <Ionicons name="add" size={20} color="white" />
        <Text className="text-[15px] font-semibold text-white">Add new automation</Text>
      </Pressable>
    </View>
  );
}
