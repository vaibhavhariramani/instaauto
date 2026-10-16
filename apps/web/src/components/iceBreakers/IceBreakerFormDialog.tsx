import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { iceBreakerSchema, type IceBreakerDto, type IceBreakerInput } from '@instaauto/shared';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateIceBreaker, useUpdateIceBreaker } from '@/api/iceBreakers';
import { extractErrorMessage } from '@/api/client';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  iceBreaker?: IceBreakerDto;
}

export function IceBreakerFormDialog({ open, onOpenChange, accountId, iceBreaker }: Props) {
  const isEdit = Boolean(iceBreaker);
  const createIceBreaker = useCreateIceBreaker(accountId);
  const updateIceBreaker = useUpdateIceBreaker(accountId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IceBreakerInput>({
    resolver: zodResolver(iceBreakerSchema),
    defaultValues: { instagramAccountId: accountId, question: '', response: '' },
  });

  useEffect(() => {
    if (open) {
      reset(
        iceBreaker
          ? {
              instagramAccountId: accountId,
              question: iceBreaker.question,
              response: iceBreaker.response,
            }
          : { instagramAccountId: accountId, question: '', response: '' },
      );
    }
  }, [open, iceBreaker, accountId, reset]);

  const onSubmit = async (values: IceBreakerInput) => {
    try {
      if (isEdit && iceBreaker) {
        await updateIceBreaker.mutateAsync({ id: iceBreaker.id, input: values });
        toast.success('Ice breaker updated');
      } else {
        await createIceBreaker.mutateAsync(values);
        toast.success('Ice breaker created');
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit ice breaker' : 'New ice breaker'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ib-question">Question</Label>
            <Input
              id="ib-question"
              placeholder="What can I help you with?"
              {...register('question')}
            />
            {errors.question && (
              <p className="text-xs text-destructive">{errors.question.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="ib-response">Auto-response</Label>
            <Textarea id="ib-response" rows={4} maxLength={500} {...register('response')} />
            {errors.response && (
              <p className="text-xs text-destructive">{errors.response.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gradient"
              loading={createIceBreaker.isPending || updateIceBreaker.isPending}
            >
              {isEdit ? 'Save changes' : 'Create ice breaker'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
