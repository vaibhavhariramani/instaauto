import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Zap } from 'lucide-react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { SortableHead } from '@/components/admin/SortableHead';
import { nextSort, type SortDir } from '@/components/admin/sort';
import { useAdminAutomations, type AdminAutomationSortBy } from '@/api/admin';
import { ROUTES } from '@/constants/routes';

const PAGE_SIZE = 25;
const SORT_COLUMNS: readonly AdminAutomationSortBy[] = [
  'name',
  'owner',
  'status',
  'triggers',
  'dms',
  'created',
];
const TEXT_COLUMNS: readonly AdminAutomationSortBy[] = ['name', 'owner', 'status'];

function isSortColumn(value: string | null): value is AdminAutomationSortBy {
  return SORT_COLUMNS.includes(value as AdminAutomationSortBy);
}

export default function AdminAutomationsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput, 300);

  const urlSortBy = searchParams.get('sortBy');
  const urlSortDir = searchParams.get('sortDir');
  const sort = {
    column: isSortColumn(urlSortBy) ? urlSortBy : ('triggers' as AdminAutomationSortBy),
    dir: (urlSortDir === 'asc' ? 'asc' : 'desc') as SortDir,
  };

  const onSort = (column: AdminAutomationSortBy) => {
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

  const { data, isLoading, isFetching } = useAdminAutomations({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    sortBy: sort.column,
    sortDir: sort.dir,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const head = { activeColumn: sort.column, dir: sort.dir, onSort };

  return (
    <div className="space-y-4">
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
                <SortableHead label="Automation" column="name" {...head} />
                <SortableHead label="Owner" column="owner" {...head} />
                <SortableHead label="Status" column="status" {...head} />
                <SortableHead label="Triggers" column="triggers" {...head} />
                <SortableHead label="DMs sent" column="dms" {...head} />
                <SortableHead label="Created" column="created" {...head} />
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
