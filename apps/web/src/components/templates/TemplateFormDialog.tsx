import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { templateSchema, TemplateCategory, type TemplateDto, type TemplateInput } from '@instaauto/shared';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TEMPLATE_CATEGORY_META } from '@instaauto/shared';
import { useCreateTemplate, useUpdateTemplate } from '@/api/templates';
import { extractErrorMessage } from '@/api/client';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: TemplateDto;
}

export function TemplateFormDialog({ open, onOpenChange, template }: Props) {
  const isEdit = Boolean(template);
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TemplateInput>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: '',
      category: TemplateCategory.CUSTOM,
      content: '',
      isFavorite: false,
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        template
          ? { name: template.name, category: template.category, content: template.content, isFavorite: template.isFavorite }
          : { name: '', category: TemplateCategory.CUSTOM, content: '', isFavorite: false },
      );
    }
  }, [open, template, reset]);

  const onSubmit = async (values: TemplateInput) => {
    try {
      if (isEdit && template) {
        await updateTemplate.mutateAsync({ id: template.id, input: values });
        toast.success('Template updated');
      } else {
        await createTemplate.mutateAsync(values);
        toast.success('Template created');
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
          <DialogTitle>{isEdit ? 'Edit template' : 'New template'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Name</Label>
            <Input id="template-name" placeholder="Free Guide Delivery" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TEMPLATE_CATEGORY_META).map(([key, meta]) => (
                      <SelectItem key={key} value={key}>
                        {meta.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-content">Message content</Label>
            <Textarea id="template-content" rows={4} maxLength={1000} {...register('content')} />
            {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" loading={createTemplate.isPending || updateTemplate.isPending}>
              {isEdit ? 'Save changes' : 'Create template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
