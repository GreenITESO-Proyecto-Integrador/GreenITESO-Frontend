import { expect, test, type Page } from '@playwright/test';
import { mockAdminSession, mockStudentSession } from './helpers/auth';

type Json = Record<string, unknown>;

interface Call {
  method: string;
  path: string;
  query: URLSearchParams;
  body: Json | null;
}

interface Failure {
  status: number;
  body?: Json;
}

interface ApiSeed {
  campaigns?: Json[];
  proposals?: Json[];
  clans?: Json[];
  actions?: Json[];
}

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET,POST,PATCH,OPTIONS',
};

const DEFAULT_ACTIONS: Json[] = [
  {
    id: 'action-1',
    code: 'reusable_bottle',
    name: 'Usar termo reutilizable',
    description: 'Evita botellas desechables.',
    points: 5,
    daily_limit: 1,
    validation_type: 'NONE',
    category: { id: 'cat-1', code: 'water', name: 'Agua', description: '', icon: '' },
    is_active: true,
  },
];

const DEFAULT_CLANS: Json[] = [
  { id: 'clan-private', name: 'Clan Reciclaje', type: 'PRIVATE' },
  { id: 'clan-institutional', name: 'ITESO Institucional', type: 'INSTITUTIONAL' },
];

function mission(id: string, name: string, targetCount: number): Json {
  return {
    id,
    action: { code: `code-${id}`, name, points: 5 },
    target_count: targetCount,
  };
}

/** Raw campaign as the API returns it; override only what a test cares about. */
function campaign(overrides: Json): Json {
  return {
    id: 'camp-1',
    title: 'Campaña de prueba',
    description: 'Descripción de prueba',
    scope: 'GLOBAL',
    status: 'IN_PROGRESS',
    approval_status: 'APPROVED',
    creator: 'admin-id',
    target_clan: null,
    start_date: '2026-09-01T00:00:00Z',
    end_date: '2026-12-31T23:59:59Z',
    created_at: '2026-08-20T00:00:00Z',
    is_participant: false,
    can_manage: false,
    missions: [],
    user_mission_progress: [],
    participants: [],
    ...overrides,
  };
}

function proposal(overrides: Json): Json {
  return campaign({
    status: 'PROMOTION',
    approval_status: 'PENDING',
    creator: 'user-9',
    ...overrides,
  });
}

/** `YYYY-MM-DD` a number of days from now, safe for the form's "end in the future" check. */
function isoDate(daysFromNow: number): string {
  return new Date(Date.now() + daysFromNow * 86_400_000).toISOString().slice(0, 10);
}

/**
 * Stateful stub of the campaigns, proposals, clans and actions endpoints.
 * Mutations (join, approve, create...) change the seed so the UI's reload shows the result.
 * Use `fail`/`recover` to make one endpoint answer with an error.
 */
