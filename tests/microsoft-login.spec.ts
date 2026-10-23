import { expect, test, type Page } from '@playwright/test';

const loginUrl = '**/api/v1/auth/login/';
const account = { homeAccountId: 'h', environment: 'e', tenantId: 't', username: 'ana@iteso.mx' };

async function exchangeFromPage(
  page: Page,
  result: { idToken?: string; accessToken?: string },
): Promise<string> {
  return page.evaluate(
    async ({ signIn, msAccount }) => {
      const module = await import('/src/lib/auth/microsoft-login.ts');
      try {
        await module.exchangeMicrosoftSignIn({ account: msAccount, ...signIn });
        return 'ok';
      } catch (error) {
        return error instanceof Error ? error.message : String(error);
      }
    },
    { signIn: result, msAccount: account },
  );
}

test.describe('Microsoft sign-in exchange (#82)', () => {
  test('sends the real ID token once and surfaces the backend error', async ({ page }) => {
    const sentIdTokens: string[] = [];
    await page.route(loginUrl, async route => {
      const body = route.request().postDataJSON() as { id_token: string };
      sentIdTokens.push(body.id_token);
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { code: 'DOMAIN_NOT_ALLOWED', message: 'Solo cuentas @iteso.mx.' },
        }),
      });
    });
    await page.goto('/login');

    const outcome = await exchangeFromPage(page, { idToken: 'real-id-token', accessToken: 'at' });

    expect(outcome).toBe('Solo cuentas @iteso.mx.');
    expect(sentIdTokens).toEqual(['real-id-token']);
  });

  test('does not call the backend without an ID token', async ({ page }) => {
    let calls = 0;
    await page.route(loginUrl, async route => {
      calls += 1;
      await route.abort();
    });
    await page.goto('/login');

    const outcome = await exchangeFromPage(page, { accessToken: 'at' });

    expect(outcome).toBe('Microsoft no devolvió un token de identidad. Intenta de nuevo.');
    expect(calls).toBe(0);
  });
});
