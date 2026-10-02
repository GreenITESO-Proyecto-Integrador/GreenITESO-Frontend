import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProfileErrorProps {
  errorMessage: string | null;
  onRetry: () => void;
}

export function ProfileError({ errorMessage, onRetry }: ProfileErrorProps) {
  return (
    <section className="rounded-2xl border border-red-200 bg-red-50 p-6 sm:p-8 text-red-700 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-red-100 rounded-xl text-red-700 shrink-0">
          <AlertTriangle className="size-6" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">No se pudo cargar el perfil ecológico</h2>
          <p className="mt-2 text-sm text-red-700">
            Ocurrió un error al obtener la información de tu perfil. Por favor, verifica tu conexión
            o intenta nuevamente.
          </p>
          {errorMessage ? (
            <p className="mt-2 text-xs text-red-600 font-mono">{errorMessage}</p>
          ) : null}
          <Button
            type="button"
            onClick={onRetry}
            className="mt-4 min-h-11 rounded-xl bg-primary-500 px-6 font-semibold text-white hover:bg-primary-600 cursor-pointer shadow-sm transition-colors"
          >
            Reintentar
          </Button>
        </div>
      </div>
    </section>
  );
}
