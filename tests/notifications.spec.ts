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
    close: () => connection.route?.close(),
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

test('should not double-count or duplicate a notification pushed mid-pagination', async ({
  page,
}) => {
  // Page 1 of the GET; page 2 repeats "Nuevo seguidor" the way DRF's
  // offset pagination would once the push below shifts every later row.
  const pageOneResults = [{ ...storedNotifications[0]!, is_read: true }, storedNotifications[1]];
  const pageTwoResults = [
    storedNotifications[1],
    {
      id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      title: 'Reto completado',
      message: 'Terminaste el reto semanal.',
      notification_type: 'MISSION_COMPLETED',
      is_read: true,
      created_at: '2026-09-29T12:00:00Z',
    },
  ];

  const socket = await mockSocket(page);
  await page.route(/\/api\/v1\/notifications\/(\?.*)?$/, async route => {
    const url = new URL(route.request().url());
    if (!url.search) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 4,
          unread_count: 0,
          results: pageOneResults,
          next: `${url.origin}${url.pathname}?offset=2`,
        }),
      });
      return;
    }

    // A notification is created (and counted server-side) while this GET is
    // still paginating, between the page 1 and page 2 requests.
    socket.push(livePush);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        count: 4,
        unread_count: 1,
        results: pageTwoResults,
        next: null,
      }),
    });
  });

  await page.goto('/notifications');

  await expect(page.getByText('Reto completado')).toBeVisible();
  await expect(page.getByText('Nuevo seguidor')).toHaveCount(1);
  await expect(page.getByText('Tienes 1 notificaciones sin leer.')).toBeVisible();
});

/**
 * Holds a write (PATCH/DELETE) open, forces the socket to reconnect so a fresh
 * GET returns the pre-write state, then lets the write succeed. The optimistic
 * UI must survive both the stale GET and the late write.
 */
async function expectOptimisticStateSurvivesReconnect(
  page: Page,
  writePattern: string,
  act: () => Promise<void>,
  assertState: () => Promise<void>,
) {
  let listResponses = 0;
  page.on('response', response => {
    if (
      response.request().method() === 'GET' &&
      /\/api\/v1\/notifications\/$/.test(response.url())
    ) {
      listResponses += 1;
    }
  });

  let releaseWrite!: () => void;
  const writeGate = new Promise<void>(resolve => {
    releaseWrite = resolve;
  });
  await page.route(writePattern, async route => {
    await writeGate;
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  const socket = await mockSocket(page);
  await page.goto('/notifications');
  await expect.poll(() => listResponses).toBeGreaterThanOrEqual(2);

  await act();
  await assertState();

  const responsesBeforeReconnect = listResponses;
  socket.close();
  await expect.poll(() => listResponses).toBeGreaterThan(responsesBeforeReconnect);
  // Give the stale GET response time to be applied before asserting.
  await page.waitForTimeout(250);
  await assertState();

  releaseWrite();
  await page.waitForTimeout(250);
  await assertState();
}

test('should keep a read notification read when a reconnect GET lands before the PATCH', async ({
  page,
}) => {
  await mockNotificationApi(page);
  await expectOptimisticStateSurvivesReconnect(
    page,
    '**/api/v1/notifications/*/',
    () => page.getByRole('button', { name: 'Marcar como leída' }).click(),
    () => expect(page.getByText('Estás al día.')).toBeVisible(),
  );
});

test('should keep every notification read when a reconnect GET lands before mark-all-read', async ({
  page,
}) => {
  await mockNotificationApi(page);
  await expectOptimisticStateSurvivesReconnect(
    page,
    '**/api/v1/notifications/mark-all-read/',
    () => page.getByRole('button', { name: 'Marcar todo' }).click(),
    () => expect(page.getByText('Estás al día.')).toBeVisible(),
  );
});

test('should keep a deleted notification gone when a reconnect GET lands before the DELETE', async ({
  page,
}) => {
  await mockNotificationApi(page);
  await expectOptimisticStateSurvivesReconnect(
    page,
    '**/api/v1/notifications/*/',
    () => page.getByRole('button', { name: 'Eliminar notificación' }).first().click(),
    () => expect(page.getByText('Evidencia aprobada')).toHaveCount(0),
  );
});

test('should refresh the token and back off when the socket keeps answering 4401', async ({
  page,
}) => {
  await mockNotificationApi(page);
  let connections = 0;
  let refreshCalls = 0;
  await page.route('**/api/v1/auth/refresh/', async route => {
    refreshCalls += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ access: MOCK_JWT_TOKEN }),
    });
  });
  await page.routeWebSocket(/\/ws\/notifications\//, ws => {
    connections += 1;
    ws.onMessage(() => ws.close({ code: 4401, reason: 'unauthorized' }));
  });

  await page.goto('/notifications');
  await page.waitForTimeout(4500);

  // Backoff of 1s, 2s, 4s allows ~3 attempts in this window; a reset to 1s each
  // time would allow 5. The server rejecting the token must also force a refresh.
  expect(connections).toBeLessThanOrEqual(4);
  expect(refreshCalls).toBeGreaterThan(0);
});

