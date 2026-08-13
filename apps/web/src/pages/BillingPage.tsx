import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Check, CreditCard, ExternalLink, Receipt } from 'lucide-react';
import { PLAN_TIERS, type SubscriptionPlan } from '@instaauto/shared';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/store/authStore';
import { useCreateCheckoutSession, useCreatePortalSession, useInvoices } from '@/api/billing';
import { extractErrorMessage } from '@/api/client';

const PLAN_ORDER: SubscriptionPlan[] = ['STARTER', 'PRO', 'BUSINESS'];

export default function BillingPage() {
  const user = useAuthStore((s) => s.user);
  const { data: invoices, isLoading: invoicesLoading } = useInvoices();
  const checkout = useCreateCheckoutSession();
  const portal = useCreatePortalSession();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const result = searchParams.get('checkout');
    if (result === 'success') toast.success('Subscription updated!');
    if (result === 'cancelled') toast.info('Checkout cancelled.');
  }, [searchParams]);

  const handleUpgrade = async (plan: SubscriptionPlan) => {
    try {
      await checkout.mutateAsync({ plan, billingCycle: 'monthly' });
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handlePortal = async () => {
    try {
      await portal.mutateAsync();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Billing</h2>
        <p className="text-sm text-muted-foreground">Manage your subscription and view past invoices.</p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Current plan</CardTitle>
            <CardDescription>
              {user ? `${PLAN_TIERS[user.subscriptionPlan].label} — ${user.subscriptionStatus.toLowerCase()}` : ''}
            </CardDescription>
          </div>
          <Button variant="outline" onClick={handlePortal} loading={portal.isPending}>
            <CreditCard className="h-4 w-4" /> Manage billing
          </Button>
        </CardHeader>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {PLAN_ORDER.map((planKey) => {
          const plan = PLAN_TIERS[planKey];
          const isCurrent = user?.subscriptionPlan === planKey;
          return (
            <Card key={planKey} className={cn(isCurrent && 'border-primary shadow-md shadow-primary/10')}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{plan.label}</CardTitle>
                  {isCurrent && <Badge>Current</Badge>}
                </div>
                <p className="text-2xl font-semibold">
                  ${plan.priceMonthly}
                  <span className="text-sm font-normal text-muted-foreground">/mo</span>
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.slice(0, 4).map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={isCurrent ? 'outline' : 'gradient'}
                  className="w-full"
                  disabled={isCurrent}
                  loading={checkout.isPending}
                  onClick={() => handleUpgrade(planKey)}
                >
                  {isCurrent ? 'Current plan' : 'Switch plan'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {invoicesLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : !invoices || invoices.length === 0 ? (
            <EmptyState icon={Receipt} title="No invoices yet" description="Your billing history will appear here once you subscribe." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.number ?? inv.id}</TableCell>
                    <TableCell>
                      {(inv.amountPaid / 100).toLocaleString('en-US', { style: 'currency', currency: inv.currency })}
                    </TableCell>
                    <TableCell className="capitalize">{inv.status}</TableCell>
                    <TableCell>{new Date(inv.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {inv.hostedInvoiceUrl && (
                        <a href={inv.hostedInvoiceUrl} target="_blank" rel="noreferrer">
                          <Button variant="ghost" size="icon">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
