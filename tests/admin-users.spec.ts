import { expect, test, type Page } from '@playwright/test';
import { failUnmockedApiCalls } from './helpers/api';
import { mockAdminSession, mockStudentSession } from './helpers/auth';

type Json = Record<string, unknown>;

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
};

/** The mocked session user (see tests/helpers/auth.ts). */
const ME = 'test-user-id';

function account(id: string, email: string, extra: Json = {}): Json {
  return {
    id,
    email,
    first_name: email.split('@')[0],
    last_name: 'ITESO',
    nickname: '',
    role: 'STUDENT',
    avatar_url: '',
    status: 'ACTIVE',
    ...extra,
  };
}

const ANA = account('11111111-1111-4111-8111-111111111111', 'ana@iteso.mx');
const BETO = account('22222222-2222-4222-8222-222222222222', 'beto@iteso.mx', {
  status: 'BANNED',
});
const CARLA = account('33333333-3333-4333-8333-333333333333', 'carla@iteso.mx', {
  status: 'SELF_DEACTIVATED',
});
const ROOT = account('44444444-4444-4444-8444-444444444444', 'root@iteso.mx', { role: 'ADMIN' });
const MYSELF = account(ME, 'usuario.test@iteso.mx', { role: 'ADMIN' });

interface ApiSeed {
  users?: Json[];
  /** Total accounts the backend reports (to test the pager); each page serves all `users`. */
  count?: number;
  /** After the first ban or unban, every page after the first is gone (the list shrank). */
  shrinkAfterAction?: boolean;
  failOn?: Record<string, { status: number; body: unknown }>;
}

/**
 * Stubs GET /users/ (filter + search like the backend) and the ban / unban actions.
 */
async function mockUsersApi(page: Page, seed: ApiSeed = {}) {
  const users = (seed.users ?? [ANA, BETO, CARLA, ROOT, MYSELF]).map(user => ({ ...user }));
  const queries: URLSearchParams[] = [];
  const actions: string[] = [];
  let shrunk = false;

  await failUnmockedApiCalls(page);
  await page.route(/\/api\/v1\/users\//, async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace('/api/v1', '');
    const json = (status: number, payload: unknown) =>
      route.fulfill({
        status,
        headers: CORS_HEADERS,
        contentType: 'application/json',
        body: JSON.stringify(payload),
      });

    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS_HEADERS });
      return;
    }

    if (path === '/users/' && request.method() === 'GET') {
      queries.push(url.searchParams);
      const pageNumber = Number(url.searchParams.get('page') ?? '1');
      if (shrunk && pageNumber > 1) {
        await json(404, { detail: 'Invalid page.' });
        return;
      }
      const status = url.searchParams.get('status');
      const search = (url.searchParams.get('search') ?? '').toLowerCase();
      const rows = users.filter(user => {
        if (status === 'banned' && user.status !== 'BANNED') return false;
        if (status === 'not_banned' && user.status === 'BANNED') return false;
        return (
          !search ||
          String(user.id).toLowerCase() === search ||
          String(user.email).toLowerCase().includes(search)
        );
      });
      const total = seed.count ?? rows.length;
      const hasNext = rows.length > 0 && total > pageNumber * rows.length;
      await json(200, {
        count: total,
        next: hasNext ? `http://localhost/api/v1/users/?page=${pageNumber + 1}` : null,
        results: rows,
      });
      return;
    }

    const match = path.match(/^\/users\/([^/]+)\/(ban|unban)\/$/);
    if (match && request.method() === 'POST') {
      const [, id, action] = match;
      actions.push(`${action} ${id}`);
      const failure = seed.failOn?.[`${action} ${id}`];
      if (failure) {
        await json(failure.status, failure.body);
        return;
      }
      const user = users.find(row => row.id === id);
      if (!user) {
        await json(404, { detail: 'Not found.' });
        return;
      }
      user.status = action === 'ban' ? 'BANNED' : 'ACTIVE';
      shrunk = seed.shrinkAfterAction ?? false;
      await json(200, user);
      return;
    }

    await json(404, {});
  });

  return { queries, actions };
}

