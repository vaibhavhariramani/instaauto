import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/constants/routes';

/**
 * UX-only gate - bounces a non-admin back to the dashboard instead of showing a 403 page. This is
 * NOT the security boundary: every admin API route independently re-verifies isAdmin against the
 * database on every request (see requireAdmin.ts on the backend), so tampering with client state
 * here cannot expose admin data or actions.
 */
export function AdminRoute() {
  const user = useAuthStore((s) => s.user);
  if (!user?.isAdmin) return <Navigate to={ROUTES.dashboard} replace />;
  return <Outlet />;
}
