import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { FlaskConical, MessageSquare, Pencil, Send, Trash2 } from 'lucide-react';
import type { AutomationDto } from '@instaauto/shared';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { KeywordChips } from './KeywordChips';
import { SimulateCommentDialog } from './SimulateCommentDialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useDeleteAutomation, useUpdateAutomation } from '@/api/automations';
import { extractErrorMessage } from '@/api/client';
import { ROUTES } from '@/constants/routes';
import { config } from '@/constants/config';

export function AutomationCard({ automation, index }: { automation: AutomationDto; index: number }) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [simulateOpen, setSimulateOpen] = useState(false);
  const updateAutomation = useUpdateAutomation(automation.id);
  const deleteAutomation = useDeleteAutomation();

  const handleToggle = async (checked: boolean) => {
    try {
      await updateAutomation.mutateAsync({ isActive: checked });
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAutomation.mutateAsync(automation.id);
      toast.success('Automation deleted');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setDeleteOpen(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.04 }}>
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <div className="flex gap-4 p-4">
          <div className="h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
            {automation.reelThumbnailUrl && (
              <img src={automation.reelThumbnailUrl} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <CardHeader className="flex-1 p-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate font-semibold">{automation.name}</h3>
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{automation.reelCaption}</p>
              </div>
              <Switch checked={automation.isActive} onCheckedChange={handleToggle} />
            </div>
            <KeywordChips keywords={automation.triggerKeywords} className="mt-2" />
          </CardHeader>
        </div>

        <CardContent className="flex items-center gap-6 border-t border-border py-3 text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5" /> {automation.totalTriggers} triggers
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Send className="h-3.5 w-3.5" /> {automation.totalDMsSent} sent
          </span>
        </CardContent>

        <CardFooter className="flex items-center justify-between gap-2 border-t border-border py-3">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={ROUTES.automationEdit(automation.id)}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Link>
            </Button>
            {config.mockMode && (
              <Button variant="outline" size="sm" onClick={() => setSimulateOpen(true)}>
                <FlaskConical className="h-3.5 w-3.5" /> Simulate
              </Button>
            )}
          </div>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </CardFooter>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete automation?"
        description={`"${automation.name}" will stop watching for comments immediately. This can't be undone.`}
        confirmLabel="Delete"
        loading={deleteAutomation.isPending}
        onConfirm={handleDelete}
      />
      <SimulateCommentDialog
        automationId={automation.id}
        automationName={automation.name}
        suggestedKeyword={automation.triggerKeywords[0] ?? 'send me'}
        open={simulateOpen}
        onOpenChange={setSimulateOpen}
      />
    </motion.div>
  );
}
