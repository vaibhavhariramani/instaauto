import { useState } from 'react';
import { Film, Heart, MessageCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { Badge } from '@/components/ui/badge';
import { AnalyticsChart } from '@/components/analytics/AnalyticsChart';
import { TopKeywordsList } from '@/components/analytics/TopKeywordsList';
import { useAnalytics } from '@/api/analytics';
import { useInstagramAccounts, useReels } from '@/api/instagram';
import { formatNumber, formatPercent, timeAgo } from '@/utils/format';

function AutomationAnalytics() {
  const [range, setRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const { data, isLoading } = useAnalytics(range);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Tabs value={range} onValueChange={(v) => setRange(v as typeof range)}>
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading || !data ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Comments detected</p>
                <p className="mt-1 text-2xl font-semibold">{formatNumber(data.totalCommentsDetected)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">DMs sent</p>
                <p className="mt-1 text-2xl font-semibold">{formatNumber(data.totalDmsSent)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Conversion rate</p>
                <p className="mt-1 text-2xl font-semibold">{formatPercent(data.conversionRate)}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Activity over time</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <AnalyticsChart series={data.series} />
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top keywords</CardTitle>
                </CardHeader>
                <CardContent>
                  <TopKeywordsList keywords={data.topKeywords} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Most active Reel</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.mostActiveReel ? (
                    <div className="flex items-center gap-4">
                      <div className="h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {data.mostActiveReel.thumbnailUrl && (
                          <img src={data.mostActiveReel.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{data.mostActiveReel.triggerCount} triggers</p>
                        <p className="text-xs text-muted-foreground">Highest engagement this period</p>
                      </div>
                    </div>
                  ) : (
                    <EmptyState icon={Film} title="No Reel data yet" />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ReelPerformance() {
  const { data: accounts, isLoading: accountsLoading } = useInstagramAccounts();
  const connectedAccount = accounts?.find((a) => a.status === 'CONNECTED');
  const { data: reels, isLoading: reelsLoading } = useReels(connectedAccount?.id);

  const isLoading = accountsLoading || reelsLoading;

  if (!connectedAccount && !accountsLoading) {
    return (
      <EmptyState
        icon={Film}
        title="No Instagram account connected"
        description="Connect an Instagram account to see Reel performance here."
      />
    );
  }

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  if (!reels || reels.length === 0) {
    return <EmptyState icon={Film} title="No Reels found" description="Published Reels will show up here." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
        <Badge variant="outline">Coming soon</Badge>
        <span>
          Views and average watch time require Instagram&apos;s Insights permission, which is pending Meta&apos;s
          approval. Likes and comments below are live.
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {reels.map((reel) => (
          <a
            key={reel.id}
            href={reel.permalink}
            target="_blank"
            rel="noreferrer"
            className="group overflow-hidden rounded-xl border border-border transition-colors hover:border-primary/50"
          >
            <div className="aspect-[9/16] w-full overflow-hidden bg-muted">
              {reel.thumbnailUrl && (
                <img
                  src={reel.thumbnailUrl}
                  alt={reel.caption}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              )}
            </div>
            <div className="space-y-1.5 p-3">
              <p className="line-clamp-2 text-xs text-muted-foreground" title={reel.caption}>
                {reel.caption || 'No caption'}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3" /> {formatNumber(reel.likeCount)}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" /> {formatNumber(reel.commentsCount)}
                </span>
                <span>{timeAgo(reel.timestamp)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground/60">
                <span>Views —</span>
                <span>Avg watch —</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Analytics</h2>
        <p className="text-sm text-muted-foreground">Automation performance and Reel-level engagement, side by side.</p>
      </div>

      <Tabs defaultValue="automations">
        <TabsList>
          <TabsTrigger value="automations">Automations</TabsTrigger>
          <TabsTrigger value="reels">Reels</TabsTrigger>
        </TabsList>
        <TabsContent value="automations" className="mt-6">
          <AutomationAnalytics />
        </TabsContent>
        <TabsContent value="reels" className="mt-6">
          <ReelPerformance />
        </TabsContent>
      </Tabs>
    </div>
  );
}
