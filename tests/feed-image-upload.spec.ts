import { expect, test } from '@playwright/test';
import { mockStudentSession } from './helpers/auth';
import { PIXEL_PNG } from './helpers/images';

const STABLE_IMAGE_URL = 'https://images.greeniteso.test/api/v1/uploads/user-1/foto.png';

test('should upload an image to /api/v1/uploads/ and create a feed post with the returned URL', async ({
  page,
}) => {
  await mockStudentSession(page);

  let uploadedFieldName: string | null = null;
  let createdPostPayload: Record<string, unknown> | null = null;

  await page.route(STABLE_IMAGE_URL, route =>
    route.fulfill({ status: 200, contentType: 'image/png', body: PIXEL_PNG }),
  );

  await page.route('**/api/v1/uploads/**', async route => {
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

  await page.route('**/api/v1/uploads/**', route =>
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

  await page.route('**/api/v1/uploads/**', route => route.abort('failed'));

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
  expect(postCreatedCalled).toBe(false);
});

test('should show a fresh, loadable preview after removing an image and choosing another', async ({
  page,
}) => {
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

  await page.getByRole('button', { name: 'Eliminar imagen seleccionada' }).click();
  await expect(preview).toHaveCount(0);

  // The cleanup effect revoked the first URL; the new one must still load.
  await fileInput.setInputFiles({ name: 'dos.png', mimeType: 'image/png', buffer: PIXEL_PNG });
  await expect(preview).toBeVisible();
  await expect(preview).not.toHaveAttribute('src', firstUrl ?? '');
  await expect
    .poll(() => preview.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth))
    .toBeGreaterThan(0);
});
