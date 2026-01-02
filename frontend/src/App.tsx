import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header, BottomNav, ProtectedRoute } from '@/components/layout';
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
    <div className="min-h-screen flex flex-col bg-base-100" data-theme="night">
      <Header />
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}
