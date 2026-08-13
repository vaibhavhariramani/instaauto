import { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/api/queryClient';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { FullScreenLoader } from '@/components/shared/FullScreenLoader';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { ProtectedRoute, PublicOnlyRoute } from '@/components/auth/ProtectedRoute';
import { PublicLayout } from '@/layouts/PublicLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useAuthBootstrap } from '@/hooks/useAuthBootstrap';
import { ROUTES } from '@/constants/routes';

const LandingPage = lazy(() => import('@/pages/LandingPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const ProfileSetupPage = lazy(() => import('@/pages/onboarding/ProfileSetupPage'));
const ConnectInstagramOnboardingPage = lazy(() => import('@/pages/onboarding/ConnectInstagramOnboardingPage'));
const DashboardOverviewPage = lazy(() => import('@/pages/DashboardOverviewPage'));
const AutomationsListPage = lazy(() => import('@/pages/AutomationsListPage'));
const AutomationBuilderPage = lazy(() => import('@/pages/AutomationBuilderPage'));
const MessagesPage = lazy(() => import('@/pages/MessagesPage'));
const CommentsPage = lazy(() => import('@/pages/CommentsPage'));
const TemplatesPage = lazy(() => import('@/pages/TemplatesPage'));
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'));
const InstagramConnectionPage = lazy(() => import('@/pages/InstagramConnectionPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const BillingPage = lazy(() => import('@/pages/BillingPage'));
const PrivacyPolicyPage = lazy(() => import('@/pages/PrivacyPolicyPage'));
const DataDeletionPage = lazy(() => import('@/pages/DataDeletionPage'));
const TermsOfServicePage = lazy(() => import('@/pages/TermsOfServicePage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

function AppRoutes() {
  useAuthBootstrap();

  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path={ROUTES.home} element={<LandingPage />} />
        <Route path={ROUTES.privacyPolicy} element={<PrivacyPolicyPage />} />
        <Route path={ROUTES.dataDeletion} element={<DataDeletionPage />} />
        <Route path={ROUTES.termsOfService} element={<TermsOfServicePage />} />
      </Route>

      <Route element={<PublicOnlyRoute />}>
        <Route element={<AuthLayout />}>
          <Route path={ROUTES.login} element={<LoginPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AuthLayout />}>
          <Route path={ROUTES.onboardingProfile} element={<ProfileSetupPage />} />
          <Route path={ROUTES.onboardingInstagram} element={<ConnectInstagramOnboardingPage />} />
        </Route>

        <Route element={<DashboardLayout />}>
          <Route path={ROUTES.dashboard} element={<DashboardOverviewPage />} />
          <Route path={ROUTES.automations} element={<AutomationsListPage />} />
          <Route path={ROUTES.automationNew} element={<AutomationBuilderPage />} />
          <Route path="/automations/:id" element={<AutomationBuilderPage />} />
          <Route path={ROUTES.messages} element={<MessagesPage />} />
          <Route path={ROUTES.comments} element={<CommentsPage />} />
          <Route path={ROUTES.templates} element={<TemplatesPage />} />
          <Route path={ROUTES.analytics} element={<AnalyticsPage />} />
          <Route path={ROUTES.instagram} element={<InstagramConnectionPage />} />
          <Route path={ROUTES.settings} element={<SettingsPage />} />
          <Route path={ROUTES.billing} element={<BillingPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={200}>
          <BrowserRouter>
            <Suspense fallback={<FullScreenLoader />}>
              <AppRoutes />
            </Suspense>
          </BrowserRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
