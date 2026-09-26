import { useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { RecentCommentDto } from '@instaauto/shared';

import { useInstagramAccounts, useRecentComments, useReplyToComment } from '@/api/instagram';
import { extractErrorMessage } from '@/api/client';

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

function CommentRow({ comment, accountId }: { comment: RecentCommentDto; accountId: string }) {
  const reply = useReplyToComment(accountId);
  const [replying, setReplying] = useState(false);
  const [draft, setDraft] = useState('');
  const [sentReply, setSentReply] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSend = async () => {
    const message = draft.trim();
    if (!message || reply.isPending) return;
    setError(null);
    try {
      await reply.mutateAsync({ commentId: comment.id, message });
      setSentReply(message);
      setReplying(false);
      setDraft('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  return (
    <View className="border-t border-neutral-100 py-3 first:border-t-0 dark:border-neutral-800">
      <View className="flex-row gap-3">
        <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/10">
          <Text className="text-sm font-semibold text-brand-600 dark:text-brand-400">
            {comment.username.slice(0, 1).toUpperCase()}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-sm text-neutral-900 dark:text-neutral-50">
            <Text className="font-semibold">{comment.username}</Text>
            {'  '}
            <Text className="text-xs text-neutral-600 dark:text-neutral-500">
              {timeAgo(comment.timestamp)}
            </Text>
          </Text>
          <Text className="mt-0.5 text-sm text-neutral-700 dark:text-neutral-300">
            {comment.text}
          </Text>

          {sentReply ? (
            <View className="mt-2 flex-row items-start gap-2 rounded-xl bg-neutral-100 px-3 py-2 dark:bg-neutral-800">
              <Ionicons name="arrow-undo" size={12} color="#5e6ad2" style={{ marginTop: 2 }} />
              <Text className="flex-1 text-xs text-neutral-600 dark:text-neutral-400">
                {sentReply}
              </Text>
            </View>
          ) : replying ? (
            <View className="mt-2 flex-row items-center gap-2">
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Reply..."
                placeholderTextColor="#a3a3a3"
                autoFocus
                className="flex-1 rounded-full border border-neutral-200 bg-white px-3.5 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
              />
              <Pressable
                onPress={onSend}
                disabled={reply.isPending}
                className="h-8 w-8 items-center justify-center rounded-full bg-brand-500"
              >
                {reply.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="arrow-up" size={14} color="#fff" />
                )}
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={() => setReplying(true)} className="mt-1 self-start">
              <Text className="text-xs font-medium text-neutral-600 dark:text-neutral-500">
                Reply
              </Text>
            </Pressable>
          )}
          {error ? (
            <Text className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</Text>
          ) : null}
        </View>
        {comment.mediaThumbnailUrl ? (
          <Image source={{ uri: comment.mediaThumbnailUrl }} className="h-9 w-9 rounded-md" />
        ) : null}
      </View>
    </View>
  );
}

export default function CommentsScreen() {
  const { data: accounts, isLoading: accountsLoading } = useInstagramAccounts();
  const accountId = accounts?.[0]?.id;
  const { data: comments, isLoading, refetch } = useRecentComments(accountId);

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
        data={comments ?? []}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshing={manualRefreshing}
        onRefresh={onManualRefresh}
        renderItem={({ item }) => <CommentRow comment={item} accountId={accountId} />}
        ListEmptyComponent={
          <View className="items-center gap-2 py-16">
            <View className="mb-2 h-14 w-14 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/10">
              <Ionicons name="chatbubble-ellipses-outline" size={26} color="#5e6ad2" />
            </View>
            <Text className="text-[15px] font-medium text-neutral-700 dark:text-neutral-300">
              No comments yet
            </Text>
          </View>
        }
      />
    </View>
  );
}
