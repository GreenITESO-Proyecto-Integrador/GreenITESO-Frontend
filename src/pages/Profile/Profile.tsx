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

export function ProfilePage() {
  const navigate = useNavigate();
  const { profile, status, errorMessage, reload } = useEcologicalProfile();

  return (
    <main className="min-h-screen bg-secondary-50 px-4 pt-6 pb-24 sm:pt-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Navigation Top Bar */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-secondary-400 hover:text-secondary-500 font-semibold cursor-pointer"
          >
            <ArrowLeft className="size-4" />
            <span>Volver al inicio</span>
          </Button>

          <span className="text-xs font-semibold uppercase tracking-wider text-primary-600">
            Perfil Ecológico
          </span>
        </div>

        {/* State Handlers */}
        {status === 'loading' && <ProfileSkeleton />}

        {status === 'error' && <ProfileError errorMessage={errorMessage} onRetry={reload} />}

        {status === 'success' && profile && (
          <div className="space-y-8">
            <ProfileHeader profile={profile} />
            <ProgressSection profile={profile} />
            <ImpactMetricsSection metrics={profile.impactMetrics} />
            <ClansSection
              institutionalClan={profile.institutionalClan}
              activePrivateClan={profile.activePrivateClan}
            />
            <BadgesSection badges={profile.badges} />
            <CampaignsSection finishedCampaigns={profile.finishedCampaigns} />
          </div>
        )}
      </div>
    </main>
  );
}

export default ProfilePage;
