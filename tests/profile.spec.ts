import { expect, test, type Page } from '@playwright/test';
import { mockStudentSession } from './helpers/auth';

const profileUrl = '**/api/v1/profile/me/**';

const fullProfileData = {
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
  badges: [
    {
      id: 'badge-1',
      name: 'Pionero Verde',
      description: 'Primera acción sustentable verificada',
      unlocked_at: '2026-09-15T10:00:00Z',
    },
    {
      id: 'badge-2',
      name: 'Racha Semanal',
      description: '7 días seguidos realizando acciones ecológicas',
      unlocked_at: '2026-09-22T12:30:00Z',
    },
  ],
  impact_metrics: {
    co2_kg: '42.500',
    water_liters: '850.000',
    plastic_kg: '15.250',
  },
  finished_campaigns: [
    {
      id: 'camp-1',
      title: 'Reto Basura Cero ITESO',
      end_date: '2026-09-20T23:59:59Z',
    },
    {
      id: 'camp-2',
      title: 'Reforestación Bosque La Primavera',
      end_date: '2026-08-30T18:00:00Z',
    },
  ],
  institutional_clan: {
    id: 'clan-inst-1',
    name: 'Ingeniería en Sistemas Computacionales',
  },
  active_private_clan: {
    id: 'clan-priv-1',
    name: 'EcoDevelopers',
  },
};

const emptyProfileData = {
  user_id: 'user-uuid-456',
  email: 'nuevo.usuario@iteso.mx',
  first_name: 'Carlos',
  last_name: 'López',
  role: 'STUDENT',
  visibility: 'PRIVATE',
  total_points: 0,
  available_points: 0,
  current_streak: 0,
  level: null,
  badges: [],
  impact_metrics: {
    co2_kg: 0,
    water_liters: 0,
    plastic_kg: 0,
  },
  finished_campaigns: [],
  institutional_clan: null,
  active_private_clan: null,
};

async function mockProfileEndpoint(page: Page, data: unknown, status = 200) {
  await page.route(profileUrl, async route => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(data),
    });
  });
}

test.describe('Ecological Profile Page (T2-22)', () => {
  test('should redirect unauthenticated users to /login', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'Inicia sesión' })).toBeVisible();
  });

  test('should display full ecological profile with all sections and metrics', async ({ page }) => {
    await mockStudentSession(page, {
      id: fullProfileData.user_id,
      email: fullProfileData.email,
      firstName: fullProfileData.first_name,
      lastName: fullProfileData.last_name,
    });
    await mockProfileEndpoint(page, fullProfileData);

    await page.goto('/profile');

    // User identity & Role
    await expect(page.getByRole('heading', { name: 'Mariana García' })).toBeVisible();
    await expect(page.getByText('usuario.test@iteso.mx')).toBeVisible();
    await expect(page.getByText('Estudiante')).toBeVisible();

    // Visibility Badge (PUBLIC)
    await expect(page.getByText('Perfil Público')).toBeVisible();
    await expect(
      page.getByText('Visible para la comunidad ITESO en tablas de clasificación.'),
    ).toBeVisible();

    // Progress Section (Points, Available, Streak, Level)
    await expect(page.getByText('350')).toBeVisible();
    await expect(page.getByText('PUNTOS TOTALES')).toBeVisible();
    await expect(page.getByText('120')).toBeVisible();
    await expect(page.getByText('DISPONIBLES')).toBeVisible();
    await expect(page.getByText('7', { exact: true })).toBeVisible();
    await expect(page.getByText('DÍAS DE RACHA')).toBeVisible();
    await expect(page.getByText('NIVEL 3')).toBeVisible();

    // Impact Metrics Section
    await expect(page.getByText('CO₂ Evitado')).toBeVisible();
    await expect(page.getByText('42.5 kg')).toBeVisible();
    await expect(page.getByText('Agua Ahorrada')).toBeVisible();
    await expect(page.getByText('850 L')).toBeVisible();
    await expect(page.getByText('Plástico Reciclado')).toBeVisible();
    await expect(page.getByText('15.25 kg')).toBeVisible();

    // Clans Section
    await expect(page.getByText('Clan Institucional')).toBeVisible();
    await expect(page.getByText('Ingeniería en Sistemas Computacionales')).toBeVisible();
    await expect(page.getByText('Clan Privado Activo')).toBeVisible();
    await expect(page.getByText('EcoDevelopers')).toBeVisible();

    // Badges Section
    await expect(page.getByText('Pionero Verde')).toBeVisible();
    await expect(page.getByText('Primera acción sustentable verificada')).toBeVisible();
    await expect(page.getByText('Racha Semanal')).toBeVisible();

    // Campaigns Section
    await expect(page.getByText('Reto Basura Cero ITESO')).toBeVisible();
    await expect(page.getByText('Reforestación Bosque La Primavera')).toBeVisible();
  });

  test('should gracefully handle empty states for badges, clans, and campaigns', async ({
    page,
  }) => {
    await mockStudentSession(page, {
      id: emptyProfileData.user_id,
      email: emptyProfileData.email,
      firstName: emptyProfileData.first_name,
      lastName: emptyProfileData.last_name,
    });
    await mockProfileEndpoint(page, emptyProfileData);

    await page.goto('/profile');

    // User identity
    await expect(page.getByRole('heading', { name: 'Carlos López' })).toBeVisible();

    // Respect Private Visibility
    await expect(page.getByText('Perfil Privado')).toBeVisible();
    await expect(
      page.getByText('Configuración privada activa: tus métricas solo son visibles por ti.'),
    ).toBeVisible();

    // Placeholder level when null
    await expect(page.getByText('SIN NIVEL')).toBeVisible();

    // Empty clans
    await expect(page.getByText('Sin clanes asociados')).toBeVisible();

    // Empty badges
    await expect(page.getByRole('heading', { name: 'Aún no tienes insignias' })).toBeVisible();

    // Empty campaigns
    await expect(page.getByRole('heading', { name: 'Sin campañas finalizadas' })).toBeVisible();
  });

  test('should show error banner when profile request fails and recover on retry', async ({
    page,
  }) => {
    await mockStudentSession(page);

    let failRequests = true;
    await page.route(profileUrl, async route => {
      if (failRequests) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Error interno del servidor' }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(fullProfileData),
        });
      }
    });

    await page.goto('/profile');

    // Error banner displayed
    await expect(
      page.getByRole('heading', { name: 'No se pudo cargar el perfil ecológico' }),
    ).toBeVisible();
    const retryButton = page.getByRole('button', { name: 'Reintentar' });
    await expect(retryButton).toBeVisible();

    // Enable success and click retry
    failRequests = false;
    await retryButton.click();

    // Successfully loaded after retry
    await expect(page.getByRole('heading', { name: 'Mariana García' })).toBeVisible();
    await expect(page.getByText('Perfil Público')).toBeVisible();
  });

  test('should navigate back to home using the back button', async ({ page }) => {
    await mockStudentSession(page);
    await mockProfileEndpoint(page, fullProfileData);

    await page.goto('/profile');
    await page.getByRole('button', { name: 'Volver al inicio' }).click();

    await expect(page).toHaveURL('/');
  });
});
