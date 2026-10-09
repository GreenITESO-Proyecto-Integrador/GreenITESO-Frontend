import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useEcologicalProfile } from '@/hooks/use-ecological-profile';
import { ProfileHeader } from './components/ProfileHeader';
import { ProgressSection } from './components/ProgressSection';
import { ImpactMetricsSection } from './components/ImpactMetricsSection';
import { ClansSection } from './components/ClansSection';
import { BadgesSection } from './components/BadgesSection';
import { CampaignsSection } from './components/CampaignsSection';
import { ProfileSkeleton } from './components/ProfileSkeleton';
import { ProfileError } from './components/ProfileError';
import { EditProfileDialog } from './components/EditProfileDialog';

export function ProfilePage() {
  const navigate = useNavigate();
  const { profile, status, errorMessage, reload, setProfile } = useEcologicalProfile();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">
      {/* Navigation Top Bar */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-semibold cursor-pointer"
        >
          <ArrowLeft className="size-4" />
          <span>Volver al inicio</span>
        </Button>

        <span className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
          Perfil Ecológico
        </span>
      </div>

      {/* State Handlers */}
      {status === 'loading' && <ProfileSkeleton />}

      {status === 'error' && <ProfileError errorMessage={errorMessage} onRetry={reload} />}

      {status === 'success' && profile && (
        <div className="space-y-8">
          <ProfileHeader profile={profile} onEditProfile={() => setIsEditDialogOpen(true)} />
          <ProgressSection profile={profile} />
          <ImpactMetricsSection metrics={profile.impactMetrics} />
          <ClansSection
            institutionalClan={profile.institutionalClan}
            activePrivateClan={profile.activePrivateClan}
          />
          <BadgesSection badges={profile.badges} />
          <CampaignsSection finishedCampaigns={profile.finishedCampaigns} />

          <EditProfileDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            profile={profile}
            onProfileUpdated={updated => {
              setProfile(updated);
            }}
          />
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
