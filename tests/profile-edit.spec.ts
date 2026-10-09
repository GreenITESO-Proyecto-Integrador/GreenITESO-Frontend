import { expect, test, type Page } from '@playwright/test';
import { mockStudentSession } from './helpers/auth';

const profileUrl = '**/api/v1/profile/me/**';
const imageHost = 'https://images.greeniteso.test';

// 1×1 transparent PNG, served for every image URL the tests treat as reachable.
const PIXEL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

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
  avatar_url: `${imageHost}/current.jpg`,
  preferences: {
    notify_impact: true,
    notify_campaigns: true,
    theme: 'dark',
  },
  institutional_clan: null,
  active_private_clan: null,
};

type ProfilePayload = typeof initialProfileData;

interface MockProfileOptions {
  profile?: Partial<ProfilePayload>;
  /** Respond to PATCH with this status and body instead of applying the change. */
  patchError?: { status: number; body: unknown };
}

/**
 * Fakes the profile API with server-side state: a PATCH is merged into the
 * stored profile, so a later GET (e.g. after a reload) returns what was saved.
 */
async function setupProfile(page: Page, options: MockProfileOptions = {}) {
  let stored: ProfilePayload = { ...initialProfileData, ...options.profile };
  const patches: Record<string, unknown>[] = [];

  await mockStudentSession(page, {
    id: stored.user_id,
    email: stored.email,
    firstName: stored.first_name,
    lastName: stored.last_name,
  });

  await page.route(`${imageHost}/**`, async route => {
    if (new URL(route.request().url()).pathname.startsWith('/missing')) {
      await route.fulfill({ status: 404, body: '' });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'image/png', body: PIXEL_PNG });
  });

  await page.route(profileUrl, async route => {
    const method = route.request().method();
    if (method === 'PATCH') {
      const body = JSON.parse(route.request().postData() || '{}') as Record<string, unknown>;
      patches.push(body);
      if (options.patchError) {
        await route.fulfill({
          status: options.patchError.status,
          contentType: 'application/json',
          body: JSON.stringify(options.patchError.body),
        });
        return;
      }
      stored = { ...stored, ...body } as ProfilePayload;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(stored),
    });
  });

  await page.goto('/profile');
  return { patches };
}

async function openEditor(page: Page) {
  await page.getByRole('button', { name: 'Editar perfil' }).click();
  await expect(page.getByRole('heading', { name: 'Editar perfil' })).toBeVisible();
}

