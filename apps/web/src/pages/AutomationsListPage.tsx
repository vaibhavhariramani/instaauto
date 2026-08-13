import { Link } from 'react-router-dom';
import { Plus, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { AutomationCard } from '@/components/automations/AutomationCard';
import { useAutomations } from '@/api/automations';
import { ROUTES } from '@/constants/routes';

export default function AutomationsListPage() {
  const { data: automations, isLoading } = useAutomations();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Automations</h2>
          <p className="text-sm text-muted-foreground">Reply to Reel comments automatically, per keyword.</p>
        </div>
        <Button variant="gradient" asChild>
          <Link to={ROUTES.automationNew}>
            <Plus className="h-4 w-4" /> New automation
          </Link>
        </Button>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      )}

      {!isLoading && automations?.length === 0 && (
        <EmptyState
          icon={Zap}
          title="No automations yet"
          description="Create your first automation to start turning Reel comments into DMs."
          action={
            <Button variant="gradient" asChild>
              <Link to={ROUTES.automationNew}>
                <Plus className="h-4 w-4" /> Create automation
              </Link>
            </Button>
          }
        />
      )}

      {!isLoading && automations && automations.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {automations.map((automation, i) => (
            <AutomationCard key={automation.id} automation={automation} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
