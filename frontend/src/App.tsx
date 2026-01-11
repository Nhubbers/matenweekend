import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header, BottomNav, ProtectedRoute } from '@/components/layout';
import { FirstLoginModal } from '@/components/common';
import { useAuth } from '@/contexts/AuthContext';
import {
  LoginPage,
  HomePage,
  ActivitiesPage,
  ActivityDetailPage,
  RankingPage,
  ProfilePage,
  AdminPage,
} from '@/pages';

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full flex flex-col bg-base-100 overflow-hidden">
      <Header />
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
      <Routes>
        <Route path="/login" element={<LoginPage />} />
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
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
