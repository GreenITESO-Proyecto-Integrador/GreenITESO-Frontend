import { useEffect, useState } from 'react';
import { Leaf, LoaderCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { loginWithMicrosoft, persistLogin } from '@/lib/api/auth';
import {
  handleMicrosoftRedirect,
  isMicrosoftLoginConfigured,
  startMicrosoftLogin,
  getMicrosoftAccessToken,
} from '@/lib/auth/microsoft';

type LoginStatus = 'idle' | 'loading' | 'error';

function getLoginErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'No fue posible iniciar sesión. Intenta de nuevo.';
  }

  if (error.message.includes('DOMAIN_NOT_ALLOWED')) {
    return 'Solo se permiten cuentas institucionales con dominio @iteso.mx.';
  }

  return error.message;
}

export function LoginPage() {
  const [status, setStatus] = useState<LoginStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function completeLogin() {
      if (!isMicrosoftLoginConfigured()) {
        return;
      }

      try {
        const result = await handleMicrosoftRedirect();
        if (!result || !result.account) {
          return;
        }

        if (isMounted) {
          setStatus('loading');
          setErrorMessage(null);
        }

        const accessToken = result.accessToken || (await getMicrosoftAccessToken(result.account));
        const loginResponse = await loginWithMicrosoft(result.idToken, accessToken);
        persistLogin(loginResponse);

        window.location.assign('/');
      } catch (error) {
        if (isMounted) {
          setStatus('error');
          setErrorMessage(getLoginErrorMessage(error));
        }
      }
    }

    void completeLogin();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleLogin() {
    setStatus('loading');
    setErrorMessage(null);

    try {
      await startMicrosoftLogin();
    } catch (error) {
      setStatus('error');
      setErrorMessage(getLoginErrorMessage(error));
    }
  }

  const isLoading = status === 'loading';
  const isConfigured = isMicrosoftLoginConfigured();

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary-50 px-4 py-8">
      <div className="w-full max-w-md">
        <section className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-3xl bg-primary-500">
              <Leaf className="size-9 text-white" aria-hidden="true" />
            </div>
            <p className="text-xs font-semibold tracking-wider text-primary-600 uppercase">
              GreenITESO
            </p>
            <h1 className="mt-2 text-2xl font-bold text-secondary-500">Inicia sesión</h1>
            <p className="mt-3 text-sm leading-relaxed text-secondary-300">
              Accede con tu cuenta institucional para registrar y consultar tu impacto ambiental.
            </p>
          </div>

          {!isConfigured ? (
            <div
              className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
              role="alert"
            >
              Microsoft login no está configurado. Define{' '}
              <code className="font-semibold">VITE_MICROSOFT_CLIENT_ID</code> en el entorno del
              frontend.
            </div>
          ) : null}

          {status === 'error' && errorMessage ? (
            <div
              className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              role="alert"
            >
              {errorMessage}
            </div>
          ) : null}

          <Button
            type="button"
            disabled={!isConfigured || isLoading}
            onClick={() => {
              void handleLogin();
            }}
            className="min-h-11 w-full cursor-pointer rounded-xl bg-primary-500 px-5 font-semibold text-white shadow-sm hover:bg-primary-600"
          >
            {isLoading ? (
              <LoaderCircle className="mr-2 size-5 animate-spin" aria-hidden="true" />
            ) : (
              <span className="mr-2 grid size-5 grid-cols-2 grid-rows-2 gap-0.5" aria-hidden="true">
                <span className="bg-current" />
                <span className="bg-current" />
                <span className="bg-current" />
                <span className="bg-current" />
              </span>
            )}
            {isLoading ? 'Conectando…' : 'Iniciar sesión con @iteso.mx'}
          </Button>

          <div className="mt-6 flex items-start gap-3 border-t border-secondary-50 pt-5 text-xs leading-relaxed text-secondary-300">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary-600" aria-hidden="true" />
            <p>Usa exclusivamente tu cuenta institucional @iteso.mx.</p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default LoginPage;
