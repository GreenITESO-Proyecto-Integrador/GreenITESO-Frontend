import { test, expect } from '@playwright/test';
import { mockStudentSession } from './helpers/auth';

test.describe('Badge Gallery UI', () => {
  test.beforeEach(async ({ page }) => {
    // Inject auth session
    await mockStudentSession(page);

    // 1. MOCK THE BADGES (This is why it works even if your real DB is empty)
    await page.route('**/api/v1/rankings/badges/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '1',
            name: 'Eco Pioneer',
            description: 'Earned badge description',
            points_required: 50,
            icon_name: 'Leaf',
            is_earned: true,
            earned_at: '2026-10-12T10:00:00Z',
          },
          {
            id: '2',
            name: 'Eco Legend',
            description: 'Locked badge description',
            points_required: 500,
            icon_name: 'Award',
            is_earned: false,
            earned_at: null,
          },
        ]),
      });
    });

    // 2. AGGRESSIVE PROFILE MOCK: Catches any endpoint variant to prevent infinite loading
    await page.route(/.*api.*\/(profile|me|users).*/, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { first_name: 'Test', last_name: 'User' },
          impactMetrics: { total_co2_saved: 10, total_water_saved: 0, total_waste_recycled: 0 },
          institutionalClan: null,
          activePrivateClan: null,
          badges: [],
          finishedCampaigns: [],
        }),
      });
    });
  });

  test('should render earned badges in color and locked badges in grayscale', async ({ page }) => {
    await page.goto('/profile');

    // Wait for the gallery container to be visible
    await expect(page.getByText('Galería de Insignias')).toBeVisible({ timeout: 10000 });

    // 1. Validate the EARNED badge
    // Finds the exact h3 heading and selects its direct parent container (the BadgeCard div)
    const earnedBadge = page
      .getByRole('heading', { name: 'Eco Pioneer', exact: true })
      .locator('..');

    await expect(earnedBadge).toBeVisible();
    // Use the exact case rendered by the component
    await expect(earnedBadge).toContainText('Obtenida el');
    await expect(earnedBadge).toHaveClass(/bg-primary-50/);
    await expect(earnedBadge).not.toHaveClass(/grayscale/);

    // 2. Validate the LOCKED badge
    const unearnedBadge = page
      .getByRole('heading', { name: 'Eco Legend', exact: true })
      .locator('..');

    await expect(unearnedBadge).toBeVisible();
    await expect(unearnedBadge).toContainText('Requiere 500 pts');
    await expect(unearnedBadge).toHaveClass(/bg-secondary-50/);
    await expect(unearnedBadge).toHaveClass(/grayscale/);
  });
});
