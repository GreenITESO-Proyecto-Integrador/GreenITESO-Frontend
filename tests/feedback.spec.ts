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

  test('should preserve a newly submitted item when the initial history load finishes late', async ({
    page,
  }) => {
    let releaseHistory!: () => void;
    const historyGate = new Promise<void>(resolve => {
      releaseHistory = resolve;
    });

    await page.route(myFeedbackUrl, async route => {
      await historyGate;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 1,
          next: null,
          previous: null,
          results: [
            {
              id: 'fb-old-1',
              user_email: 'estudiante@iteso.mx',
              category: 'IDEA',
              rating: 5,
              subject: 'Comentario anterior en el servidor',
              message: 'Este comentario ya existía antes de enviar el nuevo.',
              has_screenshot: false,
              status: 'OPEN',
              admin_notes: '',
              created_at: new Date().toISOString(),
            },
          ],
        }),
      });
    });

    await page.route(feedbackUrl, async route => {
      if (route.request().method() === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}') as Record<string, unknown>;
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'fb-new-2',
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

    await page.getByLabel(/Asunto breve/i).fill('Nuevo comentario enviado antes de cargar');
    await page
      .getByLabel(/Cuéntanos los detalles/i)
      .fill('Este comentario se envió mientras la carga inicial estaba en espera.');
    await page.getByRole('button', { name: /Enviar comentario/i }).click();

    const historySection = page.getByRole('region', { name: /Mis comentarios enviados/i });
    await expect(
      historySection.getByText('Nuevo comentario enviado antes de cargar'),
    ).toBeVisible();

    const heldHistoryResponse = page.waitForResponse(
      res => res.url().includes('/api/v1/feedback/mine/') && res.request().method() === 'GET',
    );
    releaseHistory();
    await (await heldHistoryResponse).finished();

    await expect(
      historySection.getByText('Nuevo comentario enviado antes de cargar'),
    ).toBeVisible();
    await expect(historySection.getByText('Comentario anterior en el servidor')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Mis comentarios enviados (2)' })).toBeVisible();
  });

  test('should show an error state with retry when history loading fails', async ({ page }) => {
    let attempts = 0;
    await page.route(myFeedbackUrl, async route => {
      attempts += 1;
      if (attempts <= 2) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Error temporal del servidor.' }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 1,
          next: null,
          previous: null,
          results: [
            {
              id: 'fb-recovered',
              user_email: 'estudiante@iteso.mx',
              category: 'ECO_ACTION',
              rating: 5,
              subject: 'Sugerencia recuperada tras reintentar',
              message: 'Contenido cargado exitosamente después del reintento.',
              has_screenshot: false,
              status: 'RESOLVED',
              admin_notes: 'Implementado.',
              created_at: new Date().toISOString(),
            },
          ],
        }),
      });
    });

    await page.goto('/feedback');

    const historySection = page.getByRole('region', { name: /Mis comentarios enviados/i });
    await expect(historySection.getByText('Aún no has enviado comentarios')).toHaveCount(0);
    await expect(historySection.getByRole('button', { name: 'Reintentar' })).toBeVisible();

    await historySection.getByRole('button', { name: 'Reintentar' }).click();
    await expect(historySection.getByText('Sugerencia recuperada tras reintentar')).toBeVisible();
  });

  test('should display total count and paginate history with Ver más', async ({ page }) => {
    const firstPageItems = Array.from({ length: 20 }, (_, idx) => ({
      id: `fb-page1-${idx + 1}`,
      user_email: 'estudiante@iteso.mx',
      category: 'IDEA',
      rating: 4,
      subject: `Comentario página 1 #${idx + 1}`,
      message: 'Detalle del comentario en la primera página.',
      has_screenshot: false,
      status: 'OPEN',
      admin_notes: '',
      created_at: new Date().toISOString(),
    }));

    await page.route('**/api/v1/feedback/mine/**', async route => {
      const url = new URL(route.request().url());
      if (url.searchParams.get('page') === '2') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            count: 21,
            next: null,
            previous: 'http://localhost:8000/api/v1/feedback/mine/',
            results: [
              {
                id: 'fb-page2-21',
                user_email: 'estudiante@iteso.mx',
                category: 'BUG',
                rating: 3,
                subject: 'Comentario número 21 en página 2',
                message: 'Detalle del comentario antiguo en la segunda página.',
                has_screenshot: false,
                status: 'IN_REVIEW',
                admin_notes: '',
                created_at: new Date().toISOString(),
              },
            ],
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 21,
          next: 'http://localhost:8000/api/v1/feedback/mine/?page=2',
          previous: null,
          results: firstPageItems,
        }),
      });
    });

    await page.goto('/feedback');

    await expect(
      page.getByRole('heading', { name: 'Mis comentarios enviados (21)' }),
    ).toBeVisible();
    const historySection = page.getByRole('region', { name: /Mis comentarios enviados/i });
    await expect(historySection.getByText('Comentario número 21 en página 2')).toHaveCount(0);

    await historySection.getByRole('button', { name: 'Ver más' }).click();
    await expect(historySection.getByText('Comentario número 21 en página 2')).toBeVisible();
    await expect(historySection.getByRole('button', { name: 'Ver más' })).toHaveCount(0);
  });
});