async function mockApi(page: Page, seed: ApiSeed = {}) {
  const campaigns = (seed.campaigns ?? []).map(item => ({ ...item }));
  const proposals = (seed.proposals ?? []).map(item => ({ ...item }));
  const clans = seed.clans ?? DEFAULT_CLANS;
  const actions = seed.actions ?? DEFAULT_ACTIONS;
  const calls: Call[] = [];
  const failures = new Map<string, Failure>();

  await page.route(/\/api\/v1\//, async route => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const path = url.pathname.replace('/api/v1', '');

    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS_HEADERS });
      return;
    }

    let body: Json | null = null;
    try {
      body = request.postDataJSON() as Json | null;
    } catch {
      body = null;
    }
    calls.push({ method, path, query: url.searchParams, body });

    const json = (status: number, payload: unknown) =>
      route.fulfill({
        status,
        headers: CORS_HEADERS,
        contentType: 'application/json',
        body: JSON.stringify(payload),
      });
    const respond = (key: string, status: number, build: () => unknown) => {
      const failure = failures.get(key);
      return failure
        ? json(failure.status, failure.body ?? { detail: 'Boom' })
        : json(status, build());
    };
    const list = (items: Json[]) => ({ results: items });

    const proposalDecision = path.match(/^\/campaigns\/proposals\/([^/]+)\/(approve|reject)\/$/);
    const campaignJoin = path.match(/^\/campaigns\/([^/]+)\/join\/$/);
    const campaignOne = path.match(/^\/campaigns\/([^/]+)\/$/);

    if (path === '/campaigns/proposals/') {
      if (method === 'POST') {
        await respond('POST proposals', 201, () => {
          proposals.push(proposal({ id: 'prop-new', title: String(body?.title ?? '') }));
          return {};
        });
        return;
      }
      await respond('GET proposals', 200, () => {
        const approval = url.searchParams.get('approval_status');
        return list(proposals.filter(item => !approval || item.approval_status === approval));
      });
      return;
    }

    if (proposalDecision && method === 'POST') {
      const [, id, decision] = proposalDecision;
      await respond(`POST ${decision}`, 200, () => {
        const target = proposals.find(item => item.id === id);
        if (target) target.approval_status = decision === 'approve' ? 'APPROVED' : 'REJECTED';
        return {};
      });
      return;
    }

    if (path === '/campaigns/') {
      if (method === 'POST') {
        await respond('POST campaigns', 201, () => {
          campaigns.push(campaign({ id: 'camp-new', title: String(body?.title ?? '') }));
          return {};
        });
        return;
      }
      await respond('GET campaigns', 200, () => {
        const status = url.searchParams.get('status');
        const scope = url.searchParams.get('scope');
        const participating = url.searchParams.get('participating');
        return list(
          campaigns.filter(
            item =>
              (!status || item.status === status) &&
              (!scope || item.scope === scope) &&
              (participating !== 'true' || item.is_participant === true),
          ),
        );
      });
      return;
    }

    if (campaignJoin && method === 'POST') {
      await respond('POST join', 201, () => {
        const target = campaigns.find(item => item.id === campaignJoin[1]);
        if (target) {
          const missions = (target.missions as Json[]) ?? [];
          target.is_participant = true;
          target.participants = [
            {
              user: { id: 'test-user-id' },
              campaign: target.id,
              joined_at: '2026-09-30T00:00:00Z',
            },
          ];
          target.user_mission_progress = missions.map(item => ({
            mission: item.id,
            current_count: 0,
            is_completed: false,
            target_count: item.target_count,
          }));
        }
        return {};
      });
      return;
    }

    if (campaignOne) {
      const target = campaigns.find(item => item.id === campaignOne[1]);
      if (method === 'PATCH') {
        await respond('PATCH campaign', 200, () => {
          if (target && body) {
            Object.assign(target, {
              title: body.title,
              description: body.description,
              start_date: body.start_date,
              end_date: body.end_date,
            });
          }
          return target ?? {};
        });
        return;
      }
      await respond('GET campaign', target ? 200 : 404, () => target ?? { detail: 'Not found.' });
      return;
    }

    if (path === '/clans/') {
      await respond('GET clans', 200, () => list(clans));
      return;
    }
    if (path === '/actions/') {
      await respond('GET actions', 200, () => list(actions));
      return;
    }

    // Anything else (e.g. the audit evidence queue) is just empty.
    await json(200, list([]));
  });

  return {
    fail: (key: string, status = 500, body?: Json) => failures.set(key, { status, body }),
    recover: (key: string) => failures.delete(key),
    callsTo: (method: string, path: string) =>
      calls.filter(call => call.method === method && call.path === path),
  };
}

const dialogOf = (page: Page) => page.getByRole('dialog');
const campaignCard = (page: Page, title: string) =>
  page.getByRole('button', { name: new RegExp(title) });
const statusFilter = (page: Page, name: string) =>
  page.getByRole('group', { name: 'Filtrar campañas por estado' }).getByRole('button', { name });
const scopeFilter = (page: Page, name: string) =>
  page.getByRole('group', { name: 'Filtrar campañas por alcance' }).getByRole('button', { name });

const promotionCampaign = campaign({
  id: 'camp-promo',
  title: 'Semana del Reciclaje',
  status: 'PROMOTION',
  missions: [mission('m-promo', 'Separar residuos', 2)],
});
const activeCampaign = campaign({
  id: 'camp-active',
  title: 'Cero Plástico',
  status: 'IN_PROGRESS',
});
const finishedCampaign = campaign({ id: 'camp-done', title: 'Reto Verano', status: 'FINISHED' });
const privateCampaign = campaign({
  id: 'camp-private',
  title: 'Reto del Clan',
  scope: 'PRIVATE',
  target_clan: 'clan-private',
});

