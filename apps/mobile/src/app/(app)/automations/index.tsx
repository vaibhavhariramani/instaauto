import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  Switch,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AutomationDto } from '@instaauto/shared';

import { StatusPill } from '@/components/ui/StatusPill';
import { useAutomations, useDeleteAutomation, useUpdateAutomation } from '@/api/automations';

function DeleteAction({
  progress,
  onPress,
}: {
  progress: SharedValue<number>;
  onPress: () => void;
}) {
  const style = useAnimatedStyle(() => ({ opacity: Math.min(progress.value, 1) }));
  return (
    <Animated.View style={style} className="mb-3 ml-2 justify-center">
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        className="h-full w-16 items-center justify-center rounded-2xl bg-red-600 active:bg-red-700"
      >
        <Ionicons name="trash-outline" size={18} color="white" />
      </Pressable>
    </Animated.View>
  );
}

function AutomationTile({ automation }: { automation: AutomationDto }) {
  const update = useUpdateAutomation(automation.id);
  const remove = useDeleteAutomation();
  // A stored thumbnail URL that's still broken after the refetch (rate-limited account,
  // deleted reel) should fall back to the placeholder icon instead of a broken-image box.
  const [thumbnailFailed, setThumbnailFailed] = useState(false);

  const confirmDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Delete automation?', `"${automation.name}" cannot be recovered once deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove.mutate(automation.id) },
    ]);
  };

  return (
    <View className="w-1/2 p-1.5">
      <Swipeable
        renderRightActions={(progress) => (
          <DeleteAction progress={progress} onPress={confirmDelete} />
        )}
        overshootRight={false}
      >
        <View className="gap-2 rounded-2xl border border-neutral-200/70 bg-white p-2 dark:border-neutral-800 dark:bg-neutral-900">
          <Pressable onPress={() => router.push(`/automations/${automation.id}`)}>
            {automation.reelThumbnailUrl && !thumbnailFailed ? (
              <Image
                source={{ uri: automation.reelThumbnailUrl }}
                onError={() => setThumbnailFailed(true)}
                className="aspect-square w-full rounded-xl bg-neutral-100 dark:bg-neutral-800"
              />
            ) : (
              <View className="aspect-square w-full items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <Ionicons name="film-outline" size={26} color="#a3a3a3" />
              </View>
            )}
            <Text
              className="mt-2 px-0.5 text-sm font-semibold text-neutral-900 dark:text-neutral-50"
              numberOfLines={1}
            >
              {automation.name}
            </Text>
            <Text
              className="px-0.5 text-xs text-neutral-600 dark:text-neutral-500"
              numberOfLines={1}
            >
              {automation.totalTriggers} triggers · {automation.totalDMsSent} sent
            </Text>
          </Pressable>
          <View className="flex-row items-center justify-between px-0.5">
            <StatusPill
              label={automation.isActive ? 'Active' : 'Paused'}
              tone={automation.isActive ? 'good' : 'neutral'}
            />
            <Switch
              value={automation.isActive}
              onValueChange={(value) => {
                Haptics.selectionAsync();
                update.mutate({ isActive: value });
              }}
              trackColor={{ false: '#d4d4d4', true: '#5e6ad2' }}
              style={{ transform: [{ scale: 0.8 }] }}
            />
          </View>
        </View>
      </Swipeable>
    </View>
  );
}

export default function AutomationsListScreen() {
  const { data, isLoading, refetch } = useAutomations();
  const insets = useSafeAreaInsets();

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
      <FlatList
        data={data ?? []}
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