test.describe('Profile Editing (T2-23)', () => {
  test('should open edit profile modal with current data', async ({ page }) => {
    await setupProfile(page);
    await openEditor(page);

    await expect(
      page.getByText(
        'Personaliza tu información pública, tu avatar y tus preferencias ecológicas.',
      ),
    ).toBeVisible();

    // Bio field shows current bio and char counter
    await expect(page.getByLabel('Biografía')).toHaveValue(
      'Comprometida con el reciclaje y la movilidad activa',
    );
    await expect(page.getByText(/\d+ \/ 500/)).toBeVisible();

    // Current avatar URL is prefilled and previewed
    await expect(page.getByLabel('Foto de perfil')).toHaveValue(`${imageHost}/current.jpg`);
    await expect(page.getByAltText('Previsualización')).toBeVisible();

    // Visibility options visible
    await expect(page.getByText('Público', { exact: true })).toBeVisible();
    await expect(page.getByText('Privado', { exact: true })).toBeVisible();

    // Cancel closes the modal
    await page.getByRole('button', { name: 'Cancelar' }).click();
    await expect(page.getByRole('heading', { name: 'Editar perfil' })).not.toBeVisible();
  });

  test('should validate bio max length', async ({ page }) => {
    await setupProfile(page);
    await openEditor(page);

    await page.getByLabel('Biografía').fill('a'.repeat(501));

    await expect(page.getByText('501 / 500')).toBeVisible();
    await expect(page.getByText('La biografía no puede exceder los 500 caracteres.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled();
  });

  test('should no longer offer a file picker that cannot upload', async ({ page }) => {
    await setupProfile(page);
    await openEditor(page);

    await expect(page.locator('input[type="file"]')).toHaveCount(0);
    await expect(page.getByText(/La subida de archivos llegará/)).toBeVisible();
  });

  test('should reject avatar URLs the backend would refuse', async ({ page }) => {
    const { patches } = await setupProfile(page);
    await openEditor(page);

    const avatarInput = page.getByLabel('Foto de perfil');
    const saveButton = page.getByRole('button', { name: 'Guardar cambios' });

    await avatarInput.fill(`http://images.greeniteso.test/new.jpg`);
    await expect(page.getByText('La URL de la foto debe usar https://.')).toBeVisible();
    await expect(saveButton).toBeDisabled();

    await avatarInput.fill(`${imageHost}/new.gif`);
    await expect(
      page.getByText('La URL de la foto debe terminar en .jpg, .jpeg, .png o .webp.'),
    ).toBeVisible();
    await expect(saveButton).toBeDisabled();

    await avatarInput.fill('no es una url');
    await expect(page.getByText('Ingresa una URL válida.')).toBeVisible();
    await expect(saveButton).toBeDisabled();

    expect(patches).toHaveLength(0);
  });

  test('should not save an avatar URL whose image cannot be loaded', async ({ page }) => {
    const { patches } = await setupProfile(page);
    await openEditor(page);

    await page.getByLabel('Foto de perfil').fill(`${imageHost}/missing.png`);

    await expect(
      page.getByText('No se pudo cargar la imagen. Verifica que el enlace sea público.'),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled();
    expect(patches).toHaveLength(0);
  });

  test('should save a new avatar URL and still show it after a reload', async ({ page }) => {
    const { patches } = await setupProfile(page);
    await openEditor(page);

    const newAvatar = `${imageHost}/new-avatar.webp`;
    await page.getByLabel('Foto de perfil').fill(newAvatar);
    await expect(page.getByAltText('Previsualización')).toHaveAttribute('src', newAvatar);
    await expect(page.getByAltText('Previsualización')).toBeVisible();

    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page.getByText('¡Perfil actualizado correctamente!')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Editar perfil' })).not.toBeVisible();

    expect(patches).toHaveLength(1);
    expect(patches[0]).toMatchObject({ avatar_url: newAvatar });

    await page.reload();
    const headerAvatar = page.getByRole('img', { name: 'Mariana García' });
    await expect(headerAvatar).toHaveAttribute('src', newAvatar);
    await expect(headerAvatar).toBeVisible();
  });

  test('should clear the avatar and fall back to initials', async ({ page }) => {
    const { patches } = await setupProfile(page);
    await openEditor(page);

    await page.getByRole('button', { name: 'Quitar' }).click();
    await expect(page.getByLabel('Foto de perfil')).toHaveValue('');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page.getByRole('heading', { name: 'Editar perfil' })).not.toBeVisible();

    expect(patches[0]).toMatchObject({ avatar_url: '' });
    await expect(page.getByRole('img', { name: 'Mariana García' })).toHaveCount(0);
    await expect(page.getByRole('main').getByText('MG', { exact: true })).toBeVisible();
  });

  test('should let other fields be saved when the stored avatar is broken', async ({ page }) => {
    const { patches } = await setupProfile(page, {
      profile: { avatar_url: `${imageHost}/missing-old.jpg` },
    });

    // The header falls back to initials instead of an empty box.
    await expect(page.getByRole('main').getByText('MG', { exact: true })).toBeVisible();

    await openEditor(page);
    await page.getByLabel('Biografía').fill('Solo cambio mi biografía.');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page.getByRole('heading', { name: 'Editar perfil' })).not.toBeVisible();

    // The untouched avatar is not re-sent.
    expect(patches[0]).toMatchObject({ bio: 'Solo cambio mi biografía.' });
    expect(patches[0]).not.toHaveProperty('avatar_url');
  });

  test('should save profile changes and update UI immediately', async ({ page }) => {
    const { patches } = await setupProfile(page);
    await openEditor(page);

    await page.getByLabel('Biografía').fill('Nueva bio ecológica actualizada para el reto ITESO.');
    await page.getByText('Privado', { exact: true }).click();
    await page.getByText('Nuevas campañas').click();

    await page.getByRole('button', { name: 'Guardar cambios' }).click();

    // The success message stays visible until the modal closes.
    await expect(page.getByText('¡Perfil actualizado correctamente!')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Editar perfil' })).not.toBeVisible();

    expect(patches[0]).toEqual({
      bio: 'Nueva bio ecológica actualizada para el reto ITESO.',
      visibility: 'PRIVATE',
      // Keys the form doesn't edit (theme) are preserved.
      preferences: { notify_impact: true, notify_campaigns: false, theme: 'dark' },
    });

    await expect(
      page.getByText('Nueva bio ecológica actualizada para el reto ITESO.'),
    ).toBeVisible();
    await expect(page.getByText('Perfil Privado')).toBeVisible();
  });

  test('should show the backend field error in Spanish when the PATCH fails', async ({ page }) => {
    await setupProfile(page, {
      patchError: { status: 400, body: { avatar_url: ['avatar_url must use https.'] } },
    });
    await openEditor(page);

    await page.getByLabel('Biografía').fill('Bio nueva');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();

    await expect(page.getByRole('alert')).toContainText('La URL de la foto debe usar https://.');
    // Modal stays open and the profile keeps its previous bio
    await expect(page.getByRole('heading', { name: 'Editar perfil' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancelar' }).click();
    await expect(
      page.getByText('Comprometida con el reciclaje y la movilidad activa'),
    ).toBeVisible();
  });

  test('should reset unsaved edits when the modal is reopened', async ({ page }) => {
    await setupProfile(page);
    await openEditor(page);

    await page.getByLabel('Biografía').fill('Borrador sin guardar');
    await page.getByLabel('Foto de perfil').fill(`${imageHost}/draft.png`);
    await page.getByRole('button', { name: 'Cancelar' }).click();

    await openEditor(page);
    await expect(page.getByLabel('Biografía')).toHaveValue(
      'Comprometida con el reciclaje y la movilidad activa',
    );
    await expect(page.getByLabel('Foto de perfil')).toHaveValue(`${imageHost}/current.jpg`);
  });
});
