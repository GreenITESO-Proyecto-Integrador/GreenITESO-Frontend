import { expect, test, type Page } from '@playwright/test';

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
  await mockCatalog(page);
  await page.goto('/actions/register');

  await expect(page.getByRole('heading', { name: 'Registrar acción' })).toBeVisible();
  await page.getByRole('button', { name: 'Registrar' }).click();
  await expect(page.getByText('Selecciona una acción del catálogo.')).toBeVisible();
});

test('should reject photographic evidence larger than 5MB', async ({ page }) => {
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
  await mockCatalog(page);
  await page.goto('/actions/register');
  await expect(page.getByRole('option', { name: /Usar termo reutilizable/ })).toBeAttached();

  await page.getByLabel('Acción').selectOption('33333333-3333-3333-3333-333333333333');
  await page.getByRole('button', { name: 'Registrar' }).click();

  await expect(page.getByText('Esta acción requiere evidencia fotográfica.')).toBeVisible();
});

test('should show an error when the catalog GET fails', async ({ page }) => {
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
