import { Outlet } from 'react-router-dom';
import { PublicNavbar } from '@/components/landing/PublicNavbar';
import { PublicFooter } from '@/components/landing/PublicFooter';

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
