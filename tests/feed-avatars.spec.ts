import { expect, test } from '@playwright/test';
import { mockStudentSession } from './helpers/auth';
import { PIXEL_PNG } from './helpers/images';

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

test("should show each author's profile photo, or their initials without one", async ({ page }) => {
  await mockStudentSession(page);
  await page.route('https://images.greeniteso.test/**', route =>
    route.fulfill({ status: 200, contentType: 'image/png', body: PIXEL_PNG }),
  );
  await page.route('**/api/v1/feed/**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        count: 2,
        next: null,
        previous: null,
        results: [
          post(1, {
            id: 'user-ana',
            first_name: 'Ana',
            last_name: 'Pérez',
            avatar_url: 'https://images.greeniteso.test/ana.png',
          }),
          post(2, { id: 'user-luis', first_name: 'Luis', last_name: 'Gómez', avatar_url: '' }),
        ],
      }),
    }),
  );
  await page.goto('/feed');

  await expect(page.getByRole('img', { name: 'Ana Pérez' })).toHaveAttribute(
    'src',
    'https://images.greeniteso.test/ana.png',
  );
  await expect(page.getByText('LG', { exact: true })).toBeVisible();
});
