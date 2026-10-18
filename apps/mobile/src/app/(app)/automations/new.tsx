import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Card } from '@/components/ui/Card';
import { HeaderBackButton } from '@/components/ui/HeaderBackButton';
import { MultiTextEditor } from '@/components/ui/MultiTextEditor';
import { LinkButtonsEditor, type LinkButtonValue } from '@/components/ui/LinkButtonsEditor';
import { TemplateVariableChips, appendTemplateToken } from '@/components/ui/TemplateVariableChips';
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
  const REELS_PAGE_SIZE = 9;
  const [visibleReelCount, setVisibleReelCount] = useState(REELS_PAGE_SIZE);

  const [name, setName] = useState('');
  const [keywords, setKeywords] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [publicReplyEnabled, setPublicReplyEnabled] = useState(false);
  const [publicReplyMessages, setPublicReplyMessages] = useState<string[]>(['']);
  const [requireFollowBeforeCta, setRequireFollowBeforeCta] = useState(false);
  const [followGateMessage, setFollowGateMessage] = useState('');
  const [followButtonLabel, setFollowButtonLabel] = useState('');
  const [sendCtaIfNeverFollows, setSendCtaIfNeverFollows] = useState(true);
  const [openingButtonLabel, setOpeningButtonLabel] = useState('');
  const [ctaLinkButtons, setCtaLinkButtons] = useState<LinkButtonValue[]>([]);
  const [error, setError] = useState<string | null>(null);

  const create = useCreateAutomation();

  if (!accountsLoading && (!accounts || accounts.length === 0)) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-neutral-50 px-8 dark:bg-neutral-950">
        <Ionicons name="logo-instagram" size={32} color="#a3a3a3" />
        <Text className="text-center text-[15px] font-medium text-neutral-700 dark:text-neutral-300">
          Connect an Instagram account first
        </Text>
        <Text className="text-center text-xs text-neutral-600 dark:text-neutral-500">
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
    const trimmedPublicReplies = publicReplyMessages.map((m) => m.trim()).filter(Boolean);
    if (publicReplyEnabled && trimmedPublicReplies.length === 0) {
      setError(
        'Add at least one public reply message, or turn off "Reply to the comment publicly".',
      );
      return;
    }
    if (requireFollowBeforeCta && !followGateMessage.trim()) {
      setError('Add a follow-ask message, or turn off "Require follow before sending the DM".');
      return;
    }
    const trimmedLinkButtons = ctaLinkButtons
      .map((b) => ({ label: b.label.trim(), url: b.url.trim() }))
      .filter((b) => b.label && b.url);
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
        publicReplyEnabled,
        publicReplyMessages: publicReplyEnabled ? trimmedPublicReplies : [],
        requireFollowBeforeCta,
        followGateMessage: requireFollowBeforeCta ? followGateMessage.trim() : null,
        followButtonLabel: requireFollowBeforeCta ? followButtonLabel.trim() || null : null,
        sendCtaIfNeverFollows,
        openingButtonLabel: openingButtonLabel.trim() || null,
        ctaLinkButtons: trimmedLinkButtons,
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
      <Stack.Screen options={{ title: 'New automation', headerLeft: () => <HeaderBackButton /> }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'android' ? 'height' : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 bg-neutral-50 dark:bg-neutral-950"
          contentContainerClassName="gap-4 p-4"
          contentContainerStyle={{ paddingBottom: 140 }}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          contentInsetAdjustmentBehavior="automatic"
        >
          {accounts && accounts.length > 1 && (
            <View className="gap-2">
              <Text className="px-1 text-xs font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-500">
                Instagram account
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {accounts.map((a) => (
                  <Pressable
                    key={a.id}
                    onPress={() => {
                      setAccountId(a.id);
                      setSelectedReel(null);
                      setVisibleReelCount(REELS_PAGE_SIZE);
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
            <Text className="px-1 text-xs font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-500">
              Pick a Reel
            </Text>
            <Card>
              {reelsLoading ? (
                <ActivityIndicator color="#5e6ad2" />
              ) : !reels || reels.length === 0 ? (
                <Text className="py-4 text-center text-sm text-neutral-600 dark:text-neutral-400">
                  No Reels found on this account yet.
                </Text>
              ) : (
                <>
                  <View className="flex-row flex-wrap gap-2">
                    {reels.slice(0, visibleReelCount).map((reel) => {
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
                  {visibleReelCount < reels.length && (
                    <Pressable
                      onPress={() => {
                        Haptics.selectionAsync();
                        setVisibleReelCount((c) => c + REELS_PAGE_SIZE);
                      }}
                      className="mt-3 items-center rounded-xl border border-neutral-200 py-2.5 dark:border-neutral-700"
                    >
                      <Text className="text-sm font-medium text-brand-600 dark:text-brand-400">
                        Show more ({reels.length - visibleReelCount} left)
                      </Text>
                    </Pressable>
                  )}
                </>
              )}
            </Card>
          </View>

          <View className="gap-3">
            <Text className="px-1 text-xs font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-500">
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
          </View>

          <View className="gap-3">
            <View className="px-1">
              <Text className="text-xs font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-500">
                {requireFollowBeforeCta
                  ? 'Opening message — sent once they follow'
                  : 'Opening DM — sent first, every time'}
              </Text>
              <Text className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                {requireFollowBeforeCta
                  ? 'Since "Require follow" is on below, this is sent after they tap to confirm they follow you, not as the very first message.'
                  : 'This message (and its button) is what they see right after commenting.'}
              </Text>
            </View>
            <TextField
              label="Opening message"
              value={replyMessage}
              onChangeText={setReplyMessage}
              multiline
              numberOfLines={4}
              style={{ minHeight: 90, textAlignVertical: 'top' }}
              placeholder="Thanks for your interest! Here's the link..."
            />
            <TemplateVariableChips
              onInsert={(token) => setReplyMessage((prev) => appendTemplateToken(prev, token))}
            />
            <View className="px-1">
              <Text className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Button on this message (optional)
              </Text>
              <Text className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                Add a real link below for a tappable button that opens a URL. No link yet? Use a
                plain button label instead — tapping it just sends a reply, it won&apos;t open
                anything.
              </Text>
            </View>
            <LinkButtonsEditor values={ctaLinkButtons} onChange={setCtaLinkButtons} />
            {ctaLinkButtons.length === 0 && (
              <TextField
                label="Plain button label (optional, no link)"
                value={openingButtonLabel}
                onChangeText={setOpeningButtonLabel}
                maxLength={20}
                placeholder="e.g. Send me the link"
              />
            )}
          </View>

          <Card className="gap-3">
            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-1">
                <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                  Reply to the comment publicly
                </Text>
                <Text className="text-xs text-neutral-600 dark:text-neutral-400">
                  Also post a visible reply under the comment, in addition to the DM. Add a few
                  variations and one is picked at random each time, avoiding a repetitive look.
                </Text>
              </View>
              <Switch
                value={publicReplyEnabled}
                onValueChange={(v) => {
                  Haptics.selectionAsync();
                  setPublicReplyEnabled(v);
                }}
                trackColor={{ false: '#d4d4d4', true: '#5e6ad2' }}
              />
            </View>
            {publicReplyEnabled && (
              <MultiTextEditor
                values={publicReplyMessages}
                onChange={setPublicReplyMessages}
                placeholder="Sent you a DM! 📩"
              />
            )}
          </Card>

          <Card className="gap-3">
            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-1">
                <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                  Require follow before sending the DM
                </Text>
                <Text className="text-xs text-neutral-600 dark:text-neutral-400">
                  Checks if they follow before sending the real message above — if not, loops a
                  follow reminder until they do (or 24h passes)
                </Text>
              </View>
              <Switch
                value={requireFollowBeforeCta}
                onValueChange={(v) => {
                  Haptics.selectionAsync();
                  setRequireFollowBeforeCta(v);
                }}
                trackColor={{ false: '#d4d4d4', true: '#5e6ad2' }}
              />
            </View>
            {requireFollowBeforeCta && (
              <>
                <Text className="text-xs text-neutral-600 dark:text-neutral-400">
                  With this on, the real message above is sent only once they&apos;re confirmed
                  following. This message below goes out first instead — keep it generic, since we
                  don&apos;t know their follow status yet.
                </Text>
                <TextField
                  label="Pre-check message (sent first)"
                  value={followGateMessage}
                  onChangeText={setFollowGateMessage}
                  multiline
                  numberOfLines={2}
                  style={{ minHeight: 60, textAlignVertical: 'top' }}
                  placeholder="Thanks for stopping by! Tap below and I'll send you access shortly ✨"
                />
                <TextField
                  label="Visit-profile button label (optional)"
                  value={followButtonLabel}
                  onChangeText={setFollowButtonLabel}
                  maxLength={20}
                  placeholder="e.g. Visit Profile"
                />
                <Text className="-mt-2 text-xs text-neutral-600 dark:text-neutral-400">
                  Opens your profile. If they are not following yet, we also add a fixed
                  &ldquo;I&apos;m following ✅&rdquo; button that rechecks their follow status when
                  tapped.
                </Text>
                <View className="flex-row items-center justify-between gap-3 border-t border-neutral-100 pt-3 dark:border-neutral-800">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                      If they never follow
                    </Text>
                    <Text className="text-xs text-neutral-600 dark:text-neutral-400">
                      {sendCtaIfNeverFollows
                        ? 'Send the link anyway after 24 hours'
                        : "Only followers get the link — they'll keep getting reminded"}
                    </Text>
                  </View>
                  <Switch
                    value={sendCtaIfNeverFollows}
                    onValueChange={(v) => {
                      Haptics.selectionAsync();
                      setSendCtaIfNeverFollows(v);
                    }}
                    trackColor={{ false: '#d4d4d4', true: '#5e6ad2' }}
                  />
                </View>
              </>
            )}
          </Card>

          {error && <Text className="text-sm text-red-600 dark:text-red-400">{error}</Text>}

          <Button label="Create automation" onPress={onSubmit} loading={create.isPending} />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
