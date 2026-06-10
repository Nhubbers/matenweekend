import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header, BottomNav, ProtectedRoute } from '@/components/layout';
import { OverdueActivitiesBanner } from '@/components/activities';
import { FirstLoginModal, ErrorBoundary, LoadingSpinner } from '@/components/common';
import { useAuth } from '@/contexts/AuthContext';

const LoginPage = lazy(() => import('@/pages/LoginPage').then(m => ({ default: m.LoginPage })));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ConfirmPasswordResetPage = lazy(() => import('@/pages/ConfirmPasswordResetPage').then(m => ({ default: m.ConfirmPasswordResetPage })));
const HomePage = lazy(() => import('@/pages/HomePage').then(m => ({ default: m.HomePage })));
const ActivitiesPage = lazy(() => import('@/pages/ActivitiesPage').then(m => ({ default: m.ActivitiesPage })));
const ActivityDetailPage = lazy(() => import('@/pages/ActivityDetailPage').then(m => ({ default: m.ActivityDetailPage })));
const RankingPage = lazy(() => import('@/pages/RankingPage').then(m => ({ default: m.RankingPage })));
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const AdminPage = lazy(() => import('@/pages/AdminPage').then(m => ({ default: m.AdminPage })));

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full flex flex-col bg-base-100 overflow-hidden">
      <Header />
      <OverdueActivitiesBanner />
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}

function AppContent() {
  const { showFirstLoginModal, dismissFirstLoginModal } = useAuth();

  return (
    <>
      <FirstLoginModal isOpen={showFirstLoginModal} onClose={dismissFirstLoginModal} />
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center min-h-screen bg-base-100 pb-20">
          <LoadingSpinner size="lg" />
        </div>
      }>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/confirm-password-reset/:token" element={<ConfirmPasswordResetPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <HomePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/activities"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ActivitiesPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/activities/:id"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ActivityDetailPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ranking"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <RankingPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ProfilePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AppLayout>
                  <AdminPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
