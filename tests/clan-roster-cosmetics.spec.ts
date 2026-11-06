import { expect, test, type Page } from '@playwright/test';
import { failUnmockedApiCalls } from './helpers/api';
import { mockStudentSession } from './helpers/auth';
import { PIXEL_PNG } from './helpers/images';

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
};

const FRAME_URL = 'https://images.greeniteso.test/frame.png';
const BACKGROUND_URL = 'https://images.greeniteso.test/background.png';

async function mockImages(page: Page) {
  await page.route('https://images.greeniteso.test/**', route =>
    route.fulfill({ status: 200, contentType: 'image/png', body: PIXEL_PNG }),
  );
}

/** Serve `payload` for the one API path; an OPTIONS preflight gets the CORS headers. */
async function mockApi(page: Page, pathPattern: RegExp, payload: unknown) {
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

test("should show each member's frame and background in the clan roster", async ({ page }) => {
  await mockStudentSession(page);
  await failUnmockedApiCalls(page);
  await mockImages(page);
  await mockApi(page, /\/api\/v1\/clans\/clan-eco\/$/, {
    id: 'clan-eco',
    name: 'Eco Warriors',
    description: '',
    avatar_object_key: '',
    type: 'PRIVATE',
    privacy: 'PUBLIC',
    total_points: 1200,
    created_at: '2026-09-01T10:00:00Z',
    member_count: 2,
    members: [
      {
        user_id: 'leader-1',
        nickname: 'Ana',
        display_name: 'Ana',
        avatar_url: '',
        frame_url: FRAME_URL,
        background_url: BACKGROUND_URL,
        role: 'LEADER',
        joined_at: '2026-09-02T10:00:00Z',
      },
      {
        user_id: 'member-2',
        nickname: 'Luis',
        display_name: 'Luis',
        avatar_url: '',
        frame_url: '',
        background_url: '',
        role: 'MEMBER',
        joined_at: '2026-09-03T10:00:00Z',
      },
    ],
  });
  await page.goto('/clans/clan-eco');
  await expect(page.getByRole('heading', { name: 'Miembros (2)' })).toBeVisible();

  await expect(page.getByTestId('avatar-frame')).toHaveCount(1);
  await expect(page.getByTestId('avatar-frame')).toHaveAttribute('src', FRAME_URL);
  const backdrop = page.getByTestId('cosmetic-backdrop');
  await expect(backdrop).toHaveCount(1);
  await expect(backdrop.getByText('Ana')).toBeVisible();
  await expect(backdrop.locator(`img[src="${BACKGROUND_URL}"]`)).toHaveCount(1);
});
