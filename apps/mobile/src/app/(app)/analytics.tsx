import { useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Card } from '@/components/ui/Card';
import { ListRow } from '@/components/ui/ListRow';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ActivityBarChart } from '@/components/charts/ActivityBarChart';
import { SuccessRateLineChart } from '@/components/charts/SuccessRateLineChart';
import { RankedBarList } from '@/components/charts/RankedBarList';
import { useAnalytics } from '@/api/analytics';
import { useInstagramAccounts } from '@/api/instagram';

type Range = 'daily' | 'weekly' | 'monthly';

function formatNumber(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

export default function AnalyticsScreen() {
  const [range, setRange] = useState<Range>('weekly');
  const { data, isLoading, refetch } = useAnalytics(range);
  const { data: accounts, refetch: refetchAccounts } = useInstagramAccounts();
  const totalFollowers = accounts?.reduce((sum, a) => sum + a.followersCount, 0) ?? null;

  const [manualRefreshing, setManualRefreshing] = useState(false);
  const onManualRefresh = async () => {
    setManualRefreshing(true);
    try {
      await Promise.all([refetch(), refetchAccounts()]);
    } finally {
      setManualRefreshing(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-neutral-50 dark:bg-neutral-950"
      contentContainerClassName="gap-4 p-4"
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={manualRefreshing} onRefresh={onManualRefresh} />}
    >
      <SegmentedControl
        value={range}
        onChange={setRange}
        options={[
          { value: 'daily', label: 'Daily' },
          { value: 'weekly', label: 'Weekly' },
          { value: 'monthly', label: 'Monthly' },
        ]}
      />

      {isLoading || !data ? (
        <View className="items-center py-16">
          <ActivityIndicator color="#5e6ad2" />
        </View>
      ) : (
        <>
          <View className="flex-row flex-wrap gap-3">
            {totalFollowers != null && (
              <Card className="min-w-[45%] flex-1 gap-1">
                <Text className="text-xs text-neutral-600 dark:text-neutral-400">
                  {accounts && accounts.length > 1 ? 'Total followers' : 'Followers'}
                </Text>
                <Text className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                  {formatNumber(totalFollowers)}
                </Text>
              </Card>
            )}
            <Card className="min-w-[45%] flex-1 gap-1">
              <Text className="text-xs text-neutral-600 dark:text-neutral-400">
                Conversion rate
              </Text>
              <Text className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                {Math.round(data.conversionRate)}%
              </Text>
            </Card>
            {data.mostActiveReel && (
              <Card className="min-w-[45%] flex-1 gap-1">
                <Text className="text-xs text-neutral-600 dark:text-neutral-400">
                  Most active reel
                </Text>
                <Text className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                  {data.mostActiveReel.triggerCount}
                </Text>
                <Text className="text-xs text-neutral-600 dark:text-neutral-500">triggers</Text>
              </Card>
            )}
          </View>

          <Card>
            <ListRow
              testID="analytics-reels-row"
              icon="film-outline"
              label="Reels"
              subtitle="Posted Reels and their engagement"
              onPress={() => router.push('/reels')}
            />
          </Card>

          <Card>
            <Text className="mb-3 text-base font-semibold text-neutral-900 dark:text-neutral-50">
              Activity by {range === 'daily' ? 'hour' : range === 'weekly' ? 'day' : 'week'}
            </Text>
            {data.series.length === 0 ? (
              <Text className="py-6 text-center text-sm text-neutral-600 dark:text-neutral-400">
                No activity yet.
              </Text>
            ) : (
              <ActivityBarChart data={data.series} />
            )}
          </Card>

          <Card>
            <Text className="mb-3 text-base font-semibold text-neutral-900 dark:text-neutral-50">
              Successful vs unsuccessful sends
            </Text>
            {data.series.length === 0 ? (
              <Text className="py-6 text-center text-sm text-neutral-600 dark:text-neutral-400">
                No activity yet.
              </Text>
            ) : (
              <SuccessRateLineChart data={data.series} />
            )}
          </Card>

          <Card>
            <Text className="mb-3 text-base font-semibold text-neutral-900 dark:text-neutral-50">
              Top keywords
            </Text>
            {data.topKeywords.length === 0 ? (
              <Text className="text-sm text-neutral-600 dark:text-neutral-400">
                No keyword data yet.
              </Text>
            ) : (
              <RankedBarList
                items={data.topKeywords.map((k) => ({ label: k.keyword, count: k.count }))}
              />
            )}
          </Card>
        </>
      )}
    </ScrollView>
  );
}
