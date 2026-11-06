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

function post(id: number, author: Record<string, unknown>) {
  return {
    id,
    author_id: author.id,
    author,
    post_type: 'COMMUNITY_MILESTONE',
    content: `Publicación ${id}`,
    image_url: null,
    badge_info: null,
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-01T12:00:00Z',
  };
}

test("should show the author's frame and background on their feed post", async ({ page }) => {
  await mockStudentSession(page);
  await failUnmockedApiCalls(page);
  await mockImages(page);
  await mockApi(page, /\/api\/v1\/feed\//, {
    count: 2,
    next: null,
    previous: null,
    results: [
      post(1, {
        id: 'user-ana',
        first_name: 'Ana',
        last_name: 'Pérez',
        avatar_url: '',
        frame_url: FRAME_URL,
        background_url: BACKGROUND_URL,
      }),
      post(2, {
        id: 'user-luis',
        first_name: 'Luis',
        last_name: 'Gómez',
        avatar_url: '',
        frame_url: '',
        background_url: '',
      }),
    ],
  });
  await page.goto('/feed');
  await expect(page.getByText('Publicación 2')).toBeVisible();

  // Only Ana picked cosmetics: one frame and one background in the whole feed.
  await expect(page.getByTestId('avatar-frame')).toHaveCount(1);
  await expect(page.getByTestId('avatar-frame')).toHaveAttribute('src', FRAME_URL);
  await expect(page.getByTestId('cosmetic-backdrop')).toHaveCount(1);
  await expect(
    page.getByTestId('cosmetic-backdrop').locator(`img[src="${BACKGROUND_URL}"]`),
  ).toHaveCount(1);
  // The author's name stays readable on top of the background.
  await expect(
    page.getByTestId('cosmetic-backdrop').getByRole('heading', { name: 'Ana Pérez' }),
  ).toBeVisible();
});

test('should keep a feed post without cosmetics as it was', async ({ page }) => {
  await mockStudentSession(page);
  await failUnmockedApiCalls(page);
  await mockApi(page, /\/api\/v1\/feed\//, {
    count: 1,
    next: null,
    previous: null,
    // An older backend sends no cosmetic fields at all.
    results: [post(1, { id: 'user-ana', first_name: 'Ana', last_name: 'Pérez', avatar_url: '' })],
  });
  await page.goto('/feed');

  await expect(page.getByRole('heading', { name: 'Ana Pérez' })).toBeVisible();
  await expect(page.getByTestId('avatar-frame')).toHaveCount(0);
  await expect(page.getByTestId('cosmetic-backdrop')).toHaveCount(0);
});
