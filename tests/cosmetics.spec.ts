import { expect, test } from '@playwright/test';
import { failUnmockedApiCalls, mockJsonApi } from './helpers/api';
import { mockStudentSession } from './helpers/auth';
import { BACKGROUND_URL, FRAME_URL, mockCosmeticImages } from './helpers/images';

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
  await mockCosmeticImages(page);
  await mockJsonApi(page, /\/api\/v1\/feed\//, {
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
  await expect(page.getByTestId('cosmetic-background')).toHaveCount(1);
  await expect(page.getByTestId('cosmetic-background')).toHaveAttribute('src', BACKGROUND_URL);
  // The background goes in the author's own header, with no extra wrapper around it.
  const header = page.getByTestId('cosmetic-background').locator('..');
  await expect(header.getByRole('heading', { name: 'Ana Pérez' })).toBeVisible();
});

test('should keep a feed post without cosmetics as it was', async ({ page }) => {
  await mockStudentSession(page);
  await failUnmockedApiCalls(page);
  await mockJsonApi(page, /\/api\/v1\/feed\//, {
    count: 1,
    next: null,
    previous: null,
    // An older backend sends no cosmetic fields at all.
    results: [post(1, { id: 'user-ana', first_name: 'Ana', last_name: 'Pérez', avatar_url: '' })],
  });
  await page.goto('/feed');

  await expect(page.getByRole('heading', { name: 'Ana Pérez' })).toBeVisible();
  await expect(page.getByTestId('avatar-frame')).toHaveCount(0);
  await expect(page.getByTestId('cosmetic-background')).toHaveCount(0);
});

test('should drop a frame and a background that are not https images', async ({ page }) => {
  await mockStudentSession(page);
  await failUnmockedApiCalls(page);
  const requested: string[] = [];
  page.on('request', request => requested.push(request.url()));
  await mockJsonApi(page, /\/api\/v1\/feed\//, {
    count: 1,
    next: null,
    previous: null,
    results: [
      post(1, {
        id: 'user-ana',
        first_name: 'Ana',
        last_name: 'Pérez',
        avatar_url: '',
        frame_url: 'http://tracker.greeniteso.test/frame.png',
        background_url: 'javascript:alert(1)',
      }),
    ],
  });
  await page.goto('/feed');

  await expect(page.getByRole('heading', { name: 'Ana Pérez' })).toBeVisible();
  await expect(page.getByTestId('avatar-frame')).toHaveCount(0);
  await expect(page.getByTestId('cosmetic-background')).toHaveCount(0);
  expect(requested.some(url => url.includes('tracker.greeniteso.test'))).toBe(false);
});

test('should hide the frame and the background when their images fail to load', async ({
  page,
}) => {
  await mockStudentSession(page);
  await failUnmockedApiCalls(page);
  await page.route('https://images.greeniteso.test/**', route => route.abort());
  await mockJsonApi(page, /\/api\/v1\/feed\//, {
    count: 1,
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
    ],
  });
  await page.goto('/feed');

  await expect(page.getByRole('heading', { name: 'Ana Pérez' })).toBeVisible();
  await expect(page.getByTestId('avatar-frame')).toHaveCount(0);
  await expect(page.getByTestId('cosmetic-background')).toHaveCount(0);
});
