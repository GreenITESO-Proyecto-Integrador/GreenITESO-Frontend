import { Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/Home/Home';
import { DesignSystemPage } from './pages/DesignSystem/DesignSystem';
import { ActionCatalogPage } from './pages/ActionCatalog/ActionCatalog';
import { ActionLogFormPage } from './pages/ActionLogForm/ActionLogForm';
import { AuditReviewPage } from './pages/AuditReview/AuditReview';
import { LeaderboardPage } from './pages/Leaderboard/Leaderboard';
import { MissionsPage } from './pages/Missions/Missions';
import { FeedPage } from './pages/Feed/Feed';
import { NotificationsPage } from './pages/Notifications/Notifications';

export const routes = [
  <Route key="app" element={<Layout />}>
    <Route key="home-root" path="/" element={<HomePage />} />
    <Route key="home-alias" path="/home" element={<HomePage />} />
    <Route key="design-system" path="/design-system" element={<DesignSystemPage />} />
    <Route key="missions" path="/missions" element={<MissionsPage />} />
    <Route key="feed" path="/feed" element={<FeedPage />} />
    <Route key="notifications" path="/notifications" element={<NotificationsPage />} />
    <Route key="action-catalog" path="/actions" element={<ActionCatalogPage />} />
    <Route key="action-log-form" path="/actions/register" element={<ActionLogFormPage />} />
    <Route key="audit-review" path="/audit" element={<AuditReviewPage />} />
    <Route key="leaderboard" path="/leaderboard" element={<LeaderboardPage />} />
    <Route key="catch-all" path="*" element={<HomePage />} />
  </Route>,
];
