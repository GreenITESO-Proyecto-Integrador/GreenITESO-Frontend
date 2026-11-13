import type { Page } from '@playwright/test';

/**
 * Answer every API call the test does not mock with a 404.
 *
 * Without it, an unmocked call (badges, notifications, onboarding…) reaches whatever listens on
 * localhost:8000. A real backend answers 401 to the fake test token, the client then tries to
 * refresh, fails, and clears the session mid-test, which sends the page to /login.
 *
 * Call it before registering the test's own routes: Playwright tries the most recently
 * registered route first, so the specific mocks still win.
 */
export async function failUnmockedApiCalls(page: Page): Promise<void> {
  await page.route('**/api/v1/**', route =>
    route.fulfill({ status: 404, contentType: 'application/json', body: '{}' }),
  );
}

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
};

/** Serve `payload` for the one API path; an OPTIONS preflight gets the CORS headers. */
export async function mockJsonApi(page: Page, pathPattern: RegExp, payload: unknown) {
  await page.route(pathPattern, route =>
    route.request().method() === 'OPTIONS'
      ? route.fulfill({ status: 204, headers: CORS_HEADERS })
      : route.fulfill({
          status: 200,
          headers: CORS_HEADERS,
          contentType: 'application/json',
          body: JSON.stringify(payload),
        }),
  );
}
