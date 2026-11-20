import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Card } from '@/components/ui/Card';
import { ListRow } from '@/components/ui/ListRow';
import { StatusPill } from '@/components/ui/StatusPill';
import { TemplateVariableChips, appendTemplateToken } from '@/components/ui/TemplateVariableChips';
import { MultiTextEditor } from '@/components/ui/MultiTextEditor';
import { LinkButtonsEditor, type LinkButtonValue } from '@/components/ui/LinkButtonsEditor';
import { useAutomation, useDeleteAutomation, useUpdateAutomation } from '@/api/automations';
import { extractErrorMessage } from '@/api/client';

export default function AutomationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: automation, isLoading } = useAutomation(id);
  const update = useUpdateAutomation(id ?? '');
  const remove = useDeleteAutomation();

  const [name, setName] = useState('');
  const [keywords, setKeywords] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [dmOncePerUser, setDmOncePerUser] = useState(false);
  const [ignoreCreatorComments, setIgnoreCreatorComments] = useState(false);
  const [publicReplyEnabled, setPublicReplyEnabled] = useState(false);
  const [publicReplyMessages, setPublicReplyMessages] = useState<string[]>(['']);
  const [requireFollowBeforeCta, setRequireFollowBeforeCta] = useState(false);
  const [followGateMessage, setFollowGateMessage] = useState('');
  const [followButtonLabel, setFollowButtonLabel] = useState('');
  const [sendCtaIfNeverFollows, setSendCtaIfNeverFollows] = useState(true);
  const [openingButtonLabel, setOpeningButtonLabel] = useState('');
  const [ctaLinkButtons, setCtaLinkButtons] = useState<LinkButtonValue[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!automation) return;
    setName(automation.name);
    setKeywords(automation.triggerKeywords.join(', '));
    setReplyMessage(automation.replyMessage);
    setDmOncePerUser(automation.dmOncePerUser);
    setIgnoreCreatorComments(automation.ignoreCreatorComments);
    setPublicReplyEnabled(automation.publicReplyEnabled);
    setPublicReplyMessages(
      automation.publicReplyMessages?.length ? automation.publicReplyMessages : [''],
    );
    setRequireFollowBeforeCta(automation.requireFollowBeforeCta);
    setFollowGateMessage(automation.followGateMessage ?? '');
    setFollowButtonLabel(automation.followButtonLabel ?? '');
    setSendCtaIfNeverFollows(automation.sendCtaIfNeverFollows);
    setOpeningButtonLabel(automation.openingButtonLabel ?? '');
    setCtaLinkButtons(automation.ctaLinkButtons ?? []);
  }, [automation]);

  if (isLoading || !automation) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <ActivityIndicator color="#5e6ad2" />
      </View>
    );
  }

  const onSave = async () => {
    setError(null);
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
      await update.mutateAsync({
        name,
        triggerKeywords: keywords
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean),
        replyMessage,
        dmOncePerUser,
        ignoreCreatorComments,
        publicReplyEnabled,
        publicReplyMessages: publicReplyEnabled ? trimmedPublicReplies : [],
        requireFollowBeforeCta,
        followGateMessage: requireFollowBeforeCta ? followGateMessage.trim() : null,
        followButtonLabel: requireFollowBeforeCta ? followButtonLabel.trim() || null : null,
        sendCtaIfNeverFollows,
        openingButtonLabel: openingButtonLabel.trim() || null,
        ctaLinkButtons: trimmedLinkButtons,
      });
      router.back();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const onDelete = () => {
    Alert.alert('Delete automation?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await remove.mutateAsync(automation.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ title: automation.name, headerBackTitle: 'Automations' }} />
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
          <Card className="flex-row items-center justify-between">
            <View className="gap-1">
              <Text className="text-xs font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-500">
                Status
              </Text>
              <StatusPill
                label={automation.isActive ? 'Active' : 'Paused'}
                tone={automation.isActive ? 'good' : 'neutral'}
              />
            </View>
            <Switch
              value={automation.isActive}
              onValueChange={(value) => update.mutate({ isActive: value })}
              trackColor={{ false: '#d4d4d4', true: '#5e6ad2' }}
            />
          </Card>

          {automation.reelPermalink ? (
            <Card className="gap-1">
              <Text className="text-xs font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-500">
                Linked reel
              </Text>
              <Text className="text-sm text-neutral-900 dark:text-neutral-50" numberOfLines={1}>
                {automation.reelCaption || automation.reelPermalink}
              </Text>
            </Card>
          ) : null}

          <View className="gap-3">
            <Text className="px-1 text-xs font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-500">
              Trigger
            </Text>
            <TextField label="Name" value={name} onChangeText={setName} />
            <TextField
              label="Trigger keywords (comma separated)"
              value={keywords}
              onChangeText={setKeywords}
              autoCapitalize="none"
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
            {publicReplyEnabled && (
              <MultiTextEditor values={publicReplyMessages} onChange={setPublicReplyMessages} />
            )}
          </View>

          <Card>
            <ListRow
              label="DM once per user"
              subtitle="Skip repeat DMs to the same follower"
              right={
                <Switch
                  value={dmOncePerUser}
                  onValueChange={setDmOncePerUser}
                  trackColor={{ false: '#d4d4d4', true: '#5e6ad2' }}
                />
              }
            />
            <ListRow
              label="Ignore creator's own comments"
              subtitle="Don't trigger on your own replies"
              right={
                <Switch
                  value={ignoreCreatorComments}
                  onValueChange={setIgnoreCreatorComments}
                  trackColor={{ false: '#d4d4d4', true: '#5e6ad2' }}
                />
              }
            />
            <ListRow
              label="Reply to the comment publicly"
              subtitle="Also post a visible reply under the comment"
              right={
                <Switch
                  value={publicReplyEnabled}
                  onValueChange={setPublicReplyEnabled}
                  trackColor={{ false: '#d4d4d4', true: '#5e6ad2' }}
                />
              }
            />
            <ListRow
              label="Require follow before sending the DM"
              subtitle="Checks if they follow before sending the opening message above — if not, loops a follow reminder until they do (or 24h passes)"
              right={
                <Switch
                  value={requireFollowBeforeCta}
                  onValueChange={setRequireFollowBeforeCta}
                  trackColor={{ false: '#d4d4d4', true: '#5e6ad2' }}
                />
              }
            />
          </Card>

          {requireFollowBeforeCta && (
            <Card className="gap-3">
              <Text className="text-xs text-neutral-600 dark:text-neutral-400">
                With this on, the opening message above is sent only once they&apos;re confirmed
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
                  onValueChange={setSendCtaIfNeverFollows}
                  trackColor={{ false: '#d4d4d4', true: '#5e6ad2' }}
                />
              </View>
            </Card>
          )}

          {error && <Text className="text-sm text-red-600 dark:text-red-400">{error}</Text>}

          <Button label="Save changes" onPress={onSave} loading={update.isPending} />
          <Button
            label="Delete automation"
            variant="destructive"
            onPress={onDelete}
            loading={remove.isPending}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
