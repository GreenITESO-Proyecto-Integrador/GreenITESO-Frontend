import { expect, test, type Page, type Route } from '@playwright/test';
import { failUnmockedApiCalls } from './helpers/api';
import { mockStudentSession } from './helpers/auth';

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
};

type PostType = 'OFFICIAL_ANNOUNCEMENT' | 'COMMUNITY_MILESTONE' | 'SHARED_EVIDENCE';

function post(
  id: number,
  overrides: {
    post_type?: PostType;
    liked_by_me?: boolean;
    likes_count?: number;
    author_id?: string;
  } = {},
) {
  return {
    id,
    author_id: overrides.author_id ?? 'user-ana',
    author: { id: 'user-ana', display_name: 'Ana', avatar_url: '' },
    post_type: overrides.post_type ?? 'COMMUNITY_MILESTONE',
    content: `Publicación ${id}`,
    image_url: null,
    badge_info: null,
    likes_count: overrides.likes_count ?? 0,
    liked_by_me: overrides.liked_by_me ?? false,
    created_at: '2026-11-01T12:00:00Z',
    updated_at: '2026-11-01T12:00:00Z',
  };
}

async function fulfillJson(route: Route, status: number, payload: unknown) {
  await route.fulfill({
    status,
    headers: CORS_HEADERS,
    contentType: 'application/json',
    body: JSON.stringify(payload),
  });
}

interface FeedMock {
  /** Every request to the feed API, in order, as `METHOD path?query`. */
  calls: string[];
}

/**
 * Serve the feed list from `listFor` and answer like requests with `onLike`.
 *
 * Unmocked API calls get a 404 (see `failUnmockedApiCalls`), so a request this spec does not
 * expect fails loudly instead of reaching a real backend.
 */
async function mockFeed(
  page: Page,
  options: {
    listFor: (url: URL) => ReturnType<typeof post>[];
    onLike?: (route: Route, method: string) => Promise<void>;
    onCreate?: (route: Route) => Promise<void>;
  },
): Promise<FeedMock> {
  const mock: FeedMock = { calls: [] };
  await failUnmockedApiCalls(page);
  await mockStudentSession(page);
  await page.route('**/api/v1/feed/**', async route => {
    const request = route.request();
    const method = request.method();
    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS_HEADERS });
      return;
    }
    const url = new URL(request.url());
    mock.calls.push(`${method} ${url.pathname}${url.search}`);

    if (/\/like\/$/.test(url.pathname)) {
      if (options.onLike) await options.onLike(route, method);
      else await fulfillJson(route, 404, {});
      return;
    }
    if (method === 'POST') {
      if (options.onCreate) await options.onCreate(route);
      else await fulfillJson(route, 404, {});
      return;
    }
    const results = options.listFor(url);
    await fulfillJson(route, 200, { count: results.length, next: null, previous: null, results });
  });
  return mock;
}

const likeCalls = (mock: FeedMock) => mock.calls.filter(call => call.includes('/like/'));
// React StrictMode runs the load effect twice in dev, so count listings after the first render.
const listCalls = (mock: FeedMock) => mock.calls.filter(call => call.startsWith('GET '));

test('should like with POST and unlike with DELETE, reflecting the state with aria-pressed', async ({
  page,
}) => {
  let likes = 2;
  const mock = await mockFeed(page, {
    listFor: () => [post(1, { likes_count: likes })],
    onLike: async (route, method) => {
      const liked = method === 'POST';
      likes += liked ? 1 : -1;
      await fulfillJson(route, 200, { liked_by_me: liked, likes_count: likes });
    },
  });
  await page.goto('/feed');

  const likeButton = page.getByRole('button', { name: /^Like,/ });
  await expect(likeButton).toHaveAttribute('aria-pressed', 'false');
  await expect(likeButton).toHaveAccessibleName('Like, 2 likes');

  await likeButton.click();
  await expect(likeButton).toHaveAttribute('aria-pressed', 'true');
  await expect(likeButton).toHaveAccessibleName('Like, 3 likes');

  await likeButton.click();
  await expect(likeButton).toHaveAttribute('aria-pressed', 'false');
  await expect(likeButton).toHaveAccessibleName('Like, 2 likes');

  expect(likeCalls(mock)).toEqual(['POST /api/v1/feed/1/like/', 'DELETE /api/v1/feed/1/like/']);
});

