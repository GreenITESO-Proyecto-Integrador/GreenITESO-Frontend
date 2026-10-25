import { expect, test, type Page } from '@playwright/test';
import { mockAdminSession, mockStudentSession } from './helpers/auth';

const onboardingUrl = '**/api/v1/clans/institutional-clan/';
const careersUrl = '**/api/v1/clans/institutional-clan/careers/';

const assignedClan = { id: 'clan-1', name: 'Arquitectura', type: 'INSTITUTIONAL' };

interface OnboardingMock {
  assigned: boolean;
  nickname?: string;
  visibility?: 'PUBLIC' | 'PRIVATE';
  careers?: string[] | 'error';
  postStatus?: number;
  postBody?: unknown;
}

/**
 * Stubs the onboarding endpoints. After a successful POST the GET reports the clan,
 * like the real backend, so the reload that follows does not reopen the modal.
 */
async function mockOnboarding(
  page: Page,
  options: OnboardingMock,
): Promise<{ posted: unknown[]; stateReads: () => number }> {
  const posted: unknown[] = [];
  let assigned = options.assigned;
  let reads = 0;
  await page.route(careersUrl, async route => {
    if (options.careers === 'error') {
      await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ careers: options.careers ?? ['Arquitectura', 'Ingeniería Civil'] }),
    });
  });
  await page.route(onboardingUrl, async route => {
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON() as { career: string };
      posted.push(body);
      const status = options.postStatus ?? 200;
      if (status === 200) assigned = true;
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(
          options.postBody ?? {
            career: body.career,
            institutional_clan: { ...assignedClan, name: body.career },
          },
        ),
      });
      return;
    }
    reads += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        career: assigned ? 'Arquitectura' : '',
        institutional_clan: assigned ? assignedClan : null,
        nickname: options.nickname ?? '',
        visibility: options.visibility ?? 'PUBLIC',
      }),
    });
  });
  return { posted, stateReads: () => reads };
}

function onboardingDialog(page: Page) {
  return page.getByRole('dialog', { name: 'Completa tu perfil' });
}

