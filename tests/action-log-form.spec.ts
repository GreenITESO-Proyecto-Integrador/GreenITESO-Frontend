import { expect, test, type Page } from '@playwright/test';
import { mockStudentSession } from './helpers/auth';

const catalogEndpoint = '**/api/v1/actions/**';

const sampleActions = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    code: 'bike_to_campus',
    category: {
      id: '22222222-2222-2222-2222-222222222222',
      code: 'mobility',
      name: 'Movilidad',
      description: '',
      icon: 'leaf',
    },
    name: 'Llegar en bicicleta',
    description: 'Usa la bici para ir al campus.',
    points: 10,
    daily_limit: 1,
    validation_type: 'NONE',
    co2_kg_factor: '0.400',
    water_liters_factor: '0.000',
    plastic_kg_factor: '0.000',
    is_active: true,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    code: 'reusable_bottle',
    category: {
      id: '44444444-4444-4444-4444-444444444444',
      code: 'waste',
      name: 'Residuos',
      description: '',
      icon: 'recycle',
    },
    name: 'Usar termo reutilizable',
    description: 'Llena tu termo en el campus.',
    points: 5,
    daily_limit: 2,
    validation_type: 'PHOTO',
    co2_kg_factor: '0.000',
    water_liters_factor: '0.000',
    plastic_kg_factor: '0.050',
    is_active: true,
  },
];

/**
 * Stub intercept for GET /api/v1/actions/ during Playwright runs.
 */
async function mockCatalog(page: Page) {
  await page.route(catalogEndpoint, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ results: sampleActions }),
    });
  });
}

test('should require an action before submitting the registration form', async ({ page }) => {
  await mockStudentSession(page);
  await mockCatalog(page);
  await page.goto('/actions/register');

  await expect(page.getByRole('heading', { name: 'Registrar acción' })).toBeVisible();
  await page.getByRole('button', { name: 'Registrar' }).click();
  await expect(page.getByText('Selecciona una acción del catálogo.')).toBeVisible();
});

test('should reject photographic evidence larger than 5MB', async ({ page }) => {
  await mockStudentSession(page);
  await mockCatalog(page);
  await page.goto('/actions/register');
  await expect(page.getByRole('option', { name: /Llegar en bicicleta/ })).toBeAttached();

  await page.getByLabel('Acción').selectOption('11111111-1111-1111-1111-111111111111');
  await page.getByLabel(/Evidencia fotográfica/).setInputFiles({
    name: 'evidence.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
  });
  await page.getByRole('button', { name: 'Registrar' }).click();

  await expect(page.getByText('La evidencia no puede superar 5 MB.')).toBeVisible();
});

test('should require a photo when the selected action uses PHOTO validation', async ({ page }) => {
  await mockStudentSession(page);
  await mockCatalog(page);
  await page.goto('/actions/register');
  await expect(page.getByRole('option', { name: /Usar termo reutilizable/ })).toBeAttached();

  await page.getByLabel('Acción').selectOption('33333333-3333-3333-3333-333333333333');
  await page.getByRole('button', { name: 'Registrar' }).click();

  await expect(page.getByText('Esta acción requiere evidencia fotográfica.')).toBeVisible();
});

test('should show an error when the catalog GET fails', async ({ page }) => {
  await mockStudentSession(page);
  await page.route(catalogEndpoint, async route => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'Service unavailable' }),
    });
  });
  await page.goto('/actions/register');

  await expect(page.getByRole('heading', { name: 'No se pudo cargar el catálogo' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible();
});

test('should register a catalog action and show the credited points', async ({ page }) => {
  await mockStudentSession(page);
  await mockCatalog(page);
  let body: unknown;
  await page.route('**/api/v1/action-logs/**', async route => {
    body = route.request().postDataJSON();
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        message: 'Action logged successfully.',
        status: 'APPROVED',
        log_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      }),
    });
  });
  await page.goto('/actions/register');
  await expect(page.getByRole('option', { name: /Llegar en bicicleta/ })).toBeAttached();

  await page.getByLabel('Acción').selectOption('11111111-1111-1111-1111-111111111111');
  await page.getByRole('button', { name: 'Registrar' }).click();

  await expect(page.getByRole('heading', { name: 'Acción registrada' })).toBeVisible();
  await expect(page.getByText('Los puntos ya se acreditaron.')).toBeVisible();
  expect(body).toMatchObject({
    action_id: '11111111-1111-1111-1111-111111111111',
  });
  expect(body).toHaveProperty('idempotency_key');
  expect(body).not.toHaveProperty('evidence_object_key');
});

