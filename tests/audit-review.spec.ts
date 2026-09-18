import { expect, test, type Page } from '@playwright/test';

const pendingQueueUrl = '**/api/v1/action-logs**';

const pendingLogs = [
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    status: 'PENDING_AUDIT',
    points_awarded: 5,
    evidence_object_key: 'evidence/termo.jpg',
    created_at: '2026-09-18T12:00:00Z',
    action: {
      id: '33333333-3333-3333-3333-333333333333',
      code: 'reusable_bottle',
      name: 'Usar termo reutilizable',
    },
    user: { id: 'user-1' },
  },
];

/**
 * Stub intercept for the pending audit queue during Playwright runs.
 */
async function mockPendingQueue(page: Page, body: unknown, status = 200) {
  await page.route(pendingQueueUrl, async route => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }

    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
}

test('should list pending evidence with approve and reject controls', async ({ page }) => {
  await mockPendingQueue(page, { results: pendingLogs });
  await page.goto('/audit');

  await expect(page.getByRole('heading', { name: 'Panel de revisión' })).toBeVisible();
  await expect(page.getByText('Usar termo reutilizable')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Aprobar' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Rechazar' })).toBeVisible();
});

test('should show an error when the audit queue GET fails', async ({ page }) => {
  await mockPendingQueue(page, { detail: 'Service unavailable' }, 500);
  await page.goto('/audit');

  await expect(
    page.getByRole('heading', { name: 'No se pudo cargar la cola de auditoría' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible();
});

test('should require a rejection reason before rejecting evidence', async ({ page }) => {
  await mockPendingQueue(page, { results: pendingLogs });
  await page.goto('/audit');

  await page.getByRole('button', { name: 'Rechazar' }).click();
  await expect(page.getByText('Indica el motivo del rechazo.')).toBeVisible();
});

test('should remove an item after a successful approve request', async ({ page }) => {
  await mockPendingQueue(page, { results: pendingLogs });
  await page.route('**/api/v1/action-logs/**/approve/', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  await page.goto('/audit');
  await page.getByRole('button', { name: 'Aprobar' }).click();

  await expect(page.getByText('Usar termo reutilizable')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'No hay evidencias pendientes' })).toBeVisible();
});
