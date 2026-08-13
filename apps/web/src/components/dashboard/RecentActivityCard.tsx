import { AlertTriangle, Bell, Instagram, MessageSquare, Send, Webhook, Zap } from 'lucide-react';
import { NotificationType, type NotificationDto } from '@instaauto/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/EmptyState';
import { timeAgo } from '@/utils/format';

const ICONS: Record<NotificationType, typeof Bell> = {
  [NotificationType.AUTOMATION_STARTED]: Zap,
  [NotificationType.INSTAGRAM_DISCONNECTED]: Instagram,
  [NotificationType.DM_FAILED]: AlertTriangle,
  [NotificationType.DM_SENT]: Send,
  [NotificationType.WEBHOOK_RECEIVED]: Webhook,
  [NotificationType.KEYWORD_MATCHED]: MessageSquare,
};

export function RecentActivityCard({ items }: { items: NotificationDto[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState icon={Bell} title="No activity yet" description="Once your automations start running, activity will show up here." />
        ) : (
          <ul className="space-y-4">
            {items.map((item) => {
              const Icon = ICONS[item.type] ?? Bell;
              return (
                <li key={item.id} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.message}</p>
                  </div>
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">{timeAgo(item.createdAt)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
