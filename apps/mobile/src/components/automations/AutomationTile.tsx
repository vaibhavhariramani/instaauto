import { useState } from 'react';
import { Alert, Image, Pressable, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import type { AutomationDto } from '@instaauto/shared';

import { StatusPill } from '@/components/ui/StatusPill';
import { useDeleteAutomation, useUpdateAutomation } from '@/api/automations';

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

const PLACEHOLDER_ICON: Record<AutomationDto['postType'], keyof typeof Ionicons.glyphMap> = {
  REEL: 'film-outline',
  CAROUSEL: 'images-outline',
  POST: 'image-outline',
};

export function AutomationTile({ automation }: { automation: AutomationDto }) {
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
                <Ionicons name={PLACEHOLDER_ICON[automation.postType]} size={26} color="#a3a3a3" />
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
