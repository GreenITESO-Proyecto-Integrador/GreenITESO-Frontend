import { expect, test, type Page } from '@playwright/test';
import { mockStudentSession } from './helpers/auth';

const usersUrl = '**/api/v1/rankings/users**';
const rankingsUrl = '**/api/v1/rankings/**';

const globalRanking = [
  { id: 'user-1', rank: 1, display_name: 'Ana', total_points: 120 },
  { id: 'user-2', rank: 2, display_name: 'Luis', total_points: 80 },
];

const institutionalRanking = [
  { id: 'clan-1', rank: 1, clan_name: 'Software', total_points: 400 },
  { id: 'clan-2', rank: 2, clan_name: 'Arquitectura', total_points: 210 },
];

const privateClanRanking = [{ id: 'clan-3', rank: 1, clan_name: 'Las Ranas', total_points: 99 }];

function paginated(results: unknown[], count = results.length) {
  return JSON.stringify({ count, next: null, previous: null, results });
}

/**
 * Stub intercept for user and clan ranking endpoints during Playwright runs.
 */
async function mockRankings(page: Page) {
  await page.route(rankingsUrl, async route => {
    const url = new URL(route.request().url());
    const pathname = url.pathname;

    if (pathname.includes('/rankings/users')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: paginated(globalRanking),
      });
      return;
    }

    const rankingType = url.searchParams.get('type');
    if (rankingType === 'INSTITUTIONAL') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: paginated(institutionalRanking, 2),
      });
      return;
    }

    if (rankingType === 'PRIVATE_CLAN') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: paginated(privateClanRanking, 1),
      });
      return;
    }

    await route.fulfill({ status: 400, contentType: 'application/json', body: '{}' });
  });
}

test.beforeEach(async ({ page }) => {
  await mockStudentSession(page);
});

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

test('should load the institutional clan ranking from GET /rankings/?type=', async ({ page }) => {
  await mockRankings(page);
  await page.goto('/leaderboard');

  await page.getByRole('tab', { name: 'Ranking institucional' }).click();
  await expect(page.getByRole('tab', { name: 'Ranking institucional' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.getByText('Software')).toBeVisible();
  await expect(page.getByText('400')).toBeVisible();
});

test('should load private clan ranking rows using clan_name', async ({ page }) => {
  await mockRankings(page);
  await page.goto('/leaderboard');

  await page.getByRole('tab', { name: 'Clanes privados' }).click();
  await expect(page.getByText('Las Ranas')).toBeVisible();
  await expect(page.getByText('99')).toBeVisible();
});

test('should request the next rankings page with limit and offset', async ({ page }) => {
  const pageOne = Array.from({ length: 50 }, (_, index) => ({
    id: `user-${index + 1}`,
    rank: index + 1,
    display_name: `Persona ${index + 1}`,
    total_points: 1000 - index,
  }));
  const pageTwo = [{ id: 'user-51', rank: 51, display_name: 'Persona 51', total_points: 10 }];

  await page.route(usersUrl, async route => {
    const url = new URL(route.request().url());
    const offset = Number(url.searchParams.get('offset') ?? '0');
    const results = offset === 0 ? pageOne : pageTwo;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: paginated(results, 51),
    });
  });

  await page.goto('/leaderboard');
  await expect(page.getByText('Persona 1')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Página siguiente' })).toBeEnabled();

  await page.getByRole('button', { name: 'Página siguiente' }).click();
  await expect(page.getByText('Persona 51')).toBeVisible();
  await expect(page.getByText('Persona 1')).toHaveCount(0);
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
