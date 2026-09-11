import { Route } from 'react-router-dom';
import { HomePage } from './pages/Home/Home';
import { DesignSystemPage } from './pages/DesignSystem/DesignSystem';

export const routes = [
  <Route key="home-root" path="/" element={<HomePage />} />,
  <Route key="home-alias" path="/home" element={<HomePage />} />,
  <Route key="design-system" path="/design-system" element={<DesignSystemPage />} />,
  <Route key="catch-all" path="*" element={<HomePage />} />,
];
