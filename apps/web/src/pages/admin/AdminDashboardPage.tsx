import { Link } from 'react-router-dom';
import { Activity, AlertTriangle, DollarSign, Users, Zap } from 'lucide-react';
import { PLAN_TIERS } from '@instaauto/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminDashboard } from '@/api/admin';
import { ROUTES } from '@/constants/routes';

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  to,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  hint?: string;
  to?: string;
}) {
  const content = (
    <Card className={to ? 'transition-colors hover:border-primary/50' : undefined}>
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

  return to ? (
    <Link to={to} className="block">
      {content}
    </Link>
  ) : (
    content
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
        <StatCard
          icon={Users}
          label="Total users"
          value={data.totalUsers.toLocaleString()}
          to={ROUTES.adminUsers}
        />
        <StatCard
          icon={Users}
          label="New (7 days)"
          value={data.newUsersLast7Days.toLocaleString()}
          hint={`${data.newUsersLast30Days.toLocaleString()} in last 30 days`}
          to={ROUTES.adminUsers}
        />
        <StatCard
          icon={DollarSign}
          label="Active paid subscriptions"
          value={data.activePaidSubscriptions.toLocaleString()}
          hint={`${data.pastDueSubscriptions.toLocaleString()} past due`}
          to={`${ROUTES.adminUsers}?plan=PAID`}
        />
        <StatCard
          icon={DollarSign}
          label="Estimated MRR"
          value={`$${data.estimatedMrr.toLocaleString()}`}
          hint="Estimate, not verified revenue"
          to={`${ROUTES.adminUsers}?plan=PAID`}
        />
        <StatCard
          icon={Zap}
          label="Active automations"
          value={data.totalActiveAutomations.toLocaleString()}
          to={ROUTES.adminAutomations}
        />
        <StatCard
          icon={Activity}
          label="DMs sent (30 days)"
          value={data.dmsSentLast30Days.toLocaleString()}
          to={`${ROUTES.adminAutomations}?sortBy=dms&sortDir=desc`}
        />
        <StatCard
          icon={Users}
          label={`${PLAN_TIERS.STARTER.label} plan`}
          value={data.planCounts.STARTER.toLocaleString()}
          to={`${ROUTES.adminUsers}?plan=STARTER`}
        />
        <StatCard
          icon={AlertTriangle}
          label={`${PLAN_TIERS.PRO.label} / ${PLAN_TIERS.BUSINESS.label}`}
          value={(data.planCounts.PRO + data.planCounts.BUSINESS).toLocaleString()}
          to={`${ROUTES.adminUsers}?plan=PAID`}
        />
      </div>
    </div>
  );
}
