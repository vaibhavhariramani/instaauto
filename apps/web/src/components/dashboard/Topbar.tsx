import { Bell, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { UserMenu } from './UserMenu';
import { useUiStore } from '@/store/uiStore';
import { useNotifications } from '@/api/notifications';

export function Topbar({ title }: { title: string }) {
  const setNotificationDrawerOpen = useUiStore((s) => s.setNotificationDrawerOpen);
  const { data } = useNotifications(1);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6">
      <h1 className="hidden text-lg font-semibold tracking-tight sm:block">{title}</h1>

      <div className="relative ml-auto w-full max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search automations, messages..." className="pl-9" />
      </div>

      <ThemeToggle className="hidden sm:inline-flex" />

      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setNotificationDrawerOpen(true)}
        aria-label="Notifications"
      >
        <Bell className="h-[18px] w-[18px]" />
        {Boolean(data?.unreadCount) && (
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
            {data!.unreadCount > 9 ? '9+' : data!.unreadCount}
          </span>
        )}
      </Button>

      <UserMenu />
    </header>
  );
}
