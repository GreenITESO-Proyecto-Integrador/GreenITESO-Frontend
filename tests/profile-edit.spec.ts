import { expect, test, type Page } from '@playwright/test';
import { mockStudentSession } from './helpers/auth';

const profileUrl = '**/api/v1/profile/me/**';

const initialProfileData = {
  user_id: 'user-uuid-123',
  email: 'usuario.test@iteso.mx',
  first_name: 'Mariana',
  last_name: 'García',
  role: 'STUDENT',
  visibility: 'PUBLIC',
  total_points: 350,
  available_points: 120,
  current_streak: 7,
  level: 3,
  badges: [],
  impact_metrics: {
    co2_kg: '42.500',
    water_liters: '850.000',
    plastic_kg: '15.250',
  },
  finished_campaigns: [],
  bio: 'Comprometida con el reciclaje y la movilidad activa',
  avatar_url: 'https://example.com/avatar.jpg',
  preferences: {
    notify_impact: true,
    notify_campaigns: true,
    theme: 'system',
  },
  institutional_clan: null,
  active_private_clan: null,
};

async function setupProfile(page: Page, profile = initialProfileData) {
  await mockStudentSession(page, {
    id: profile.user_id,
    email: profile.email,
    firstName: profile.first_name,
    lastName: profile.last_name,
  });

  await page.route(profileUrl, async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(profile),
      });
    }
  });

  await page.goto('/profile');
}

test.describe('Profile Editing (T2-23)', () => {
  test('should open edit profile modal with current data', async ({ page }) => {
    await setupProfile(page);

    const editBtn = page.getByRole('button', { name: 'Editar perfil' });
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    // Modal opens
    await expect(page.getByRole('heading', { name: 'Editar perfil' })).toBeVisible();
    await expect(
      page.getByText(
        'Personaliza tu información pública, tu avatar y tus preferencias ecológicas.',
      ),
    ).toBeVisible();

    // Bio field shows current bio and char counter
    const bioTextarea = page.getByLabel('Biografía');
    await expect(bioTextarea).toHaveValue('Comprometida con el reciclaje y la movilidad activa');
    await expect(page.getByText(/\d+ \/ 500/)).toBeVisible();

    // Visibility options visible
    await expect(page.getByText('Público', { exact: true })).toBeVisible();
    await expect(page.getByText('Privado', { exact: true })).toBeVisible();

    // Cancel closes the modal
    await page.getByRole('button', { name: 'Cancelar' }).click();
    await expect(page.getByRole('heading', { name: 'Editar perfil' })).not.toBeVisible();
  });

  test('should validate bio max length', async ({ page }) => {
    await setupProfile(page);

    await page.getByRole('button', { name: 'Editar perfil' }).click();

    const bioTextarea = page.getByLabel('Biografía');
    // Fill with 501 characters
    const longBio = 'a'.repeat(501);
    await bioTextarea.fill(longBio);

    await expect(page.getByText('501 / 500')).toBeVisible();
    await expect(page.getByText('La biografía no puede exceder los 500 caracteres.')).toBeVisible();

    // Submit button should be disabled
    const saveButton = page.getByRole('button', { name: 'Guardar cambios' });
    await expect(saveButton).toBeDisabled();
  });

  test('should validate avatar file size and type', async ({ page }) => {
    await setupProfile(page);

    await page.getByRole('button', { name: 'Editar perfil' }).click();

    // Test invalid mime type (e.g. text/plain or pdf)
    const fileInput = page.locator('#avatar-file-input');
    await fileInput.setInputFiles({
      name: 'document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('dummy-content'),
    });

    await expect(
      page.getByText('Formato no válido. Usa una imagen JPG, PNG o WEBP.'),
    ).toBeVisible();

    // Test file larger than 5MB
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024);
    await fileInput.setInputFiles({
      name: 'large-image.jpg',
      mimeType: 'image/jpeg',
      buffer: largeBuffer,
    });

    await expect(page.getByText('La imagen no puede exceder los 5 MB.')).toBeVisible();
  });

  test('should preview avatar file when valid image is selected and allow removal', async ({
    page,
  }) => {
    await setupProfile(page);

    await page.getByRole('button', { name: 'Editar perfil' }).click();

    const fileInput = page.locator('#avatar-file-input');
    const validImageBuffer = Buffer.from('fake-image-bytes');
    await fileInput.setInputFiles({
      name: 'my-avatar.png',
      mimeType: 'image/png',
      buffer: validImageBuffer,
    });

    // File name and size displayed
    await expect(page.getByText('my-avatar.png')).toBeVisible();

    // Remove avatar button
    const removeBtn = page.getByRole('button', { name: 'Quitar' });
    await expect(removeBtn).toBeVisible();
    await removeBtn.click();

    // File details and remove button disappear
    await expect(page.getByText('my-avatar.png')).not.toBeVisible();
  });

  test('should save profile changes and update UI immediately', async ({ page }) => {
    await setupProfile(page);

    // Prepare route handler for PATCH
    let patchPayload: unknown = null;
    await page.route(profileUrl, async route => {
      if (route.request().method() === 'PATCH') {
        patchPayload = JSON.parse(route.request().postData() || '{}');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...initialProfileData,
            bio: 'Nueva bio ecológica actualizada para el reto ITESO.',
            visibility: 'PRIVATE',
            avatar_url: '',
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(initialProfileData),
        });
      }
    });

    await page.getByRole('button', { name: 'Editar perfil' }).click();

    // Modify bio
    const bioTextarea = page.getByLabel('Biografía');
    await bioTextarea.fill('Nueva bio ecológica actualizada para el reto ITESO.');

    // Switch to Private
    await page.getByText('Privado', { exact: true }).click();

    // Remove photo to clear avatar
    const removeBtn = page.getByRole('button', { name: 'Quitar' });
    if (await removeBtn.isVisible()) {
      await removeBtn.click();
    }

    // Submit form
    await page.getByRole('button', { name: 'Guardar cambios' }).click();

    // Verify payload sent
    expect(patchPayload).toMatchObject({
      bio: 'Nueva bio ecológica actualizada para el reto ITESO.',
      visibility: 'PRIVATE',
    });

    // Modal automatically closes and UI updates with new data
    await expect(page.getByRole('heading', { name: 'Editar perfil' })).not.toBeVisible();
    await expect(
      page.getByText('Nueva bio ecológica actualizada para el reto ITESO.'),
    ).toBeVisible();
    await expect(page.getByText('Perfil Privado')).toBeVisible();
  });

  test('should display clear error message when PATCH request fails', async ({ page }) => {
    await setupProfile(page);

    await page.route(profileUrl, async route => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'La URL del avatar no cumple con las políticas de seguridad.',
            },
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(initialProfileData),
        });
      }
    });

    await page.getByRole('button', { name: 'Editar perfil' }).click();

    await page.getByRole('button', { name: 'Guardar cambios' }).click();

    // Error banner should be rendered
    await expect(
      page.getByText('La URL del avatar no cumple con las políticas de seguridad.'),
    ).toBeVisible();

    // Modal stays open
    await expect(page.getByRole('heading', { name: 'Editar perfil' })).toBeVisible();
  });
});
