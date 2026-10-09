import { expect, test } from '@playwright/test';

test('should render the Microsoft login screen', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByRole('heading', { name: 'Inicia sesión' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Iniciar sesión con @iteso.mx' })).toBeVisible();
  await expect(page.getByText('cuenta institucional @iteso.mx')).toBeVisible();
});
