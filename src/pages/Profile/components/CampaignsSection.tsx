import { CalendarCheck, Flag } from 'lucide-react';
import type { FinishedCampaign } from '@/types/ecological-profile';

interface CampaignsSectionProps {
  finishedCampaigns: FinishedCampaign[];
}

export function CampaignsSection({ finishedCampaigns }: CampaignsSectionProps) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Fecha no especificada';
    const date = new Date(dateStr);
    return isNaN(date.getTime())
      ? dateStr
      : date.toLocaleDateString('es-MX', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
  };

  return (
    <section aria-labelledby="campanas-title" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
        <h2 id="campanas-title" className="text-xl font-bold text-secondary-500">
          Historial de Campañas
        </h2>
        <span className="text-xs text-secondary-300">
          Campañas sostenibles en las que participaste y han concluido
        </span>
      </div>

      {finishedCampaigns.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 sm:p-8 text-center border border-secondary-100 shadow-sm">
          <div className="size-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Flag className="size-6" />
          </div>
          <h3 className="text-base font-bold text-secondary-500">Sin campañas finalizadas</h3>
          <p className="text-sm text-secondary-300 mt-1 max-w-md mx-auto">
            Cuando concluyan las campañas ecológicas en las que te inscribas, aparecerán listadas en
            este historial de participación.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-secondary-100 shadow-sm divide-y divide-secondary-100 overflow-hidden">
          {finishedCampaigns.map(campaign => (
            <div
              key={campaign.id}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-secondary-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                  <CalendarCheck className="size-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-secondary-500">{campaign.title}</h4>
                  <p className="text-xs text-secondary-300 mt-0.5">Participación completada</p>
                </div>
              </div>

              <div className="text-xs font-semibold text-secondary-400 bg-secondary-50 px-3 py-1.5 rounded-lg self-start sm:self-center border border-secondary-100">
                Finalizó: {formatDate(campaign.endDate)}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
