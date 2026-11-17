import { expect, test } from '@playwright/test';
import { mockStudentSession } from './helpers/auth';
import { PIXEL_PNG } from './helpers/images';

const STABLE_IMAGE_URL = 'https://images.greeniteso.test/api/v1/uploads/user-1/foto.png';

// Mirrors UPLOAD_ENDPOINT in src/lib/api/upload.ts (specs cannot import it: it pulls in Vite env).
const UPLOAD_PATH = '/api/v1/uploads/';
const UPLOAD_ROUTE = `**${UPLOAD_PATH}**`;

// 2×2 navy PNG, so a second preview cannot be confused with the 1×1 PIXEL_PNG.
const SQUARE_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAD0lEQVR4nGNgaGAAIQgFAA4OAgFhGn2EAAAAAElFTkSuQmCC',
  'base64',
);

test('should upload an image to /api/v1/uploads/ and create a feed post with the returned URL', async ({
  page,
}) => {
  await mockStudentSession(page);

  let uploadedFieldName: string | null = null;
  let createdPostPayload: Record<string, unknown> | null = null;

  await page.route(STABLE_IMAGE_URL, route =>
    route.fulfill({ status: 200, contentType: 'image/png', body: PIXEL_PNG }),
  );

  await page.route(UPLOAD_ROUTE, async route => {
    const body = route.request().postDataBuffer()?.toString('latin1') ?? '';
    if (body.includes('name="image"')) {
      uploadedFieldName = 'image';
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ url: STABLE_IMAGE_URL }),
    });
  });

  await page.route('**/api/**/feed/**', async route => {
    if (route.request().method() === 'POST') {
      createdPostPayload = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 99,
          author_id: 'user-1',
          author: {
            id: 'user-1',
            first_name: 'Emilio',
            last_name: 'Maciel',
            avatar_url: '',
          },
          post_type: 'SHARED_EVIDENCE',
          content: createdPostPayload.content,
          image_url: createdPostPayload.image_url,
          badge_info: null,
          created_at: '2026-11-06T12:00:00Z',
          updated_at: '2026-11-06T12:00:00Z',
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ count: 0, next: null, previous: null, results: [] }),
    });
  });

  await page.goto('/feed');

  await page
    .getByPlaceholder('¿Qué acción sostenible realizaste hoy?')
    .fill('Separé residuos en casa');
  await page.getByRole('button', { name: /Añadir imagen/i }).click();

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: 'evidencia.png',
    mimeType: 'image/png',
    buffer: PIXEL_PNG,
  });

  await expect(page.getByAltText('Previsualización de evidencia')).toBeVisible();

  await page.getByRole('button', { name: 'Publicar' }).click();

  await expect.poll(() => uploadedFieldName).toBe('image');
  await expect
    .poll(() => createdPostPayload)
    .toMatchObject({
      content: 'Separé residuos en casa',
      post_type: 'SHARED_EVIDENCE',
      image_url: STABLE_IMAGE_URL,
    });
});

test('should display the backend error message and not create a post when upload fails', async ({
  page,
}) => {
  await mockStudentSession(page);

  let postCreatedCalled = false;

  await page.route(UPLOAD_ROUTE, route =>
    route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({
        error: 'La imagen debe ser un JPG, PNG o WEBP válido de máximo 5 MB.',
      }),
    }),
  );

  await page.route('**/api/**/feed/**', async route => {
    if (route.request().method() === 'POST') {
      postCreatedCalled = true;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ count: 0, next: null, previous: null, results: [] }),
    });
  });

  await page.goto('/feed');

  await page
    .getByPlaceholder('¿Qué acción sostenible realizaste hoy?')
    .fill('Intento con imagen dañada');
  await page.getByRole('button', { name: /Añadir imagen/i }).click();

  await page.locator('input[type="file"]').setInputFiles({
    name: 'corrupta.png',
    mimeType: 'image/png',
    buffer: PIXEL_PNG,
  });

  await page.getByRole('button', { name: 'Publicar' }).click();

  await expect(
    page.getByText('La imagen debe ser un JPG, PNG o WEBP válido de máximo 5 MB.'),
  ).toBeVisible();
  expect(postCreatedCalled).toBe(false);
});