test.describe('Admin users window', () => {
  test('lists accounts with their status and the right action for each', async ({ page }) => {
    await mockAdminSession(page);
    await mockUsersApi(page);
    await page.goto('/admin/users');

    await expect(page.getByRole('heading', { name: 'Usuarios', exact: true })).toBeVisible();
    const rows = page.getByRole('list', { name: 'Usuarios' }).getByRole('listitem');
    await expect(rows).toHaveCount(5);

    const ana = rows.filter({ hasText: 'ana@iteso.mx' });
    await expect(ana.getByText('Activa')).toBeVisible();
    await expect(ana.getByText(`ID: ${ANA.id}`)).toBeVisible();
    await expect(ana.getByRole('button', { name: /^Banear a / })).toBeVisible();

    const beto = rows.filter({ hasText: 'beto@iteso.mx' });
    await expect(beto.getByText('Baneada')).toBeVisible();
    await expect(beto.getByRole('button', { name: /^Desbanear a / })).toBeVisible();

    // The user closed the account: no admin action applies.
    const carla = rows.filter({ hasText: 'carla@iteso.mx' });
    await expect(carla.getByText('Desactivada por el usuario')).toBeVisible();
    await expect(carla.getByRole('button')).toHaveCount(0);

    // Admins (and yourself) cannot be banned.
    await expect(rows.filter({ hasText: 'root@iteso.mx' }).getByRole('button')).toHaveCount(0);
    await expect(rows.filter({ hasText: 'usuario.test@iteso.mx' }).getByRole('button')).toHaveCount(
      0,
    );
  });

  test('filters by banned / not banned and searches by id', async ({ page }) => {
    await mockAdminSession(page);
    const api = await mockUsersApi(page);
    await page.goto('/admin/users');

    const rows = page.getByRole('list', { name: 'Usuarios' }).getByRole('listitem');
    await expect(rows).toHaveCount(5);

    await page.getByRole('button', { name: 'Baneados', exact: true }).click();
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText('beto@iteso.mx');
    expect(api.queries.at(-1)?.get('status')).toBe('banned');

    await page.getByRole('button', { name: 'No baneados', exact: true }).click();
    await expect(rows).toHaveCount(4);
    await expect(page.getByText('beto@iteso.mx')).toHaveCount(0);
    expect(api.queries.at(-1)?.get('status')).toBe('not_banned');

    await page.getByRole('button', { name: 'Todos', exact: true }).click();
    await expect(rows).toHaveCount(5);
    expect(api.queries.at(-1)?.has('status')).toBe(false);

    await page
      .getByRole('searchbox', { name: 'Buscar por ID, correo o nombre' })
      .fill(String(ANA.id));
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText('ana@iteso.mx');
    expect(api.queries.at(-1)?.get('search')).toBe(ANA.id);
  });

  test('shows an empty state when nothing matches', async ({ page }) => {
    await mockAdminSession(page);
    await mockUsersApi(page);
    await page.goto('/admin/users');

    await page
      .getByRole('searchbox', { name: 'Buscar por ID, correo o nombre' })
      .fill('nadie@iteso.mx');
    await expect(page.getByRole('heading', { name: 'Sin resultados' })).toBeVisible();
  });

  test('bans an account after confirming', async ({ page }) => {
    await mockAdminSession(page);
    const api = await mockUsersApi(page);
    await page.goto('/admin/users');

    await page.getByRole('button', { name: /^Banear a ana/ }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: /¿Banear a ana/ })).toBeVisible();
    // Nothing is sent until the admin confirms.
    expect(api.actions).toEqual([]);

    await dialog.getByRole('button', { name: 'Banear', exact: true }).click();

    await expect(page.getByRole('status').filter({ hasText: 'Se baneó la cuenta' })).toBeVisible();
    expect(api.actions).toEqual([`ban ${ANA.id}`]);
    const ana = page.getByRole('listitem').filter({ hasText: 'ana@iteso.mx' });
    await expect(ana.getByText('Baneada')).toBeVisible();
    await expect(ana.getByRole('button', { name: /^Desbanear a / })).toBeVisible();
  });

  test('cancelling the confirmation sends nothing', async ({ page }) => {
    await mockAdminSession(page);
    const api = await mockUsersApi(page);
    await page.goto('/admin/users');

    await page.getByRole('button', { name: /^Banear a ana/ }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Cancelar' }).click();

    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(api.actions).toEqual([]);
  });

  test('unbans an account after confirming', async ({ page }) => {
    await mockAdminSession(page);
    const api = await mockUsersApi(page);
    await page.goto('/admin/users');

    await page.getByRole('button', { name: /^Desbanear a beto/ }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Desbanear', exact: true }).click();

    await expect(
      page.getByRole('status').filter({ hasText: 'Se desbaneó la cuenta' }),
    ).toBeVisible();
    expect(api.actions).toEqual([`unban ${BETO.id}`]);
    const beto = page.getByRole('listitem').filter({ hasText: 'beto@iteso.mx' });
    await expect(beto.getByText('Activa')).toBeVisible();
  });

  test('shows the backend refusal in Spanish and keeps the dialog open', async ({ page }) => {
    await mockAdminSession(page);
    await mockUsersApi(page, {
      failOn: {
        [`ban ${ANA.id}`]: {
          status: 400,
          body: {
            error: { code: 'VALIDATION_ERROR', message: 'This account is already banned.' },
          },
        },
      },
    });
    await page.goto('/admin/users');

    await page.getByRole('button', { name: /^Banear a ana/ }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Banear', exact: true }).click();

    await expect(dialog.getByRole('alert')).toHaveText('Esta cuenta ya está baneada.');
    await expect(dialog).toBeVisible();
  });

  test('shows a retry when the list fails to load', async ({ page }) => {
    await mockAdminSession(page);
    await failUnmockedApiCalls(page);
    await page.route(/\/api\/v1\/users\//, route =>
      route.fulfill({
        status: 500,
        headers: CORS_HEADERS,
        contentType: 'application/json',
        body: '{}',
      }),
    );
    await page.goto('/admin/users');

    await expect(
      page.getByRole('heading', { name: 'No se pudieron cargar los usuarios' }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible();
  });

  test('pages through the accounts', async ({ page }) => {
    await mockAdminSession(page);
    const api = await mockUsersApi(page, { count: 120 });
    await page.goto('/admin/users');

    await expect(page.getByRole('navigation', { name: 'Paginación de usuarios' })).toBeVisible();
    await page.getByRole('button', { name: 'Página siguiente' }).click();
    await expect.poll(() => api.queries.at(-1)?.get('page')).toBe('2');
  });

  test('goes back a page when the one it was on no longer exists', async ({ page }) => {
    await mockAdminSession(page);
    // 10 accounts in 2 pages of 5; the second page disappears once one is banned.
    const api = await mockUsersApi(page, { count: 10, shrinkAfterAction: true });
    await page.goto('/admin/users');

    await page.getByRole('button', { name: 'Página siguiente' }).click();
    await expect.poll(() => api.queries.at(-1)?.get('page')).toBe('2');

    await page.getByRole('button', { name: /^Banear a ana/ }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Banear', exact: true }).click();

    // The reload of page 2 answers 404: the window shows page 1 instead of an error.
    await expect(page.getByRole('status').filter({ hasText: 'Se baneó la cuenta' })).toBeVisible();
    await expect.poll(() => api.queries.at(-1)?.get('page')).toBe('1');
    await expect(
      page.getByRole('heading', { name: 'No se pudieron cargar los usuarios' }),
    ).toHaveCount(0);
    await expect(page.getByRole('listitem').filter({ hasText: 'ana@iteso.mx' })).toBeVisible();
  });

  test('does not ask for the old search on a new page when the search changes', async ({
    page,
  }) => {
    await mockAdminSession(page);
    const api = await mockUsersApi(page, { count: 120 });
    await page.goto('/admin/users');
    await page.getByRole('button', { name: 'Página siguiente' }).click();
    await expect.poll(() => api.queries.at(-1)?.get('page')).toBe('2');
    const before = api.queries.length;

    await page.getByRole('searchbox', { name: 'Buscar por ID, correo o nombre' }).fill('ana');
    await expect.poll(() => api.queries.at(-1)?.get('search')).toBe('ana');

    // Every request after typing is for the new search, from page 1.
    const after = api.queries.slice(before);
    expect(after.every(query => query.get('search') === 'ana' && query.get('page') === '1')).toBe(
      true,
    );
  });

  test('shows that it is loading again when retrying after an error', async ({ page }) => {
    await mockAdminSession(page);
    await mockUsersApi(page);
    let phase: 'fail' | 'hold' = 'fail';
    let release: () => void = () => {};
    const gate = new Promise<void>(resolve => {
      release = resolve;
    });
    await page.route(/\/api\/v1\/users\/(\?.*)?$/, async route => {
      if (route.request().method() === 'GET') {
        if (phase === 'fail') {
          await route.fulfill({ status: 500, headers: CORS_HEADERS, body: '{}' });
          return;
        }
        await gate;
      }
      await route.fallback();
    });
    await page.goto('/admin/users');
    await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible();

    phase = 'hold';
    await page.getByRole('button', { name: 'Reintentar' }).click();
    await expect(page.getByText('Cargando usuarios…')).toBeVisible();

    release();
    await expect(page.getByRole('listitem').filter({ hasText: 'ana@iteso.mx' })).toBeVisible();
  });

  test('explains in Spanish that a clan leader cannot be banned', async ({ page }) => {
    await mockAdminSession(page);
    await mockUsersApi(page, {
      failOn: {
        [`ban ${ANA.id}`]: {
          status: 400,
          body: {
            error: {
              code: 'VALIDATION_ERROR',
              message:
                'This account leads a clan. Ask them to transfer its leadership or dissolve it before banning.',
            },
          },
        },
      },
    });
    await page.goto('/admin/users');

    await page.getByRole('button', { name: /^Banear a ana/ }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Banear', exact: true }).click();

    await expect(dialog.getByRole('alert')).toContainText('lidera un clan');
  });

  test('is listed in the sidebar for admins only', async ({ page }) => {
    await mockAdminSession(page);
    await mockUsersApi(page);
    await page.goto('/actions');

    const link = page.locator('aside').getByRole('link', { name: 'Usuarios', exact: true });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL('/admin/users');
  });

  test('a student cannot open it nor see the link', async ({ page }) => {
    await mockStudentSession(page);
    await failUnmockedApiCalls(page);
    await page.goto('/admin/users');

    await expect(page.getByRole('heading', { name: 'Acceso Restringido' })).toBeVisible();
    await expect(page.locator('aside').getByRole('link', { name: 'Usuarios' })).toHaveCount(0);
  });
});
