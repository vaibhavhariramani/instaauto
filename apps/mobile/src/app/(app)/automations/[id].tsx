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
  const [publicReplyMessage, setPublicReplyMessage] = useState('');
  const [requireFollowBeforeCta, setRequireFollowBeforeCta] = useState(false);
  const [followGateMessage, setFollowGateMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!automation) return;
    setName(automation.name);
    setKeywords(automation.triggerKeywords.join(', '));
    setReplyMessage(automation.replyMessage);
    setDmOncePerUser(automation.dmOncePerUser);
    setIgnoreCreatorComments(automation.ignoreCreatorComments);
    setPublicReplyEnabled(automation.publicReplyEnabled);
    setPublicReplyMessage(automation.publicReplyMessage ?? '');
    setRequireFollowBeforeCta(automation.requireFollowBeforeCta);
    setFollowGateMessage(automation.followGateMessage ?? '');
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
    if (publicReplyEnabled && !publicReplyMessage.trim()) {
      setError('Add a public reply message, or turn off "Reply to the comment publicly".');
      return;
    }
    if (requireFollowBeforeCta && !followGateMessage.trim()) {
      setError('Add a follow-ask message, or turn off "Require follow before sending the DM".');
      return;
    }
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
        publicReplyMessage: publicReplyEnabled ? publicReplyMessage.trim() : null,
        requireFollowBeforeCta,
        followGateMessage: requireFollowBeforeCta ? followGateMessage.trim() : null,
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
              Trigger &amp; reply
            </Text>
            <TextField label="Name" value={name} onChangeText={setName} />
            <TextField
              label="Trigger keywords (comma separated)"
              value={keywords}
              onChangeText={setKeywords}
              autoCapitalize="none"
            />
            <TextField
              label="DM reply message"
              value={replyMessage}
              onChangeText={setReplyMessage}
              multiline
              numberOfLines={4}
              style={{ minHeight: 90, textAlignVertical: 'top' }}
            />
            <TemplateVariableChips
              onInsert={(token) => setReplyMessage((prev) => appendTemplateToken(prev, token))}
            />
            {publicReplyEnabled && (
              <>
                <TextField
                  label="Public reply to comment"
                  value={publicReplyMessage}
                  onChangeText={setPublicReplyMessage}
                  multiline
                  numberOfLines={2}
                  style={{ minHeight: 60, textAlignVertical: 'top' }}
                />
                <TemplateVariableChips
                  onInsert={(token) =>
                    setPublicReplyMessage((prev) => appendTemplateToken(prev, token))
                  }
                />
              </>
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
              subtitle="Ask them to follow first, then send the real message"
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
            <TextField
              label="Follow-ask message"
              value={followGateMessage}
              onChangeText={setFollowGateMessage}
              multiline
              numberOfLines={2}
              style={{ minHeight: 60, textAlignVertical: 'top' }}
            />
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
