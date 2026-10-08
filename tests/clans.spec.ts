import { expect, test, type Page } from '@playwright/test';
import { mockStudentSession } from './helpers/auth';

type Json = Record<string, unknown>;

interface Call {
  method: string;
  path: string;
  body: Json | null;
}

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET,POST,DELETE,OPTIONS',
};

/** The mocked session user (see tests/helpers/auth.ts). */
const ME = 'test-user-id';

const ECO_CLAN = {
  id: 'clan-eco',
  name: 'Eco Warriors',
  description: 'Reciclamos todo el semestre',
  avatar_object_key: '',
  type: 'PRIVATE',
  privacy: 'PUBLIC',
  total_points: 1200,
  created_at: '2026-09-01T10:00:00Z',
};

const RIO_CLAN = {
  id: 'clan-rio',
  name: 'Clan Río',
  description: '',
  avatar_object_key: '',
  type: 'PRIVATE',
  privacy: 'PUBLIC',
  total_points: 300,
  created_at: '2026-09-10T10:00:00Z',
};

function member(userId: string, nickname: string, role: 'LEADER' | 'MEMBER'): Json {
  return { user_id: userId, nickname, role, joined_at: '2026-09-02T10:00:00Z' };
}

function detail(base: Json, members: Json[]): Json {
  return { ...base, members, member_count: members.length };
}

const PROFILE = {
  user_id: ME,
  email: 'usuario.test@iteso.mx',
  first_name: 'Usuario',
  last_name: 'Prueba',
  role: 'STUDENT',
  visibility: 'PUBLIC',
  total_points: 0,
  available_points: 0,
  current_streak: 0,
  level: 1,
  badges: [],
  impact_metrics: { co2_kg: '0', water_liters: '0', plastic_kg: '0' },
  finished_campaigns: [],
  institutional_clan: { id: 'clan-inst', name: 'Ingeniería en Sistemas' },
  active_private_clan: null,
};

interface ApiSeed {
  clans?: Json[];
  details?: Record<string, Json>;
  /** Clan ids that answer 404 on the detail endpoint. */
  hidden?: string[];
  failOn?: Record<string, { status: number; body: unknown }>;
}

/**
 * Stubs every /api/v1 call used by the clans pages and records the mutations.
 */
async function mockClansApi(page: Page, seed: ApiSeed = {}) {
  const calls: Call[] = [];
  const clans = seed.clans ?? [ECO_CLAN, RIO_CLAN];
  const details = seed.details ?? {};
  const hidden = new Set(seed.hidden ?? []);

  await page.route(/\/api\/v1\//, async route => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const path = url.pathname.replace('/api/v1', '');

    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS_HEADERS });
      return;
    }

    let body: Json | null;
    try {
      body = request.postDataJSON() as Json | null;
    } catch {
      body = null;
    }
    if (method !== 'GET') calls.push({ method, path, body });

    const json = (status: number, payload: unknown) =>
      route.fulfill({
        status,
        headers: CORS_HEADERS,
        contentType: 'application/json',
        body: JSON.stringify(payload),
      });

    const failure = seed.failOn?.[`${method} ${path}`];
    if (failure) {
      await json(failure.status, failure.body);
      return;
    }

    if (path === '/profile/me/') {
      await json(200, PROFILE);
      return;
    }
    if (path === '/clans/' && method === 'GET') {
      const search = (url.searchParams.get('search') ?? '').toLowerCase();
      await json(200, {
        results: clans.filter(clan => String(clan.name).toLowerCase().includes(search)),
        next: null,
      });
      return;
    }
    if (path === '/clans/' && method === 'POST') {
      await json(201, { ...ECO_CLAN, id: 'clan-new', name: String(body?.name ?? '') });
      return;
    }

    const action = path.match(
      /^\/clans\/([^/]+)\/(join|leave|select-active|transfer-leadership)\/$/,
    );
    if (action) {
      const [, clanId, name] = action;
      if (name === 'leave') {
        await route.fulfill({ status: 204, headers: CORS_HEADERS });
        return;
      }
      await json(name === 'join' ? 201 : 200, {
        id: 'membership-1',
        clan: clanId,
        user: ME,
        role: 'MEMBER',
        status: seed.hidden?.includes(clanId) ? 'PENDING' : 'ACCEPTED',
        is_active_private: name === 'select-active',
        joined_at: '2026-10-01T10:00:00Z',
      });
      return;
    }

    const one = path.match(/^\/clans\/([^/]+)\/$/);
    if (one && method === 'GET') {
      const clanId = one[1];
      if (hidden.has(clanId) || !details[clanId]) {
        await json(404, { detail: 'No Clan matches the given query.' });
        return;
      }
      await json(200, details[clanId]);
      return;
    }
    if (one && method === 'DELETE') {
      await route.fulfill({ status: 204, headers: CORS_HEADERS });
      return;
    }

    await json(404, { detail: 'Not found.' });
  });

  return { calls };
}

