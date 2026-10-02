import { GraduationCap, Users, Shield } from 'lucide-react';
import type { ClanSummary } from '@/types/ecological-profile';

interface ClansSectionProps {
  institutionalClan: ClanSummary | null;
  activePrivateClan: ClanSummary | null;
}

export function ClansSection({ institutionalClan, activePrivateClan }: ClansSectionProps) {
  const hasNoClans = !institutionalClan && !activePrivateClan;

  return (
    <section aria-labelledby="clanes-title" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
        <h2 id="clanes-title" className="text-xl font-bold text-foreground">
          Mis Clanes
        </h2>
        <span className="text-xs text-muted-foreground">
          Equipos y colectivos a los que perteneces
        </span>
      </div>

      {hasNoClans ? (
        <div className="bg-card rounded-2xl p-6 sm:p-8 text-center border border-border shadow-xs">
          <Shield className="size-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-base font-bold text-foreground">Sin clanes asociados</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Aún no estás asignado a un clan institucional ni te has unido a un clan privado.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Institutional Clan */}
          <div className="bg-card rounded-2xl p-6 border border-border shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                  <GraduationCap className="size-3.5" />
                  Clan Institucional
                </span>
              </div>

              {institutionalClan ? (
                <>
                  <h3 className="text-lg font-bold text-foreground">{institutionalClan.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Asignado automáticamente por carrera o departamento ITESO.
                  </p>
                </>
              ) : (
                <div className="text-muted-foreground text-sm py-2">
                  <p className="italic">Sin clan institucional asignado.</p>
                </div>
              )}
            </div>
          </div>

          {/* Active Private Clan */}
          <div className="bg-card rounded-2xl p-6 border border-border shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  <Users className="size-3.5" />
                  Clan Privado Activo
                </span>
              </div>

              {activePrivateClan ? (
                <>
                  <h3 className="text-lg font-bold text-foreground">{activePrivateClan.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Clan privado seleccionado actualmente para sumar puntos en equipo.
                  </p>
                </>
              ) : (
                <div className="text-muted-foreground text-sm py-2">
                  <p className="italic">Sin clan privado activo.</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Únete a un clan o crea uno con tu equipo para colaborar juntos.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
