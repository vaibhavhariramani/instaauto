import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useMe } from '@/api/me';
import { FullScreenLoader } from '@/components/shared/FullScreenLoader';
import { ROUTES } from '@/constants/routes';

export function ProtectedRoute() {
  const { accessToken, isBootstrapping, user } = useAuthStore();
  const location = useLocation();
  const { isLoading: meLoading } = useMe(Boolean(accessToken) && !user);

  if (isBootstrapping || (accessToken && meLoading && !user)) {
    return <FullScreenLoader />;
  }

  if (!accessToken) {
    return <Navigate to={ROUTES.login} state={{ from: location }} replace />;
  }

  const onOnboardingRoute = location.pathname.startsWith('/onboarding');
  if (user && !user.onboardingCompleted && !onOnboardingRoute) {
    return <Navigate to={ROUTES.onboardingProfile} replace />;
  }
  if (user?.onboardingCompleted && onOnboardingRoute) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { accessToken, isBootstrapping } = useAuthStore();
  if (isBootstrapping) return <FullScreenLoader />;
  if (accessToken) return <Navigate to={ROUTES.dashboard} replace />;
  return <Outlet />;
}