test('should upload the photo as multipart evidence and mark it pending audit', async ({
  page,
}) => {
  await mockStudentSession(page);
  await mockCatalog(page);
  let contentType = '';
  let raw = '';
  await page.route('**/api/v1/action-logs/**', async route => {
    contentType = route.request().headers()['content-type'] ?? '';
    raw = route.request().postDataBuffer()?.toString('latin1') ?? '';
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        message: 'Action logged successfully.',
        status: 'PENDING_AUDIT',
        log_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      }),
    });
  });
  await page.goto('/actions/register');
  await expect(page.getByRole('option', { name: /Usar termo reutilizable/ })).toBeAttached();

  await page.getByLabel('Acción').selectOption('33333333-3333-3333-3333-333333333333');
  await page.getByLabel(/Evidencia fotográfica/).setInputFiles({
    name: 'termo.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.from('photo'),
  });
  await page.getByRole('button', { name: 'Registrar' }).click();

  await expect(page.getByText('Quedó pendiente de auditoría.')).toBeVisible();
  expect(contentType).toMatch(/^multipart\/form-data;\s*boundary=/i);
  expect(raw).toContain('name="action_id"');
  expect(raw).toContain('33333333-3333-3333-3333-333333333333');
  expect(raw).toContain('name="idempotency_key"');
  expect(raw).toContain('name="evidence"');
  expect(raw).toContain('filename="termo.jpg"');
  expect(raw).toContain('photo');
  expect(raw).not.toContain('evidence_object_key');
});

test('should show the photographic evidence error returned by the API', async ({ page }) => {
  await mockStudentSession(page);
  await mockCatalog(page);
  await page.route('**/api/v1/action-logs/**', async route => {
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({
        evidence: ['Esta acción requiere evidencia fotográfica.'],
      }),
    });
  });
  await page.goto('/actions/register');
  await expect(page.getByRole('option', { name: /Usar termo reutilizable/ })).toBeAttached();

  await page.getByLabel('Acción').selectOption('33333333-3333-3333-3333-333333333333');
  await page.getByLabel(/Evidencia fotográfica/).setInputFiles({
    name: 'termo.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.from('photo'),
  });
  await page.getByRole('button', { name: 'Registrar' }).click();

  await expect(page.locator('#evidence-file-error')).toHaveText(
    'Esta acción requiere evidencia fotográfica.',
  );
});

test('should show the daily limit message when the API rejects the log', async ({ page }) => {
  await mockStudentSession(page);
  await mockCatalog(page);
  await page.route('**/api/v1/action-logs/**', async route => {
    await route.fulfill({
      status: 429,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Daily limit reached for this action.' }),
    });
  });
  await page.goto('/actions/register');
  await expect(page.getByRole('option', { name: /Llegar en bicicleta/ })).toBeAttached();

  await page.getByLabel('Acción').selectOption('11111111-1111-1111-1111-111111111111');
  await page.getByRole('button', { name: 'Registrar' }).click();

  await expect(page.getByText('Ya alcanzaste el límite diario de esta acción.')).toBeVisible();
});

test('should preselect the action from the query string', async ({ page }) => {
  await mockStudentSession(page);
  await mockCatalog(page);
  await page.goto('/actions/register?action=bike_to_campus');

  await expect(page.getByLabel('Acción')).toHaveValue('11111111-1111-1111-1111-111111111111');
});
