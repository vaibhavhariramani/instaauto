import { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { NotificationDto } from '@instaauto/shared';

import { Card } from '@/components/ui/Card';
import { ListRow } from '@/components/ui/ListRow';
import { useDashboardStats } from '@/api/analytics';
import { useConnectInstagram, useInstagramAccounts } from '@/api/instagram';
import { useAuthStore } from '@/store/authStore';

function formatNumber(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const STAT_CARDS = [
  {
    key: 'totalAutomations',
    label: 'Automations',
    icon: 'flash' as const,
    color: '#5e6ad2',
    format: String,
    route: '/automations' as const,
  },
  {
    key: 'messagesSent',
    label: 'Messages sent',
    icon: 'paper-plane' as const,
    color: '#1baf7a',
    format: formatNumber,
    route: '/messages' as const,
  },
  {
    key: 'commentsDetected',
    label: 'Comments detected',
    icon: 'chatbubble' as const,
    color: '#2a78d6',
    format: formatNumber,
    route: '/comments' as const,
  },
  {
    key: 'successRate',
    label: 'Success rate',
    icon: 'checkmark-circle' as const,
    color: '#eda100',
    format: (n: number) => `${Math.round(n)}%`,
    route: '/analytics' as const,
  },
];

const ACTIVITY_META: Record<
  NotificationDto['type'],
  { icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  AUTOMATION_STARTED: { icon: 'flash', color: '#5e6ad2' },
  INSTAGRAM_DISCONNECTED: { icon: 'logo-instagram', color: '#d03b3b' },
  DM_FAILED: { icon: 'alert-circle', color: '#d03b3b' },
  DM_SENT: { icon: 'paper-plane', color: '#1baf7a' },
  WEBHOOK_RECEIVED: { icon: 'pulse', color: '#2a78d6' },
  KEYWORD_MATCHED: { icon: 'chatbubble-ellipses', color: '#2a78d6' },
};

export default function DashboardScreen() {
  const { data, isLoading, refetch } = useDashboardStats();
  const { data: accounts, refetch: refetchAccounts } = useInstagramAccounts();
  const connect = useConnectInstagram();
  const name = useAuthStore((s) => s.user?.name);
  const totalFollowers = accounts?.reduce((sum, a) => sum + a.followersCount, 0) ?? null;

  // Bound to a manual pull only - refetch() also fires silently in the background
  // (account switch, focus, etc.) and that must never yank the screen down.
  const [manualRefreshing, setManualRefreshing] = useState(false);
  const onManualRefresh = async () => {
    setManualRefreshing(true);
    try {
      await Promise.all([refetch(), refetchAccounts()]);
    } finally {
      setManualRefreshing(false);
    }
  };

  if (isLoading || !data) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <ActivityIndicator color="#5e6ad2" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-neutral-50 dark:bg-neutral-950"
      contentContainerClassName="gap-4 p-4"
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={manualRefreshing} onRefresh={onManualRefresh} />}
    >
      <Text className="text-[15px] text-neutral-600 dark:text-neutral-400">
        {greeting()}
        {name ? `, ${name.split(' ')[0]}` : ''}
      </Text>

      {totalFollowers != null && (
        <Card className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/10">
            <Ionicons name="people" size={19} color="#5e6ad2" />
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
              {formatNumber(totalFollowers)}
            </Text>
            <Text className="text-xs text-neutral-600 dark:text-neutral-400">
              {accounts && accounts.length > 1 ? 'Total followers' : 'Followers'}
            </Text>
          </View>
        </Card>
      )}

      <View className="flex-row flex-wrap gap-3">
        {STAT_CARDS.map((stat) => (
          <Pressable
            key={stat.key}
            testID={`dashboard-stat-${stat.key}`}
            className="min-w-[45%] flex-1"
            onPress={() => router.push(stat.route)}
          >
            <Card className="gap-2">
              <View
                className="h-9 w-9 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${stat.color}1a` }}
              >
                <Ionicons name={stat.icon} size={18} color={stat.color} />
              </View>
              <Text className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                {stat.format((data as unknown as Record<string, number>)[stat.key])}
              </Text>
              <Text className="text-xs text-neutral-600 dark:text-neutral-400">{stat.label}</Text>
            </Card>
          </Pressable>
        ))}
      </View>

      <Card>
        <ListRow
          testID="dashboard-connect-instagram-row"
          icon="logo-instagram"
          label={
            accounts && accounts.length > 0
              ? 'Connect another account'
              : 'Connect Instagram account'
          }
          subtitle={
            accounts && accounts.length > 0
              ? `${accounts.length} connected`
              : 'Link an Instagram account to get started'
          }
          onPress={() => connect.mutate()}
          right={connect.isPending ? <ActivityIndicator size="small" color="#5e6ad2" /> : undefined}
        />
        <ListRow
          testID="dashboard-reels-row"
          icon="film-outline"
          label="Reels"
          subtitle="Posted Reels and their engagement"
          onPress={() => router.push('/reels')}
        />
      </Card>

      <Card>
        <Text className="mb-1 text-base font-semibold text-neutral-900 dark:text-neutral-50">
          Recent activity
        </Text>
        {data.recentActivity.length === 0 ? (
          <View className="items-center gap-2 py-8">
            <Ionicons name="time-outline" size={28} color="#a3a3a3" />
            <Text className="text-sm text-neutral-600 dark:text-neutral-400">No activity yet.</Text>
          </View>
        ) : (
          <View>
            {data.recentActivity.slice(0, 8).map((item) => {
              const meta = ACTIVITY_META[item.type];
              return (
                <View
                  key={item.id}
                  className="flex-row items-center gap-3 border-t border-neutral-100 py-3 first:border-t-0 first:pt-3 dark:border-neutral-800"
                >
                  <View
                    className="h-8 w-8 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${meta.color}1a` }}
                  >
                    <Ionicons name={meta.icon} size={15} color={meta.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm text-neutral-900 dark:text-neutral-50">
                      {item.title}
                    </Text>
                    {item.message ? (
                      <Text
                        className="text-xs text-neutral-600 dark:text-neutral-400"
                        numberOfLines={1}
                      >
                        {item.message}
                      </Text>
                    ) : null}
                  </View>
                  <Text className="text-[11px] text-neutral-600 dark:text-neutral-500">
                    {timeAgo(item.createdAt)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </Card>
    </ScrollView>
  );
}
