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
    <main className="min-h-screen bg-secondary-50 px-4 pb-24 pt-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <p className="text-xs font-semibold tracking-wider text-primary-600 uppercase">
            Equipo 1
          </p>
          <h1 className="text-2xl font-bold text-secondary-500">Catálogo de acciones</h1>
          <p className="mt-2 text-sm text-secondary-300 sm:text-base">
            Acciones sustentables disponibles y su valor en puntos.
          </p>
        </header>

        {status === 'loading' ? (
          <p className="text-sm text-secondary-300" role="status">
            Cargando catálogo…
          </p>
        ) : null}

        {status === 'error' ? (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            <h2 className="text-lg font-semibold">No se pudo cargar el catálogo</h2>
            <p className="mt-2 text-sm">
              No fue posible obtener las acciones sustentables. Intenta de nuevo cuando el servicio
              esté disponible.
            </p>
            {errorMessage ? <p className="mt-2 text-xs text-red-600">{errorMessage}</p> : null}
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

        {status === 'success' && actions.length === 0 ? (
          <section className="rounded-2xl border border-sky-200 bg-sky-50 p-8 text-center">
            <Leaf className="mx-auto mb-4 size-10 text-sky-700" />
            <h2 className="text-lg font-semibold text-sky-800">No hay acciones activas</h2>
            <p className="mt-2 text-sm text-sky-700">
              Cuando el catálogo tenga acciones disponibles, aparecerán aquí.
            </p>
          </section>
        ) : null}

        {status === 'success' && actions.length > 0 ? (
          <ActionCatalogList actions={actions} />
        ) : null}
      </div>
    </main>
  );
}

export default ActionCatalogPage;
