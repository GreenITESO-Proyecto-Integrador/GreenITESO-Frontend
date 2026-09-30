import { useCurrentUser } from '@/hooks/use-current-user';
import { AdminMissionsView } from './components/AdminMissionsView';
import { UserMissionsView } from './components/UserMissionsView';

export function MissionsPage() {
  const { isAdmin } = useCurrentUser();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 pt-8 pb-24">
      {isAdmin ? <AdminMissionsView /> : <UserMissionsView />}
    </div>
  );
}

export default MissionsPage;
