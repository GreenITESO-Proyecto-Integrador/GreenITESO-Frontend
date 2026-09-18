import { expect, test, type Page } from '@playwright/test';

const usersUrl = '**/api/v1/rankings/users**';
const clansUrl = '**/api/v1/rankings/clans**';

const globalRanking = [
  { id: 'user-1', rank: 1, display_name: 'Ana', total_points: 120 },
  { id: 'user-2', rank: 2, display_name: 'Luis', total_points: 80 },
];

const teamRanking = [
  { id: 'clan-1', rank: 1, name: 'ITESO Verde', total_points: 400 },
  { id: 'clan-2', rank: 2, name: 'Clan Río', total_points: 210 },
];

/**
 * Stub intercept for ranking endpoints during Playwright runs.
 */
async function mockRankings(page: Page) {
  await page.route(usersUrl, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ results: globalRanking }),
    });
  });
  await page.route(clansUrl, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ results: teamRanking }),
    });
  });
}

test('should show the global ranking table by default', async ({ page }) => {
  await mockRankings(page);
  await page.goto('/leaderboard');

  await expect(page.getByRole('heading', { name: 'Tablas de clasificación' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Clasificación Global' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.getByText('Ana')).toBeVisible();
  await expect(page.getByText('120')).toBeVisible();
});

test('should switch to the team ranking tab', async ({ page }) => {
  await mockRankings(page);
  await page.goto('/leaderboard');

  await page.getByRole('tab', { name: 'Clasificación por Equipos' }).click();
  await expect(page.getByRole('tab', { name: 'Clasificación por Equipos' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.getByText('ITESO Verde')).toBeVisible();
  await expect(page.getByText('400')).toBeVisible();
});

test('should show an error when the global ranking GET fails', async ({ page }) => {
  await page.route(usersUrl, async route => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'Service unavailable' }),
    });
  });
  await page.goto('/leaderboard');

  await expect(
    page.getByRole('heading', { name: 'No se pudo cargar la clasificación' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible();
});