test('should show a network error in Spanish and not create a post when the upload cannot connect', async ({
  page,
}) => {
  await mockStudentSession(page);

  let postCreatedCalled = false;
  let abortedUploads = 0;

  await page.route('**/api/**/feed/**', async route => {
    if (route.request().method() === 'POST') {
      postCreatedCalled = true;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ count: 0, next: null, previous: null, results: [] }),
    });
  });

  // Registered last so it takes precedence over any broader route that could also match.
  await page.route(UPLOAD_ROUTE, async route => {
    abortedUploads += 1;
    await route.abort('failed');
  });

  await page.goto('/feed');

  await page.getByPlaceholder('¿Qué acción sostenible realizaste hoy?').fill('Intento sin red');
  await page.getByRole('button', { name: /Añadir imagen/i }).click();

  await page.locator('input[type="file"]').setInputFiles({
    name: 'evidencia.png',
    mimeType: 'image/png',
    buffer: PIXEL_PNG,
  });

  await page.getByRole('button', { name: 'Publicar' }).click();

  await expect(
    page.getByText('Error de red al subir la imagen. Revisa tu conexión e inténtalo de nuevo.'),
  ).toBeVisible();
  await expect(page.getByText(/Failed to fetch/i)).toHaveCount(0);
  expect(abortedUploads).toBe(1);
  expect(postCreatedCalled).toBe(false);
});

test('should tell the user their session expired, not show the API detail, when the upload gets a 401', async ({
  page,
}) => {
  await mockStudentSession(page);

  let uploadAttempts = 0;
  let refreshAttempts = 0;
  let postCreatedCalled = false;

  await page.route('**/api/**/feed/**', async route => {
    if (route.request().method() === 'POST') {
      postCreatedCalled = true;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ count: 0, next: null, previous: null, results: [] }),
    });
  });

  // SimpleJWT rejects both the access token and the refresh token, as when the session is over.
  await page.route('**/api/v1/auth/refresh/', async route => {
    refreshAttempts += 1;
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'Token is invalid or expired', code: 'token_not_valid' }),
    });
  });

  await page.route(UPLOAD_ROUTE, async route => {
    uploadAttempts += 1;
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({
        detail: 'Given token not valid for any token type',
        code: 'token_not_valid',
      }),
    });
  });

  await page.goto('/feed');

  await page
    .getByPlaceholder('¿Qué acción sostenible realizaste hoy?')
    .fill('Intento con sesión vencida');
  await page.getByRole('button', { name: /Añadir imagen/i }).click();

  await page.locator('input[type="file"]').setInputFiles({
    name: 'evidencia.png',
    mimeType: 'image/png',
    buffer: PIXEL_PNG,
  });

  await page.getByRole('button', { name: 'Publicar' }).click();

  await expect(
    page.getByText('Tu sesión expiró. Vuelve a iniciar sesión e inténtalo de nuevo.'),
  ).toBeVisible();
  await expect(page.getByText(/token/i)).toHaveCount(0);
  await expect(page.getByText(/Error de red/i)).toHaveCount(0);
  expect(uploadAttempts).toBe(1);
  expect(refreshAttempts).toBe(1);
  expect(postCreatedCalled).toBe(false);
});

test('should revoke the removed preview and show the newly chosen image', async ({ page }) => {
  await mockStudentSession(page);
  await page.route('**/api/**/feed/**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ count: 0, next: null, previous: null, results: [] }),
    }),
  );

  await page.goto('/feed');
  await page.getByRole('button', { name: /Añadir imagen/i }).click();

  const fileInput = page.locator('input[type="file"]');
  const preview = page.getByAltText('Previsualización de evidencia');
  await fileInput.setInputFiles({ name: 'uno.png', mimeType: 'image/png', buffer: PIXEL_PNG });
  await expect(preview).toBeVisible();
  const firstUrl = await preview.getAttribute('src');
  expect(firstUrl).toMatch(/^blob:/);

  await page.getByRole('button', { name: 'Eliminar imagen seleccionada' }).click();
  await expect(preview).toHaveCount(0);

  // A revoked blob URL can no longer be fetched; one that leaked still resolves.
  const firstUrlStillLoads = (url: string) =>
    page.evaluate(
      blobUrl =>
        fetch(blobUrl).then(
          () => true,
          () => false,
        ),
      url,
    );
  await expect.poll(() => firstUrlStillLoads(firstUrl ?? '')).toBe(false);

  await fileInput.setInputFiles({ name: 'dos.png', mimeType: 'image/png', buffer: SQUARE_PNG });
  await expect(preview).toBeVisible();
  await expect(preview).not.toHaveAttribute('src', firstUrl ?? '');
  // 2 px wide means the preview shows the second file, not a stale copy of the first.
  await expect
    .poll(() => preview.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth))
    .toBe(2);
});
