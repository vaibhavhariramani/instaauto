import { useState } from 'react';
import { toast } from 'sonner';
import { FlaskConical } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSimulateComment } from '@/api/dev';
import { extractErrorMessage } from '@/api/client';

interface Props {
  automationId: string;
  automationName: string;
  suggestedKeyword: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SimulateCommentDialog({ automationId, automationName, suggestedKeyword, open, onOpenChange }: Props) {
  const [username, setUsername] = useState('curious_follower');
  const [text, setText] = useState(suggestedKeyword);
  const simulate = useSimulateComment();

  const handleSubmit = async () => {
    try {
      await simulate.mutateAsync({ automationId, commenterUsername: username, commentText: text });
      toast.success(`Simulated comment processed for "${automationName}" — check Messages for the result.`);
      onOpenChange(false);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-primary" /> Simulate a comment
          </DialogTitle>
          <DialogDescription>
            Mock mode is on, so this fires a synthetic comment through the real automation pipeline — no live
            Instagram account required.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sim-username">Commenter username</Label>
            <Input id="sim-username" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sim-text">Comment text</Label>
            <Input id="sim-text" value={text} onChange={(e) => setText(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="gradient" loading={simulate.isPending} onClick={handleSubmit}>
            Fire comment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
