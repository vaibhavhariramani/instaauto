import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  BookOpen,
  CalendarClock,
  Copy,
  GraduationCap,
  Magnet,
  Pencil,
  Sparkles,
  Star,
  Tag,
  Trash2,
} from 'lucide-react';
import { TEMPLATE_CATEGORY_META, type TemplateDto } from '@instaauto/shared';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { TemplateFormDialog } from './TemplateFormDialog';
import { useDeleteTemplate, useDuplicateTemplate, useToggleFavoriteTemplate } from '@/api/templates';
import { extractErrorMessage } from '@/api/client';
import { cn } from '@/utils/cn';

const ICONS: Record<string, typeof BookOpen> = {
  BookOpen,
  GraduationCap,
  Tag,
  CalendarClock,
  Magnet,
  Sparkles,
};

export function TemplateCard({ template, index }: { template: TemplateDto; index: number }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const toggleFavorite = useToggleFavoriteTemplate();
  const duplicateTemplate = useDuplicateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const meta = TEMPLATE_CATEGORY_META[template.category];
  const Icon = ICONS[meta.icon] ?? Sparkles;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(template.content);
    toast.success('Copied to clipboard');
  };

  const handleDuplicate = async () => {
    try {
      await duplicateTemplate.mutateAsync(template.id);
      toast.success('Template duplicated');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTemplate.mutateAsync(template.id);
      toast.success('Template deleted');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setDeleteOpen(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.04 }}>
      <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-semibold leading-tight">{template.name}</h3>
              <Badge variant="outline" className="mt-1">
                {meta.label}
              </Badge>
            </div>
          </div>
          <button
            onClick={() => toggleFavorite.mutate(template.id)}
            className={cn('text-muted-foreground transition-colors hover:text-amber-500', template.isFavorite && 'text-amber-500')}
            aria-label="Toggle favorite"
          >
            <Star className={cn('h-5 w-5', template.isFavorite && 'fill-current')} />
          </button>
        </CardHeader>
        <CardContent className="flex-1">
          <p className="line-clamp-3 text-sm text-muted-foreground">{template.content}</p>
          <p className="mt-3 text-xs text-muted-foreground">Used {template.usageCount} times</p>
        </CardContent>
        <CardFooter className="flex items-center justify-between gap-2 border-t border-border pt-3">
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={handleCopy} aria-label="Copy">
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)} aria-label="Edit">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDuplicate} aria-label="Duplicate">
              <Copy className="h-4 w-4 opacity-50" />
            </Button>
          </div>
          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>

      <TemplateFormDialog open={editOpen} onOpenChange={setEditOpen} template={template} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete template?"
        description={`"${template.name}" will be permanently removed. Automations using it keep their existing message.`}
        confirmLabel="Delete"
        loading={deleteTemplate.isPending}
        onConfirm={handleDelete}
      />
    </motion.div>
  );
}
