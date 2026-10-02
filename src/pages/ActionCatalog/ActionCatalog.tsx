import { Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useActionCatalog } from '@/hooks/use-action-catalog';
import { ActionCatalogList } from './components/ActionCatalogList';

/**
 * Catalog screen that lists sustainable actions and their point values.
 */
export function ActionCatalogPage() {
  const { actions, status, errorMessage, reload } = useActionCatalog();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8">
      <header>
        <p className="text-xs font-semibold tracking-wider text-primary uppercase">Equipo 1</p>
        <h1 className="text-2xl font-bold text-foreground">Catálogo de acciones</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Acciones sustentables disponibles y su valor en puntos.
        </p>
      </header>

      {status === 'loading' ? (
        <p className="text-sm text-muted-foreground" role="status">
          Cargando catálogo…
        </p>
      ) : null}

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

      {status === 'success' && actions.length === 0 ? (
        <section className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <Leaf className="mx-auto mb-4 size-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">No hay acciones activas</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Cuando el catálogo tenga acciones disponibles, aparecerán aquí.
          </p>
        </section>
      ) : null}

      {status === 'success' && actions.length > 0 ? <ActionCatalogList actions={actions} /> : null}
    </div>
  );
}

export default ActionCatalogPage;
