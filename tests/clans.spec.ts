import { expect, test, type Page } from '@playwright/test';
import { mockStudentSession } from './helpers/auth';
import { PIXEL_PNG } from './helpers/images';

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
  /** Pending join requests (leader view) by clan id. Accepting or rejecting removes one. */
  requests?: Record<string, Json[]>;
  /** Campaigns the campaigns endpoints answer with; `target_clan` and `is_active` filter them. */
  campaigns?: Json[];
  failOn?: Record<string, { status: number; body: unknown }>;
}

/**
 * Stubs every /api/v1 call used by the clans pages and records the mutations.
 */
async function mockClansApi(page: Page, seed: ApiSeed = {}) {
  const calls: Call[] = [];
  const campaignQueries: URLSearchParams[] = [];
  const clans = seed.clans ?? [ECO_CLAN, RIO_CLAN];
  const details = seed.details ?? {};
  const hidden = new Set(seed.hidden ?? []);
  const pending: Record<string, Json[]> = { ...(seed.requests ?? {}) };

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

    if (path === '/campaigns/' && method === 'GET') {
      campaignQueries.push(url.searchParams);
      const targetClan = url.searchParams.get('target_clan');
      const activeOnly = url.searchParams.get('is_active') === 'true';
      await json(200, {
        results: (seed.campaigns ?? []).filter(
          item =>
            (!targetClan || item.target_clan === targetClan) &&
            (!activeOnly || item.status === 'IN_PROGRESS'),
        ),
        next: null,
      });
      return;
    }
    const campaignOne = path.match(/^\/campaigns\/([^/]+)\/$/);
    if (campaignOne && method === 'GET') {
      const found = (seed.campaigns ?? []).find(item => item.id === campaignOne[1]);
      await json(found ? 200 : 404, found ?? { detail: 'Not found.' });
      return;
    }

    const listed = path.match(/^\/clans\/([^/]+)\/requests\/$/);
    if (listed && method === 'GET') {
      await json(200, pending[listed[1]] ?? []);
      return;
    }

    const decision = path.match(/^\/clans\/([^/]+)\/(accept|reject)-request\/$/);
    if (decision && method === 'POST') {
      const [, clanId, verdict] = decision;
      const request = (pending[clanId] ?? []).find(
        item => (item.user as Json).id === body?.applicant_id,
      );
      if (!request) {
        await json(400, { applicant_id: 'No pending join request from this user.' });
        return;
      }
      pending[clanId] = pending[clanId].filter(item => item !== request);
      if (verdict === 'accept' && details[clanId]) {
        const applicant = request.user as Json;
        const roster = [
          ...(details[clanId].members as Json[]),
          {
            ...member(String(applicant.id), String(applicant.nickname), 'MEMBER'),
            display_name: applicant.display_name,
          },
        ];
        details[clanId] = { ...details[clanId], members: roster, member_count: roster.length };
      }
      await json(200, {
        id: String(request.id),
        clan: clanId,
        user: (request.user as Json).id,
        role: 'MEMBER',
        status: verdict === 'accept' ? 'ACCEPTED' : 'REJECTED',
        is_active_private: false,
        joined_at: request.joined_at,
      });
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

  return { calls, campaignQueries };
}

const MEMBER_DETAIL = detail(ECO_CLAN, [
  member('leader-1', 'Ana Líder', 'LEADER'),
  member(ME, 'Usuario Prueba', 'MEMBER'),
]);

const LEADER_DETAIL = detail(ECO_CLAN, [
  member(ME, 'Usuario Prueba', 'LEADER'),
  member('member-2', 'Luis Miembro', 'MEMBER'),
]);

const INVITE_CLAN = { ...ECO_CLAN, privacy: 'PRIVATE_INVITE' };
const INVITE_LEADER_DETAIL = detail(INVITE_CLAN, [
  member(ME, 'Usuario Prueba', 'LEADER'),
  member('member-2', 'Luis Miembro', 'MEMBER'),
]);

/** A pending request as the backend serializes it; `displayName` falls back to the nickname. */
function joinRequest(userId: string, nickname: string, displayName = nickname): Json {
  return {
    id: `req-${userId}`,
    clan_id: 'clan-eco',
    user: { id: userId, nickname, display_name: displayName },
    role: 'MEMBER',
    status: 'PENDING',
    joined_at: '2026-10-18T12:00:00Z',
  };
}

/** Raw campaign as the API returns it. */
function clanCampaign(overrides: Json): Json {
  return {
    id: 'camp-eco',
    title: 'Reto Eco',
    description: 'Solo para el clan',
    scope: 'PRIVATE',
    status: 'IN_PROGRESS',
    approval_status: 'APPROVED',
    creator: 'leader-1',
    target_clan: 'clan-eco',
    target_clan_name: 'Eco Warriors',
    start_date: '2026-10-01T00:00:00Z',
    end_date: '2026-12-31T23:59:59Z',
    created_at: '2026-09-20T00:00:00Z',
    is_participant: false,
    can_manage: false,
    missions: [],
    user_mission_progress: [],
    participants: [],
    ...overrides,
  };
}

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

test("should show each member's profile photo, or their initials without one", async ({ page }) => {
  await mockStudentSession(page);
  await page.route('https://images.greeniteso.test/**', route =>
    route.fulfill({ status: 200, contentType: 'image/png', body: PIXEL_PNG }),
  );
  await mockClansApi(page, {
    details: {
      'clan-eco': detail(ECO_CLAN, [
        {
          ...member('leader-1', 'Ana Líder', 'LEADER'),
          avatar_url: 'https://images.greeniteso.test/ana.png',
        },
        member(ME, 'Usuario Prueba', 'MEMBER'),
      ]),
    },
  });
  await page.goto('/clans/clan-eco');

  const members = page.getByRole('region', { name: /Miembros/ });
  await expect(members.getByRole('img', { name: 'Ana Líder' })).toHaveAttribute(
    'src',
    'https://images.greeniteso.test/ana.png',
  );
  await expect(members.getByText('UP', { exact: true })).toBeVisible();
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

test('should not show the leave notice again after reloading the list', async ({ page }) => {
  await mockStudentSession(page);
  await mockClansApi(page, { details: { 'clan-eco': MEMBER_DETAIL } });
  await page.goto('/clans/clan-eco');

  await page.getByRole('button', { name: 'Salir del clan' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Salir del clan' }).click();
  await expect(page.getByText('Saliste de Eco Warriors.')).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Clanes', exact: true })).toBeVisible();
  await expect(page.getByText('Saliste de Eco Warriors.')).toHaveCount(0);
});

test('should send a single create request when submit is double clicked', async ({ page }) => {
  await mockStudentSession(page);
  await mockClansApi(page);
  let posts = 0;
  // Registered after the shared mock, so it wins for POST /clans/ and answers slowly enough
  // for the second click to arrive while the first request is still in flight.
  await page.route(/\/api\/v1\/clans\/$/, async route => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }
    posts += 1;
    await new Promise(resolve => setTimeout(resolve, 300));
    await route.fulfill({
      status: 201,
      headers: CORS_HEADERS,
      contentType: 'application/json',
      body: JSON.stringify({ ...ECO_CLAN, id: 'clan-new', name: 'Mi Clan' }),
    });
  });
  await page.goto('/clans');

  await page.getByRole('button', { name: 'Crear clan' }).first().click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nombre').fill('Mi Clan');
  await dialog.getByRole('button', { name: 'Crear clan' }).dblclick();

  await expect(page).toHaveURL(/\/clans\/clan-new$/);
  expect(posts).toBe(1);
});

test('should keep the profile when a background refresh fails', async ({ page }) => {
  await mockStudentSession(page);
  await mockClansApi(page, { details: { 'clan-eco': MEMBER_DETAIL } });
  let failRefresh = false;
  // Registered after the shared mock, so it wins once `failRefresh` is switched on.
  await page.route(/\/api\/v1\/clans\/clan-eco\/$/, async route => {
    if (route.request().method() !== 'GET' || !failRefresh) {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 500,
      headers: CORS_HEADERS,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'boom' }),
    });
  });
  await page.goto('/clans/clan-eco');
  await expect(page.getByRole('heading', { name: 'Eco Warriors' })).toBeVisible();
  failRefresh = true;

  await page.getByRole('button', { name: 'Establecer como clan activo' }).click();

  await expect(page.getByText('Eco Warriors es ahora tu clan activo.')).toBeVisible();
  await expect(page.getByText(/No se pudo actualizar el clan/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Eco Warriors' })).toBeVisible();
  await expect(page.getByText('Ana Líder')).toBeVisible();
  await expect(page.getByText('No se pudo cargar el clan')).toHaveCount(0);
});

test('should not reload the clan when copying the invite link', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await mockStudentSession(page);
  await mockClansApi(page, { details: { 'clan-eco': MEMBER_DETAIL } });
  let detailLoads = 0;
  await page.route(/\/api\/v1\/clans\/clan-eco\/$/, async route => {
    if (route.request().method() === 'GET') detailLoads += 1;
    await route.fallback();
  });
  await page.goto('/clans/clan-eco');
  await expect(page.getByRole('heading', { name: 'Eco Warriors' })).toBeVisible();
  const loadsBefore = detailLoads;

  await page.getByRole('button', { name: 'Copiar enlace de invitación' }).click();

  await expect(page.getByText(/Enlace copiado/)).toBeVisible();
  expect(detailLoads).toBe(loadsBefore);
});

test('should keep the confirm dialog open while the request is in flight', async ({ page }) => {
  await mockStudentSession(page);
  await mockClansApi(page, { details: { 'clan-eco': LEADER_DETAIL } });
  let deletes = 0;
  await page.route(/\/api\/v1\/clans\/clan-eco\/$/, async route => {
    if (route.request().method() !== 'DELETE') {
      await route.fallback();
      return;
    }
    deletes += 1;
    await new Promise(resolve => setTimeout(resolve, 1500));
    await route.fulfill({ status: 204, headers: CORS_HEADERS });
  });
  await page.goto('/clans/clan-eco');

  await page.getByRole('button', { name: 'Disolver clan' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Disolver clan' }).click();
  await expect(dialog.getByRole('button', { name: 'Disolviendo…' })).toBeDisabled();

  // The disabled button loses focus, so put it back inside the dialog for Esc to reach it.
  await dialog.focus();
  await page.keyboard.press('Escape');
  // A closing dialog stays in the DOM during its exit animation, so check that its body
  // (still showing the pending state) was not unmounted.
  await page.waitForTimeout(300);
  await expect(dialog.getByRole('button', { name: 'Disolviendo…' })).toBeVisible();

  await expect(page).toHaveURL(/\/clans$/);
  await expect(page.getByText('Eco Warriors se disolvió.')).toBeVisible();
  expect(deletes).toBe(1);
});

test('should label members without a nickname by their display name', async ({ page }) => {
  await mockStudentSession(page);
  const unnamed = detail(ECO_CLAN, [
    { ...member(ME, '', 'LEADER'), display_name: 'Usuario Prueba' },
    { ...member('member-2', '', 'MEMBER'), display_name: 'Luisa Pérez' },
  ]);
  await mockClansApi(page, { details: { 'clan-eco': unnamed } });
  await page.goto('/clans/clan-eco');

  await expect(page.getByText('Luisa Pérez')).toBeVisible();
  await expect(page.getByText('Miembro sin apodo')).toHaveCount(0);

  await page.getByRole('button', { name: 'Transferir liderazgo' }).click();
  await page.getByRole('dialog').getByLabel('Nuevo líder').click();
  await expect(page.getByRole('option', { name: 'Luisa Pérez' })).toBeVisible();
});

test('should show the leader the pending join requests', async ({ page }) => {
  await mockStudentSession(page);
  await mockClansApi(page, {
    details: { 'clan-eco': INVITE_LEADER_DETAIL },
    requests: {
      'clan-eco': [
        joinRequest('user-ana', 'Ana Solicita'),
        joinRequest('user-luisa', '', 'Luisa Pérez'),
        joinRequest('user-sin', '', ''),
      ],
    },
  });
  await page.goto('/clans/clan-eco');

  await expect(page.getByRole('heading', { name: 'Solicitudes pendientes (3)' })).toBeVisible();
  await expect(page.getByText('Ana Solicita')).toBeVisible();
  await expect(page.getByText('Luisa Pérez')).toBeVisible();
  await expect(page.getByText('Miembro sin apodo')).toBeVisible();
  await expect(page.getByText('Solicitó el 18 de octubre de 2026').first()).toBeVisible();
});

test('should not show or load the pending requests for a regular member', async ({ page }) => {
  await mockStudentSession(page);
  const requested: string[] = [];
  page.on('request', request => {
    if (request.url().includes('/requests/')) requested.push(request.url());
  });
  await mockClansApi(page, {
    details: { 'clan-eco': { ...MEMBER_DETAIL, privacy: 'PRIVATE_INVITE' } },
  });
  await page.goto('/clans/clan-eco');

  await expect(page.getByRole('heading', { name: 'Miembros (2)' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Solicitudes pendientes/ })).toHaveCount(0);
  expect(requested).toEqual([]);
});

test('should accept a request and add the person to the roster', async ({ page }) => {
  await mockStudentSession(page);
  const { calls } = await mockClansApi(page, {
    details: { 'clan-eco': INVITE_LEADER_DETAIL },
    requests: { 'clan-eco': [joinRequest('user-ana', 'Ana Solicita')] },
  });
  await page.goto('/clans/clan-eco');

  await page.getByRole('button', { name: 'Aceptar solicitud de Ana Solicita' }).click();

  await expect(page.getByText('Ana Solicita ya es parte del clan.')).toBeVisible();
  await expect(page.getByText('No hay solicitudes pendientes.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Miembros (3)' })).toBeVisible();
  expect(calls.find(call => call.path === '/clans/clan-eco/accept-request/')?.body).toEqual({
    applicant_id: 'user-ana',
  });
});

test('should reject a request without touching the roster', async ({ page }) => {
  await mockStudentSession(page);
  const { calls } = await mockClansApi(page, {
    details: { 'clan-eco': INVITE_LEADER_DETAIL },
    requests: {
      'clan-eco': [joinRequest('user-ana', 'Ana Solicita'), joinRequest('user-beto', 'Beto')],
    },
  });
  await page.goto('/clans/clan-eco');

  await page.getByRole('button', { name: 'Rechazar solicitud de Ana Solicita' }).click();

  await expect(page.getByText('Rechazaste la solicitud de Ana Solicita.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Solicitudes pendientes (1)' })).toBeVisible();
  await expect(page.getByRole('button', { name: /solicitud de Ana Solicita/ })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Miembros (2)' })).toBeVisible();
  expect(calls.find(call => call.path === '/clans/clan-eco/reject-request/')?.body).toEqual({
    applicant_id: 'user-ana',
  });
});

test('should show an empty state for an invite-only clan with no requests', async ({ page }) => {
  await mockStudentSession(page);
  await mockClansApi(page, { details: { 'clan-eco': INVITE_LEADER_DETAIL } });
  await page.goto('/clans/clan-eco');

  await expect(page.getByRole('heading', { name: 'Solicitudes pendientes (0)' })).toBeVisible();
  await expect(page.getByText('No hay solicitudes pendientes.')).toBeVisible();
});

test('should hide the requests section of a public clan with none pending', async ({ page }) => {
  await mockStudentSession(page);
  await mockClansApi(page, { details: { 'clan-eco': LEADER_DETAIL } });
  await page.goto('/clans/clan-eco');

  await expect(page.getByRole('heading', { name: 'Miembros (2)' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Solicitudes pendientes/ })).toHaveCount(0);
});

test('should keep the request and explain when the applicant is at the clan limit', async ({
  page,
}) => {
  await mockStudentSession(page);
  await mockClansApi(page, {
    details: { 'clan-eco': INVITE_LEADER_DETAIL },
    requests: { 'clan-eco': [joinRequest('user-ana', 'Ana Solicita')] },
    failOn: {
      'POST /clans/clan-eco/accept-request/': {
        status: 400,
        body: ['User already belongs to 5 private clans (BR-04).'],
      },
    },
  });
  await page.goto('/clans/clan-eco');

  await page.getByRole('button', { name: 'Aceptar solicitud de Ana Solicita' }).click();

  await expect(page.getByRole('alert')).toHaveText(
    'Esta persona ya está en el máximo de clanes privados y no puede unirse a otro.',
  );
  await expect(page.getByText('Ana Solicita', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Aceptar solicitud de Ana Solicita' }),
  ).toBeEnabled();
});

test('should offer a retry when the requests fail to load', async ({ page }) => {
  await mockStudentSession(page);
  await mockClansApi(page, {
    details: { 'clan-eco': INVITE_LEADER_DETAIL },
    failOn: { 'GET /clans/clan-eco/requests/': { status: 500, body: { detail: 'Boom' } } },
  });
  await page.goto('/clans/clan-eco');

  await expect(page.getByText(/No se pudieron cargar las solicitudes/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Eco Warriors' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible();
});

test('should show members the active campaigns of their clan', async ({ page }) => {
  await mockStudentSession(page);
  const { campaignQueries } = await mockClansApi(page, {
    details: { 'clan-eco': MEMBER_DETAIL },
    campaigns: [
      clanCampaign({}),
      clanCampaign({ id: 'camp-soon', title: 'Reto Próximo', status: 'PROMOTION' }),
      clanCampaign({
        id: 'camp-rio',
        title: 'Reto Río',
        target_clan: 'clan-rio',
        target_clan_name: 'Clan Río',
      }),
    ],
  });
  await page.goto('/clans/clan-eco');

  await expect(page.getByRole('heading', { name: 'Campañas activas' })).toBeVisible();
  const card = page.getByRole('button', { name: /Reto Eco/ });
  await expect(card).toContainText('Clan · Eco Warriors');
  await expect(page.getByRole('button', { name: /Reto Próximo/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Reto Río/ })).toHaveCount(0);
  expect(
    campaignQueries.some(
      query => query.get('target_clan') === 'clan-eco' && query.get('is_active') === 'true',
    ),
  ).toBe(true);

  await card.click();
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Reto Eco' })).toBeVisible();
});

test('should show an empty state when the clan has no active campaigns', async ({ page }) => {
  await mockStudentSession(page);
  await mockClansApi(page, { details: { 'clan-eco': MEMBER_DETAIL } });
  await page.goto('/clans/clan-eco');

  await expect(page.getByRole('heading', { name: 'Campañas activas' })).toBeVisible();
  await expect(page.getByText('Sin campañas activas')).toBeVisible();
});

test('should not load clan campaigns for someone who is not a member', async ({ page }) => {
  await mockStudentSession(page);
  const { campaignQueries } = await mockClansApi(page, {
    details: { 'clan-eco': detail(ECO_CLAN, [member('leader-1', 'Ana Líder', 'LEADER')]) },
    campaigns: [clanCampaign({})],
  });
  await page.goto('/clans/clan-eco');

  await expect(page.getByRole('heading', { name: 'Miembros (1)' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Campañas activas' })).toHaveCount(0);
  expect(campaignQueries).toEqual([]);
});
