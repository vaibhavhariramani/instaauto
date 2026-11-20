import { useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ReelDto } from '@instaauto/shared';

import { useInstagramAccounts, useReels } from '@/api/instagram';

function formatNumber(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function ReelStatsModal({ reel, onClose }: { reel: ReelDto | null; onClose: () => void }) {
  const engagement = reel ? reel.likeCount + reel.commentsCount : 0;
  return (
    <Modal visible={Boolean(reel)} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 items-center justify-center bg-black/50 px-6" onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full max-w-sm gap-4 rounded-3xl bg-white p-5 dark:bg-neutral-900"
        >
          {reel ? (
            <>
              <View className="flex-row gap-3">
                <Image
                  source={{ uri: reel.thumbnailUrl }}
                  className="h-24 w-16 rounded-xl bg-neutral-100 dark:bg-neutral-800"
                />
                <View className="flex-1 justify-center">
                  <Text
                    className="text-sm text-neutral-700 dark:text-neutral-300"
                    numberOfLines={4}
                  >
                    {reel.caption || 'No caption'}
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1 items-center gap-1 rounded-2xl bg-neutral-50 py-3 dark:bg-neutral-800">
                  <Ionicons name="heart" size={16} color="#d03b3b" />
                  <Text className="text-base font-bold text-neutral-900 dark:text-neutral-50">
                    {formatNumber(reel.likeCount)}
                  </Text>
                  <Text className="text-[11px] text-neutral-600 dark:text-neutral-500">Likes</Text>
                </View>
                <View className="flex-1 items-center gap-1 rounded-2xl bg-neutral-50 py-3 dark:bg-neutral-800">
                  <Ionicons name="chatbubble" size={16} color="#2a78d6" />
                  <Text className="text-base font-bold text-neutral-900 dark:text-neutral-50">
                    {formatNumber(reel.commentsCount)}
                  </Text>
                  <Text className="text-[11px] text-neutral-600 dark:text-neutral-500">
                    Comments
                  </Text>
                </View>
                <View className="flex-1 items-center gap-1 rounded-2xl bg-neutral-50 py-3 dark:bg-neutral-800">
                  <Ionicons name="flash" size={16} color="#5e6ad2" />
                  <Text className="text-base font-bold text-neutral-900 dark:text-neutral-50">
                    {formatNumber(engagement)}
                  </Text>
                  <Text className="text-[11px] text-neutral-600 dark:text-neutral-500">
                    Engagement
                  </Text>
                </View>
              </View>

              <Text className="text-center text-xs text-neutral-600 dark:text-neutral-500">
                Posted {new Date(reel.timestamp).toLocaleDateString()}
              </Text>
            </>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ReelTile({ reel, onPress }: { reel: ReelDto; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="w-1/2 p-1.5">
      <View className="gap-2 rounded-2xl border border-neutral-200/70 bg-white p-2 dark:border-neutral-800 dark:bg-neutral-900">
        <Image
          source={{ uri: reel.thumbnailUrl }}
          className="aspect-[3/4] w-full rounded-xl bg-neutral-100 dark:bg-neutral-800"
        />
        <Text className="px-0.5 text-xs text-neutral-700 dark:text-neutral-300" numberOfLines={2}>
          {reel.caption || 'No caption'}
        </Text>
        <View className="flex-row items-center gap-3 px-0.5">
          <View className="flex-row items-center gap-1">
            <Ionicons name="heart-outline" size={12} color="#a3a3a3" />
            <Text className="text-[11px] text-neutral-600 dark:text-neutral-500">
              {formatNumber(reel.likeCount)}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Ionicons name="chatbubble-outline" size={12} color="#a3a3a3" />
            <Text className="text-[11px] text-neutral-600 dark:text-neutral-500">
              {formatNumber(reel.commentsCount)}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function ReelsScreen() {
  const { data: accounts, isLoading: accountsLoading } = useInstagramAccounts();
  const accountId = accounts?.[0]?.id;
  const { data: reels, isLoading, refetch } = useReels(accountId);
  const [selected, setSelected] = useState<ReelDto | null>(null);

  const [manualRefreshing, setManualRefreshing] = useState(false);
  const onManualRefresh = async () => {
    setManualRefreshing(true);
    try {
      await refetch();
    } finally {
      setManualRefreshing(false);
    }
  };

  if (accountsLoading || isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <ActivityIndicator color="#5e6ad2" />
      </View>
    );
  }

  if (!accountId) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-neutral-50 px-8 dark:bg-neutral-950">
        <Ionicons name="logo-instagram" size={32} color="#a3a3a3" />
        <Text className="text-center text-[15px] font-medium text-neutral-700 dark:text-neutral-300">
          Connect an Instagram account first
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-950">
      <FlatList
        data={reels ?? []}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerClassName="p-2.5"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshing={manualRefreshing}
        onRefresh={onManualRefresh}
        renderItem={({ item }) => <ReelTile reel={item} onPress={() => setSelected(item)} />}
        ListEmptyComponent={
          <View className="items-center gap-2 py-16">
            <View className="mb-2 h-14 w-14 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/10">
              <Ionicons name="film-outline" size={26} color="#5e6ad2" />
            </View>
            <Text className="text-[15px] font-medium text-neutral-700 dark:text-neutral-300">
              No Reels posted yet
            </Text>
          </View>
        }
      />
      <ReelStatsModal reel={selected} onClose={() => setSelected(null)} />
    </View>
  );
}
