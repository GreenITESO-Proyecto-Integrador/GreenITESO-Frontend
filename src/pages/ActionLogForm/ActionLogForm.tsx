import { Button } from '@/components/ui/button';
import { useActionCatalog } from '@/hooks/use-action-catalog';
import { useActionLogForm } from '@/hooks/use-action-log-form';
import { ActionSelect } from './components/ActionSelect';
import { EvidenceFileInput } from './components/EvidenceFileInput';

/**
 * Registration form to pick a catalog action and attach photographic evidence.
 */
export function ActionLogFormPage() {
  const { actions, status, errorMessage, reload } = useActionCatalog();
  const {
    actionId,
    evidence,
    errors,
    selectedAction,
    submitStatus,
    selectAction,
    selectEvidence,
    submitForm,
    resetForm,
  } = useActionLogForm(actions);

  const isCatalogLoading = status === 'loading';
  const requiresPhoto = selectedAction?.validationType === 'PHOTO';

  return (
    <main className="min-h-screen bg-background px-4 pt-8 pb-24">
      <div className="mx-auto max-w-xl">
        <header className="mb-8">
          <p className="text-xs font-semibold tracking-wider text-primary-600 uppercase dark:text-primary-400">
            Registro
          </p>
          <h1 className="text-2xl font-bold text-foreground">Registrar acción</h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Elige una acción del catálogo y, si aplica, adjunta la evidencia fotográfica.
          </p>
        </header>

        {status === 'error' ? (
          <section className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            <h2 className="text-lg font-semibold">No se pudo cargar el catálogo</h2>
            <p className="mt-2 text-sm">
              No fue posible obtener las acciones sustentables. Intenta de nuevo cuando el servicio
              esté disponible.
            </p>
            {errorMessage ? (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400">{errorMessage}</p>
            ) : null}
            <Button
              type="button"
              onClick={() => {
                void reload();
              }}
              className="mt-4 min-h-11 rounded-xl bg-primary-500 px-5 font-semibold text-white hover:bg-primary-600"
            >
              Reintentar
            </Button>
          </section>
        ) : null}

        {submitStatus === 'preview' ? (
          <section className="mb-6 rounded-2xl border border-primary-200 bg-primary-50 p-4 text-primary-700 dark:border-primary-800 dark:bg-primary-950/40 dark:text-primary-300">
            <h2 className="text-lg font-semibold">Formulario listo</h2>
            <p className="mt-1 text-sm">
              La acreditación de puntos se hará en el servidor. Aquí solo validamos acción y
              evidencia.
            </p>
            {selectedAction ? (
              <p className="mt-2 text-sm font-semibold tabular-nums">
                {selectedAction.name} · {selectedAction.points} pts
              </p>
            ) : null}
          </section>
        ) : null}

        <form
          className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm"
          onSubmit={event => {
            event.preventDefault();
            submitForm();
          }}
        >
          <ActionSelect
            actions={actions}
            value={actionId}
            error={errors.actionId}
            disabled={isCatalogLoading || status === 'error'}
            onChange={selectAction}
          />

          <EvidenceFileInput
            file={evidence}
            error={errors.evidence}
            requiredPhoto={requiresPhoto}
            disabled={isCatalogLoading || status === 'error'}
            onChange={selectEvidence}
          />

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="submit"
              disabled={isCatalogLoading || status === 'error'}
              className="min-h-11 cursor-pointer rounded-xl bg-primary-500 px-5 font-semibold text-white shadow-sm hover:bg-primary-600"
            >
              Registrar
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isCatalogLoading}
              onClick={resetForm}
              className="min-h-11 cursor-pointer rounded-xl px-5 font-semibold"
            >
              Limpiar
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default ActionLogFormPage;
