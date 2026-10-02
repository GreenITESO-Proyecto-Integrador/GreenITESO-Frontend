import { expect, test, type Page, type WebSocketRoute } from '@playwright/test';
import { MOCK_JWT_TOKEN, mockStudentSession } from './helpers/auth';

const listUrl = '**/api/v1/notifications/';

const storedNotifications = [
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    title: 'Evidencia aprobada',
    message: 'Tu registro de reciclaje fue validado.',
    notification_type: 'AUDIT_APPROVED',
    is_read: false,
    created_at: '2026-10-01T12:00:00Z',
  },
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    title: 'Nuevo seguidor',
    message: 'carlos.iteso ahora sigue tu actividad.',
    notification_type: 'SOCIAL_FOLLOW',
    is_read: true,
    created_at: '2026-09-30T12:00:00Z',
  },
];

const livePush = {
  id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
  title: '¡Nueva insignia desbloqueada!',
  message: 'Obtuviste la insignia "Guardián del agua".',
  notification_type: 'BADGE_EARNED',
  is_read: false,
  created_at: '2026-10-01T13:00:00Z',
};

/** Serves the notification list and records the PATCH calls the page makes. */
async function mockNotificationApi(page: Page, list = storedNotifications) {
  const patches: string[] = [];

  await page.route(listUrl, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        count: list.length,
        results: list,
        unread_count: list.filter(item => !item.is_read).length,
      }),
    });
  });
  // Playwright runs the most recently registered matching route first, so the
  // specific mark-all-read route goes after the generic detail route.
  await page.route('**/api/v1/notifications/*/', async route => {
    patches.push(`${route.request().method()} ${route.request().postData()}`);
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  await page.route('**/api/v1/notifications/mark-all-read/', async route => {
    patches.push(`${route.request().method()} mark-all-read`);
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  return patches;
}

/** Fakes the backend socket: records frames and answers the auth handshake. */
async function mockSocket(page: Page) {
  const frames: unknown[] = [];
  const connection: { route: WebSocketRoute | null } = { route: null };

  await page.routeWebSocket(/\/ws\/notifications\//, ws => {
    connection.route = ws;
    ws.onMessage(message => {
      const frame = JSON.parse(String(message));
      frames.push(frame);
      if (frame.type === 'auth') {
        ws.send(JSON.stringify({ type: 'auth.ok', unread_count: 1 }));
      }
    });
  });

  return {
    frames,
    push: (notification: unknown) =>
      connection.route?.send(JSON.stringify({ type: 'notification.created', notification })),
  };
}

test.beforeEach(async ({ page }) => {
  await mockStudentSession(page);
});

test('should list the stored notifications with the unread count', async ({ page }) => {
  await mockNotificationApi(page);
  await mockSocket(page);
  await page.goto('/notifications');

  await expect(page.getByText('Evidencia aprobada')).toBeVisible();
  await expect(page.getByText('carlos.iteso ahora sigue tu actividad.')).toBeVisible();
  await expect(page.getByText('Tienes 1 notificaciones sin leer.')).toBeVisible();
});

test('should authenticate the socket with the access token in the first frame', async ({
  page,
}) => {
  await mockNotificationApi(page);
  const socket = await mockSocket(page);
  await page.goto('/notifications');

  await expect.poll(() => socket.frames.length).toBeGreaterThan(0);
  expect(socket.frames[0]).toEqual({ type: 'auth', token: MOCK_JWT_TOKEN });
});

test('should show a live notification as a toast, in the list and in the badge', async ({
  page,
}) => {
  await mockNotificationApi(page);
  const socket = await mockSocket(page);
  await page.goto('/notifications');
  await expect(page.getByText('Tienes 1 notificaciones sin leer.')).toBeVisible();
  await expect.poll(() => socket.frames.length).toBeGreaterThan(0);

  socket.push(livePush);

  const toast = page.getByRole('status');
  await expect(toast).toContainText('¡Nueva insignia desbloqueada!');
  await expect(page.getByText('Tienes 2 notificaciones sin leer.')).toBeVisible();
  await expect(page.getByText('Obtuviste la insignia "Guardián del agua".')).toHaveCount(2);
});

test('should ignore a pushed notification that is already listed', async ({ page }) => {
  await mockNotificationApi(page);
  const socket = await mockSocket(page);
  await page.goto('/notifications');
  await expect.poll(() => socket.frames.length).toBeGreaterThan(0);

  socket.push(storedNotifications[0]);
  socket.push(livePush);
  socket.push(livePush);

  await expect(page.getByText('Tienes 2 notificaciones sin leer.')).toBeVisible();
  await expect(page.getByText('Evidencia aprobada')).toHaveCount(1);
});

test('should mark one notification as read through the API', async ({ page }) => {
  const patches = await mockNotificationApi(page);
  await mockSocket(page);
  await page.goto('/notifications');

  await page.getByRole('button', { name: 'Marcar como leída' }).click();

  await expect(page.getByText('Estás al día.')).toBeVisible();
  expect(patches).toEqual(['PATCH {"is_read":true}']);
});

test('should mark every notification as read through the API', async ({ page }) => {
  const patches = await mockNotificationApi(page);
  await mockSocket(page);
  await page.goto('/notifications');

  await page.getByRole('button', { name: 'Marcar todo' }).click();

  await expect(page.getByText('Estás al día.')).toBeVisible();
  expect(patches).toEqual(['PATCH mark-all-read']);
});

test('should open the related page and mark as read when a notification is clicked', async ({
  page,
}) => {
  const patches = await mockNotificationApi(page);
  await mockSocket(page);
  await page.goto('/notifications');

  await page.getByText('Evidencia aprobada').click();

  await expect(page).toHaveURL(/\/leaderboard$/);
  expect(patches).toEqual(['PATCH {"is_read":true}']);
});

test('should open the related page from the live toast', async ({ page }) => {
  await mockNotificationApi(page);
  const socket = await mockSocket(page);
  await page.goto('/notifications');
  await expect.poll(() => socket.frames.length).toBeGreaterThan(0);

  socket.push({ ...livePush, notification_type: 'AUDIT_REJECT' });
  await page.getByRole('status').click();

  await expect(page).toHaveURL(/\/actions\/register$/);
});

test('should not link a notification type that has no destination page', async ({ page }) => {
  await mockNotificationApi(page, [
    { ...storedNotifications[0]!, notification_type: 'SYSTEM', title: 'Aviso del sistema' },
  ]);
  await mockSocket(page);
  await page.goto('/notifications');

  await expect(page.getByText('Aviso del sistema')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Aviso del sistema' })).toHaveCount(0);
});

test('should delete a notification through the API and drop it from the list', async ({ page }) => {
  const patches = await mockNotificationApi(page);
  await mockSocket(page);
  await page.goto('/notifications');

  await page.getByRole('button', { name: 'Eliminar notificación' }).first().click();

  await expect(page.getByText('Evidencia aprobada')).toHaveCount(0);
  await expect(page.getByText('Estás al día.')).toBeVisible();
  expect(patches).toEqual(['DELETE null']);
});

test('should not resurrect a deleted notification when it is pushed again', async ({ page }) => {
  await mockNotificationApi(page);
  const socket = await mockSocket(page);
  await page.goto('/notifications');
  await expect.poll(() => socket.frames.length).toBeGreaterThan(0);

  await page.getByRole('button', { name: 'Eliminar notificación' }).first().click();
  socket.push(storedNotifications[0]);
  socket.push(livePush);

  await expect(page.getByText('Obtuviste la insignia "Guardián del agua".')).toHaveCount(2);
  await expect(page.getByText('Evidencia aprobada')).toHaveCount(0);
});

test('should show an error when the notification list fails to load', async ({ page }) => {
  await page.route(listUrl, route => route.fulfill({ status: 500, body: '{}' }));
  await mockSocket(page);
  await page.goto('/notifications');

  await expect(page.getByRole('alert')).toContainText('No se pudieron cargar las notificaciones.');
});