const MEMBER_DETAIL = detail(ECO_CLAN, [
  member('leader-1', 'Ana Líder', 'LEADER'),
  member(ME, 'Usuario Prueba', 'MEMBER'),
]);

const LEADER_DETAIL = detail(ECO_CLAN, [
  member(ME, 'Usuario Prueba', 'LEADER'),
  member('member-2', 'Luis Miembro', 'MEMBER'),
]);

test('should list clans and filter them with the search box', async ({ page }) => {
  await mockStudentSession(page);
  await mockClansApi(page);
  await page.goto('/clans');

  await expect(page.getByRole('heading', { name: 'Clanes', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /Eco Warriors/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Clan Río/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Mis clanes' })).toBeVisible();
  await expect(page.getByText('Ingeniería en Sistemas')).toBeVisible();

  await page.getByLabel('Buscar clanes por nombre').fill('río');
  await expect(page.getByRole('link', { name: /Clan Río/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Eco Warriors/ })).toHaveCount(0);
});

test('should show an empty state when the search has no results', async ({ page }) => {
  await mockStudentSession(page);
  await mockClansApi(page);
  await page.goto('/clans');

  await page.getByLabel('Buscar clanes por nombre').fill('zzz');
  await expect(page.getByRole('heading', { name: 'Sin resultados' })).toBeVisible();
});

test('should show an error with retry when the clan list fails', async ({ page }) => {
  await mockStudentSession(page);
  await mockClansApi(page, {
    failOn: { 'GET /clans/': { status: 500, body: { detail: 'Boom' } } },
  });
  await page.goto('/clans');

  await expect(
    page.getByRole('heading', { name: 'No se pudieron cargar los clanes' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible();
});

test('should show the clan profile with its members and member actions', async ({ page }) => {
  await mockStudentSession(page);
  await mockClansApi(page, { details: { 'clan-eco': MEMBER_DETAIL } });
  await page.goto('/clans/clan-eco');

  await expect(page.getByRole('heading', { name: 'Eco Warriors' })).toBeVisible();
  await expect(page.getByText('1,200 puntos')).toBeVisible();
  await expect(page.getByText('Ana Líder')).toBeVisible();
  await expect(page.getByText('(tú)')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Establecer como clan activo' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Salir del clan' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Disolver clan' })).toHaveCount(0);
});

test('should set the clan as active', async ({ page }) => {
  await mockStudentSession(page);
  const { calls } = await mockClansApi(page, { details: { 'clan-eco': MEMBER_DETAIL } });
  await page.goto('/clans/clan-eco');

  await page.getByRole('button', { name: 'Establecer como clan activo' }).click();

  await expect(page.getByText('Eco Warriors es ahora tu clan activo.')).toBeVisible();
  expect(calls.some(call => call.path === '/clans/clan-eco/select-active/')).toBe(true);
});

test('should leave a clan after confirming and go back to the list', async ({ page }) => {
  await mockStudentSession(page);
  const { calls } = await mockClansApi(page, { details: { 'clan-eco': MEMBER_DETAIL } });
  await page.goto('/clans/clan-eco');

  await page.getByRole('button', { name: 'Salir del clan' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Salir del clan' }).click();

  await expect(page).toHaveURL(/\/clans$/);
  await expect(page.getByText('Saliste de Eco Warriors.')).toBeVisible();
  expect(calls.some(call => call.path === '/clans/clan-eco/leave/')).toBe(true);
});

test('should show leader actions and transfer leadership', async ({ page }) => {
  await mockStudentSession(page);
  const { calls } = await mockClansApi(page, { details: { 'clan-eco': LEADER_DETAIL } });
  await page.goto('/clans/clan-eco');

  await expect(page.getByRole('button', { name: 'Salir del clan' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Disolver clan' })).toBeVisible();

  await page.getByRole('button', { name: 'Transferir liderazgo' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nuevo líder').click();
  await page.getByRole('option', { name: 'Luis Miembro' }).click();
  await dialog.getByRole('button', { name: 'Transferir liderazgo' }).click();

  await expect(page.getByText(/Luis Miembro es ahora la persona líder/)).toBeVisible();
  expect(calls.find(call => call.path === '/clans/clan-eco/transfer-leadership/')?.body).toEqual({
    successor_id: 'member-2',
  });
});

test('should dissolve the clan after confirming', async ({ page }) => {
  await mockStudentSession(page);
  const { calls } = await mockClansApi(page, { details: { 'clan-eco': LEADER_DETAIL } });
  await page.goto('/clans/clan-eco');

  await page.getByRole('button', { name: 'Disolver clan' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Disolver clan' }).click();

  await expect(page).toHaveURL(/\/clans$/);
  await expect(page.getByText('Eco Warriors se disolvió.')).toBeVisible();
  expect(calls.some(call => call.method === 'DELETE' && call.path === '/clans/clan-eco/')).toBe(
    true,
  );
});

test('should create a clan and open its profile', async ({ page }) => {
  await mockStudentSession(page);
  const { calls } = await mockClansApi(page, {
    details: {
      'clan-new': detail({ ...ECO_CLAN, id: 'clan-new', name: 'Mi Clan' }, [
        member(ME, 'Usuario Prueba', 'LEADER'),
      ]),
    },
  });
  await page.goto('/clans');

  await page.getByRole('button', { name: 'Crear clan' }).first().click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nombre').fill('Mi Clan');
  await dialog.getByLabel('Descripción (opcional)').fill('Equipo de prueba');
  await dialog.getByRole('button', { name: 'Solo invitación' }).click();
  await dialog.getByRole('button', { name: 'Crear clan' }).click();

  await expect(page).toHaveURL(/\/clans\/clan-new$/);
  await expect(page.getByText(/Creaste Mi Clan/)).toBeVisible();
  expect(calls.find(call => call.method === 'POST' && call.path === '/clans/')?.body).toEqual({
    name: 'Mi Clan',
    description: 'Equipo de prueba',
    privacy: 'PRIVATE_INVITE',
  });
});

test('should translate a duplicate clan name error', async ({ page }) => {
  await mockStudentSession(page);
  await mockClansApi(page, {
    failOn: {
      'POST /clans/': { status: 400, body: ["A clan named 'Mi Clan' already exists."] },
    },
  });
  await page.goto('/clans');

  await page.getByRole('button', { name: 'Crear clan' }).first().click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nombre').fill('Mi Clan');
  await dialog.getByRole('button', { name: 'Crear clan' }).click();

  await expect(dialog.getByRole('alert')).toHaveText(
    'Ya existe un clan con ese nombre. Elige otro.',
  );
});

test('should require a name before creating a clan', async ({ page }) => {
  await mockStudentSession(page);
  const { calls } = await mockClansApi(page);
  await page.goto('/clans');

  await page.getByRole('button', { name: 'Crear clan' }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: 'Crear clan' }).click();

  await expect(page.getByText('Escribe un nombre para el clan.')).toBeVisible();
  expect(calls).toHaveLength(0);
});

test('should join a public clan from its profile', async ({ page }) => {
  await mockStudentSession(page);
  const { calls } = await mockClansApi(page, {
    details: { 'clan-eco': detail(ECO_CLAN, [member('leader-1', 'Ana Líder', 'LEADER')]) },
  });
  await page.goto('/clans/clan-eco');

  await page.getByRole('button', { name: 'Unirme al clan' }).click();

  await expect(page.getByText('Te uniste a Eco Warriors.')).toBeVisible();
  expect(calls.some(call => call.path === '/clans/clan-eco/join/')).toBe(true);
});

test('should request to join an invite-only clan from an invite link', async ({ page }) => {
  const inviteId = '3f2b8c1e-9d4a-4e6b-8a1c-5d7e9f0a1b2c';
  await mockStudentSession(page);
  const { calls } = await mockClansApi(page, { hidden: [inviteId] });
  await page.goto('/clans');

  await page.getByRole('button', { name: 'Tengo una invitación' }).click();
  await page.getByLabel('Enlace de invitación').fill(`http://localhost:3000/clans/${inviteId}`);
  await page.getByRole('dialog').getByRole('button', { name: 'Continuar' }).click();

  await expect(page).toHaveURL(new RegExp(`/clans/${inviteId}$`));
  await expect(page.getByRole('heading', { name: 'No encontramos este clan' })).toBeVisible();

  await page.getByRole('button', { name: 'Solicitar unirme' }).click();
  await expect(page.getByRole('heading', { name: 'Solicitud enviada' })).toBeVisible();
  expect(calls.some(call => call.path === `/clans/${inviteId}/join/`)).toBe(true);
});

test('should reject an invite link without a clan id', async ({ page }) => {
  await mockStudentSession(page);
  await mockClansApi(page);
  await page.goto('/clans');

  await page.getByRole('button', { name: 'Tengo una invitación' }).click();
  await page.getByLabel('Enlace de invitación').fill('esto no es un enlace');
  await page.getByRole('dialog').getByRole('button', { name: 'Continuar' }).click();

  await expect(page.getByText(/No encontramos un clan en ese enlace/)).toBeVisible();
});

test('should show the clans link in the sidebar navigation', async ({ page }) => {
  await mockStudentSession(page);
  await mockClansApi(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/clans');

  await expect(page.getByRole('link', { name: 'Clanes' }).first()).toBeVisible();
});
