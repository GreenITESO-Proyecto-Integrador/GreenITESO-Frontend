import type { Page } from '@playwright/test';

/**
 * 1×1 transparent PNG, served for every image URL a test treats as reachable.
 */
export const PIXEL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

/** Frame and background addresses the cosmetics tests serve. */
export const FRAME_URL = 'https://images.greeniteso.test/frame.png';
export const BACKGROUND_URL = 'https://images.greeniteso.test/background.png';

/** Serve a pixel for every image on the cosmetics test host. */
export async function mockCosmeticImages(page: Page) {
  await page.route('https://images.greeniteso.test/**', route =>
    route.fulfill({ status: 200, contentType: 'image/png', body: PIXEL_PNG }),
  );
}
