import { Outlet } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Footer } from '@/components/layout/Footer';
import { NotificationsProvider } from '@/components/notifications-provider';
import { useNotifications } from '@/hooks/use-notifications';

function LayoutContent() {
  const { unreadCount } = useNotifications();

  return (
    <div className="min-h-screen bg-background">
      <Navbar unreadNotifications={unreadCount} />
      <Sidebar />

      <div className="flex min-h-screen flex-col pt-16 pb-24 md:pl-64 md:pb-0">
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>

      <BottomNav unreadNotifications={unreadCount} />
    </div>
  );
}

export function Layout() {
  return (
    <NotificationsProvider>
      <LayoutContent />
    </NotificationsProvider>
  );
}
