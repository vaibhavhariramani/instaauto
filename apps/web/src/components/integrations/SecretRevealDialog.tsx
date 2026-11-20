import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { buildMcpSnippets } from '@/lib/mcpSnippets';
import { CodeBlock } from './CodeBlock';

interface SecretRevealDialogProps {
  secret: string | null;
  url: string;
  onClose: () => void;
}

export function SecretRevealDialog({ secret, url, onClose }: SecretRevealDialogProps) {
  const snippets = secret ? buildMcpSnippets({ url, key: secret }) : null;

  return (
    <Dialog open={secret !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Copy your API key now</DialogTitle>
          <DialogDescription>
            This is the only time the full key is shown. We store only a hash, so it can&apos;t be
            recovered later.
          </DialogDescription>
        </DialogHeader>
        {secret && snippets && (
          <div className="space-y-3">
            <CodeBlock label="API key" code={secret} />
            <CodeBlock
              label="Claude Code - ready to paste (other tools: see the setup guide below)"
              code={snippets.claudeCode}
            />
          </div>
        )}
        <p className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
          <span>
            Treat it like a password. Once you close this dialog the key is gone from this page; if
            you lose it, revoke it and create a new one.
          </span>
        </p>
        <DialogFooter>
          <Button onClick={onClose}>I&apos;ve copied it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
