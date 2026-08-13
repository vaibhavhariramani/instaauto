import { CheckCircle2, MessageSquare, Send, Zap } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { MessagesTrendChart } from '@/components/dashboard/MessagesTrendChart';
import { RecentActivityCard } from '@/components/dashboard/RecentActivityCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardStats } from '@/api/analytics';
import { formatNumber, formatPercent } from '@/utils/format';

export default function DashboardOverviewPage() {
  const { data, isLoading } = useDashboardStats();

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Automations" value={String(data.totalAutomations)} icon={Zap} accent="violet" delay={0} />
        <StatCard label="Messages Sent" value={formatNumber(data.messagesSent)} icon={Send} accent="blue" delay={0.05} />
        <StatCard
          label="Comments Detected"
          value={formatNumber(data.commentsDetected)}
          icon={MessageSquare}
          accent="amber"
          delay={0.1}
        />
        <StatCard label="Success Rate" value={formatPercent(data.successRate)} icon={CheckCircle2} accent="emerald" delay={0.15} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MessagesTrendChart data={data.messagesTrend} />
        </div>
        <QuickActions />
      </div>

      <RecentActivityCard items={data.recentActivity} />
    </div>
  );
}
