import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Card } from '@/components/ui/Card';
import { useInstagramAccounts, useReels } from '@/api/instagram';
import { useCreateAutomation } from '@/api/automations';
import { extractErrorMessage } from '@/api/client';
import type { ReelDto } from '@instaauto/shared';

export default function NewAutomationScreen() {
  const { data: accounts, isLoading: accountsLoading } = useInstagramAccounts();
  const [accountId, setAccountId] = useState<string | undefined>(undefined);
  const activeAccountId = accountId ?? accounts?.[0]?.id;

  const { data: reels, isLoading: reelsLoading } = useReels(activeAccountId);
  const [selectedReel, setSelectedReel] = useState<ReelDto | null>(null);

  const [name, setName] = useState('');
  const [keywords, setKeywords] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const create = useCreateAutomation();

  if (!accountsLoading && (!accounts || accounts.length === 0)) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-neutral-50 px-8 dark:bg-neutral-950">
        <Ionicons name="logo-instagram" size={32} color="#a3a3a3" />
        <Text className="text-center text-[15px] font-medium text-neutral-700 dark:text-neutral-300">
          Connect an Instagram account first
        </Text>
        <Text className="text-center text-xs text-neutral-400 dark:text-neutral-500">
          Automations reply on a specific Reel, so you'll need a connected account to pick from.
        </Text>
        <Button
          label="Go to Settings"
          variant="secondary"
          onPress={() => router.push('/settings')}
        />
      </View>
    );
  }

  const onSubmit = async () => {
    setError(null);
    if (!activeAccountId || !selectedReel) {
      setError('Pick a Reel to attach this automation to.');
      return;
    }
    const parsedKeywords = keywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    if (!name.trim() || parsedKeywords.length === 0 || !replyMessage.trim()) {
      setError('Fill in a name, at least one keyword, and a reply message.');
      return;
    }
    try {
      await create.mutateAsync({
        name: name.trim(),
        instagramAccountId: activeAccountId,
        reelId: selectedReel.id,
        reelThumbnailUrl: selectedReel.thumbnailUrl,
        reelPermalink: selectedReel.permalink,
        reelCaption: selectedReel.caption,
        triggerKeywords: parsedKeywords,
        matchType: 'CONTAINS',
        replyMessage: replyMessage.trim(),
        publicReplyEnabled: false,
        publicReplyMessage: null,
        dmOncePerUser: true,
        ignoreCreatorComments: true,
        isActive: true,
        templateId: null,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'New automation' }} />
      <ScrollView
        className="flex-1 bg-neutral-50 dark:bg-neutral-950"
        contentContainerClassName="gap-4 p-4"
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {accounts && accounts.length > 1 && (
          <View className="gap-2">
            <Text className="px-1 text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
              Instagram account
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {accounts.map((a) => (
                <Pressable
                  key={a.id}
                  onPress={() => {
                    setAccountId(a.id);
                    setSelectedReel(null);
                  }}
                  className={`rounded-full border px-3 py-2 ${
                    activeAccountId === a.id
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                      : 'border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      activeAccountId === a.id
                        ? 'text-brand-600 dark:text-brand-400'
                        : 'text-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    @{a.username}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <View className="gap-2">
          <Text className="px-1 text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
            Pick a Reel
          </Text>
          <Card>
            {reelsLoading ? (
              <ActivityIndicator color="#5e6ad2" />
            ) : !reels || reels.length === 0 ? (
              <Text className="py-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
                No Reels found on this account yet.
              </Text>
            ) : (
              <View className="flex-row flex-wrap gap-2">
                {reels.map((reel) => {
                  const active = selectedReel?.id === reel.id;
                  return (
                    <Pressable
                      key={reel.id}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedReel(reel);
                      }}
                      className={`overflow-hidden rounded-xl border-2 ${
                        active ? 'border-brand-500' : 'border-transparent'
                      }`}
                      style={{ width: '31%', aspectRatio: 9 / 16 }}
                    >
                      <Image
                        source={{ uri: reel.thumbnailUrl }}
                        className="h-full w-full bg-neutral-100 dark:bg-neutral-800"
                      />
                      {active && (
                        <View className="absolute inset-0 items-center justify-center bg-black/30">
                          <Ionicons name="checkmark-circle" size={28} color="white" />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </Card>
        </View>

        <View className="gap-3">
          <Text className="px-1 text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
            Automation
          </Text>
          <TextField
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Free guide giveaway"
          />
          <TextField
            label="Trigger keywords (comma separated)"
            value={keywords}
            onChangeText={setKeywords}
            autoCapitalize="none"
            placeholder="guide, link, info"
          />
          <TextField
            label="DM reply message"
            value={replyMessage}
            onChangeText={setReplyMessage}
            multiline
            numberOfLines={4}
            style={{ minHeight: 90, textAlignVertical: 'top' }}
            placeholder="Thanks for your interest! Here's the link..."
          />
        </View>

        {error && <Text className="text-sm text-red-600 dark:text-red-400">{error}</Text>}

        <Button label="Create automation" onPress={onSubmit} loading={create.isPending} />
      </ScrollView>
    </>
  );
}
