import { expect, test } from '@playwright/test';
import { failUnmockedApiCalls, mockJsonApi } from './helpers/api';
import { mockStudentSession } from './helpers/auth';
import { BACKGROUND_URL, FRAME_URL, mockCosmeticImages } from './helpers/images';

test("should show each member's frame and background in the clan roster", async ({ page }) => {
  await mockStudentSession(page);
  await failUnmockedApiCalls(page);
  await mockCosmeticImages(page);
  await mockJsonApi(page, /\/api\/v1\/clans\/clan-eco\/$/, {
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
  const background = page.getByTestId('cosmetic-background');
  await expect(background).toHaveCount(1);
  await expect(background).toHaveAttribute('src', BACKGROUND_URL);
  // It sits in Ana's own row, with her name on top.
  await expect(background.locator('..').getByText('Ana')).toBeVisible();
});
