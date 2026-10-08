import { Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/Login/Login';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { DashboardPage } from './pages/Dashboard/Dashboard';
import { HomePage } from './pages/Home/Home';
import { DesignSystemPage } from './pages/DesignSystem/DesignSystem';
import { ActionCatalogPage } from './pages/ActionCatalog/ActionCatalog';
import { ActionLogFormPage } from './pages/ActionLogForm/ActionLogForm';
import { AuditReviewPage } from './pages/AuditReview/AuditReview';
import { LeaderboardPage } from './pages/Leaderboard/Leaderboard';
import { MissionsPage } from './pages/Missions/Missions';
import { FeedPage } from './pages/Feed/Feed';
import { NotificationsPage } from './pages/Notifications/Notifications';
import { ProfilePage } from './pages/Profile/Profile';
import { StorePage } from './pages/Store/Store';
import { ADMIN_ROLES, type UserRole } from './types/auth';

function protectedElement(
  element: React.ReactElement,
  allowedRoles?: readonly (UserRole | string)[],
) {
  return <ProtectedRoute allowedRoles={allowedRoles}>{element}</ProtectedRoute>;
}

export const routes = [
  <Route key="login" path="/login" element={<LoginPage />} />,
  <Route key="app" element={<Layout />}>
    <Route key="home-root" path="/" element={protectedElement(<DashboardPage />)} />
    <Route key="home-alias" path="/home" element={protectedElement(<HomePage />)} />
    <Route
      key="design-system"
      path="/design-system"
      element={protectedElement(<DesignSystemPage />)}
    />
    <Route key="missions" path="/missions" element={protectedElement(<MissionsPage />)} />
    <Route key="store" path="/store" element={protectedElement(<StorePage />)} />
    <Route key="shop" path="/shop" element={protectedElement(<StorePage />)} />
    <Route key="feed" path="/feed" element={protectedElement(<FeedPage />)} />
    <Route
      key="notifications"
      path="/notifications"
      element={protectedElement(<NotificationsPage />)}
    />
    <Route key="action-catalog" path="/actions" element={protectedElement(<ActionCatalogPage />)} />
    <Route
      key="action-log-form"
      path="/actions/register"
      element={protectedElement(<ActionLogFormPage />)}
    />
    <Route
      key="audit-review"
      path="/audit"
      element={protectedElement(<AuditReviewPage />, ADMIN_ROLES)}
    />
    <Route key="leaderboard" path="/leaderboard" element={protectedElement(<LeaderboardPage />)} />
    <Route key="profile" path="/profile" element={protectedElement(<ProfilePage />)} />
    <Route key="catch-all" path="*" element={protectedElement(<DashboardPage />)} />
  </Route>,
];
