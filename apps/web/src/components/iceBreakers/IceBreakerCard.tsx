import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { MessageCircleQuestion, Pencil, Trash2 } from 'lucide-react';
import type { IceBreakerDto } from '@instaauto/shared';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { IceBreakerFormDialog } from './IceBreakerFormDialog';
import { useDeleteIceBreaker } from '@/api/iceBreakers';
import { extractErrorMessage } from '@/api/client';

export function IceBreakerCard({
  iceBreaker,
  accountId,
  index,
}: {
  iceBreaker: IceBreakerDto;
  accountId: string;
  index: number;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteIceBreaker = useDeleteIceBreaker(accountId);

  const handleDelete = async () => {
    try {
      await deleteIceBreaker.mutateAsync(iceBreaker.id);
      toast.success('Ice breaker deleted');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setDeleteOpen(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
    >
      <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
        <CardHeader className="flex-row items-start gap-3 space-y-0">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MessageCircleQuestion className="h-5 w-5" />
          </span>
          <h3 className="font-semibold leading-tight">{iceBreaker.question}</h3>
        </CardHeader>
        <CardContent className="flex-1">
          <p className="line-clamp-3 text-sm text-muted-foreground">{iceBreaker.response}</p>
        </CardContent>
        <CardFooter className="flex items-center justify-end gap-1 border-t border-border pt-3">
          <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)} aria-label="Edit">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={() => setDeleteOpen(true)}
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>

      <IceBreakerFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        accountId={accountId}
        iceBreaker={iceBreaker}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete ice breaker?"
        description={`"${iceBreaker.question}" will be removed and re-synced to Instagram.`}
        confirmLabel="Delete"
        loading={deleteIceBreaker.isPending}
        onConfirm={handleDelete}
      />
    </motion.div>
  );
}
