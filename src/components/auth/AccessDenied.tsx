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
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary-50 px-4 text-center">
      <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-sm border border-secondary-200">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <ShieldAlert className="size-8" />
        </div>

        <span className="inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 mb-3">
          Error 403 · Prohibido
        </span>

        <h1 className="text-2xl font-bold text-secondary-500 mb-3">{title}</h1>

        <p className="text-sm text-secondary-400 mb-8 leading-relaxed">{message}</p>

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
