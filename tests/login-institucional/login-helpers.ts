/**
 * Utilidades compartidas por las pruebas del login institucional.
 *
 * Referencia: ID01 ("Identidad 1" en la división de trabajo del equipo) = login
 * institucional con Microsoft (mock y Entra ID), dominio @iteso.mx, alta o
 * actualización del usuario y rol según el puesto.
 *
 * Las funciones del login se llaman dentro de la página con `import()` dinámico, así
 * corren con el mismo Vite, sessionStorage y fetch que usa la app real.
 */
import type { Page, Route } from '@playwright/test';

export const LOGIN_API = '**/api/v1/auth/login/';
export const REFRESH_API = '**/api/v1/auth/refresh/';
export const MS_ACCOUNT = {
  homeAccountId: 'h',
  environment: 'e',
  tenantId: 't',
  username: 'ana@iteso.mx',
};

export const LOGIN_OK = {
  access: 'access-token',
  refresh: 'refresh-token',
  user: {
    id: 'u1',
    email: 'ana@iteso.mx',
    first_name: 'Ana',
    last_name: 'García',
    role: 'STUDENT',
    avatar_url: '',
  },
  created: true,
  reactivated: false,
};

export interface LoginOutcome {
  ok: boolean;
  message?: string;
  code?: unknown;
  response?: Record<string, unknown>;
}

export interface LoginRequest {
  body: Record<string, unknown>;
  headers: Record<string, string>;
}

/** Answer POST /auth/login/ with `reply` and keep every request the page sent. */
export async function mockLoginApi(
  page: Page,
  reply: (body: Record<string, unknown>) => { status: number; body: unknown; raw?: boolean },
): Promise<LoginRequest[]> {
  const requests: LoginRequest[] = [];
  await page.route(LOGIN_API, async (route: Route) => {
    const request = route.request();
    const body = (request.postDataJSON() ?? {}) as Record<string, unknown>;
    requests.push({ body, headers: await request.allHeaders() });
    const answer = reply(body);
    await route.fulfill({
      status: answer.status,
      contentType: 'application/json',
      body: answer.raw ? String(answer.body) : JSON.stringify(answer.body),
    });
  });
  return requests;
}

/** Envelope `{"error": {...}}` like the backend's LoginError. */
export const envelope = (code: string, message: string) => ({ error: { code, message } });

/** Call `loginWithMicrosoft` from src/lib/api/auth.ts inside the page. */
export async function callLoginApi(
  page: Page,
  idToken: string,
  accessToken = '',
): Promise<LoginOutcome> {
  return page.evaluate(
    async ({ id, at }) => {
      const auth = await import('/src/lib/api/auth.ts');
      try {
        const response = await auth.loginWithMicrosoft(id, at);
        return { ok: true, response };
      } catch (error) {
        const err = error as Error & { code?: unknown };
        return { ok: false, message: err.message, code: err.code };
      }
    },
    { id: idToken, at: accessToken },
  );
}

/** Call `exchangeMicrosoftSignIn` from src/lib/auth/microsoft-login.ts inside the page. */
export async function callExchange(
  page: Page,
  signIn: { idToken?: string; accessToken?: string },
  allowMockRetry?: boolean,
): Promise<LoginOutcome> {
  return page.evaluate(
    async ({ result, account, retry }) => {
      const flow = await import('/src/lib/auth/microsoft-login.ts');
      try {
        const response = await flow.exchangeMicrosoftSignIn(
          { account, ...result },
          retry === undefined ? undefined : { allowMockRetry: retry },
        );
        return { ok: true, response };
      } catch (error) {
        const err = error as Error & { code?: unknown };
        return { ok: false, message: err.message, code: err.code };
      }
    },
    { result: signIn, account: MS_ACCOUNT, retry: allowMockRetry },
  );
}

/** Metadata that `hallazgos-reporter.ts` turns into the findings report. */
export interface Hallazgo {
  titulo: string;
  integrante: string;
  severidad: 'alta' | 'media' | 'baja';
  detalle: string;
  recomendacion: string;
}

export const hallazgo = (data: Hallazgo) => ({
  annotation: { type: 'hallazgo', description: JSON.stringify(data) },
});
