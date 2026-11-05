import { expect, test, type Page } from '@playwright/test';
import { mockStudentSession } from './helpers/auth';

const baseProfile = {
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
  profile?: Partial<typeof baseProfile>;
  /** Answer the nickname POST with this status and body instead of applying it. */
  nicknameError?: { status: number; body: unknown };
}

async function setupProfile(page: Page, options: SetupOptions = {}) {
  const profile = { ...baseProfile, ...options.profile };
  const posted: unknown[] = [];

  await mockStudentSession(page, { id: profile.user_id, email: profile.email });
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
  await page.route('**/api/v1/profile/me/nickname/', async route => {
    posted.push(JSON.parse(route.request().postData() || '{}'));
    if (options.nicknameError) {
      await route.fulfill({
        status: options.nicknameError.status,
        contentType: 'application/json',
        body: JSON.stringify(options.nicknameError.body),
      });
      return;
    }
    const { nickname } = posted[posted.length - 1] as { nickname: string };
    const cost = profile.nickname_change_cost;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        nickname,
        points_spent: cost,
        available_points: profile.available_points - cost,
        next_change_cost: 50,
      }),
    });
  });

  await page.goto('/profile');
  return { posted };
}

async function openDialog(page: Page) {
  await page.getByRole('button', { name: 'Cambiar nickname' }).click();
  return page.getByRole('dialog');
}

test.describe('Cambio de nickname (#175)', () => {
  test('shows the nickname and that the first change is free', async ({ page }) => {
    await setupProfile(page);

    const section = page.getByRole('region', { name: 'Cuenta' });
    await expect(section.getByText('Mari', { exact: true })).toBeVisible();
    await expect(section.getByText('Tu primer cambio es gratis.')).toBeVisible();
  });

  test('the free first change saves without charging and shows the next cost', async ({ page }) => {
    const { posted } = await setupProfile(page);

    const dialog = await openDialog(page);
    await expect(dialog.getByText('Tu primer cambio es gratis.')).toBeVisible();
    await dialog.getByLabel('Nuevo nickname').fill('  Mariana Verde ');
    await dialog.getByRole('button', { name: 'Guardar' }).click();

    await expect(dialog).toBeHidden();
    expect(posted).toEqual([{ nickname: 'Mariana Verde' }]);
    const section = page.getByRole('region', { name: 'Cuenta' });
    await expect(section.getByText('Mariana Verde', { exact: true })).toBeVisible();
    await expect(section.getByText('El siguiente cambio cuesta 50 puntos.')).toBeVisible();
  });

  test('a paid change shows its cost and updates the points balance', async ({ page }) => {
    await setupProfile(page, { profile: { nickname_change_cost: 50 } });

    const dialog = await openDialog(page);
    await expect(dialog.getByText('Cambiarlo cuesta 50 puntos. Tienes 120.')).toBeVisible();
    await dialog.getByLabel('Nuevo nickname').fill('Eco Mari');
    await dialog.getByRole('button', { name: 'Pagar 50 puntos y guardar' }).click();

    await expect(dialog).toBeHidden();
    // 120 available before, 50 charged.
    await expect(page.getByText('70', { exact: true })).toBeVisible();
  });

  test('cannot submit the same nickname or an empty one', async ({ page }) => {
    const { posted } = await setupProfile(page);

    const dialog = await openDialog(page);
    const save = dialog.getByRole('button', { name: 'Guardar' });
    await expect(save).toBeDisabled();
    await dialog.getByLabel('Nuevo nickname').fill('   ');
    await expect(save).toBeDisabled();
    expect(posted).toEqual([]);
  });

  test('blocks the change when the points do not cover its cost', async ({ page }) => {
    const { posted } = await setupProfile(page, {
      profile: { nickname_change_cost: 50, available_points: 10 },
    });

    const dialog = await openDialog(page);
    await dialog.getByLabel('Nuevo nickname').fill('Otro');
    await expect(
      dialog.getByText('No te alcanzan los puntos para cambiarlo todavía.'),
    ).toBeVisible();
    await expect(dialog.getByRole('button', { name: /Pagar 50 puntos/ })).toBeDisabled();
    expect(posted).toEqual([]);
  });

  test('shows the backend rejection in Spanish and keeps the dialog open', async ({ page }) => {
    await setupProfile(page, {
      nicknameError: {
        status: 400,
        body: {
          error: { code: 'VALIDATION_ERROR' },
          nickname: ['Changing your nickname costs 50 points and you have 20.'],
        },
      },
    });

    const dialog = await openDialog(page);
    await dialog.getByLabel('Nuevo nickname').fill('Otro');
    await dialog.getByRole('button', { name: 'Guardar' }).click();

    await expect(dialog.getByRole('alert')).toContainText(
      'Cambiar tu nickname cuesta 50 puntos y tienes 20.',
    );
    await expect(dialog).toBeVisible();
  });

  test('reopening the dialog starts from the current nickname with no stale error', async ({
    page,
  }) => {
    await setupProfile(page, {
      nicknameError: {
        status: 400,
        body: { nickname: ['That is already your nickname.'] },
      },
    });

    let dialog = await openDialog(page);
    await dialog.getByLabel('Nuevo nickname').fill('Otro');
    await dialog.getByRole('button', { name: 'Guardar' }).click();
    await expect(dialog.getByRole('alert')).toContainText('Ese ya es tu nickname.');

    await dialog.getByRole('button', { name: 'Cancelar' }).click();
    await expect(dialog).toBeHidden();

    dialog = await openDialog(page);
    await expect(dialog.getByLabel('Nuevo nickname')).toHaveValue('Mari');
    await expect(dialog.getByRole('alert')).toHaveCount(0);
  });
});