test.describe('Usuario: campañas', () => {
  test.beforeEach(async ({ page }) => {
    await mockStudentSession(page);
  });

  test('should list campaigns and open the detail of one', async ({ page }) => {
    await mockApi(page, { campaigns: [promotionCampaign, activeCampaign] });
    await page.goto('/missions');

    await expect(page.getByRole('heading', { name: 'Misiones y campañas' })).toBeVisible();
    await expect(campaignCard(page, 'Semana del Reciclaje')).toBeVisible();
    await expect(campaignCard(page, 'Cero Plástico')).toBeVisible();

    await campaignCard(page, 'Semana del Reciclaje').click();

    const dialog = dialogOf(page);
    await expect(dialog.getByRole('heading', { name: 'Semana del Reciclaje' })).toBeVisible();
    await expect(dialog.getByText('Descripción de prueba')).toBeVisible();
    await expect(dialog.getByText('Separar residuos')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Unirme' })).toBeVisible();
  });

  test('should filter campaigns by status and scope', async ({ page }) => {
    const api = await mockApi(page, {
      campaigns: [promotionCampaign, activeCampaign, finishedCampaign, privateCampaign],
    });
    await page.goto('/missions');
    await expect(campaignCard(page, 'Reto Verano')).toBeVisible();

    await statusFilter(page, 'Finalizadas').click();
    await expect(campaignCard(page, 'Reto Verano')).toBeVisible();
    await expect(campaignCard(page, 'Cero Plástico')).toHaveCount(0);
    expect(api.callsTo('GET', '/campaigns/').some(c => c.query.get('status') === 'FINISHED')).toBe(
      true,
    );

    await statusFilter(page, 'Todas').click();
    await scopeFilter(page, 'Privadas').click();
    await expect(campaignCard(page, 'Reto del Clan')).toBeVisible();
    await expect(campaignCard(page, 'Reto Verano')).toHaveCount(0);
    expect(api.callsTo('GET', '/campaigns/').some(c => c.query.get('scope') === 'PRIVATE')).toBe(
      true,
    );
  });

  test('should join a campaign in promotion', async ({ page }) => {
    const api = await mockApi(page, { campaigns: [promotionCampaign] });
    await page.goto('/missions');

    await campaignCard(page, 'Semana del Reciclaje').click();
    await dialogOf(page).getByRole('button', { name: 'Unirme' }).click();

    await expect(dialogOf(page).getByText('¡Listo! Te uniste a la campaña.')).toBeVisible();
    await expect(dialogOf(page).getByRole('button', { name: 'Unirme' })).toHaveCount(0);
    expect(api.callsTo('POST', '/campaigns/camp-promo/join/')).toHaveLength(1);
  });

  test('should show the progress of their missions in the dashboard', async ({ page }) => {
    await mockApi(page, {
      campaigns: [
        campaign({
          id: 'camp-mine',
          title: 'Cero Plástico',
          is_participant: true,
          missions: [mission('m1', 'Usar termo reutilizable', 3), mission('m2', 'Reciclar PET', 4)],
          user_mission_progress: [
            { mission: 'm1', current_count: 3, is_completed: true, target_count: 3 },
            { mission: 'm2', current_count: 1, is_completed: false, target_count: 4 },
          ],
        }),
      ],
    });
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Mis campañas' })).toBeVisible();
    await expect(page.getByText('1/2', { exact: true })).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Misiones activas' })).toBeVisible();
    await expect(page.getByText('Usar termo reutilizable')).toBeVisible();
    await expect(page.getByText('3/3', { exact: true })).toBeVisible();
    await expect(page.getByText('1/4', { exact: true })).toBeVisible();

    await campaignCard(page, 'Cero Plástico').click();
    await expect(dialogOf(page).getByText('Reciclar PET')).toBeVisible();
    await expect(dialogOf(page).getByText('1/4', { exact: true })).toBeVisible();
  });

  test('should propose a campaign and list it as pending', async ({ page }) => {
    const api = await mockApi(page, { campaigns: [activeCampaign] });
    await page.goto('/missions');

    await page.getByRole('button', { name: 'Proponer campaña' }).click();
    const dialog = dialogOf(page);
    await dialog.getByLabel('Título', { exact: true }).fill('Día sin plásticos');
    await dialog.getByLabel('Descripción', { exact: true }).fill('Una semana sin plástico.');
    await dialog.getByLabel('Fecha de inicio').fill(isoDate(10));
    await dialog.getByLabel('Fecha de fin').fill(isoDate(30));
    await dialog.getByRole('button', { name: 'Proponer campaña' }).click();

    await expect(
      page.getByText('¡Propuesta enviada! Un administrador la revisará pronto.'),
    ).toBeVisible();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByText('Día sin plásticos')).toBeVisible();
    await expect(page.getByText('Pendiente', { exact: true })).toBeVisible();

    const [call] = api.callsTo('POST', '/campaigns/proposals/');
    expect(call?.body).toMatchObject({
      title: 'Día sin plásticos',
      description: 'Una semana sin plástico.',
      missions: [],
    });
  });
});

