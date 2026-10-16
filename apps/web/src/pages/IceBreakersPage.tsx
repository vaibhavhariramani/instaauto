import { useEffect, useState } from 'react';
import { Plus, MessageCircleQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/shared/EmptyState';
import { IceBreakerCard } from '@/components/iceBreakers/IceBreakerCard';
import { IceBreakerFormDialog } from '@/components/iceBreakers/IceBreakerFormDialog';
import { useInstagramAccounts } from '@/api/instagram';
import { useIceBreakers } from '@/api/iceBreakers';

const MAX_ICE_BREAKERS = 4;

export default function IceBreakersPage() {
  const { data: accounts, isLoading: accountsLoading } = useInstagramAccounts();
  const [accountId, setAccountId] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (!accountId && accounts && accounts.length > 0) setAccountId(accounts[0]!.id);
  }, [accounts, accountId]);

  const { data: iceBreakers, isLoading: iceBreakersLoading } = useIceBreakers(
    accountId || undefined,
  );
  const atLimit = (iceBreakers?.length ?? 0) >= MAX_ICE_BREAKERS;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Ice Breakers</h2>
          <p className="text-sm text-muted-foreground">
            Up to {MAX_ICE_BREAKERS} conversation-starter buttons shown on first DM contact.
          </p>
        </div>
        {accounts && accounts.length > 1 && (
          <Select value={accountId} onValueChange={setAccountId}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>
                  @{acc.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button
          variant="gradient"
          onClick={() => setCreateOpen(true)}
          disabled={!accountId || atLimit}
        >
          <Plus className="h-4 w-4" /> New ice breaker
        </Button>
      </div>

      {(accountsLoading || iceBreakersLoading) && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      )}

      {!accountsLoading && (!accounts || accounts.length === 0) && (
        <EmptyState
          icon={MessageCircleQuestion}
          title="No Instagram account connected"
          description="Connect an Instagram account to set up ice breakers."
        />
      )}

      {!iceBreakersLoading && accountId && iceBreakers?.length === 0 && (
        <EmptyState
          icon={MessageCircleQuestion}
          title="No ice breakers yet"
          description="Add a question and auto-response shown to people messaging you for the first time."
          action={
            <Button variant="gradient" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> Add ice breaker
            </Button>
          }
        />
      )}

      {!iceBreakersLoading && iceBreakers && iceBreakers.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {iceBreakers.map((ib, i) => (
            <IceBreakerCard key={ib.id} iceBreaker={ib} accountId={accountId} index={i} />
          ))}
        </div>
      )}

      {accountId && (
        <IceBreakerFormDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          accountId={accountId}
        />
      )}
    </div>
  );
}
