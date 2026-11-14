import { expect, test } from '@playwright/test';
import { mockStudentSession } from './helpers/auth';
import { PIXEL_PNG } from './helpers/images';

const feedbackUrl = '**/api/v1/feedback/';
const myFeedbackUrl = '**/api/v1/feedback/mine/';

test.describe('Feedback and Suggestions (/feedback)', () => {
  test.beforeEach(async ({ page }) => {
    await mockStudentSession(page);
  });

  test('should render feedback form with all sections', async ({ page }) => {
    await page.route(myFeedbackUrl, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ count: 0, next: null, previous: null, results: [] }),
      });
    });

    await page.goto('/feedback');

    await expect(
      page.getByRole('heading', { name: 'Buzón de Comentarios y Sugerencias' }),
    ).toBeVisible();

    // Categories
    await expect(page.getByRole('radio', { name: /Error técnico/i })).toBeVisible();
    await expect(page.getByRole('radio', { name: /Idea o mejora/i })).toBeVisible();
    await expect(page.getByRole('radio', { name: /Nueva acción eco/i })).toBeVisible();
    await expect(page.getByRole('radio', { name: /Accesibilidad/i })).toBeVisible();
    await expect(page.getByRole('radio', { name: /Otro comentario/i })).toBeVisible();

    // Inputs
    await expect(page.getByLabel(/Asunto breve/i)).toBeVisible();
    await expect(page.getByLabel(/Cuéntanos los detalles/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Enviar comentario/i })).toBeDisabled();
  });

  test('should submit feedback successfully and update history list', async ({ page }) => {
    let submittedPayload: Record<string, unknown> | null = null;

    await page.route(myFeedbackUrl, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ count: 0, next: null, previous: null, results: [] }),
      });
    });

    await page.route(feedbackUrl, async route => {
      if (route.request().method() === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}') as Record<string, unknown>;
        submittedPayload = body;
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'fb-123',
            user_email: 'estudiante@iteso.mx',
            category: body.category,
            rating: body.rating,
            subject: body.subject,
            message: body.message,
            has_screenshot: false,
            status: 'OPEN',
            admin_notes: '',
            created_at: new Date().toISOString(),
          }),
        });
        return;
      }
      await route.fallback();
    });

    await page.goto('/feedback');

    // Select category: Error técnico
    await page.getByRole('radio', { name: /Error técnico/i }).click();

    // Select rating: 4
    await page.getByRole('radio', { name: '4 - Muy buena' }).click();

    // Fill subject and message
    await page.getByLabel(/Asunto breve/i).fill('Fallo al cargar mapa del campus');
    await page
      .getByLabel(/Cuéntanos los detalles/i)
      .fill('Cuando abro la vista en Safari móvil el contenedor del mapa parpadea y no carga.');

    const submitBtn = page.getByRole('button', { name: /Enviar comentario/i });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Success banner
    await expect(
      page.getByText('¡Gracias por tus comentarios! Hemos recibido tu mensaje.'),
    ).toBeVisible();

    expect(submittedPayload).toMatchObject({
      category: 'BUG',
      rating: 4,
      subject: 'Fallo al cargar mapa del campus',
      message: 'Cuando abro la vista en Safari móvil el contenedor del mapa parpadea y no carga.',
    });

    // History list updated
    const historySection = page.getByRole('region', { name: /Mis comentarios enviados/i });
    await expect(historySection.getByText('Fallo al cargar mapa del campus')).toBeVisible();
    await expect(historySection.getByText('Recibido')).toBeVisible();
  });

  test('should attach and remove an optional screenshot', async ({ page }) => {
    await page.route(myFeedbackUrl, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ count: 0, next: null, previous: null, results: [] }),
      });
    });

    await page.goto('/feedback');

    const fileInput = page.getByTestId('feedback-file-input');
    await fileInput.setInputFiles({
      name: 'evidencia.png',
      mimeType: 'image/png',
      buffer: PIXEL_PNG,
    });

    await expect(page.getByAltText('Vista previa de captura')).toBeVisible();
    await expect(page.getByText('evidencia.png')).toBeVisible();

    // Remove
    await page.getByRole('button', { name: 'Quitar' }).click();
    await expect(page.getByAltText('Vista previa de captura')).toHaveCount(0);
    await expect(page.getByText('evidencia.png')).toHaveCount(0);
  });

  test('should navigate to feedback from navbar user menu', async ({ page }) => {
    await page.route(myFeedbackUrl, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ count: 0, next: null, previous: null, results: [] }),
      });
    });

    await page.goto('/');

    await page.getByRole('button', { name: 'Menú de usuario' }).click();
    await page.getByRole('menuitem', { name: 'Buzón de feedback' }).click();

    await expect(page).toHaveURL(/\/feedback$/);
    await expect(
      page.getByRole('heading', { name: 'Buzón de Comentarios y Sugerencias' }),
    ).toBeVisible();
  });
});
