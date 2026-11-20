import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Zap } from 'lucide-react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
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
import { useAdminAutomations, type AdminAutomationsParams } from '@/api/admin';
import { ROUTES } from '@/constants/routes';

const PAGE_SIZE = 25;

type Sort = NonNullable<AdminAutomationsParams['sort']>;

function isSort(value: string | null): value is Sort {
  return value === 'triggers' || value === 'dms' || value === 'recent';
}

const SORT_LABEL: Record<Sort, string> = {
  triggers: 'Most triggers',
  dms: 'Most DMs sent',
  recent: 'Newest first',
};

export default function AdminAutomationsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput, 300);
  const initialSort = searchParams.get('sort');
  const [sort, setSort] = useState<Sort>(isSort(initialSort) ? initialSort : 'triggers');

  const { data, isLoading, isFetching } = useAdminAutomations({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    sort,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name or owner…"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={sort}
          onValueChange={(v) => {
            const next = v as Sort;
            setSort(next);
            setPage(1);
            setSearchParams(
              (prev) => {
                prev.set('sort', next);
                return prev;
              },
              { replace: true },
            );
          }}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="triggers">{SORT_LABEL.triggers}</SelectItem>
            <SelectItem value="dms">{SORT_LABEL.dms}</SelectItem>
            <SelectItem value="recent">{SORT_LABEL.recent}</SelectItem>
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
            icon={Zap}
            title="No automations found"
            description="Try a different search."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Automation</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Triggers</TableHead>
                <TableHead>DMs sent</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className={isFetching ? 'opacity-60' : undefined}>
              {data.items.map((a) => (
                <TableRow
                  key={a.id}
                  className="cursor-pointer"
                  onClick={() => navigate(ROUTES.adminUserDetail(a.ownerId))}
                >
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell>
                    <div>{a.ownerName}</div>
                    <div className="text-xs text-muted-foreground">{a.ownerEmail}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={a.isActive ? 'success' : 'secondary'}>
                      {a.isActive ? 'Active' : 'Paused'}
                    </Badge>
                  </TableCell>
                  <TableCell>{a.totalTriggers.toLocaleString()}</TableCell>
                  <TableCell>{a.totalDMsSent.toLocaleString()}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(a.createdAt).toLocaleDateString()}
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
            Page {page} of {totalPages} — {data.total.toLocaleString()} automations
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