test.describe('Career onboarding modal (#163)', () => {
  test('asks for the career and submits nickname and visibility', async ({ page }) => {
    await mockStudentSession(page);
    const { posted } = await mockOnboarding(page, { assigned: false });

    await page.goto('/');
    const dialog = onboardingDialog(page);
    await expect(dialog).toBeVisible();

    await dialog.getByLabel('Carrera').selectOption('Arquitectura');
    await dialog.getByLabel('Nickname (opcional)').fill('  Ana  ');
    await dialog.getByLabel(/Perfil privado/).check();
    await dialog.getByRole('button', { name: 'Continuar' }).click();

    await expect(dialog).toBeHidden();
    expect(posted).toEqual([{ career: 'Arquitectura', nickname: 'Ana', visibility: 'PRIVATE' }]);
  });

  test('keeps an existing private profile and nickname', async ({ page }) => {
    await mockStudentSession(page);
    const { posted } = await mockOnboarding(page, {
      assigned: false,
      nickname: 'Pau',
      visibility: 'PRIVATE',
    });

    await page.goto('/');
    const dialog = onboardingDialog(page);
    await expect(dialog.getByLabel(/Perfil privado/)).toBeChecked();
    const nickname = dialog.getByLabel('Nickname (opcional)');
    await expect(nickname).toHaveValue('Pau');
    await expect(nickname).not.toBeEditable();

    await dialog.getByLabel('Carrera').selectOption('Arquitectura');
    await dialog.getByRole('button', { name: 'Continuar' }).click();

    await expect(dialog).toBeHidden();
    expect(posted).toEqual([{ career: 'Arquitectura', visibility: 'PRIVATE' }]);
  });

  test('requires a career before submitting', async ({ page }) => {
    await mockStudentSession(page);
    const { posted } = await mockOnboarding(page, { assigned: false });

    await page.goto('/');
    const dialog = onboardingDialog(page);
    await dialog.getByRole('button', { name: 'Continuar' }).click();

    await expect(dialog.getByText('Elige tu carrera.')).toBeVisible();
    expect(posted).toEqual([]);
  });

  test('accepts a career that is not in the list', async ({ page }) => {
    await mockStudentSession(page);
    const { posted } = await mockOnboarding(page, { assigned: false });

    await page.goto('/');
    const dialog = onboardingDialog(page);
    await dialog.getByLabel('Carrera').selectOption({ label: 'Mi carrera no está en la lista' });
    await dialog.getByLabel('Escribe tu carrera').fill('Ingeniería en Biotecnología');
    await dialog.getByRole('button', { name: 'Continuar' }).click();

    await expect(dialog).toBeHidden();
    expect(posted).toEqual([{ career: 'Ingeniería en Biotecnología', visibility: 'PUBLIC' }]);
  });

  test('stays open and usable after pressing Escape', async ({ page }) => {
    await mockStudentSession(page);
    await mockOnboarding(page, { assigned: false });

    await page.goto('/');
    const dialog = onboardingDialog(page);
    const nickname = dialog.getByLabel('Nickname (opcional)');
    await nickname.click();
    await page.keyboard.press('Escape');
    await page.keyboard.type('Ana');

    await expect(nickname).toHaveValue('Ana');
    await expect(dialog).toBeVisible();
  });

  test('shows a field error the form has no slot for', async ({ page }) => {
    await mockStudentSession(page);
    await mockOnboarding(page, {
      assigned: false,
      postStatus: 400,
      postBody: { visibility: ['"HIDDEN" is not a valid choice.'] },
    });

    await page.goto('/');
    const dialog = onboardingDialog(page);
    await dialog.getByLabel('Carrera').selectOption('Arquitectura');
    await dialog.getByRole('button', { name: 'Continuar' }).click();

    await expect(dialog.getByRole('alert')).toBeVisible();
    await expect(dialog).toBeVisible();
  });

  test('shows an error when the server fails', async ({ page }) => {
    await mockStudentSession(page);
    await mockOnboarding(page, { assigned: false, postStatus: 500, postBody: {} });

    await page.goto('/');
    const dialog = onboardingDialog(page);
    await dialog.getByLabel('Carrera').selectOption('Arquitectura');
    await dialog.getByRole('button', { name: 'Continuar' }).click();

    await expect(dialog.getByRole('alert')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Continuar' })).toBeEnabled();
  });

  test('warns and falls back to free text when the careers list fails', async ({ page }) => {
    await mockStudentSession(page);
    await mockOnboarding(page, { assigned: false, careers: 'error' });

    await page.goto('/');
    const dialog = onboardingDialog(page);

    await expect(
      dialog.getByText('No se pudo cargar la lista de carreras.', { exact: false }),
    ).toBeVisible();
    await expect(dialog.getByRole('textbox', { name: 'Carrera' })).toBeVisible();
  });

  test('lets the user sign out from the modal', async ({ page }) => {
    await mockStudentSession(page);
    await mockOnboarding(page, { assigned: false });

    await page.goto('/');
    await onboardingDialog(page).getByRole('button', { name: 'Cerrar sesión' }).click();

    await expect(page).toHaveURL(/\/login$/);
    expect(await page.evaluate(() => sessionStorage.getItem('greeniteso.access_token'))).toBeNull();
  });

  test('does not gate admins', async ({ page }) => {
    await mockAdminSession(page);
    const { stateReads } = await mockOnboarding(page, { assigned: false });

    await page.goto('/');
    await expect(page.getByRole('navigation').first()).toBeVisible();

    await expect(onboardingDialog(page)).toHaveCount(0);
    expect(stateReads()).toBe(0);
  });

  test('stays hidden when the user already has an institutional clan', async ({ page }) => {
    await mockStudentSession(page);
    await mockOnboarding(page, { assigned: true });

    const checked = page.waitForResponse(response =>
      response.url().endsWith('/api/v1/clans/institutional-clan/'),
    );
    await page.goto('/');
    await checked;
    await expect(onboardingDialog(page)).toHaveCount(0);
  });
});
