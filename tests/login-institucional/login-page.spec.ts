/**
 * Login institucional (front): la pantalla /login y el salto a Microsoft.
 *
 * Referencia: ID01 ("Identidad 1" en la división de trabajo del equipo) = login
 * institucional con Microsoft (mock y Entra ID), dominio @iteso.mx, alta o
 * actualización del usuario y rol según el puesto.
 *
 * Caja negra: se abre la página como un usuario y se revisa lo que ve y a dónde lo
 * manda el botón. La petición a Microsoft se intercepta y se cancela, así que no se
 * necesita una cuenta real.
 */
import { expect, test, type Page } from '@playwright/test';
import { failUnmockedApiCalls } from '../helpers/api';

const loginButton = (page: Page) => page.getByRole('button', { name: /Iniciar sesión/ });

/** Click the button and return the Microsoft authorize URL the browser tried to open. */
async function captureMicrosoftRedirect(page: Page): Promise<URL> {
  let authorizeUrl: URL | null = null;
  await page.route('https://login.microsoftonline.com/**', route => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/authorize')) authorizeUrl = url;
    return route.abort();
  });
  await loginButton(page).click();
  await expect.poll(() => authorizeUrl !== null).toBe(true);
  return authorizeUrl as unknown as URL;
}

async function skipIfMicrosoftNotConfigured(page: Page) {
  test.skip(
    await page.getByText('Microsoft login no está configurado').isVisible(),
    'VITE_MICROSOFT_CLIENT_ID no está definido en este entorno',
  );
}

test.beforeEach(async ({ page }) => {
  await failUnmockedApiCalls(page);
  await page.goto('/login');
});

test.describe('Lo que ve el usuario', () => {
  test('título "Inicia sesión"', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Inicia sesión' })).toBeVisible();
  });

  test('el botón dice que es con @iteso.mx', async ({ page }) => {
    await skipIfMicrosoftNotConfigured(page);
    await expect(loginButton(page)).toHaveText(/Iniciar sesión con @iteso\.mx/);
    await expect(loginButton(page)).toBeEnabled();
  });

  test('avisa que solo se usa la cuenta institucional', async ({ page }) => {
    await expect(
      page.getByText('Usa exclusivamente tu cuenta institucional @iteso.mx.'),
    ).toBeVisible();
  });

  test('no muestra errores al entrar', async ({ page }) => {
    await skipIfMicrosoftNotConfigured(page);
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('no pide correo ni contraseña propios', async ({ page }) => {
    await expect(page.locator('input[type="password"]')).toHaveCount(0);
    await expect(page.locator('input[type="email"]')).toHaveCount(0);
  });

  test('no llama al backend solo por abrir la página', async ({ page }) => {
    const calls: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/v1/auth/login/')) calls.push(request.url());
    });
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Inicia sesión' })).toBeVisible();
    expect(calls).toEqual([]);
  });
});

test.describe('Salto a Microsoft', () => {
  test('el botón manda a la pantalla de Microsoft', async ({ page }) => {
    await skipIfMicrosoftNotConfigured(page);
    const url = await captureMicrosoftRedirect(page);
    expect(url.hostname).toBe('login.microsoftonline.com');
  });

  test('manda el client_id de la app', async ({ page }) => {
    await skipIfMicrosoftNotConfigured(page);
    const url = await captureMicrosoftRedirect(page);
    expect(url.searchParams.get('client_id')).toMatch(/^[0-9a-f-]{36}$/);
  });

  test('pide los permisos necesarios, incluido User.Read para Graph', async ({ page }) => {
    await skipIfMicrosoftNotConfigured(page);
    const scopes = (await captureMicrosoftRedirect(page)).searchParams.get('scope')?.split(' ');
    for (const scope of ['openid', 'profile', 'email', 'offline_access', 'User.Read']) {
      expect(scopes).toContain(scope);
    }
  });

  test('usa el flujo con código y PKCE, no el implícito', async ({ page }) => {
    await skipIfMicrosoftNotConfigured(page);
    const url = await captureMicrosoftRedirect(page);
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('code_challenge')).toBeTruthy();
  });

  test('regresa a /login de la misma app', async ({ page }) => {
    await skipIfMicrosoftNotConfigured(page);
    const appOrigin = new URL(page.url()).origin;
    const url = await captureMicrosoftRedirect(page);
    const redirect = new URL(url.searchParams.get('redirect_uri') ?? '');
    expect(redirect.origin).toBe(appOrigin);
    expect(redirect.pathname).toBe('/login');
  });

  test('no manda ningún secreto en la URL', async ({ page }) => {
    await skipIfMicrosoftNotConfigured(page);
    const url = await captureMicrosoftRedirect(page);
    expect(url.searchParams.has('client_secret')).toBe(false);
  });
});

test.describe('Entrada a la app', () => {
  for (const path of ['/', '/profile', '/clans', '/admin/users']) {
    test(`sin sesión, ${path} manda a /login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    });
  }
});