test('should send a single like request on a double click and disable the button meanwhile', async ({
  page,
}) => {
  let releaseLike: () => void = () => {};
  const likeHeld = new Promise<void>(resolve => {
    releaseLike = resolve;
  });
  const mock = await mockFeed(page, {
    listFor: () => [post(1)],
    onLike: async route => {
      await likeHeld;
      await fulfillJson(route, 200, { liked_by_me: true, likes_count: 1 });
    },
  });
  await page.goto('/feed');

  const likeButton = page.getByRole('button', { name: /^Like,/ });
  await likeButton.dblclick();

  await expect(likeButton).toBeDisabled();
  await expect(likeButton).toHaveAttribute('aria-pressed', 'true');
  releaseLike();

  await expect(likeButton).toBeEnabled();
  await expect(likeButton).toHaveAccessibleName('Like, 1 like');
  expect(likeCalls(mock)).toEqual(['POST /api/v1/feed/1/like/']);
});

test('should roll back only the failed like without refetching the feed', async ({ page }) => {
  const mock = await mockFeed(page, {
    listFor: () => [post(1, { likes_count: 4 }), post(2, { liked_by_me: true, likes_count: 1 })],
    onLike: route => fulfillJson(route, 500, { detail: 'Error' }),
  });
  await page.goto('/feed');

  const firstPost = page.getByRole('button', { name: /^Like,/ }).first();
  const secondPost = page.getByRole('button', { name: /^Like,/ }).nth(1);
  await expect(secondPost).toBeVisible();
  const listingsBefore = listCalls(mock).length;
  await firstPost.click();

  await expect(page.getByRole('alert')).toHaveText(
    'No se pudo registrar tu Like. Intenta de nuevo.',
  );
  await expect(firstPost).toHaveAttribute('aria-pressed', 'false');
  await expect(firstPost).toHaveAccessibleName('Like, 4 likes');
  await expect(firstPost).toBeEnabled();
  await expect(secondPost).toHaveAttribute('aria-pressed', 'true');
  expect(listCalls(mock)).toHaveLength(listingsBefore);
});