test.describe('Líder: campaña privada', () => {
  test('should create a private campaign for a clan', async ({ page }) => {
    await mockStudentSession(page);
    const api = await mockApi(page);
    await page.goto('/missions');

    await page.getByRole('button', { name: 'Crear campaña de clan' }).click();
    const dialog = dialogOf(page);
    await dialog.locator('#campaign-clan').click();
    // Leaders only get PRIVATE clans; institutional ones belong to admins.
    await expect(page.getByRole('option', { name: 'ITESO Institucional' })).toHaveCount(0);
    await page.getByRole('option', { name: 'Clan Reciclaje' }).click();

    await dialog.getByLabel('Título', { exact: true }).fill('Reto del Clan');
    await dialog.getByLabel('Descripción', { exact: true }).fill('Solo para el clan.');
    await dialog.getByLabel('Fecha de inicio').fill(isoDate(10));
    await dialog.getByLabel('Fecha de fin').fill(isoDate(30));
    await dialog.getByRole('button', { name: 'Crear campaña' }).click();

    await expect(page.getByText('¡Campaña creada! Ya está disponible para tu clan.')).toBeVisible();
    const [call] = api.callsTo('POST', '/campaigns/');
    expect(call?.body).toMatchObject({
      title: 'Reto del Clan',
      scope: 'PRIVATE',
      target_clan: 'clan-private',
    });
  });

  test('should show the backend error when the user does not lead the clan', async ({ page }) => {
    await mockStudentSession(page);
    const api = await mockApi(page);
    api.fail('POST campaigns', 403, { detail: 'Only the clan leader can create campaigns.' });
    await page.goto('/missions');

    await page.getByRole('button', { name: 'Crear campaña de clan' }).click();
    const dialog = dialogOf(page);
    await dialog.locator('#campaign-clan').click();
    await page.getByRole('option', { name: 'Clan Reciclaje' }).click();
    await dialog.getByLabel('Título', { exact: true }).fill('Reto del Clan');
    await dialog.getByLabel('Descripción', { exact: true }).fill('Solo para el clan.');
    await dialog.getByLabel('Fecha de inicio').fill(isoDate(10));
    await dialog.getByLabel('Fecha de fin').fill(isoDate(30));
    await dialog.getByRole('button', { name: 'Crear campaña' }).click();

    await expect(dialog.getByRole('alert')).toContainText('Solo el líder de este clan');
  });
});

