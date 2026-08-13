import { AlertTriangle, Bell, CheckCheck, Instagram, MessageSquare, Send, Webhook, Zap } from 'lucide-react';
import { NotificationType } from '@instaauto/shared';
import type { NotificationDto } from '@instaauto/shared';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useUiStore } from '@/store/uiStore';
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from '@/api/notifications';
import { timeAgo } from '@/utils/format';
import { cn } from '@/utils/cn';

const ICONS: Record<NotificationType, typeof Bell> = {
  [NotificationType.AUTOMATION_STARTED]: Zap,
  [NotificationType.INSTAGRAM_DISCONNECTED]: Instagram,
  [NotificationType.DM_FAILED]: AlertTriangle,
  [NotificationType.DM_SENT]: Send,
  [NotificationType.WEBHOOK_RECEIVED]: Webhook,
  [NotificationType.KEYWORD_MATCHED]: MessageSquare,
};

function NotificationRow({ notification }: { notification: NotificationDto }) {
  const markRead = useMarkNotificationRead();
  const Icon = ICONS[notification.type] ?? Bell;

  return (
    <button
      onClick={() => !notification.isRead && markRead.mutate(notification.id)}
      className={cn(
        'flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors hover:bg-accent',
        !notification.isRead && 'bg-primary/5',
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          notification.isRead ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary',
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{notification.title}</span>
        <span className="block truncate text-xs text-muted-foreground">{notification.message}</span>
        <span className="mt-1 block text-[11px] text-muted-foreground">{timeAgo(notification.createdAt)}</span>
      </span>
      {!notification.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
    </button>
  );
}

export function NotificationDrawer() {
  const { notificationDrawerOpen, setNotificationDrawerOpen } = useUiStore();
  const { data, isLoading } = useNotifications(1);
  const markAllRead = useMarkAllNotificationsRead();

  return (
    <Sheet open={notificationDrawerOpen} onOpenChange={setNotificationDrawerOpen}>
      <SheetContent className="flex flex-col gap-4">
        <SheetHeader className="flex-row items-center justify-between">
          <SheetTitle>Notifications</SheetTitle>
          {Boolean(data?.unreadCount) && (
            <Button variant="ghost" size="sm" onClick={() => markAllRead.mutate()}>
              <CheckCheck className="h-4 w-4" /> Mark all read
            </Button>
          )}
        </SheetHeader>
        <ScrollArea className="-mx-2 flex-1 px-2">
          <div className="space-y-1">
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            {!isLoading && data?.items.length === 0 && (
              <p className="py-12 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>
            )}
            {data?.items.map((n) => (
              <NotificationRow key={n.id} notification={n} />
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