test('should mark the active filters with aria-pressed and keep the list visible while switching', async ({
  page,
}) => {
  let releaseAnnouncements: () => void = () => {};
  const announcementsHeld = new Promise<void>(resolve => {
    releaseAnnouncements = resolve;
  });
  const mock = await mockFeed(page, {
    listFor: url =>
      url.searchParams.get('post_type') === 'OFFICIAL_ANNOUNCEMENT'
        ? [post(7, { post_type: 'OFFICIAL_ANNOUNCEMENT' })]
        : [post(1)],
  });
  // Hold only the filtered listing so the test can look at the page while it loads.
  await page.route(/\/api\/v1\/feed\/\?.*post_type=OFFICIAL_ANNOUNCEMENT/, async route => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS_HEADERS });
      return;
    }
    await announcementsHeld;
    await route.fallback();
  });
  await page.goto('/feed');

  const typeFilters = page.getByRole('group', { name: 'Filtrar por tipo de publicación' });
  const ordering = page.getByRole('group', { name: 'Ordenar publicaciones' });
  await expect(typeFilters.getByRole('button', { name: 'Todos' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(ordering.getByRole('button', { name: 'Recientes' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByText('Publicación 1')).toBeVisible();
  const listingsBefore = listCalls(mock).length;

  await typeFilters.getByRole('button', { name: 'Anuncios' }).click();
  await expect(typeFilters.getByRole('button', { name: 'Anuncios' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByText('Publicación 1')).toBeVisible();
  await expect(page.locator('[aria-busy="true"]')).toBeVisible();
  await expect(page.getByText('Cargando publicaciones...')).toHaveCount(0);

  releaseAnnouncements();
  await expect(page.getByText('Publicación 7')).toBeVisible();
  await expect(page.getByText('Publicación 1')).toHaveCount(0);
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  expect(listCalls(mock).slice(listingsBefore)).toEqual([
    'GET /api/v1/feed/?page=1&post_type=OFFICIAL_ANNOUNCEMENT',
  ]);
});

test('should not prepend a new post the active filter excludes and offer to show it', async ({
  page,
}) => {
  const created = { ...post(99, { post_type: 'SHARED_EVIDENCE' }), content: 'Reciclé hoy' };
  let saved = false;
  await mockFeed(page, {
    listFor: url => {
      if (url.searchParams.get('post_type') === 'OFFICIAL_ANNOUNCEMENT') {
        return [post(7, { post_type: 'OFFICIAL_ANNOUNCEMENT' })];
      }
      return saved ? [created, post(1)] : [post(1)];
    },
    onCreate: async route => {
      saved = true;
      await fulfillJson(route, 201, created);
    },
  });
  await page.goto('/feed');

  const typeFilters = page.getByRole('group', { name: 'Filtrar por tipo de publicación' });
  await typeFilters.getByRole('button', { name: 'Anuncios' }).click();
  await expect(page.getByText('Publicación 7')).toBeVisible();

  await page.getByPlaceholder('¿Qué acción sostenible realizaste hoy?').fill('Reciclé hoy');
  await page.getByRole('button', { name: 'Publicar' }).click();

  const notice = page.getByRole('status').filter({ hasText: 'Tu publicación se creó' });
  await expect(notice).toBeVisible();
  await expect(page.getByText('Reciclé hoy', { exact: true })).toHaveCount(0);
  await expect(typeFilters.getByRole('button', { name: 'Anuncios' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await notice.getByRole('button', { name: 'Ver en Todos' }).click();
  await expect(typeFilters.getByRole('button', { name: 'Todos' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByText('Reciclé hoy', { exact: true })).toBeVisible();
  await expect(notice).toHaveCount(0);
});

test('should prepend a new post that matches the active filter', async ({ page }) => {
  const created = { ...post(99, { post_type: 'SHARED_EVIDENCE' }), content: 'Usé mi termo' };
  const mock = await mockFeed(page, {
    listFor: () => [post(1)],
    onCreate: route => fulfillJson(route, 201, created),
  });
  await page.goto('/feed');
  await expect(page.getByText('Publicación 1')).toBeVisible();
  const listingsBefore = listCalls(mock).length;

  await page.getByPlaceholder('¿Qué acción sostenible realizaste hoy?').fill('Usé mi termo');
  await page.getByRole('button', { name: 'Publicar' }).click();

  await expect(page.getByText('Usé mi termo', { exact: true })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Tu publicación se creó' })).toHaveCount(
    0,
  );
  expect(listCalls(mock)).toHaveLength(listingsBefore);
});

test('should warn about a new post hidden by the popular order and keep its type when showing it', async ({
  page,
}) => {
  const created = { ...post(99, { post_type: 'SHARED_EVIDENCE' }), content: 'Llevé mi bolsa' };
  const evidence = post(5, { post_type: 'SHARED_EVIDENCE', likes_count: 8 });
  let saved = false;
  const mock = await mockFeed(page, {
    listFor: url => {
      if (url.searchParams.get('post_type') !== 'SHARED_EVIDENCE') return [post(1)];
      if (url.searchParams.get('ordering') === 'popular') return [evidence];
      return saved ? [created, evidence] : [evidence];
    },
    onCreate: async route => {
      saved = true;
      await fulfillJson(route, 201, created);
    },
  });
  await page.goto('/feed');

  const typeFilters = page.getByRole('group', { name: 'Filtrar por tipo de publicación' });
  const ordering = page.getByRole('group', { name: 'Ordenar publicaciones' });
  await typeFilters.getByRole('button', { name: 'Evidencias' }).click();
  await ordering.getByRole('button', { name: 'Populares' }).click();
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  await expect(page.getByText('Publicación 5')).toBeVisible();

  await page.getByPlaceholder('¿Qué acción sostenible realizaste hoy?').fill('Llevé mi bolsa');
  await page.getByRole('button', { name: 'Publicar' }).click();

  // The type matches, so only the popular order hides it.
  const notice = page.getByRole('status').filter({ hasText: 'Tu publicación se creó' });
  await expect(notice).toBeVisible();
  await expect(page.getByText('Llevé mi bolsa', { exact: true })).toHaveCount(0);
  const listingsBefore = listCalls(mock).length;

  await notice.getByRole('button', { name: 'Ver en Recientes' }).click();
  await expect(ordering.getByRole('button', { name: 'Recientes' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(typeFilters.getByRole('button', { name: 'Evidencias' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByText('Llevé mi bolsa', { exact: true })).toBeVisible();
  await expect(notice).toHaveCount(0);
  expect(listCalls(mock).slice(listingsBefore)).toEqual([
    'GET /api/v1/feed/?page=1&post_type=SHARED_EVIDENCE',
  ]);
});

test('should disable like, edit, delete and save while a filter change is loading', async ({
  page,
}) => {
  let releaseAnnouncements: () => void = () => {};
  const announcementsHeld = new Promise<void>(resolve => {
    releaseAnnouncements = resolve;
  });
  // Both posts belong to the signed-in user (mockStudentSession), so they show edit and delete.
  const mine = { author_id: 'test-user-id' };
  const mock = await mockFeed(page, {
    listFor: () => [post(1, mine), post(2, mine)],
  });
  await page.route(/\/api\/v1\/feed\/\?.*post_type=OFFICIAL_ANNOUNCEMENT/, async route => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS_HEADERS });
      return;
    }
    await announcementsHeld;
    await route.fallback();
  });
  await page.goto('/feed');

  const editing = page.locator('div.rounded-xl').filter({ hasText: 'Publicación 1' });
  const idle = page.locator('div.rounded-xl').filter({ hasText: 'Publicación 2' });
  await editing.getByRole('button', { name: 'Editar publicación' }).click();
  const saveButton = editing.getByRole('button', { name: 'Guardar' });
  const idleControls = [
    idle.getByRole('button', { name: /^Like,/ }),
    idle.getByRole('button', { name: 'Editar publicación' }),
    idle.getByRole('button', { name: 'Eliminar publicación' }),
  ];
  for (const control of [saveButton, ...idleControls]) {
    await expect(control).toBeEnabled();
  }

  await page
    .getByRole('group', { name: 'Filtrar por tipo de publicación' })
    .getByRole('button', { name: 'Anuncios' })
    .click();
  await expect(page.locator('[aria-busy="true"]')).toBeVisible();
  for (const control of [saveButton, ...idleControls]) {
    await expect(control).toBeDisabled();
  }

  releaseAnnouncements();
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  for (const control of [saveButton, ...idleControls]) {
    await expect(control).toBeEnabled();
  }
  expect(likeCalls(mock)).toEqual([]);
});

/** A promise the test resolves by hand, to hold a mocked response until it says so. */
function gate() {
  let open: () => void = () => {};
  const opened = new Promise<void>(resolve => {
    open = resolve;
  });
  return { open, opened };
}

/**
 * Press "Publicar" with the create request held, switch to `filter` with its listing held, then let
 * the post be created before that listing (requested earlier, so without the post) arrives.
 */
async function createPostWhileFilterLoads(
  page: Page,
  options: { filter: string; postType: PostType; content: string },
) {
  const createHeld = gate();
  const listingHeld = gate();
  const created = { ...post(99, { post_type: 'SHARED_EVIDENCE' }), content: options.content };
  const filtered = post(5, { post_type: options.postType });
  const mock = await mockFeed(page, {
    listFor: url =>
      url.searchParams.get('post_type') === options.postType ? [filtered] : [post(1)],
    onCreate: async route => {
      await createHeld.opened;
      await fulfillJson(route, 201, created);
    },
  });
  await page.route(new RegExp(`/api/v1/feed/\\?.*post_type=${options.postType}`), async route => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS_HEADERS });
      return;
    }
    await listingHeld.opened;
    await route.fallback();
  });
  await page.goto('/feed');
  await expect(page.getByText('Publicación 1')).toBeVisible();

  await page.getByPlaceholder('¿Qué acción sostenible realizaste hoy?').fill(options.content);
  await page.getByRole('button', { name: 'Publicar' }).click();
  await expect.poll(() => mock.calls.filter(call => call.startsWith('POST '))).toHaveLength(1);

  const typeFilters = page.getByRole('group', { name: 'Filtrar por tipo de publicación' });
  await typeFilters.getByRole('button', { name: options.filter }).click();
  await expect(page.locator('[aria-busy="true"]')).toBeVisible();

  createHeld.open();
  // The form clears once the post exists, while the filtered listing is still held.
  await expect(page.getByPlaceholder('¿Qué acción sostenible realizaste hoy?')).toHaveValue('');
  listingHeld.open();
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  await expect(page.getByText('Publicación 5')).toBeVisible();
  return { typeFilters };
}

test('should keep a post created while a matching filter loads', async ({ page }) => {
  await createPostWhileFilterLoads(page, {
    filter: 'Evidencias',
    postType: 'SHARED_EVIDENCE',
    content: 'Composté en casa',
  });

  await expect(page.getByText('Composté en casa', { exact: true })).toBeVisible();
  await expect(page.getByText('Publicación 1')).toHaveCount(0);
  await expect(page.getByRole('status').filter({ hasText: 'Tu publicación se creó' })).toHaveCount(
    0,
  );
});

test('should judge a post created during a filter change by the new filter', async ({ page }) => {
  const { typeFilters } = await createPostWhileFilterLoads(page, {
    filter: 'Anuncios',
    postType: 'OFFICIAL_ANNOUNCEMENT',
    content: 'Apagué las luces',
  });

  await expect(page.getByText('Apagué las luces', { exact: true })).toHaveCount(0);
  const notice = page.getByRole('status').filter({ hasText: 'Tu publicación se creó' });
  await expect(notice.getByRole('button', { name: 'Ver en Todos' })).toBeVisible();
  await expect(typeFilters.getByRole('button', { name: 'Anuncios' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('should never show the author email as their name', async ({ page }) => {
  await mockFeed(page, {
    listFor: () => [
      {
        ...post(1),
        author: {
          id: 'user-x',
          email: 'persona.privada@iteso.mx',
          display_name: '',
          avatar_url: '',
        },
      },
    ],
  });
  await page.goto('/feed');

  await expect(page.getByRole('heading', { name: 'Usuario GreenITESO' })).toBeVisible();
  await expect(page.getByText(/persona\.privada/)).toHaveCount(0);
});
