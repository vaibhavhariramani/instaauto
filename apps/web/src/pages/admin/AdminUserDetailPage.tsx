import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, ExternalLink, Instagram, Zap } from 'lucide-react';
import type { SubscriptionPlan } from '@instaauto/shared';
import { PLAN_TIERS } from '@instaauto/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAdminUser, useAdminUpdateUserPlan } from '@/api/admin';
import { extractErrorMessage } from '@/api/client';
import { ROUTES } from '@/constants/routes';

function PlanChangeDialog({
  userId,
  currentPlan,
  open,
  onOpenChange,
}: {
  userId: string;
  currentPlan: SubscriptionPlan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [plan, setPlan] = useState<SubscriptionPlan>(currentPlan);
  const [reason, setReason] = useState('');
  const update = useAdminUpdateUserPlan(userId);

  const onConfirm = async () => {
    try {
      await update.mutateAsync({ plan, reason: reason.trim() });
      toast.success(`Plan changed to ${plan}`);
      onOpenChange(false);
      setReason('');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change plan</DialogTitle>
          <DialogDescription>
            This is a manual override, not a real payment — it sets subscriptionStatus to ACTIVE
            directly, with no Stripe charge involved. It's logged with your account, this reason,
            and the before/after state.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">New plan</label>
            <Select value={plan} onValueChange={(v) => setPlan(v as SubscriptionPlan)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STARTER">Starter</SelectItem>
                <SelectItem value="PRO">Pro</SelectItem>
                <SelectItem value="BUSINESS">Business</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Reason <span className="text-muted-foreground">(required, min 10 characters)</span>
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Manual comp for a support escalation - ticket #1234"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={reason.trim().length < 10 || update.isPending}>
            {update.isPending ? 'Saving…' : `Set plan to ${plan}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: user, isLoading } = useAdminUser(id);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);

  if (isLoading || !user) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const tier = PLAN_TIERS[user.subscriptionPlan];
  const dmUsagePct =
    user.dmLimitPerMonth === -1
      ? 0
      : Math.min(100, (user.dmsSentThisPeriod / Math.max(1, user.dmLimitPerMonth)) * 100);

  return (
    <div className="space-y-6">
      <Link
        to={ROUTES.adminUsers}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All users
      </Link>

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-xl font-semibold">
            {user.name}
            {user.isAdmin && (
              <Badge variant="outline" className="ml-2">
                Admin
              </Badge>
            )}
          </h2>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Joined {new Date(user.createdAt).toLocaleDateString()} · ID {user.id}
          </p>
        </div>
        <Button onClick={() => setPlanDialogOpen(true)}>Change plan</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge>{user.subscriptionPlan}</Badge>
              <Badge variant="outline">{user.subscriptionStatus}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {user.hasStripeCustomer ? 'Has a Stripe customer record' : 'No Stripe customer yet'}
            </p>
            {user.subscriptionCurrentPeriodEnd && (
              <p className="text-xs text-muted-foreground">
                Renews/ends {new Date(user.subscriptionCurrentPeriodEnd).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              DMs this period
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold">
              {user.dmsSentThisPeriod.toLocaleString()}
              <span className="text-sm font-normal text-muted-foreground">
                {' '}
                / {user.dmLimitPerMonth === -1 ? '∞' : user.dmLimitPerMonth.toLocaleString()}
              </span>
            </div>
            {user.dmLimitPerMonth !== -1 && <Progress value={dmUsagePct} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Plan limits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs text-muted-foreground">
            <p>
              {user.automations.filter((a) => a.isActive).length} /{' '}
              {tier.automationLimit === -1 ? '∞' : tier.automationLimit} automations
            </p>
            <p>
              {user.connectedAccounts.filter((a) => a.status === 'CONNECTED').length} /{' '}
              {tier.instagramAccountLimit === -1 ? '∞' : tier.instagramAccountLimit} Instagram
              accounts
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Instagram className="h-4 w-4" />
          <CardTitle className="text-sm font-medium">Connected Instagram accounts</CardTitle>
        </CardHeader>
        <CardContent>
          {user.connectedAccounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">None connected.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Followers</TableHead>
                  <TableHead>Connected</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.connectedAccounts.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>@{a.username}</TableCell>
                    <TableCell>
                      <Badge variant={a.status === 'CONNECTED' ? 'success' : 'secondary'}>
                        {a.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{a.followersCount.toLocaleString()}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(a.connectedAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Zap className="h-4 w-4" />
          <CardTitle className="text-sm font-medium">Automations</CardTitle>
        </CardHeader>
        <CardContent>
          {user.automations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No automations created.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Triggers</TableHead>
                  <TableHead>DMs sent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.automations.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.name}</TableCell>
                    <TableCell>
                      <Badge variant={a.isActive ? 'success' : 'secondary'}>
                        {a.isActive ? 'Active' : 'Paused'}
                      </Badge>
                    </TableCell>
                    <TableCell>{a.totalTriggers.toLocaleString()}</TableCell>
                    <TableCell>{a.totalDMsSent.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {user.recentInvoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recent invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.recentInvoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>{new Date(inv.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {(inv.amountPaid / 100).toLocaleString(undefined, {
                        style: 'currency',
                        currency: inv.currency.toUpperCase(),
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={inv.status === 'paid' ? 'success' : 'secondary'}>
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {inv.hostedInvoiceUrl && (
                        <a
                          href={inv.hostedInvoiceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary underline"
                        >
                          View <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {user.recentAdminActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Admin action history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {user.recentAdminActions.map((a, i) => (
              <div key={i} className="border-b border-border pb-2 text-sm last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{a.action}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(a.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {a.actorEmail} — {a.reason}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <PlanChangeDialog
        userId={user.id}
        currentPlan={user.subscriptionPlan}
        open={planDialogOpen}
        onOpenChange={setPlanDialogOpen}
      />
    </div>
  );
}
