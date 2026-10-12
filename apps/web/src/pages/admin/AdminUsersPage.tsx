import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { Search, Users } from 'lucide-react';
import type { SubscriptionPlan } from '@instaauto/shared';
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
import { useAdminUsers } from '@/api/admin';
import { ROUTES } from '@/constants/routes';

const PAGE_SIZE = 25;

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

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput, 300);
  const [plan, setPlan] = useState<SubscriptionPlan | 'ALL'>('ALL');

  const { data, isLoading, isFetching } = useAdminUsers({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    plan: plan === 'ALL' ? undefined : plan,
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
            setPlan(v as SubscriptionPlan | 'ALL');
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All plans" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All plans</SelectItem>
            <SelectItem value="STARTER">Starter</SelectItem>
            <SelectItem value="PRO">Pro</SelectItem>
            <SelectItem value="BUSINESS">Business</SelectItem>
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
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Accounts</TableHead>
                <TableHead>Automations</TableHead>
                <TableHead>DMs this period</TableHead>
                <TableHead>Joined</TableHead>
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
                    <Badge variant={PLAN_BADGE[u.subscriptionPlan]}>{u.subscriptionPlan}</Badge>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

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