test('should not show the empty state while a superseded request has finished first', async ({
  page,
}) => {
  let listRequests = 0;
  await page.route(listUrl, async route => {
    listRequests += 1;
    await new Promise(resolve => setTimeout(resolve, listRequests === 1 ? 300 : 2000));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ count: 2, results: storedNotifications, unread_count: 1 }),
    });
  });
  await mockSocket(page);

  await page.goto('/notifications');
  // The first request has finished by now but the list is still loading. A plain
  // count() (not toHaveCount) so a transient empty state can't be retried away.
  await page.waitForTimeout(1000);
  expect(await page.getByText('No tienes notificaciones.').count()).toBe(0);

  await expect(page.getByText('Evidencia aprobada')).toBeVisible();
});

test('should not drop a notification when one is deleted while paginating', async ({ page }) => {
  const item = (id: string, title: string, day: number) => ({
    id: `${id}`.repeat(8) + '-0000-0000-0000-000000000000',
    title,
    message: `${title} message`,
    notification_type: 'SYSTEM',
    is_read: true,
    created_at: `2026-09-${day}T12:00:00Z`,
  });
  const [alfa, bravo, charlie, delta] = [
    item('a', 'Alfa', 28),
    item('b', 'Bravo', 27),
    item('c', 'Charlie', 26),
    item('d', 'Delta', 25),
  ];

  // Page size 2. Alfa is deleted between the page 1 and page 2 requests, so
  // every later row shifts up by one and page 2 skips Charlie.
  let alfaDeleted = false;
  await page.route(/\/api\/v1\/notifications\/(\?.*)?$/, async route => {
    const url = new URL(route.request().url());
    const nextPage = `${url.origin}${url.pathname}?offset=2`;
    let body;
    if (url.search) {
      alfaDeleted = true;
      body = { count: 3, results: [delta], next: null };
    } else if (alfaDeleted) {
      body = { count: 3, results: [bravo, charlie], next: nextPage };
    } else {
      body = { count: 4, results: [alfa, bravo], next: nextPage };
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ unread_count: 0, ...body }),
    });
  });
  // No auth.ok: the reconnect reload would re-walk the (now stable) list and
  // mask a skipped row, so only the initial walk decides what is shown.
  await page.routeWebSocket(/\/ws\/notifications\//, () => {});

  await page.goto('/notifications');

  await expect(page.getByText('Delta', { exact: true })).toBeVisible();
  await expect(page.getByText('Charlie', { exact: true })).toBeVisible();
  await expect(page.getByText('Bravo', { exact: true })).toBeVisible();
  await expect(page.getByText('Alfa', { exact: true })).toHaveCount(0);
});

test('should show an error when the notification list fails to load', async ({ page }) => {
  await page.route(listUrl, route => route.fulfill({ status: 500, body: '{}' }));
  await mockSocket(page);
  await page.goto('/notifications');

  await expect(page.getByRole('alert')).toContainText('No se pudieron cargar las notificaciones.');
});
