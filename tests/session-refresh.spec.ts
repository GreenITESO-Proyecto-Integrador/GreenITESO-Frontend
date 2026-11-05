import { expect, test, type Page } from '@playwright/test';

const refreshUrl = '**/api/v1/auth/refresh/';

// exp in 2001 (expired) and 2050 (valid); signatures are never checked client-side.
const EXPIRED_ACCESS =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjEwMDAwMDAwMDB9.expired-signature';
const VALID_ACCESS =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjI1MjQ2MDgwMDB9.valid-signature';

async function seedSession(page: Page, refresh: string): Promise<void> {
  await page.goto('/login');
  await page.evaluate(
    ({ access, refreshToken }) => {
      sessionStorage.setItem('greeniteso.access_token', access);
      sessionStorage.setItem('greeniteso.refresh_token', refreshToken);
    },
    { access: EXPIRED_ACCESS, refreshToken: refresh },
  );
}

async function refreshFromPage(page: Page): Promise<string | null> {
  return page.evaluate(async () => {
    const session = await import('/src/lib/auth/session.ts');
    return session.refreshAccessToken();
  });
}

test.describe('Refresh token rotation', () => {
  test('stores the rotated refresh token and sends it on the next refresh', async ({ page }) => {
    const sentRefreshTokens: string[] = [];
    let issued = 0;
    await page.route(refreshUrl, async route => {
      const body = route.request().postDataJSON() as { refresh: string };
      sentRefreshTokens.push(body.refresh);
      issued += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ access: VALID_ACCESS, refresh: `refresh-${issued + 1}` }),
      });
    });

    await seedSession(page, 'refresh-1');

    expect(await refreshFromPage(page)).toBe(VALID_ACCESS);
    expect(await page.evaluate(() => sessionStorage.getItem('greeniteso.refresh_token'))).toBe(
      'refresh-2',
    );

    await refreshFromPage(page);
    expect(sentRefreshTokens).toEqual(['refresh-1', 'refresh-2']);
  });

  test('keeps the current refresh token when the response does not rotate it', async ({ page }) => {
    await page.route(refreshUrl, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ access: VALID_ACCESS }),
      });
    });

    await seedSession(page, 'refresh-1');

    expect(await refreshFromPage(page)).toBe(VALID_ACCESS);
    expect(await page.evaluate(() => sessionStorage.getItem('greeniteso.refresh_token'))).toBe(
      'refresh-1',
    );
  });
});
