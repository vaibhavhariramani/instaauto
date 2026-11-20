import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { Search, Users } from 'lucide-react';
import { PLAN_TIERS, type SubscriptionPlan } from '@instaauto/shared';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { SortableHead } from '@/components/admin/SortableHead';
import { nextSort, type SortDir } from '@/components/admin/sort';
import { PlanChangeDialog } from '@/components/admin/PlanChangeDialog';
import { useAdminUsers, type AdminUserSortBy } from '@/api/admin';
import { ROUTES } from '@/constants/routes';

const PAGE_SIZE = 25;
const SORT_COLUMNS: readonly AdminUserSortBy[] = [
  'name',
  'plan',
  'status',
  'accounts',
  'automations',
  'dms',
  'joined',
];
const TEXT_COLUMNS: readonly AdminUserSortBy[] = ['name', 'plan', 'status'];

function isSortColumn(value: string | null): value is AdminUserSortBy {
  return SORT_COLUMNS.includes(value as AdminUserSortBy);
}

const PLAN_BADGE: Record<SubscriptionPlan, 'secondary' | 'default' | 'success'> = {
  STARTER: 'secondary',
  PRO: 'default',
  BUSINESS: 'success',
};

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  ACTIVE: 'success',
  TRIALING: 'success',
  PAST_DUE: 'warning',
  CANCELED: 'destructive',
  NONE: 'secondary',
};

type PlanFilter = SubscriptionPlan | 'PAID' | 'ALL';

function isPlanFilter(value: string | null): value is PlanFilter {
  return value === 'STARTER' || value === 'PRO' || value === 'BUSINESS' || value === 'PAID';
}

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput, 300);
  const initialPlan = searchParams.get('plan');
  const [plan, setPlan] = useState<PlanFilter>(isPlanFilter(initialPlan) ? initialPlan : 'ALL');
  const [planTarget, setPlanTarget] = useState<{
    id: string;
    label: string;
    plan: SubscriptionPlan;
  } | null>(null);

  const urlSortBy = searchParams.get('sortBy');
  const urlSortDir = searchParams.get('sortDir');
  const sort = {
    column: isSortColumn(urlSortBy) ? urlSortBy : ('joined' as AdminUserSortBy),
    dir: (urlSortDir === 'asc' ? 'asc' : 'desc') as SortDir,
  };
  const onSort = (column: AdminUserSortBy) => {
    const next = nextSort(column, sort, TEXT_COLUMNS);
    setPage(1);
    setSearchParams(
      (prev) => {
        prev.set('sortBy', next.column);
        prev.set('sortDir', next.dir);
        return prev;
      },
      { replace: true },
    );
  };
  const head = { activeColumn: sort.column, dir: sort.dir, onSort };

  const { data, isLoading, isFetching } = useAdminUsers({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    plan: plan === 'ALL' ? undefined : plan,
    sortBy: sort.column,
    sortDir: sort.dir,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name or email…"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={plan}
          onValueChange={(v) => {
            const next = v as PlanFilter;
            setPlan(next);
            setPage(1);
            setSearchParams(
              (prev) => {
                if (next === 'ALL') prev.delete('plan');
                else prev.set('plan', next);
                return prev;
              },
              { replace: true },
            );
          }}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All plans" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All plans</SelectItem>
            <SelectItem value="STARTER">{PLAN_TIERS.STARTER.label}</SelectItem>
            <SelectItem value="PRO">{PLAN_TIERS.PRO.label}</SelectItem>
            <SelectItem value="BUSINESS">{PLAN_TIERS.BUSINESS.label}</SelectItem>
            <SelectItem value="PAID">
              {PLAN_TIERS.PRO.label} + {PLAN_TIERS.BUSINESS.label}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No users found"
            description="Try a different search or filter."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead label="User" column="name" {...head} />
                <SortableHead label="Plan" column="plan" {...head} />
                <SortableHead label="Status" column="status" {...head} />
                <SortableHead label="Accounts" column="accounts" {...head} />
                <SortableHead label="Automations" column="automations" {...head} />
                <SortableHead label="DMs this period" column="dms" {...head} />
                <SortableHead label="Joined" column="joined" {...head} />
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className={isFetching ? 'opacity-60' : undefined}>
              {data.items.map((u) => (
                <TableRow
                  key={u.id}
                  className="cursor-pointer"
                  onClick={() => navigate(ROUTES.adminUserDetail(u.id))}
                >
                  <TableCell>
                    <div className="font-medium">
                      {u.name}
                      {u.isAdmin && (
                        <Badge variant="outline" className="ml-2">
                          Admin
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={PLAN_BADGE[u.subscriptionPlan]}>
                      {PLAN_TIERS[u.subscriptionPlan].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE[u.subscriptionStatus] ?? 'secondary'}>
                      {u.subscriptionStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>{u.connectedAccountsCount}</TableCell>
                  <TableCell>{u.activeAutomationsCount}</TableCell>
                  <TableCell>{u.dmsSentThisPeriod.toLocaleString()}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlanTarget({ id: u.id, label: u.email, plan: u.subscriptionPlan });
                      }}
                    >
                      Change plan
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {planTarget && (
        <PlanChangeDialog
          key={planTarget.id}
          userId={planTarget.id}
          userLabel={planTarget.label}
          currentPlan={planTarget.plan}
          open
          onOpenChange={(open) => {
            if (!open) setPlanTarget(null);
          }}
        />
      )}

      {data && data.total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page} of {totalPages} — {data.total.toLocaleString()} users
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        <Link to={ROUTES.admin} className="underline">
          ← Back to dashboard
        </Link>
      </p>
    </div>
  );
}
