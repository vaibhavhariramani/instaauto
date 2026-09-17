import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ListRow } from '@/components/ui/ListRow';
import { StatusPill } from '@/components/ui/StatusPill';
import { useAuthStore } from '@/store/authStore';
import { useAccountsStore } from '@/store/accountsStore';
import { useLogout } from '@/api/auth';
import { useMe, useUpdateNotificationPrefs } from '@/api/me';
import { useConnectInstagram, useDisconnectInstagram, useInstagramAccounts } from '@/api/instagram';

const STATUS_LABEL: Record<string, string> = {
  CONNECTED: 'Connected',
  DISCONNECTED: 'Disconnected',
  EXPIRED: 'Expired',
  ERROR: 'Error',
};

export default function SettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const savedAccountCount = useAccountsStore((s) => s.accounts.length);
  const logout = useLogout();
  const { data: accounts, isLoading: accountsLoading } = useInstagramAccounts();
  const connect = useConnectInstagram();
  const disconnect = useDisconnectInstagram();
  useMe(true);
  const updatePrefs = useUpdateNotificationPrefs();

  const [emailOnDmFailed, setEmailOnDmFailed] = useState(user?.emailOnDmFailed ?? true);
  const [emailWeeklyDigest, setEmailWeeklyDigest] = useState(user?.emailWeeklyDigest ?? true);

  if (!user) return null;

  return (
    <ScrollView
      className="flex-1 bg-neutral-50 dark:bg-neutral-950"
      contentContainerClassName="gap-4 p-4"
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <Pressable onPress={() => router.push('/settings/accounts')}>
        <Card className="flex-row items-center gap-3">
          {user.avatarUrl ? (
            <Image
              source={{ uri: user.avatarUrl }}
              className="h-14 w-14 rounded-full bg-neutral-100 dark:bg-neutral-800"
            />
          ) : (
            <View className="h-14 w-14 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900">
              <Text className="text-lg font-bold text-brand-600 dark:text-brand-300">
                {user.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View className="flex-1">
            <Text className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
              {user.name}
            </Text>
            <Text className="text-sm text-neutral-500 dark:text-neutral-400">{user.email}</Text>
          </View>
          <View className="items-end gap-1">
            {savedAccountCount > 1 && (
              <Text className="text-xs font-medium text-brand-600 dark:text-brand-400">
                {savedAccountCount} accounts
              </Text>
            )}
            <Ionicons name="chevron-forward" size={18} color="#a3a3a3" />
          </View>
        </Card>
      </Pressable>

      <View className="gap-2">
        <Text className="px-1 text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
          Instagram accounts
        </Text>
        <Card>
          {accountsLoading ? (
            <ActivityIndicator color="#5e6ad2" />
          ) : !accounts || accounts.length === 0 ? (
            <View className="items-center gap-3 py-2">
              <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                No Instagram account connected yet.
              </Text>
              <Button
                label="Connect account"
                variant="secondary"
                onPress={() => connect.mutate()}
                loading={connect.isPending}
              />
            </View>
          ) : (
            <View>
              {accounts.map((account) => (
                <View
                  key={account.id}
                  className="flex-row items-center gap-3 border-t border-neutral-100 py-3 first:border-t-0 first:pt-0 dark:border-neutral-800"
                >
                  {account.profilePictureUrl ? (
                    <Image
                      source={{ uri: account.profilePictureUrl }}
                      className="h-10 w-10 rounded-full bg-neutral-100 dark:bg-neutral-800"
                    />
                  ) : (
                    <View className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                      <Ionicons name="logo-instagram" size={18} color="#a3a3a3" />
                    </View>
                  )}
                  <View className="flex-1 gap-1">
                    <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                      @{account.username}
                    </Text>
                    <StatusPill
                      label={STATUS_LABEL[account.status]}
                      tone={
                        account.status === 'CONNECTED'
                          ? 'good'
                          : account.status === 'DISCONNECTED'
                            ? 'neutral'
                            : 'critical'
                      }
                    />
                  </View>
                  <Button
                    label="Disconnect"
                    variant="ghost"
                    onPress={() => disconnect.mutate(account.id)}
                    loading={disconnect.isPending}
                  />
                </View>
              ))}
            </View>
          )}
        </Card>
        {accounts && accounts.length > 0 && (
          <Button
            label="Connect another account"
            variant="secondary"
            onPress={() => connect.mutate()}
            loading={connect.isPending}
          />
        )}
      </View>

      <View className="gap-2">
        <Text className="px-1 text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
          Notifications
        </Text>
        <Card>
          <ListRow
            label="Email me when a DM fails"
            right={
              <Switch
                value={emailOnDmFailed}
                onValueChange={(v) => {
                  setEmailOnDmFailed(v);
                  updatePrefs.mutate({ emailOnDmFailed: v });
                }}
                trackColor={{ false: '#d4d4d4', true: '#5e6ad2' }}
              />
            }
          />
          <ListRow
            label="Weekly digest email"
            right={
              <Switch
                value={emailWeeklyDigest}
                onValueChange={(v) => {
                  setEmailWeeklyDigest(v);
                  updatePrefs.mutate({ emailWeeklyDigest: v });
                }}
                trackColor={{ false: '#d4d4d4', true: '#5e6ad2' }}
              />
            }
          />
        </Card>
      </View>

      <Card>
        <Pressable
          accessibilityRole="button"
          onPress={() => logout.mutate()}
          disabled={logout.isPending}
          className="items-center"
        >
          {logout.isPending ? (
            <ActivityIndicator color="#dc2626" />
          ) : (
            <Text className="text-base font-semibold text-red-600 dark:text-red-400">Sign out</Text>
          )}
        </Pressable>
      </Card>
    </ScrollView>
  );
}
