import { expect, test, type Page } from '@playwright/test';
import { mockStudentSession } from './helpers/auth';

const profileData = {
  user_id: 'user-uuid-123',
  email: 'usuario.test@iteso.mx',
  first_name: 'Mariana',
  last_name: 'García',
  role: 'STUDENT',
  visibility: 'PUBLIC',
  total_points: 0,
  available_points: 0,
  current_streak: 0,
  level: 1,
  badges: [],
  impact_metrics: { co2_kg: '0', water_liters: '0', plastic_kg: '0' },
  finished_campaigns: [],
  bio: '',
  avatar_url: '',
  institutional_clan: null,
  active_private_clan: null,
};

function actionLog(id: string, name: string, status: string, points: number, co2 = '0.000') {
  return {
    id,
    action: { id: `action-${id}`, code: `CODE_${id}`, name, validation_type: 'PHOTO' },
    status,
    points_awarded: points,
    co2_kg_factor_snapshot: co2,
    water_liters_factor_snapshot: '0.000',
    plastic_kg_factor_snapshot: '0.000',
    has_evidence: true,
    is_shared_publicly: false,
    rejection_reason: '',
    created_at: '2026-10-15T10:00:00Z',
  };
}

const allLogs = [
  actionLog('1', 'Usar termo reutilizable', 'APPROVED', 50, '1.250'),
  actionLog('2', 'Separar residuos', 'PENDING_AUDIT', 0),
  actionLog('3', 'Ir en bicicleta', 'REJECTED', 0),
];

/** Mock the profile and `GET /action-logs/mine/`, filtering by `?status=` like the backend. */
async function mockProfileWithHistory(
  page: Page,
  logs: ReturnType<typeof actionLog>[] = allLogs,
  requestedStatuses: (string | null)[] = [],
) {
  await mockStudentSession(page, { id: profileData.user_id, email: profileData.email });
  await page.route('**/api/v1/profile/me/**', route => route.fulfill({ json: profileData }));
  await page.route('**/api/v1/action-logs/mine/**', route => {
    const status = new URL(route.request().url()).searchParams.get('status');
    requestedStatuses.push(status);
    const results = status ? logs.filter(log => log.status === status) : logs;
    return route.fulfill({
      json: { count: results.length, next: null, previous: null, results },
    });
  });
}

test.describe('Profile action history', () => {
  test('lists logs with translated status, points and CO2', async ({ page }) => {
    await mockProfileWithHistory(page);
    await page.goto('/profile');

    const section = page.getByRole('region', { name: 'Historial de Acciones' });
    const items = section.getByRole('listitem');
    await expect(items).toHaveCount(3);

    const first = items.filter({ hasText: 'Usar termo reutilizable' });
    await expect(first.getByText('Aprobado')).toBeVisible();
    await expect(first.getByText('50 pts')).toBeVisible();
    await expect(first.getByText('1.25 kg CO₂')).toBeVisible();
    await expect(first.getByText('15 de octubre de 2026')).toBeVisible();

    await expect(
      items.filter({ hasText: 'Separar residuos' }).getByText('Pendiente'),
    ).toBeVisible();
    await expect(items.filter({ hasText: 'Ir en bicicleta' }).getByText('Rechazado')).toBeVisible();
  });

  test('filters through the backend and keeps the filter usable when empty', async ({ page }) => {
    // No PENDING_AUDIT log, so that filter returns an empty list.
    const logs = [
      actionLog('1', 'Usar termo reutilizable', 'APPROVED', 50, '1.250'),
      actionLog('3', 'Ir en bicicleta', 'REJECTED', 0),
      actionLog('4', 'Apagar luces', 'APPROVED', 10),
    ];
    const requestedStatuses: (string | null)[] = [];
    await mockProfileWithHistory(page, logs, requestedStatuses);
    await page.goto('/profile');

    const section = page.getByRole('region', { name: 'Historial de Acciones' });
    const filter = section.getByRole('combobox', { name: 'Filtrar acciones por estado' });
    await expect(section.getByRole('listitem')).toHaveCount(3);

    await filter.selectOption('APPROVED');
    await expect(section.getByRole('listitem')).toHaveCount(2);
    expect(requestedStatuses).toContain('APPROVED');

    await filter.selectOption('PENDING_AUDIT');
    await expect(section.getByText('No tienes acciones pendientes de revisión.')).toBeVisible();

    // The select stays on screen, so the user can go back to all logs.
    await filter.selectOption('ALL');
    await expect(section.getByRole('listitem')).toHaveCount(3);
  });

  test('shows a Spanish error message when the request fails', async ({ page }) => {
    await mockProfileWithHistory(page);
    await page.route('**/api/v1/action-logs/mine/**', route =>
      route.fulfill({ status: 500, json: { detail: 'boom' } }),
    );
    await page.goto('/profile');

    const section = page.getByRole('region', { name: 'Historial de Acciones' });
    await expect(section.getByRole('alert')).toHaveText(
      'El servidor tuvo un problema. Inténtalo de nuevo más tarde.',
    );
    await expect(section.getByRole('combobox')).toBeVisible();
  });
});
