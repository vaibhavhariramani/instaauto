import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { DirectMessageDto } from '@instaauto/shared';

import { useConversationMessages, useSendMessage } from '@/api/conversations';

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function MessageBubble({ message }: { message: DirectMessageDto }) {
  const mine = message.direction === 'OUTBOUND';
  return (
    <View className={`mb-2 max-w-[78%] ${mine ? 'self-end items-end' : 'self-start items-start'}`}>
      <View
        className={`rounded-2xl px-3.5 py-2.5 ${
          mine ? 'rounded-br-md bg-brand-500' : 'rounded-bl-md bg-neutral-200 dark:bg-neutral-800'
        }`}
      >
        <Text
          className={
            mine ? 'text-[15px] text-white' : 'text-[15px] text-neutral-900 dark:text-neutral-50'
          }
        >
          {message.content}
        </Text>
      </View>
      <Text className="mt-1 text-[10px] text-neutral-600 dark:text-neutral-500">
        {timeLabel(message.createdAt)}
      </Text>
    </View>
  );
}

export default function ConversationThreadScreen() {
  const { id, accountId, username } = useLocalSearchParams<{
    id: string;
    accountId: string;
    username?: string;
  }>();
  const { data, isLoading } = useConversationMessages(accountId, id);
  const sendMessage = useSendMessage(accountId, id);
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList>(null);

  const onSend = async () => {
    const content = draft.trim();
    if (!content || sendMessage.isPending) return;
    setDraft('');
    try {
      await sendMessage.mutateAsync(content);
      Haptics.selectionAsync();
      requestAnimationFrame(() => listRef.current?.scrollToOffset({ offset: 0, animated: true }));
    } catch {
      setDraft(content);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: username ?? data?.conversation.participantUsername ?? '' }} />
      <KeyboardAvoidingView
        className="flex-1 bg-neutral-50 dark:bg-neutral-950"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {isLoading || !data ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#5e6ad2" />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={[...data.messages].reverse()}
            keyExtractor={(m) => m.id}
            inverted
            contentContainerClassName="px-4 py-3"
            renderItem={({ item }) => <MessageBubble message={item} />}
          />
        )}

        <View className="flex-row items-end gap-2 border-t border-neutral-100 bg-neutral-50 px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-950">
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message..."
            placeholderTextColor="#a3a3a3"
            multiline
            className="max-h-28 flex-1 rounded-2xl border border-neutral-200 bg-white px-4 py-2.5 text-[15px] text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
          />
          <Pressable
            onPress={onSend}
            disabled={!draft.trim() || sendMessage.isPending}
            className={`h-10 w-10 items-center justify-center rounded-full ${
              draft.trim() ? 'bg-brand-500' : 'bg-neutral-200 dark:bg-neutral-800'
            }`}
          >
            {sendMessage.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="arrow-up" size={18} color={draft.trim() ? '#fff' : '#a3a3a3'} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}
