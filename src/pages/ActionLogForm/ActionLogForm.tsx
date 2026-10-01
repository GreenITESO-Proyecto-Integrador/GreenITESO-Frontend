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
    <div className="mx-auto flex max-w-xl flex-col gap-8 px-4 py-8">
      <header>
        <p className="text-xs font-semibold tracking-wider text-primary uppercase">Registro</p>
        <h1 className="text-2xl font-bold text-foreground">Registrar acción</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Elige una acción del catálogo y, si aplica, adjunta la evidencia fotográfica.
        </p>
      </header>

      {status === 'error' ? (
        <section className="rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-destructive">
          <h2 className="text-lg font-semibold">No se pudo cargar el catálogo</h2>
          <p className="mt-2 text-sm">
            No fue posible obtener las acciones sustentables. Intenta de nuevo cuando el servicio
            esté disponible.
          </p>
          {errorMessage ? <p className="mt-2 text-xs">{errorMessage}</p> : null}
          <Button
            type="button"
            onClick={() => {
              void reload();
            }}
            className="mt-4 min-h-11"
          >
            Reintentar
          </Button>
        </section>
      ) : null}

      {submitStatus === 'preview' ? (
        <section className="rounded-2xl border border-border bg-accent p-4 text-accent-foreground">
          <h2 className="text-lg font-semibold">Formulario listo</h2>
          <p className="mt-1 text-sm text-muted-foreground">
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
        className="space-y-6 rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border"
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
            className="min-h-11"
          >
            Registrar
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isCatalogLoading}
            onClick={resetForm}
            className="min-h-11"
          >
            Limpiar
          </Button>
        </div>
      </form>
    </div>
  );
}

export default ActionLogFormPage;
