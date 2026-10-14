import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AccessDeniedProps {
  title?: string;
  message?: string;
  returnTo?: string;
}

export function AccessDenied({
  title = 'Acceso Restringido',
  message = 'No cuentas con los permisos necesarios para acceder a esta sección. Esta vista está reservada para personal administrativo.',
  returnTo = '/',
}: AccessDeniedProps) {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-300">
          <ShieldAlert className="size-8" />
        </div>

        <span className="mb-3 inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-950/60 dark:text-red-300">
          Error 403 · Prohibido
        </span>

        <h1 className="mb-3 text-2xl font-bold text-foreground">{title}</h1>

        <p className="mb-8 text-sm leading-relaxed text-muted-foreground">{message}</p>

        <Button
          onClick={() => navigate(returnTo)}
          className="w-full min-h-11 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
        >
          <ArrowLeft className="mr-2 size-4" />
          Volver al inicio
        </Button>
      </div>
    </div>
  );
}
