import { Route } from 'react-router-dom';
import { HomePage } from './pages/Home/Home';
import { DesignSystemPage } from './pages/DesignSystem/DesignSystem';
import { ActionCatalogPage } from './pages/ActionCatalog/ActionCatalog';
import { ActionLogFormPage } from './pages/ActionLogForm/ActionLogForm';

export const routes = [
  <Route key="home-root" path="/" element={<HomePage />} />,
  <Route key="home-alias" path="/home" element={<HomePage />} />,
  <Route key="design-system" path="/design-system" element={<DesignSystemPage />} />,
  <Route key="action-catalog" path="/actions" element={<ActionCatalogPage />} />,
  <Route key="action-log-form" path="/actions/register" element={<ActionLogFormPage />} />,
  <Route key="catch-all" path="*" element={<HomePage />} />,
];
