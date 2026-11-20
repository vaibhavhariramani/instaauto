import { useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import { ApiKeyScope, type CreatedApiKeyDto } from '@instaauto/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useCreateApiKey } from '@/api/apiKeys';
import { extractErrorMessage } from '@/api/client';

interface CreateApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (key: CreatedApiKeyDto) => void;
}

const EXPIRY_OPTIONS = [
  { value: 'never', label: 'Never expires' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
  { value: '365', label: '1 year' },
];

export function CreateApiKeyDialog({ open, onOpenChange, onCreated }: CreateApiKeyDialogProps) {
  const [name, setName] = useState('');
  const [scope, setScope] = useState<ApiKeyScope>(ApiKeyScope.READ_ONLY);
  const [expiry, setExpiry] = useState('never');
  const create = useCreateApiKey();

  const reset = () => {
    setName('');
    setScope(ApiKeyScope.READ_ONLY);
    setExpiry('never');
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await create.mutateAsync({
        name: name.trim(),
        scope,
        ...(expiry === 'never' ? {} : { expiresInDays: Number(expiry) }),
      });
      reset();
      onOpenChange(false);
      onCreated(created);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Create an API key</DialogTitle>
            <DialogDescription>
              Name it after the AI tool that will use it, so you know which one to revoke later.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="api-key-name">Name</Label>
            <Input
              id="api-key-name"
              value={name}
              maxLength={60}
              placeholder="e.g. Claude Code on my laptop"
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Access</Label>
            <Select value={scope} onValueChange={(v) => setScope(v as ApiKeyScope)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ApiKeyScope.READ_ONLY}>Read-only (recommended)</SelectItem>
                <SelectItem value={ApiKeyScope.READ_WRITE}>Read &amp; write</SelectItem>
              </SelectContent>
            </Select>
            {scope === ApiKeyScope.READ_WRITE && (
              <p className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                <span>
                  An AI tool with this key can pause or resume your automations and create message
                  templates. Only use it with tools you trust.
                </span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Expiry</Label>
            <Select value={expiry} onValueChange={setExpiry}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPIRY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={create.isPending} disabled={name.trim().length === 0}>
              Create key
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