test.describe('Admin: campañas', () => {
  test.beforeEach(async ({ page }) => {
    await mockAdminSession(page);
  });

  test('should create a global campaign with a mission', async ({ page }) => {
    const api = await mockApi(page);
    await page.goto('/missions');

    await page.getByRole('button', { name: 'Crear campaña' }).click();
    const dialog = dialogOf(page);
    await dialog.getByLabel('Título', { exact: true }).fill('Cero Plástico');
    await dialog.getByLabel('Descripción', { exact: true }).fill('Reducir el uso de plástico.');
    await dialog.getByLabel('Fecha de inicio').fill(isoDate(10));
    await dialog.getByLabel('Fecha de fin').fill(isoDate(30));
    await dialog.getByRole('button', { name: 'Agregar misión' }).click();
    await dialog.locator('#mission-action-1').click();
    await page.getByRole('option', { name: /Usar termo reutilizable/ }).click();
    await dialog.getByLabel('Meta').fill('3');
    await dialog.getByRole('button', { name: 'Crear campaña' }).click();

    await expect(
      page.getByText('¡Campaña creada! Ya está disponible para la comunidad.'),
    ).toBeVisible();
    await expect(campaignCard(page, 'Cero Plástico')).toBeVisible();

    const [call] = api.callsTo('POST', '/campaigns/');
    expect(call?.body).toMatchObject({
      title: 'Cero Plástico',
      scope: 'GLOBAL',
      missions: [{ action_id: 'action-1', target_count: 3 }],
    });
    expect(call?.body).not.toHaveProperty('target_clan');
  });

  test('should approve a pending proposal', async ({ page }) => {
    const api = await mockApi(page, {
      proposals: [
        proposal({ id: 'prop-a', title: 'Propuesta Alfa' }),
        proposal({ id: 'prop-b', title: 'Propuesta Beta' }),
      ],
    });
    await page.goto('/audit?tab=propuestas');

    const card = page.getByRole('listitem').filter({ hasText: 'Propuesta Alfa' });
    await card.getByRole('button', { name: 'Aprobar' }).click();

    await expect(page.getByText('Propuesta aprobada.')).toBeVisible();
    await expect(page.getByText('Propuesta Alfa')).toHaveCount(0);
    await expect(page.getByText('Propuesta Beta')).toBeVisible();
    expect(api.callsTo('POST', '/campaigns/proposals/prop-a/approve/')).toHaveLength(1);
  });

  test('should reject a pending proposal with a reason', async ({ page }) => {
    const api = await mockApi(page, {
      proposals: [proposal({ id: 'prop-a', title: 'Propuesta Alfa' })],
    });
    await page.goto('/audit?tab=propuestas');

    const card = page.getByRole('listitem').filter({ hasText: 'Propuesta Alfa' });
    await card.getByRole('button', { name: 'Rechazar' }).click();
    const confirm = card.getByRole('button', { name: 'Confirmar rechazo' });
    await expect(confirm).toBeDisabled();

    await card.getByLabel('Motivo del rechazo').fill('Ya existe una campaña igual.');
    await confirm.click();

    await expect(page.getByText('Propuesta rechazada.')).toBeVisible();
    const [call] = api.callsTo('POST', '/campaigns/proposals/prop-a/reject/');
    expect(call?.body).toEqual({ rejection_reason: 'Ya existe una campaña igual.' });
  });

  test('should edit a campaign in promotion', async ({ page }) => {
    const api = await mockApi(page, {
      campaigns: [{ ...promotionCampaign, can_manage: true }],
    });
    await page.goto('/missions');

    await campaignCard(page, 'Semana del Reciclaje').click();
    await dialogOf(page).getByRole('button', { name: 'Editar campaña' }).click();
    const title = dialogOf(page).getByLabel('Título', { exact: true });
    await expect(title).toHaveValue('Semana del Reciclaje');
    await title.fill('Mes del Reciclaje');
    await dialogOf(page).getByRole('button', { name: 'Guardar cambios' }).click();

    await expect(
      dialogOf(page).getByText('¡Listo! Los cambios de la campaña se guardaron.'),
    ).toBeVisible();
    await expect(dialogOf(page).getByRole('heading', { name: 'Mes del Reciclaje' })).toBeVisible();
    const [call] = api.callsTo('PATCH', '/campaigns/camp-promo/');
    expect(call?.body).toMatchObject({ title: 'Mes del Reciclaje' });
  });

  test('should not offer editing once the campaign left promotion', async ({ page }) => {
    await mockApi(page, { campaigns: [{ ...activeCampaign, can_manage: true }] });
    await page.goto('/missions');

    await campaignCard(page, 'Cero Plástico').click();
    await expect(dialogOf(page).getByRole('heading', { name: 'Cero Plástico' })).toBeVisible();
    await expect(dialogOf(page).getByRole('button', { name: 'Editar campaña' })).toHaveCount(0);
  });

  test('should not let an admin join a campaign', async ({ page }) => {
    await mockApi(page, { campaigns: [promotionCampaign] });
    await page.goto('/missions');

    await campaignCard(page, 'Semana del Reciclaje').click();
    await expect(
      dialogOf(page).getByRole('heading', { name: 'Semana del Reciclaje' }),
    ).toBeVisible();
    await expect(dialogOf(page).getByRole('button', { name: 'Unirme' })).toHaveCount(0);
  });
});

