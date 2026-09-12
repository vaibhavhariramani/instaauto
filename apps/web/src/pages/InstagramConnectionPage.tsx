import { useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, Instagram, Unlink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useConnectInstagram, useDisconnectInstagram, useInstagramAccounts } from '@/api/instagram';
import { extractErrorMessage } from '@/api/client';
import { formatNumber } from '@/utils/format';
import { AiReplySettingsCard } from '@/components/instagram/AiReplySettingsCard';

export default function InstagramConnectionPage() {
  const { data: accounts, isLoading } = useInstagramAccounts();
  const connect = useConnectInstagram();
  const disconnect = useDisconnectInstagram();
  const [disconnectId, setDisconnectId] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      await connect.mutateAsync();
      toast.success('Instagram account connected');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleDisconnect = async () => {
    if (!disconnectId) return;
    try {
      await disconnect.mutateAsync(disconnectId);
      toast.success('Instagram account disconnected');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setDisconnectId(null);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Instagram</h2>
        <p className="text-sm text-muted-foreground">
          Manage the Instagram Professional accounts connected to InstaAuto via the Meta Graph API.
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : !accounts || accounts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={Instagram}
              title="No Instagram account connected"
              description="Connect an Instagram Professional account (Business or Creator) to start automating DMs."
              action={
                <Button variant="gradient" onClick={handleConnect} loading={connect.isPending}>
                  Connect Instagram
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {accounts.map((account) => (
            <Card key={account.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Connected account</CardTitle>
                <Badge variant="success" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Connected
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border border-border">
                    <AvatarImage src={account.profilePictureUrl ?? undefined} />
                    <AvatarFallback>{account.username[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">@{account.username}</p>
                    <p className="text-sm text-muted-foreground">{account.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatNumber(account.followersCount)} followers
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDisconnectId(account.id)}
                  >
                    <Unlink className="h-4 w-4" /> Disconnect
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {accounts.map((account) => (
            <AiReplySettingsCard key={account.id} accountId={account.id} />
          ))}

          <Button variant="outline" onClick={handleConnect} loading={connect.isPending}>
            <Instagram className="h-4 w-4" /> Connect another account
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(disconnectId)}
        onOpenChange={(open) => !open && setDisconnectId(null)}
        title="Disconnect Instagram?"
        description="Automations using this account will be paused until you reconnect."
        confirmLabel="Disconnect"
        loading={disconnect.isPending}
        onConfirm={handleDisconnect}
      />
    </div>
  );
}
