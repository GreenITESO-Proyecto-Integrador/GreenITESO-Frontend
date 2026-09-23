import { Route } from 'react-router-dom';
import { HomePage } from './pages/Home/Home';
import { DesignSystemPage } from './pages/DesignSystem/DesignSystem';
import { ActionCatalogPage } from './pages/ActionCatalog/ActionCatalog';
import { ActionLogFormPage } from './pages/ActionLogForm/ActionLogForm';
import { AuditReviewPage } from './pages/AuditReview/AuditReview';
import { LeaderboardPage } from './pages/Leaderboard/Leaderboard';
import { LoginPage } from './pages/Login/Login';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

function protectedElement(element: React.ReactElement) {
  return <ProtectedRoute>{element}</ProtectedRoute>;
}

export const routes = [
  <Route key="home-root" path="/" element={protectedElement(<HomePage />)} />,
  <Route key="home-alias" path="/home" element={protectedElement(<HomePage />)} />,
  <Route key="login" path="/login" element={<LoginPage />} />,
  <Route
    key="design-system"
    path="/design-system"
    element={protectedElement(<DesignSystemPage />)}
  />,
  <Route key="action-catalog" path="/actions" element={protectedElement(<ActionCatalogPage />)} />,
  <Route
    key="action-log-form"
    path="/actions/register"
    element={protectedElement(<ActionLogFormPage />)}
  />,
  <Route key="audit-review" path="/audit" element={protectedElement(<AuditReviewPage />)} />,
  <Route key="leaderboard" path="/leaderboard" element={protectedElement(<LeaderboardPage />)} />,
  <Route key="catch-all" path="*" element={protectedElement(<HomePage />)} />,
];