test.describe('Estados de error y vacío', () => {
  test('should show an error and recover on retry when campaigns fail to load', async ({
    page,
  }) => {
    await mockStudentSession(page);
    const api = await mockApi(page, { campaigns: [activeCampaign] });
    api.fail('GET campaigns');
    await page.goto('/missions');

    await expect(
      page.getByRole('heading', { name: 'No se pudieron cargar las campañas' }),
    ).toBeVisible();

    api.recover('GET campaigns');
    await page.getByRole('button', { name: 'Reintentar' }).first().click();
    await expect(campaignCard(page, 'Cero Plástico')).toBeVisible();
  });

  test('should show the empty state when there are no campaigns', async ({ page }) => {
    await mockStudentSession(page);
    await mockApi(page);
    await page.goto('/missions');

    await expect(page.getByRole('heading', { name: 'No hay campañas' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Aún no has propuesto campañas' }),
    ).toBeVisible();
  });

  test('should show the empty states of the dashboard when the user has no campaigns', async ({
    page,
  }) => {
    await mockStudentSession(page);
    await mockApi(page, { campaigns: [activeCampaign] });
    await page.goto('/');

    await expect(
      page.getByRole('heading', { name: 'Aún no participas en campañas' }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'No tienes misiones activas' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Unirme a una campaña' })).toBeVisible();
  });

  test('should show an error when the campaign detail fails to load', async ({ page }) => {
    await mockStudentSession(page);
    const api = await mockApi(page, { campaigns: [activeCampaign] });
    api.fail('GET campaign');
    await page.goto('/missions');

    await campaignCard(page, 'Cero Plástico').click();
    await expect(
      dialogOf(page).getByRole('heading', { name: 'No se pudo cargar la campaña' }),
    ).toBeVisible();
    await expect(dialogOf(page).getByRole('button', { name: 'Reintentar' })).toBeVisible();
  });

  test('should show an error when joining fails', async ({ page }) => {
    await mockStudentSession(page);
    const api = await mockApi(page, { campaigns: [promotionCampaign] });
    api.fail('POST join', 400, { detail: 'User already joined this campaign.' });
    await page.goto('/missions');

    await campaignCard(page, 'Semana del Reciclaje').click();
    await dialogOf(page).getByRole('button', { name: 'Unirme' }).click();

    await expect(dialogOf(page).getByRole('alert')).toHaveText(
      'Ya estás inscrito en esta campaña.',
    );
  });

  test('should validate the required fields of the campaign form', async ({ page }) => {
    await mockAdminSession(page);
    const api = await mockApi(page);
    await page.goto('/missions');

    await page.getByRole('button', { name: 'Crear campaña' }).click();
    await dialogOf(page).getByRole('button', { name: 'Crear campaña' }).click();

    await expect(dialogOf(page).getByText('Escribe un título.')).toBeVisible();
    await expect(dialogOf(page).getByText('Escribe una descripción.')).toBeVisible();
    await expect(dialogOf(page).getByText('Elige la fecha de inicio.')).toBeVisible();
    await expect(dialogOf(page).getByText('Elige la fecha de fin.')).toBeVisible();
    expect(api.callsTo('POST', '/campaigns/')).toHaveLength(0);
  });

  test('should show the empty state when there are no pending proposals', async ({ page }) => {
    await mockAdminSession(page);
    await mockApi(page);
    await page.goto('/audit?tab=propuestas');

    await expect(page.getByRole('heading', { name: 'No hay propuestas' })).toBeVisible();
  });

  test('should show an error when proposals fail to load', async ({ page }) => {
    await mockAdminSession(page);
    const api = await mockApi(page);
    api.fail('GET proposals');
    await page.goto('/audit?tab=propuestas');

    await expect(
      page.getByRole('heading', { name: 'No se pudieron cargar las propuestas' }),
    ).toBeVisible();
  });

  test('should show an error when approving a proposal fails', async ({ page }) => {
    await mockAdminSession(page);
    const api = await mockApi(page, {
      proposals: [proposal({ id: 'prop-a', title: 'Propuesta Alfa' })],
    });
    api.fail('POST approve');
    await page.goto('/audit?tab=propuestas');

    await page.getByRole('button', { name: 'Aprobar' }).click();

    await expect(page.getByRole('alert')).toContainText('El servidor tuvo un problema');
    await expect(page.getByText('Propuesta Alfa')).toBeVisible();
  });
});
