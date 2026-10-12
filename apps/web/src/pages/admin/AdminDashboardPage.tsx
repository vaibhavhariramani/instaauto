import { Link } from 'react-router-dom';
import { Activity, AlertTriangle, DollarSign, Users, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminDashboard } from '@/api/admin';
import { ROUTES } from '@/constants/routes';

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const { data, isLoading } = useAdminDashboard();

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Estimated MRR is a sum of current ACTIVE/TRIALING subscribers' monthly list price — not
          verified payment revenue. See{' '}
          <Link to={ROUTES.adminUsers} className="font-medium text-primary underline">
            all users
          </Link>{' '}
          for per-account detail.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total users" value={data.totalUsers.toLocaleString()} />
        <StatCard
          icon={Users}
          label="New (7 days)"
          value={data.newUsersLast7Days.toLocaleString()}
          hint={`${data.newUsersLast30Days.toLocaleString()} in last 30 days`}
        />
        <StatCard
          icon={DollarSign}
          label="Active paid subscriptions"
          value={data.activePaidSubscriptions.toLocaleString()}
          hint={`${data.pastDueSubscriptions.toLocaleString()} past due`}
        />
        <StatCard
          icon={DollarSign}
          label="Estimated MRR"
          value={`$${data.estimatedMrr.toLocaleString()}`}
          hint="Estimate, not verified revenue"
        />
        <StatCard
          icon={Zap}
          label="Active automations"
          value={data.totalActiveAutomations.toLocaleString()}
        />
        <StatCard
          icon={Activity}
          label="DMs sent (30 days)"
          value={data.dmsSentLast30Days.toLocaleString()}
        />
        <StatCard
          icon={Users}
          label="Starter plan"
          value={data.planCounts.STARTER.toLocaleString()}
        />
        <StatCard
          icon={AlertTriangle}
          label="Pro / Business"
          value={(data.planCounts.PRO + data.planCounts.BUSINESS).toLocaleString()}
        />
      </div>
    </div>
  );
}
