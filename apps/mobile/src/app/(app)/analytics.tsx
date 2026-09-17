import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ActivityBarChart } from '@/components/charts/ActivityBarChart';
import { RankedBarList } from '@/components/charts/RankedBarList';
import { useAnalytics } from '@/api/analytics';

type Range = 'daily' | 'weekly' | 'monthly';

export default function AnalyticsScreen() {
  const [range, setRange] = useState<Range>('weekly');
  const { data, isLoading } = useAnalytics(range);

  return (
    <ScrollView
      className="flex-1 bg-neutral-50 dark:bg-neutral-950"
      contentContainerClassName="gap-4 p-4"
      contentContainerStyle={{ paddingBottom: 100 }}
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
          <View className="flex-row gap-3">
            <Card className="flex-1 gap-1">
              <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                Conversion rate
              </Text>
              <Text className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                {Math.round(data.conversionRate)}%
              </Text>
            </Card>
            {data.mostActiveReel && (
              <Card className="flex-1 gap-1">
                <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                  Most active reel
                </Text>
                <Text className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                  {data.mostActiveReel.triggerCount}
                </Text>
                <Text className="text-xs text-neutral-400 dark:text-neutral-500">triggers</Text>
              </Card>
            )}
          </View>

          <Card>
            <Text className="mb-3 text-base font-semibold text-neutral-900 dark:text-neutral-50">
              Activity by {range === 'daily' ? 'hour' : range === 'weekly' ? 'day' : 'week'}
            </Text>
            {data.series.length === 0 ? (
              <Text className="py-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
                No activity yet.
              </Text>
            ) : (
              <ActivityBarChart data={data.series} />
            )}
          </Card>

          <Card>
            <Text className="mb-3 text-base font-semibold text-neutral-900 dark:text-neutral-50">
              Top keywords
            </Text>
            {data.topKeywords.length === 0 ? (
              <Text className="text-sm text-neutral-500 dark:text-neutral-400">
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
