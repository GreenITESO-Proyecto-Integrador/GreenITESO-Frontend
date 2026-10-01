import { useCurrentUser } from '@/hooks/use-current-user';
import { UserDashboard } from './components/UserDashboard';

export function DashboardPage() {
  const { isAdmin } = useCurrentUser();

  // ADMIN keeps the plain dashboard: campaigns are managed from /missions and /audit.
  if (isAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-2xl font-bold text-foreground">Dashboard</p>
      </div>
    );
  }

  return <UserDashboard />;
}

export default DashboardPage;
