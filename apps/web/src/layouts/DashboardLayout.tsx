import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Topbar } from '@/components/dashboard/Topbar';
import { NotificationDrawer } from '@/components/dashboard/NotificationDrawer';
import { PageTransition } from '@/components/shared/PageTransition';
import { ROUTES } from '@/constants/routes';

const TITLES: Record<string, string> = {
  [ROUTES.dashboard]: 'Dashboard',
  [ROUTES.automations]: 'Automations',
  [ROUTES.messages]: 'Messages',
  [ROUTES.comments]: 'Comments',
  [ROUTES.templates]: 'Templates',
  [ROUTES.analytics]: 'Analytics',
  [ROUTES.instagram]: 'Instagram',
  [ROUTES.iceBreakers]: 'Ice Breakers',
  [ROUTES.settings]: 'Settings',
  [ROUTES.billing]: 'Billing',
};

function resolveTitle(pathname: string): string {
  if (TITLES[pathname]) return TITLES[pathname];
  const base = '/' + (pathname.split('/')[1] ?? '');
  return TITLES[base] ?? 'InstaAuto';
}

export function DashboardLayout() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-muted/20">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={resolveTitle(location.pathname)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </main>
      </div>
      <NotificationDrawer />
    </div>
  );
}
