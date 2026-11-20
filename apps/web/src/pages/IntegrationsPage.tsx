import { useState } from 'react';
import { toast } from 'sonner';
import { Bot, KeyRound, Plus, ShieldCheck } from 'lucide-react';
import {
  ApiKeyScope,
  MAX_ACTIVE_API_KEYS,
  type ApiKeyDto,
  type CreatedApiKeyDto,
} from '@instaauto/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { CodeBlock } from '@/components/integrations/CodeBlock';
import { ConnectGuides } from '@/components/integrations/ConnectGuides';
import { CreateApiKeyDialog } from '@/components/integrations/CreateApiKeyDialog';
import { SecretRevealDialog } from '@/components/integrations/SecretRevealDialog';
import { useApiKeys, useRevokeApiKey } from '@/api/apiKeys';
import { extractErrorMessage } from '@/api/client';
import { MCP_TOOLS } from '@/lib/mcpSnippets';

type KeyStatus = 'active' | 'expired' | 'revoked';

function keyStatus(key: ApiKeyDto): KeyStatus {
  if (key.revokedAt) return 'revoked';
  if (key.expiresAt && new Date(key.expiresAt).getTime() <= Date.now()) return 'expired';
  return 'active';
}

const STATUS_BADGE: Record<
  KeyStatus,
  { label: string; variant: 'success' | 'warning' | 'secondary' }
> = {
  active: { label: 'Active', variant: 'success' },
  expired: { label: 'Expired', variant: 'warning' },
  revoked: { label: 'Revoked', variant: 'secondary' },
};

export default function IntegrationsPage() {
  const url = `${window.location.origin}/api/mcp`;
  const { data: keys, isLoading } = useApiKeys();
  const revoke = useRevokeApiKey();

  const [createOpen, setCreateOpen] = useState(false);
  // The one-time secret lives only here, in component state - never in the query cache or storage.
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<ApiKeyDto | null>(null);

  const activeCount = (keys ?? []).filter((k) => keyStatus(k) === 'active').length;
  const limitReached = activeCount >= MAX_ACTIVE_API_KEYS;

  const onCreated = (created: CreatedApiKeyDto) => setRevealedSecret(created.secret);

  const onRevoke = async () => {
    if (!revokeTarget) return;
    try {
      await revoke.mutateAsync(revokeTarget.id);
      toast.success('Key revoked');
      setRevokeTarget(null);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="h-4 w-4" /> Use InstaAuto from your AI assistant
          </CardTitle>
          <CardDescription>
            InstaAuto speaks MCP (Model Context Protocol), so an AI assistant can look at your
            automations, analytics and messages and, with a read &amp; write key, pause or resume
            automations and create templates. A key only ever acts on your own account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CodeBlock label="Server URL" code={url} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-4 w-4" /> API keys
            </CardTitle>
            <CardDescription>
              {limitReached
                ? `You have ${MAX_ACTIVE_API_KEYS} active keys, the maximum. Revoke one to create another.`
                : `${activeCount} of ${MAX_ACTIVE_API_KEYS} active keys used.`}
            </CardDescription>
          </div>
          <Button onClick={() => setCreateOpen(true)} disabled={limitReached}>
            <Plus className="h-4 w-4" /> Create key
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !keys || keys.length === 0 ? (
            <EmptyState
              icon={KeyRound}
              title="No API keys yet"
              description="Create a key, then paste it into your AI tool using the guide below."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Access</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last used</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((k) => {
                  const status = keyStatus(k);
                  const badge = STATUS_BADGE[status];
                  return (
                    <TableRow key={k.id}>
                      <TableCell className="font-medium">{k.name}</TableCell>
                      <TableCell className="font-mono text-xs">{k.prefix}…</TableCell>
                      <TableCell>
                        <Badge
                          variant={k.scope === ApiKeyScope.READ_WRITE ? 'warning' : 'secondary'}
                        >
                          {k.scope === ApiKeyScope.READ_WRITE ? 'Read & write' : 'Read-only'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(k.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : 'Never'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {status === 'revoked' ? null : (
                          <Button variant="outline" size="sm" onClick={() => setRevokeTarget(k)}>
                            Revoke
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConnectGuides url={url} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tools available</CardTitle>
          <CardDescription>
            Write tools only appear for keys created with read &amp; write access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {MCP_TOOLS.map((t) => (
              <li key={t.name} className="flex items-center justify-between gap-4 py-2">
                <div>
                  <code className="text-sm font-medium">{t.name}</code>
                  <p className="text-xs text-muted-foreground">{t.description}</p>
                </div>
                <Badge variant={t.write ? 'warning' : 'secondary'}>
                  {t.write ? 'Read & write' : 'Read'}
                </Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4" /> Security
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            <li>
              Treat an API key like a password: don&apos;t paste it into chats, commits or
              screenshots.
            </li>
            <li>Keys are read-only by default. Only grant write access to an AI tool you trust.</li>
            <li>You can revoke a key at any time and it stops working immediately.</li>
            <li>
              A key only sees your own account&apos;s data - never other users&apos;, billing
              details or stored secrets.
            </li>
            <li>
              Text from Instagram comments and messages is returned to the AI as data. It is
              untrusted: an attacker can write a comment that tries to instruct your assistant,
              which is one more reason to keep write access off.
            </li>
            <li>Keys are stored hashed, so we can&apos;t show them again after creation.</li>
          </ul>
        </CardContent>
      </Card>

      <CreateApiKeyDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={onCreated} />
      <SecretRevealDialog
        secret={revealedSecret}
        url={url}
        onClose={() => setRevealedSecret(null)}
      />
      <ConfirmDialog
        open={revokeTarget !== null}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
        title="Revoke this key?"
        description={`"${revokeTarget?.name ?? ''}" will stop working immediately. Any AI tool using it will lose access.`}
        confirmLabel="Revoke key"
        loading={revoke.isPending}
        onConfirm={onRevoke}
      />
    </div>
  );
}
