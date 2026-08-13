import { useState } from 'react';
import { Plus, Text } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { TemplateCard } from '@/components/templates/TemplateCard';
import { TemplateFormDialog } from '@/components/templates/TemplateFormDialog';
import { useTemplates } from '@/api/templates';

export default function TemplatesPage() {
  const { data: templates, isLoading } = useTemplates();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Templates</h2>
          <p className="text-sm text-muted-foreground">Reusable DM replies you can drop into any automation.</p>
        </div>
        <Button variant="gradient" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> New template
        </Button>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      )}

      {!isLoading && templates?.length === 0 && (
        <EmptyState
          icon={Text}
          title="No templates yet"
          description="Create reusable replies for free guides, discount codes, and more."
          action={
            <Button variant="gradient" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> Create template
            </Button>
          }
        />
      )}

      {!isLoading && templates && templates.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {templates.map((template, i) => (
            <TemplateCard key={template.id} template={template} index={i} />
          ))}
        </div>
      )}

      <TemplateFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
