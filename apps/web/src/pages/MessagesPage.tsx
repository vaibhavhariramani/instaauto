import { useState } from 'react';
import { toast } from 'sonner';
import { Inbox, RefreshCw, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { Pagination } from '@/components/shared/Pagination';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageStatusBadge } from '@/components/messages/MessageStatusBadge';
import { InboxPanel } from '@/components/messages/InboxPanel';
import { useMessages, useRetryMessage, type MessagesFilters } from '@/api/messages';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { extractErrorMessage } from '@/api/client';
import { timeAgo } from '@/utils/format';

const STATUS_OPTIONS = ['ALL', 'PENDING', 'SENT', 'DELIVERED', 'FAILED', 'RETRYING'] as const;

function AutomationLog() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<MessagesFilters['status']>('ALL');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data, isLoading, isFetching } = useMessages({ page, pageSize: 20, status, search: debouncedSearch || undefined });
  const retryMessage = useRetryMessage();

  const handleRetry = async (id: string) => {
    try {
      await retryMessage.mutateAsync(id);
      toast.success('Retry queued');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by recipient username..."
            className="pl-9"
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v as MessagesFilters['status']);
            setPage(1);
          }}
        >
          <SelectTrigger className="sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s === 'ALL' ? 'All statuses' : s.charAt(0) + s.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : data && data.items.length === 0 ? (
        <EmptyState icon={Inbox} title="No messages found" description="Once automations start replying, they'll show up here." />
      ) : (
        <div className="rounded-2xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Automation</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.map((message) => (
                <TableRow key={message.id}>
                  <TableCell className="font-medium">@{message.recipientUsername}</TableCell>
                  <TableCell className="text-muted-foreground">{message.automationName}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground" title={message.content}>
                    {message.content}
                  </TableCell>
                  <TableCell>
                    <MessageStatusBadge status={message.status} />
                    {message.errorMessage && (
                      <p className="mt-1 max-w-[200px] truncate text-xs text-destructive" title={message.errorMessage}>
                        {message.errorMessage}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{timeAgo(message.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    {(message.status === 'FAILED' || message.status === 'RETRYING') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRetry(message.id)}
                        loading={retryMessage.isPending}
                      >
                        <RefreshCw className="h-3.5 w-3.5" /> Retry
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="p-4">
            <Pagination page={data?.page ?? 1} totalPages={data?.totalPages ?? 1} onPageChange={setPage} />
          </div>
        </div>
      )}
      {isFetching && !isLoading && <p className="text-xs text-muted-foreground">Refreshing…</p>}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Messages</h2>
        <p className="text-sm text-muted-foreground">
          Every DM your automations have sent, and the full conversation history with each person.
        </p>
      </div>

      <Tabs defaultValue="inbox">
        <TabsList>
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
          <TabsTrigger value="log">Automation Log</TabsTrigger>
        </TabsList>
        <TabsContent value="inbox" className="mt-6">
          <InboxPanel />
        </TabsContent>
        <TabsContent value="log" className="mt-6">
          <AutomationLog />
        </TabsContent>
      </Tabs>
    </div>
  );
}
