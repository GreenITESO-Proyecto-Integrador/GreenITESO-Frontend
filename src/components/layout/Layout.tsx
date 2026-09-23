import { Outlet } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Footer } from '@/components/layout/Footer';

export function Layout() {
  // TODO: replace with the real unread-notifications count once the notifications API lands.
  const unreadNotifications = 3;

  return (
    <div className="min-h-screen bg-background">
      <Navbar unreadNotifications={unreadNotifications} />
      <Sidebar />

      <div className="flex min-h-screen flex-col pt-16 pb-24 md:pl-64 md:pb-0">
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>

      <BottomNav unreadNotifications={unreadNotifications} />
    </div>
  );
}
