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
      description: 'Desplazamientos sustentables',
      icon: 'leaf',
    },
    name: 'Llegar en bicicleta',
    description: 'Usa la bici para ir al campus y evita emisiones.',
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
      description: 'Reducción de plásticos',
      icon: 'recycle',
    },
    name: 'Usar termo reutilizable',
    description: 'Llena tu termo en los bebederos del campus.',
    points: 5,
    daily_limit: 2,
    validation_type: 'PHOTO',
    co2_kg_factor: '0.000',
    water_liters_factor: '0.000',
    plastic_kg_factor: '0.050',
    is_active: true,
  },
];

async function mockCatalog(page: Page, body: unknown, status = 200) {
  await page.route(catalogEndpoint, async route => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
}

test('should render sustainable action cards from the catalog endpoint', async ({ page }) => {
  await mockCatalog(page, { results: sampleActions });
  await page.goto('/actions');

  await expect(page.getByRole('heading', { name: 'Catálogo de acciones' })).toBeVisible();
  await expect(page.getByText('Llegar en bicicleta')).toBeVisible();
  await expect(page.getByText('Usar termo reutilizable')).toBeVisible();
  await expect(page.getByText('10 pts')).toBeVisible();
  await expect(page.getByText('5 pts')).toBeVisible();
});

test('should show mock catalog cards when the catalog endpoint fails', async ({ page }) => {
  await mockCatalog(page, { detail: 'Service unavailable' }, 500);
  await page.goto('/actions');

  await expect(page.getByRole('heading', { name: 'Vista de ejemplo' })).toBeVisible();
  await expect(page.getByText('Llegar en bicicleta')).toBeVisible();
  await expect(page.getByText('Usar termo reutilizable')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible();
});
