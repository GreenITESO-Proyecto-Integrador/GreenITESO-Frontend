import { expect, test, type Page } from '@playwright/test';
import { failUnmockedApiCalls } from './helpers/api';
import { mockStudentSession } from './helpers/auth';

const profile = {
  user_id: 'user-uuid-123',
  email: 'usuario.test@iteso.mx',
  first_name: 'Mariana',
  last_name: 'García',
  role: 'STUDENT',
  nickname: 'Mari',
  nickname_change_cost: 0,
  visibility: 'PUBLIC',
  total_points: 350,
  available_points: 120,
  current_streak: 7,
  level: 3,
  badges: [],
  impact_metrics: { co2_kg: 0, water_liters: 0, plastic_kg: 0 },
  finished_campaigns: [],
  bio: '',
  avatar_url: '',
  institutional_clan: null,
  active_private_clan: null,
};

interface SetupOptions {
  /** Answer the deactivate POST with this status and body instead of 204. */
  deactivateError?: { status: number; body: unknown };
}

async function setupProfile(page: Page, options: SetupOptions = {}) {
  const posted: unknown[] = [];

  await mockStudentSession(page, { id: profile.user_id, email: profile.email });
  await failUnmockedApiCalls(page);
  await page.route('**/api/v1/exchangeables/**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ results: [] }),
    }),
  );
  await page.route('**/api/v1/profile/me/', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(profile),
    }),
  );
  await page.route('**/api/v1/profile/me/deactivate/', async route => {
    posted.push(JSON.parse(route.request().postData() || '{}'));
    if (options.deactivateError) {
      await route.fulfill({
        status: options.deactivateError.status,
        contentType: 'application/json',
        body: JSON.stringify(options.deactivateError.body),
      });
      return;
    }
    await route.fulfill({ status: 204 });
  });

  await page.goto('/profile');
  return { posted };
}

async function openDialog(page: Page) {
  await page.getByRole('button', { name: 'Desactivar cuenta' }).click();
  return page.getByRole('dialog');
}

test.describe('Desactivar cuenta (#176)', () => {
  test('needs the explicit confirmation before it can be sent', async ({ page }) => {
    const { posted } = await setupProfile(page);

    const dialog = await openDialog(page);
    const confirm = dialog.getByRole('button', { name: 'Desactivar mi cuenta' });
    await expect(dialog.getByText(/Se borra tu progreso/)).toBeVisible();
    await expect(confirm).toBeDisabled();

    await dialog.getByRole('checkbox').check();
    await expect(confirm).toBeEnabled();
    await dialog.getByRole('checkbox').uncheck();
    await expect(confirm).toBeDisabled();
    expect(posted).toEqual([]);
  });

  test('deactivating sends the confirmation, ends the session and goes to login', async ({
    page,
  }) => {
    const { posted } = await setupProfile(page);

    const dialog = await openDialog(page);
    await dialog.getByRole('checkbox').check();
    await dialog.getByRole('button', { name: 'Desactivar mi cuenta' }).click();

    await expect(page).toHaveURL(/\/login$/);
    expect(posted).toEqual([{ confirm: true }]);
    const stored = await page.evaluate(() => [
      sessionStorage.getItem('greeniteso.access_token'),
      sessionStorage.getItem('greeniteso.refresh_token'),
      sessionStorage.getItem('greeniteso.user'),
    ]);
    expect(stored).toEqual([null, null, null]);
  });

  test('a clan leader is told why, and keeps the session', async ({ page }) => {
    await setupProfile(page, {
      deactivateError: {
        status: 400,
        body: {
          error: { code: 'VALIDATION_ERROR' },
          account: ['You lead a clan; transfer its leadership or dissolve it first.'],
        },
      },
    });

    const dialog = await openDialog(page);
    await dialog.getByRole('checkbox').check();
    await dialog.getByRole('button', { name: 'Desactivar mi cuenta' }).click();

    await expect(dialog.getByRole('alert')).toContainText('Eres líder de un clan.');
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(/\/profile$/);
    expect(await page.evaluate(() => sessionStorage.getItem('greeniteso.access_token'))).not.toBe(
      null,
    );
  });

  test('the last administrator is told to name another admin first', async ({ page }) => {
    await setupProfile(page, {
      deactivateError: {
        status: 400,
        body: { account: ['You are the last administrator; promote another admin first.'] },
      },
    });

    const dialog = await openDialog(page);
    await dialog.getByRole('checkbox').check();
    await dialog.getByRole('button', { name: 'Desactivar mi cuenta' }).click();

    await expect(dialog.getByRole('alert')).toContainText('último administrador');
  });
});

test.describe('Cuenta reactivada (#176)', () => {
  test('welcomes the user back once after signing in to a deactivated account', async ({
    page,
  }) => {
    await mockStudentSession(page);
    await page.addInitScript(() => {
      // The login page leaves this behind before redirecting home.
      if (!sessionStorage.getItem('seen')) {
        sessionStorage.setItem('seen', '1');
        sessionStorage.setItem('greeniteso.reactivated_notice', '1');
      }
    });
    await page.route('**/api/v1/campaigns/**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ results: [], next: null }),
      }),
    );
    await page.route('**/api/v1/profile/me/', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(profile),
      }),
    );
    await page.route('**/api/v1/profile/me/impact-trend/', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    );

    await page.goto('/');
    await expect(
      page.getByRole('status').filter({ hasText: 'Reactivamos tu cuenta' }),
    ).toBeVisible();

    await page.reload();
    await expect(page.getByText('Reactivamos tu cuenta')).toHaveCount(0);
  });
});
