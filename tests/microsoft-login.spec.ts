import { expect, test, type Page } from '@playwright/test';

const loginUrl = '**/api/v1/auth/login/';
const account = { homeAccountId: 'h', environment: 'e', tenantId: 't', username: 'ana@iteso.mx' };

const LOGIN_OK = {
  access: 'access-token',
  refresh: 'refresh-token',
  user: { id: 'u1', email: 'ana@iteso.mx', first_name: '', last_name: '', role: 'STUDENT' },
  created: false,
};

async function exchangeFromPage(
  page: Page,
  result: { idToken?: string; accessToken?: string },
  allowMockRetry?: boolean,
): Promise<string> {
  return page.evaluate(
    async ({ signIn, msAccount, retry }) => {
      const module = await import('/src/lib/auth/microsoft-login.ts');
      try {
        await module.exchangeMicrosoftSignIn(
          { account: msAccount, ...signIn },
          retry === undefined ? undefined : { allowMockRetry: retry },
        );
        return 'ok';
      } catch (error) {
        return error instanceof Error ? error.message : String(error);
      }
    },
    { signIn: result, msAccount: account, retry: allowMockRetry },
  );
}

/** Rejects the real token like a local mock-mode backend and accepts `mock:` tokens. */
async function mockLogin(page: Page): Promise<string[]> {
  const sentIdTokens: string[] = [];
  await page.route(loginUrl, async route => {
    const body = route.request().postDataJSON() as { id_token: string };
    sentIdTokens.push(body.id_token);
    if (body.id_token.startsWith('mock:')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(LOGIN_OK),
      });
      return;
    }
    await route.fulfill({
      status: 403,
      contentType: 'application/json',
      body: JSON.stringify({
        error: { code: 'DOMAIN_NOT_ALLOWED', message: 'Solo cuentas @iteso.mx.' },
      }),
    });
  });
  return sentIdTokens;
}

test.describe('Microsoft sign-in exchange (#82)', () => {
  test('outside the dev server it sends the real token once and surfaces the error', async ({
    page,
  }) => {
    const sentIdTokens = await mockLogin(page);
    await page.goto('/login');

    const outcome = await exchangeFromPage(
      page,
      { idToken: 'real-id-token', accessToken: 'at' },
      false,
    );

    expect(outcome).toBe('Solo cuentas @iteso.mx.');
    expect(sentIdTokens).toEqual(['real-id-token']);
  });

  test('on the dev server it retries with a mock token for a local backend', async ({ page }) => {
    const sentIdTokens = await mockLogin(page);
    await page.goto('/login');

    const outcome = await exchangeFromPage(page, { idToken: 'real-id-token', accessToken: 'at' });

    expect(outcome).toBe('ok');
    expect(sentIdTokens).toEqual(['real-id-token', 'mock:ana@iteso.mx']);
  });

  test('on the dev server it keeps the original error when the retry fails too', async ({
    page,
  }) => {
    const sentIdTokens: string[] = [];
    await page.route(loginUrl, async route => {
      const body = route.request().postDataJSON() as { id_token: string };
      sentIdTokens.push(body.id_token);
      const message = body.id_token.startsWith('mock:')
        ? 'Mock mode expects an id_token like mock:<email>.'
        : 'Solo cuentas @iteso.mx.';
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'DOMAIN_NOT_ALLOWED', message } }),
      });
    });
    await page.goto('/login');

    const outcome = await exchangeFromPage(page, { idToken: 'real-id-token', accessToken: 'at' });

    expect(outcome).toBe('Solo cuentas @iteso.mx.');
    expect(sentIdTokens).toEqual(['real-id-token', 'mock:ana@iteso.mx']);
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
