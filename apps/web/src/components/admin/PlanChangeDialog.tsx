import { useState } from 'react';
import { toast } from 'sonner';
import { PLAN_TIERS, type SubscriptionPlan } from '@instaauto/shared';
import { Button } from '@/components/ui/button';
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
import { useAdminUpdateUserPlan } from '@/api/admin';
import { extractErrorMessage } from '@/api/client';

interface PlanChangeDialogProps {
  userId: string;
  userLabel?: string;
  currentPlan: SubscriptionPlan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlanChangeDialog({
  userId,
  userLabel,
  currentPlan,
  open,
  onOpenChange,
}: PlanChangeDialogProps) {
  const [plan, setPlan] = useState<SubscriptionPlan>(currentPlan);
  const [reason, setReason] = useState('');
  const update = useAdminUpdateUserPlan(userId);

  const onConfirm = async () => {
    try {
      await update.mutateAsync({ plan, reason: reason.trim() });
      toast.success(`Plan changed to ${PLAN_TIERS[plan].label}`);
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
          <DialogTitle>Change plan{userLabel ? ` — ${userLabel}` : ''}</DialogTitle>
          <DialogDescription>
            This is a manual override, not a real payment — it sets the plan and an ACTIVE status
            directly, with no Stripe charge involved, so it works as a free upgrade. It&apos;s
            logged with your account, this reason, and the before/after state.
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
                {(Object.keys(PLAN_TIERS) as SubscriptionPlan[]).map((p) => (
                  <SelectItem key={p} value={p}>
                    {PLAN_TIERS[p].label}
                    {p === currentPlan ? ' (current)' : ''}
                  </SelectItem>
                ))}
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
              placeholder="e.g. Free Business upgrade for a partner / support escalation - ticket #1234"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={reason.trim().length < 10 || update.isPending}>
            {update.isPending ? 'Saving…' : `Set plan to ${PLAN_TIERS[plan].label}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
