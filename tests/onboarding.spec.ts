import { expect, test, type Page } from '@playwright/test';
import { mockStudentSession } from './helpers/auth';

const onboardingUrl = '**/api/v1/clans/institutional-clan/';
const careersUrl = '**/api/v1/clans/institutional-clan/careers/';

const assignedClan = { id: 'clan-1', name: 'Arquitectura', type: 'INSTITUTIONAL' };

async function mockOnboarding(
  page: Page,
  options: { assigned: boolean; careers?: string[] },
): Promise<{ posted: unknown[] }> {
  const posted: unknown[] = [];
  await page.route(careersUrl, async route => {
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
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          career: body.career,
          institutional_clan: { ...assignedClan, name: body.career },
        }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        career: options.assigned ? 'Arquitectura' : '',
        institutional_clan: options.assigned ? assignedClan : null,
      }),
    });
  });
  return { posted };
}

test.describe('Career onboarding modal (#163)', () => {
  test('asks for the career and submits nickname and visibility', async ({ page }) => {
    await mockStudentSession(page);
    const { posted } = await mockOnboarding(page, { assigned: false });

    await page.goto('/');
    const dialog = page.getByRole('dialog', { name: 'Completa tu perfil' });
    await expect(dialog).toBeVisible();

    await dialog.getByLabel('Carrera').selectOption('Arquitectura');
    await dialog.getByLabel('Nickname (opcional)').fill('  Ana  ');
    await dialog.getByLabel(/Perfil privado/).check();
    await dialog.getByRole('button', { name: 'Continuar' }).click();

    await expect(dialog).toBeHidden();
    expect(posted).toEqual([{ career: 'Arquitectura', nickname: 'Ana', visibility: 'PRIVATE' }]);
  });

  test('requires a career before submitting', async ({ page }) => {
    await mockStudentSession(page);
    const { posted } = await mockOnboarding(page, { assigned: false });

    await page.goto('/');
    const dialog = page.getByRole('dialog', { name: 'Completa tu perfil' });
    await dialog.getByRole('button', { name: 'Continuar' }).click();

    await expect(dialog.getByText('Elige tu carrera.')).toBeVisible();
    expect(posted).toEqual([]);
  });

  test('accepts a career that is not in the list', async ({ page }) => {
    await mockStudentSession(page);
    const { posted } = await mockOnboarding(page, { assigned: false });

    await page.goto('/');
    const dialog = page.getByRole('dialog', { name: 'Completa tu perfil' });
    await dialog.getByLabel('Carrera').selectOption({ label: 'Mi carrera no está en la lista' });
    await dialog.getByLabel('Escribe tu carrera').fill('Ingeniería en Biotecnología');
    await dialog.getByRole('button', { name: 'Continuar' }).click();

    await expect(dialog).toBeHidden();
    expect(posted).toEqual([{ career: 'Ingeniería en Biotecnología', visibility: 'PUBLIC' }]);
  });

  test('cannot be dismissed with Escape', async ({ page }) => {
    await mockStudentSession(page);
    await mockOnboarding(page, { assigned: false });

    await page.goto('/');
    const dialog = page.getByRole('dialog', { name: 'Completa tu perfil' });
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');

    await expect(dialog).toBeVisible();
  });

  test('stays hidden when the user already has an institutional clan', async ({ page }) => {
    await mockStudentSession(page);
    await mockOnboarding(page, { assigned: true });

    const checked = page.waitForResponse(response =>
      response.url().endsWith('/api/v1/clans/institutional-clan/'),
    );
    await page.goto('/');
    await checked;
    await expect(page.getByRole('dialog', { name: 'Completa tu perfil' })).toHaveCount(0);
  });
});
