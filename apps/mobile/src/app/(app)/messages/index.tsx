import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { ConversationDto } from '@instaauto/shared';

import { useInstagramAccounts } from '@/api/instagram';
import { useConversations } from '@/api/conversations';

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

function ConversationRow({
  conversation,
  accountId,
}: {
  conversation: ConversationDto;
  accountId: string;
}) {
  const needsReply = conversation.lastMessageDirection === 'INBOUND';
  return (
    <Pressable
      className="flex-row items-center gap-3 border-t border-neutral-100 py-3 first:border-t-0 dark:border-neutral-800"
      accessibilityRole="button"
      onPress={() =>
        router.push({
          pathname: '/messages/[id]',
          params: { id: conversation.id, accountId, username: conversation.participantUsername },
        })
      }
    >
      <View className="h-11 w-11 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/10">
        <Text className="text-base font-semibold text-brand-600 dark:text-brand-400">
          {conversation.participantUsername.slice(0, 1).toUpperCase()}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="text-[15px] font-medium text-neutral-900 dark:text-neutral-50">
          {conversation.participantUsername}
        </Text>
        <Text
          numberOfLines={1}
          className={`text-xs ${needsReply ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-600 dark:text-neutral-400'}`}
        >
          {conversation.lastMessageDirection === 'OUTBOUND' ? 'You: ' : ''}
          {conversation.lastMessagePreview ?? ''}
        </Text>
      </View>
      <View className="items-end gap-1.5">
        <Text className="text-[11px] text-neutral-600 dark:text-neutral-500">
          {timeAgo(conversation.lastMessageAt)}
        </Text>
        {needsReply ? <View className="h-2 w-2 rounded-full bg-brand-500" /> : null}
      </View>
    </Pressable>
  );
}

export default function MessagesListScreen() {
  const { data: accounts, isLoading: accountsLoading } = useInstagramAccounts();
  const accountId = accounts?.[0]?.id;
  const { data: conversations, isLoading, refetch } = useConversations(accountId);

  // Bound to a manual pull only - the 30s background poll (useConversations'
  // refetchInterval) must never yank the list down on its own.
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
        data={conversations ?? []}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshing={manualRefreshing}
        onRefresh={onManualRefresh}
        renderItem={({ item }) => <ConversationRow conversation={item} accountId={accountId} />}
        ListEmptyComponent={
          <View className="items-center gap-2 py-16">
            <View className="mb-2 h-14 w-14 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/10">
              <Ionicons name="chatbubbles-outline" size={26} color="#5e6ad2" />
            </View>
            <Text className="text-[15px] font-medium text-neutral-700 dark:text-neutral-300">
              No conversations yet
            </Text>
            <Text className="text-center text-xs text-neutral-600 dark:text-neutral-500">
              DMs from your Instagram account will show up here.
            </Text>
          </View>
        }
      />
    </View>
  );
}
