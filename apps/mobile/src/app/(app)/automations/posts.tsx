import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AutomationTile } from '@/components/automations/AutomationTile';
import { useAutomations } from '@/api/automations';

export default function PostAutomationsListScreen() {
  const { data, isLoading, refetch } = useAutomations();
  const insets = useSafeAreaInsets();
  const postAutomations = useMemo(() => (data ?? []).filter((a) => a.postType !== 'REEL'), [data]);

  const [manualRefreshing, setManualRefreshing] = useState(false);
  const onManualRefresh = async () => {
    setManualRefreshing(true);
    try {
      await refetch();
    } finally {
      setManualRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <ActivityIndicator color="#5e6ad2" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-950">
      <Stack.Screen options={{ title: 'Post automations', headerBackTitle: 'Automations' }} />
      <FlatList
        data={postAutomations}
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
              <Ionicons name="images-outline" size={26} color="#5e6ad2" />
            </View>
            <Text className="text-[15px] font-medium text-neutral-700 dark:text-neutral-300">
              No post automations yet
            </Text>
            <Text className="px-8 text-center text-xs text-neutral-600 dark:text-neutral-500">
              Create one from a carousel or single post on your connected Instagram account.
            </Text>
          </View>
        }
      />

      <Pressable
        accessibilityRole="button"
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/automations/new-post');
        }}
        className="absolute right-4 flex-row items-center gap-2 rounded-full bg-brand-500 py-3.5 pl-4 pr-5 active:bg-brand-600"
        style={{
          bottom: insets.bottom + 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 10,
          elevation: 6,
        }}
      >
        <Ionicons name="add" size={20} color="white" />
        <Text className="text-[15px] font-semibold text-white">Add post automation</Text>
      </Pressable>
    </View>
  );
}
