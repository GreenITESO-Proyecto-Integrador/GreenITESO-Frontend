import { expect, test, type Page, type WebSocketRoute } from '@playwright/test';
import { mockStudentSession } from './helpers/auth';

const badgePush = {
  id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  title: '¡Nueva insignia desbloqueada!',
  message: 'Obtuviste la insignia "Guardián del agua".',
  notification_type: 'BADGE_EARNED',
  is_read: false,
  created_at: '2026-10-01T13:00:00Z',
};

/** Empty notification list plus a fake socket that can push notifications. */
async function mockNotifications(page: Page) {
  const patches: string[] = [];
  const connection: { route: WebSocketRoute | null } = { route: null };

  await page.route('**/api/v1/notifications/', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ count: 0, results: [], unread_count: 0 }),
    }),
  );
  await page.route('**/api/v1/notifications/*/', async route => {
    patches.push(`${route.request().method()} ${route.request().postData()}`);
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  await page.routeWebSocket(/\/ws\/notifications\//, ws => {
    connection.route = ws;
    ws.onMessage(message => {
      if (JSON.parse(String(message)).type === 'auth') {
        ws.send(JSON.stringify({ type: 'auth.ok', unread_count: 0 }));
      }
    });
  });

  return {
    patches,
    isConnected: () => connection.route !== null,
    push: (notification: unknown) =>
      connection.route?.send(JSON.stringify({ type: 'notification.created', notification })),
  };
}

test.beforeEach(async ({ page }) => {
  await mockStudentSession(page);
});

test('should celebrate a badge pushed by the API with confetti', async ({ page }) => {
  const socket = await mockNotifications(page);
  await page.goto('/notifications');
  await expect.poll(socket.isConnected).toBe(true);

  socket.push(badgePush);

  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('¡Insignia desbloqueada!');
  await expect(dialog).toContainText('Guardián del agua');
  await expect(page.getByTestId('confetti')).toBeAttached();
});

test('should not celebrate notifications that are not badges', async ({ page }) => {
  const socket = await mockNotifications(page);
  await page.goto('/notifications');
  await expect.poll(socket.isConnected).toBe(true);

  socket.push({ ...badgePush, notification_type: 'AUDIT_APPROVED', title: 'Evidencia aprobada' });

  await expect(page.getByRole('status')).toContainText('Evidencia aprobada');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('should show queued badges one after another', async ({ page }) => {
  const socket = await mockNotifications(page);
  await page.goto('/notifications');
  await expect.poll(socket.isConnected).toBe(true);

  socket.push(badgePush);
  socket.push({
    ...badgePush,
    id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
    message: 'Obtuviste la insignia "Héroe del reciclaje".',
  });

  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Tienes 1 insignia más por ver');
  await dialog.getByRole('button', { name: 'Siguiente' }).click();
  await expect(dialog).toContainText('Héroe del reciclaje');
  await dialog.getByRole('button', { name: 'Seguir explorando' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('should mark the badge as read and open the profile', async ({ page }) => {
  const socket = await mockNotifications(page);
  await page.goto('/notifications');
  await expect.poll(socket.isConnected).toBe(true);

  socket.push(badgePush);
  await page.getByRole('link', { name: 'Ver mis insignias' }).click();

  await expect(page).toHaveURL(/\/profile$/);
  expect(socket.patches).toEqual(['PATCH {"is_read":true}']);
});

test('should preview the celebration from the design system', async ({ page }) => {
  await mockNotifications(page);
  await page.goto('/design-system');

  await page.getByRole('button', { name: 'Probar animación' }).click();

  await expect(page.getByRole('dialog')).toContainText('Guardián del agua');
});
