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
import type { AutomationDto } from '@instaauto/shared';

import { Card } from '@/components/ui/Card';
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
        className="h-full w-20 items-center justify-center rounded-2xl bg-red-600 active:bg-red-700"
      >
        <Ionicons name="trash-outline" size={20} color="white" />
        <Text className="mt-1 text-xs font-semibold text-white">Delete</Text>
      </Pressable>
    </Animated.View>
  );
}

function AutomationRow({ automation }: { automation: AutomationDto }) {
  const update = useUpdateAutomation(automation.id);
  const remove = useDeleteAutomation();

  const confirmDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Delete automation?', `"${automation.name}" cannot be recovered once deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove.mutate(automation.id) },
    ]);
  };

  return (
    <Swipeable
      renderRightActions={(progress) => (
        <DeleteAction progress={progress} onPress={confirmDelete} />
      )}
      overshootRight={false}
    >
      <Card className="mb-3 flex-row items-center gap-3">
        <Pressable
          onPress={() => router.push(`/automations/${automation.id}`)}
          className="flex-1 flex-row items-center gap-3"
        >
          {automation.reelThumbnailUrl ? (
            <Image
              source={{ uri: automation.reelThumbnailUrl }}
              className="h-14 w-14 rounded-xl bg-neutral-100 dark:bg-neutral-800"
            />
          ) : (
            <View className="h-14 w-14 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
              <Ionicons name="film-outline" size={22} color="#a3a3a3" />
            </View>
          )}
          <View className="flex-1 gap-1.5">
            <Text
              className="text-sm font-semibold text-neutral-900 dark:text-neutral-50"
              numberOfLines={1}
            >
              {automation.name}
            </Text>
            <Text className="text-xs text-neutral-500 dark:text-neutral-400" numberOfLines={1}>
              Triggers: {automation.triggerKeywords.join(', ') || '—'}
            </Text>
            <View className="flex-row items-center gap-2">
              <StatusPill
                label={automation.isActive ? 'Active' : 'Paused'}
                tone={automation.isActive ? 'good' : 'neutral'}
              />
              <Text className="text-xs text-neutral-400 dark:text-neutral-500">
                {automation.totalTriggers} triggers · {automation.totalDMsSent} sent
              </Text>
            </View>
          </View>
        </Pressable>
        <Switch
          value={automation.isActive}
          onValueChange={(value) => {
            Haptics.selectionAsync();
            update.mutate({ isActive: value });
          }}
          trackColor={{ false: '#d4d4d4', true: '#5e6ad2' }}
        />
      </Card>
    </Swipeable>
  );
}

export default function AutomationsListScreen() {
  const { data, isLoading, refetch, isRefetching } = useAutomations();

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
        contentContainerClassName="p-4"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshing={isRefetching}
        onRefresh={refetch}
        renderItem={({ item }) => <AutomationRow automation={item} />}
        ListEmptyComponent={
          <View className="items-center gap-2 py-16">
            <View className="mb-2 h-14 w-14 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/10">
              <Ionicons name="flash-outline" size={26} color="#5e6ad2" />
            </View>
            <Text className="text-[15px] font-medium text-neutral-700 dark:text-neutral-300">
              No automations yet
            </Text>
            <Text className="text-center text-xs text-neutral-400 dark:text-neutral-500">
              Create one from a Reel on the web dashboard, then manage it here.
            </Text>
          </View>
        }
      />
    </View>
  );
}
