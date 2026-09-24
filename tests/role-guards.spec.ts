import { expect, test } from '@playwright/test';
import { mockAdminSession, mockStudentSession, mockStaffSession } from './helpers/auth';

const pendingQueueUrl = '**/api/v1/action-logs**';
const actionsUrl = '**/api/v1/actions/**';

test.describe('Role-based route guards and permissions', () => {
  test('should redirect unauthenticated users from /audit to /login', async ({ page }) => {
    await page.goto('/audit');

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'Inicia sesión' })).toBeVisible();
  });

  test('should block STUDENT from accessing /audit and show 403 Access Denied', async ({
    page,
  }) => {
    await mockStudentSession(page);
    await page.goto('/audit');

    await expect(page.getByText('Error 403 · Prohibido')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Acceso Restringido' })).toBeVisible();
    await expect(
      page.getByText('No cuentas con los permisos necesarios para acceder a esta sección.'),
    ).toBeVisible();

    // Verify returning to home works
    await page.getByRole('button', { name: 'Volver al inicio' }).click();
    await expect(page).toHaveURL('/');
  });

  test('should block STAFF from accessing /audit and show 403 Access Denied', async ({ page }) => {
    await mockStaffSession(page);
    await page.goto('/audit');

    await expect(page.getByText('Error 403 · Prohibido')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Acceso Restringido' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Volver al inicio' })).toBeVisible();
  });

  test('should grant ADMIN access to /audit review panel', async ({ page }) => {
    await mockAdminSession(page);
    await page.route(pendingQueueUrl, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ results: [] }),
      });
    });

    await page.goto('/audit');

    await expect(page.getByRole('heading', { name: 'Panel de revisión' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Acceso Restringido' })).toHaveCount(0);
  });

  test('should allow both STUDENT and STAFF to access standard protected routes like /actions', async ({
    page,
  }) => {
    await page.route(actionsUrl, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ results: [] }),
      });
    });

    // Test STUDENT access
    await mockStudentSession(page);
    await page.goto('/actions');
    await expect(page.getByRole('heading', { name: 'Catálogo de Acciones' })).toBeVisible();

    // Test STAFF access
    await mockStaffSession(page);
    await page.goto('/actions');
    await expect(page.getByRole('heading', { name: 'Catálogo de Acciones' })).toBeVisible();
  });

  test('should conditionally render admin UI controls exclusively for ADMIN users', async ({
    page,
  }) => {
    // STUDENT user should NOT see the audit button on Home
    await mockStudentSession(page);
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Panel de Auditoría' })).toHaveCount(0);

    // STAFF user should NOT see the audit button on Home
    await mockStaffSession(page);
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Panel de Auditoría' })).toHaveCount(0);

    // ADMIN user SHOULD see the audit button on Home
    await mockAdminSession(page);
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Panel de Auditoría' })).toBeVisible();

    // Clicking it navigates to /audit
    await page.route(pendingQueueUrl, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ results: [] }),
      });
    });
    await page.getByRole('button', { name: 'Panel de Auditoría' }).click();
    await expect(page).toHaveURL('/audit');
  });
});
