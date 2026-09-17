import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAccountsStore } from '@/store/accountsStore';
import { useRemoveAccount, useSwitchAccount } from '@/api/auth';

export default function SwitchAccountScreen() {
  const accounts = useAccountsStore((s) => s.accounts);
  const activeUserId = useAccountsStore((s) => s.activeUserId);
  const switchAccount = useSwitchAccount();
  const removeAccount = useRemoveAccount();

  return (
    <ScrollView
      className="flex-1 bg-neutral-50 dark:bg-neutral-950"
      contentContainerClassName="gap-4 p-4"
    >
      <Card>
        {accounts.map((account, index) => {
          const isActive = account.userId === activeUserId;
          const isSwitching = switchAccount.isPending && switchAccount.variables === account.userId;
          return (
            <View
              key={account.userId}
              className={`flex-row items-center gap-3 py-3 ${index > 0 ? 'border-t border-neutral-100 dark:border-neutral-800' : ''}`}
            >
              <Pressable
                disabled={isActive || switchAccount.isPending}
                onPress={() => {
                  Haptics.selectionAsync();
                  switchAccount.mutate(account.userId, { onSuccess: () => router.back() });
                }}
                className="flex-1 flex-row items-center gap-3"
              >
                {account.avatarUrl ? (
                  <Image
                    source={{ uri: account.avatarUrl }}
                    className="h-11 w-11 rounded-full bg-neutral-100 dark:bg-neutral-800"
                  />
                ) : (
                  <View className="h-11 w-11 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900">
                    <Text className="text-base font-bold text-brand-600 dark:text-brand-300">
                      {account.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                    {account.name}
                  </Text>
                  <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                    {account.email}
                  </Text>
                </View>
                {isSwitching ? (
                  <ActivityIndicator color="#5e6ad2" />
                ) : isActive ? (
                  <Ionicons name="checkmark-circle" size={22} color="#5e6ad2" />
                ) : null}
              </Pressable>
              {!isActive && (
                <Pressable
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => removeAccount.mutate(account.userId)}
                >
                  <Ionicons name="close-circle-outline" size={20} color="#a3a3a3" />
                </Pressable>
              )}
            </View>
          );
        })}
      </Card>

      <Button
        label="Add another account"
        variant="secondary"
        icon={<Ionicons name="add" size={18} color="#5e6ad2" />}
        onPress={() => router.push('/settings/add-account')}
      />

      {switchAccount.isError && (
        <Text className="text-center text-sm text-red-600 dark:text-red-400">
          Couldn't switch accounts - it may have been signed out elsewhere.
        </Text>
      )}
    </ScrollView>
  );
}
