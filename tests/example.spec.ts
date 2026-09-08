import { test, expect } from '@playwright/test';

test('should display welcome message', async ({ page }) => {
  await page.goto('/');

  const heading = page.locator('h1');
  await expect(heading).toContainText('GreenITESO');

  const subheading = page.locator('p');
  await expect(subheading).toContainText('Frontend ready to go');
});

test('should display tech stack', async ({ page }) => {
  await page.goto('/');

  const react = page.locator('text=React 18');
  const typescript = page.locator('text=TypeScript');
  const tailwind = page.locator('text=Tailwind CSS');

  await expect(react).toBeVisible();
  await expect(typescript).toBeVisible();
  await expect(tailwind).toBeVisible();
});
