import { expect, test } from '@playwright/test';
import { mockStudentSession } from './helpers/auth';

// week_start arrives as a bare 'YYYY-MM-DD' (DRF DateField, no time/offset).
// new Date(...) parses that as UTC midnight; formatting it back out without
// pinning the timezone shifts the displayed day for anyone west of UTC.
test.use({ timezoneId: 'America/Mexico_City' });

test('keeps the correct calendar day for week_start in America/Mexico_City', async ({ page }) => {
  await mockStudentSession(page);

  await page.route('**/api/v1/campaigns/**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ results: [], next: null }),
    });
  });

  await page.route('**/api/v1/profile/me/', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user_id: 'user-1',
        first_name: 'Ana',
        last_name: 'Test',
        total_points: 0,
        available_points: 0,
        current_streak: 0,
        impact_metrics: { co2_kg: '0', water_liters: '0', plastic_kg: '0' },
        finished_campaigns: [],
      }),
    });
  });

  await page.route('**/api/v1/profile/me/impact-trend/', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { week_start: '2026-09-14', co2_kg: '0.000', water_liters: '0.000', plastic_kg: '0.000' },
        { week_start: '2026-09-21', co2_kg: '0.000', water_liters: '0.000', plastic_kg: '0.000' },
        { week_start: '2026-09-28', co2_kg: '0.000', water_liters: '0.000', plastic_kg: '0.000' },
        { week_start: '2026-10-05', co2_kg: '1.200', water_liters: '3.000', plastic_kg: '0.400' },
      ]),
    });
  });

  await page.goto('/');

  // The last point is 2026-10-05: must render as "05-oct", never "04-oct".
  await expect(page.getByText('05-oct').first()).toBeVisible();
  await expect(page.getByText('04-oct')).toHaveCount(0);
});
