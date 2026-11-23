/**
 * Login institucional (front): cómo el front habla con POST /api/v1/auth/login/.
 *
 * Referencia: ID01 ("Identidad 1" en la división de trabajo del equipo) = login
 * institucional con Microsoft (mock y Entra ID), dominio @iteso.mx, alta o
 * actualización del usuario y rol según el puesto.
 *
 * Caja blanca: se llaman directo `loginWithMicrosoft`, `persistLogin` y
 * `exchangeMicrosoftSignIn` y se revisa qué mandan y cómo leen la respuesta.
 * El backend se simula con page.route, así que no se necesita Microsoft ni Django.
 */
import { expect, test } from '@playwright/test';
import {
  LOGIN_OK,
  REFRESH_API,
  callExchange,
  callLoginApi,
  envelope,
  mockLoginApi,
} from './login-helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/login');
});

test.describe('Lo que manda el front', () => {
  test('manda id_token y access_token en JSON', async ({ page }) => {
    const requests = await mockLoginApi(page, () => ({ status: 200, body: LOGIN_OK }));
    await callLoginApi(page, 'id-123', 'at-456');
    expect(requests[0]?.body).toEqual({ id_token: 'id-123', access_token: 'at-456' });
  });

  test('usa Content-Type application/json', async ({ page }) => {
    const requests = await mockLoginApi(page, () => ({ status: 200, body: LOGIN_OK }));
    await callLoginApi(page, 'id-123');
    expect(requests[0]?.headers['content-type']).toContain('application/json');
  });

  test('sin sesión no manda Authorization', async ({ page }) => {
    const requests = await mockLoginApi(page, () => ({ status: 200, body: LOGIN_OK }));
    await callLoginApi(page, 'id-123');
    expect(requests[0]?.headers.authorization).toBeUndefined();
  });

  test('un access_token vacío se manda como texto vacío', async ({ page }) => {
    const requests = await mockLoginApi(page, () => ({ status: 200, body: LOGIN_OK }));
    await callLoginApi(page, 'id-123', '');
    expect(requests[0]?.body.access_token).toBe('');
  });

  test('un 401 del login no intenta refrescar el token', async ({ page }) => {
    let refreshCalls = 0;
    await page.route(REFRESH_API, route => {
      refreshCalls += 1;
      return route.fulfill({ status: 401, body: '{}' });
    });
    const requests = await mockLoginApi(page, () => ({
      status: 401,
      body: envelope('UNAUTHENTICATED', 'x'),
    }));
    await callLoginApi(page, 'id-123');
    expect(refreshCalls).toBe(0);
    expect(requests).toHaveLength(1);
  });
});

test.describe('Cómo lee la respuesta', () => {
  test('convierte los campos del usuario a camelCase', async ({ page }) => {
    await mockLoginApi(page, () => ({ status: 200, body: LOGIN_OK }));
    const outcome = await callLoginApi(page, 'id');
    expect(outcome.response?.user).toEqual({
      id: 'u1',
      email: 'ana@iteso.mx',
      firstName: 'Ana',
      lastName: 'García',
      role: 'STUDENT',
      avatarUrl: '',
    });
  });

  for (const role of ['STUDENT', 'STAFF', 'ADMIN']) {
    test(`respeta el rol ${role} que decidió el backend`, async ({ page }) => {
      await mockLoginApi(page, () => ({
        status: 200,
        body: { ...LOGIN_OK, user: { ...LOGIN_OK.user, role } },
      }));
      const outcome = await callLoginApi(page, 'id');
      expect((outcome.response?.user as { role: string }).role).toBe(role);
    });
  }

  test('created true en el primer login', async ({ page }) => {
    await mockLoginApi(page, () => ({ status: 200, body: LOGIN_OK }));
    expect((await callLoginApi(page, 'id')).response?.created).toBe(true);
  });

  test('created como texto "true" no cuenta como true', async ({ page }) => {
    await mockLoginApi(page, () => ({ status: 200, body: { ...LOGIN_OK, created: 'true' } }));
    expect((await callLoginApi(page, 'id')).response?.created).toBe(false);
  });

  test('reactivated true cuando vuelve una cuenta desactivada', async ({ page }) => {
    await mockLoginApi(page, () => ({ status: 200, body: { ...LOGIN_OK, reactivated: true } }));
    expect((await callLoginApi(page, 'id')).response?.reactivated).toBe(true);
  });

  test('sin reactivated se toma como false', async ({ page }) => {
    const { reactivated: _omit, ...withoutFlag } = LOGIN_OK;
    await mockLoginApi(page, () => ({ status: 200, body: withoutFlag }));
    expect((await callLoginApi(page, 'id')).response?.reactivated).toBe(false);
  });

  test('sin avatar_url queda vacío', async ({ page }) => {
    const { avatar_url: _omit, ...user } = LOGIN_OK.user;
    await mockLoginApi(page, () => ({ status: 200, body: { ...LOGIN_OK, user } }));
    const outcome = await callLoginApi(page, 'id');
    expect((outcome.response?.user as { avatarUrl: string }).avatarUrl).toBe('');
  });

  const malformed: [string, Record<string, unknown>][] = [
    ['sin access', { ...LOGIN_OK, access: '' }],
    ['sin refresh', { ...LOGIN_OK, refresh: '' }],
    ['sin id de usuario', { ...LOGIN_OK, user: { ...LOGIN_OK.user, id: '' } }],
    ['sin correo', { ...LOGIN_OK, user: { ...LOGIN_OK.user, email: '' } }],
  ];
  for (const [name, body] of malformed) {
    test(`rechaza una respuesta ${name}`, async ({ page }) => {
      await mockLoginApi(page, () => ({ status: 200, body }));
      const outcome = await callLoginApi(page, 'id');
      expect(outcome.ok).toBe(false);
      expect(outcome.message).toBe('Malformed login response');
    });
  }

  test('rechaza una respuesta sin objeto user', async ({ page }) => {
    await mockLoginApi(page, () => ({ status: 200, body: { ...LOGIN_OK, user: 'ana' } }));
    expect((await callLoginApi(page, 'id')).message).toBe('Unexpected login response shape');
  });

  test('rechaza una respuesta que es una lista', async ({ page }) => {
    await mockLoginApi(page, () => ({ status: 200, body: [LOGIN_OK] }));
    expect((await callLoginApi(page, 'id')).message).toBe('Unexpected login response shape');
  });

  test('rechaza un 200 que no es JSON', async ({ page }) => {
    await mockLoginApi(page, () => ({ status: 200, body: '<html>', raw: true }));
    expect((await callLoginApi(page, 'id')).message).toBe('Login response is not valid JSON');
  });
});

test.describe('Errores del backend', () => {
  const passthrough: [string, number, string, string][] = [
    [
      'dominio no permitido',
      403,
      'DOMAIN_NOT_ALLOWED',
      'Solo se permiten cuentas institucionales @iteso.mx.',
    ],
    ['cuenta desactivada', 403, 'PERMISSION_DENIED', 'Esta cuenta está desactivada.'],
    [
      'correo ligado a otra cuenta',
      403,
      'PERMISSION_DENIED',
      'Este correo ya está vinculado a otra cuenta de Microsoft.',
    ],
    ['cuerpo inválido', 400, 'VALIDATION_ERROR', 'id_token: This field is required.'],
  ];
  for (const [name, status, code, message] of passthrough) {
    test(`muestra el mensaje del backend: ${name}`, async ({ page }) => {
      await mockLoginApi(page, () => ({ status, body: envelope(code, message) }));
      const outcome = await callLoginApi(page, 'id');
      expect(outcome.ok).toBe(false);
      expect(outcome.message).toBe(message);
    });
  }

  test('un error sin JSON dice el código HTTP', async ({ page }) => {
    await mockLoginApi(page, () => ({ status: 502, body: 'Bad Gateway', raw: true }));
    expect((await callLoginApi(page, 'id')).message).toBe('Login failed (502)');
  });

  test('un error con JSON sin "error" dice el código HTTP', async ({ page }) => {
    await mockLoginApi(page, () => ({ status: 400, body: { id_token: ['x'] } }));
    expect((await callLoginApi(page, 'id')).message).toBe('Login failed (400)');
  });
});

test.describe('persistLogin', () => {
  test('guarda access, refresh y usuario en sessionStorage', async ({ page }) => {
    const stored = await page.evaluate(async () => {
      const auth = await import('/src/lib/api/auth.ts');
      auth.persistLogin({
        access: 'a',
        refresh: 'r',
        user: { id: 'u1', email: 'ana@iteso.mx', firstName: 'Ana', lastName: 'G', role: 'STAFF' },
        created: false,
        reactivated: false,
      });
      return [
        sessionStorage.getItem('greeniteso.access_token'),
        sessionStorage.getItem('greeniteso.refresh_token'),
        JSON.parse(sessionStorage.getItem('greeniteso.user') ?? '{}').role,
      ];
    });
    expect(stored).toEqual(['a', 'r', 'STAFF']);
  });

  test('no usa localStorage (la sesión muere al cerrar la pestaña)', async ({ page }) => {
    const leaked = await page.evaluate(async () => {
      const auth = await import('/src/lib/api/auth.ts');
      localStorage.clear();
      auth.persistLogin({
        access: 'a',
        refresh: 'r',
        user: { id: 'u1', email: 'ana@iteso.mx', firstName: '', lastName: '', role: 'STUDENT' },
        created: false,
        reactivated: false,
      });
      return Object.keys(localStorage).filter(key => key.includes('token'));
    });
    expect(leaked).toEqual([]);
  });
});

test.describe('exchangeMicrosoftSignIn (de Microsoft al backend)', () => {
  test('sin ID token avisa en español y no llama al backend', async ({ page }) => {
    const requests = await mockLoginApi(page, () => ({ status: 200, body: LOGIN_OK }));
    const outcome = await callExchange(page, { accessToken: 'at' }, false);
    expect(outcome.message).toBe('Microsoft no devolvió un token de identidad. Intenta de nuevo.');
    expect(requests).toHaveLength(0);
  });

  test('un ID token vacío cuenta como faltante', async ({ page }) => {
    const requests = await mockLoginApi(page, () => ({ status: 200, body: LOGIN_OK }));
    const outcome = await callExchange(page, { idToken: '', accessToken: 'at' }, false);
    expect(outcome.ok).toBe(false);
    expect(requests).toHaveLength(0);
  });

  test('manda el access token que dio Microsoft', async ({ page }) => {
    const requests = await mockLoginApi(page, () => ({ status: 200, body: LOGIN_OK }));
    await callExchange(page, { idToken: 'id', accessToken: 'graph-at' }, false);
    expect(requests[0]?.body.access_token).toBe('graph-at');
  });

  test('si el primer intento funciona no reintenta', async ({ page }) => {
    const requests = await mockLoginApi(page, () => ({ status: 200, body: LOGIN_OK }));
    const outcome = await callExchange(page, { idToken: 'id', accessToken: 'at' });
    expect(outcome.ok).toBe(true);
    expect(requests).toHaveLength(1);
  });

  test('fuera del servidor de desarrollo nunca manda un token mock', async ({ page }) => {
    const requests = await mockLoginApi(page, () => ({
      status: 401,
      body: envelope('UNAUTHENTICATED', 'x'),
    }));
    await callExchange(page, { idToken: 'real', accessToken: 'at' }, false);
    expect(requests.map(r => r.body.id_token)).toEqual(['real']);
  });

  test('en desarrollo reintenta con mock:<correo de Microsoft>', async ({ page }) => {
    const requests = await mockLoginApi(page, body =>
      String(body.id_token).startsWith('mock:')
        ? { status: 200, body: LOGIN_OK }
        : { status: 401, body: envelope('UNAUTHENTICATED', 'x') },
    );
    const outcome = await callExchange(page, { idToken: 'real', accessToken: 'at' }, true);
    expect(outcome.ok).toBe(true);
    expect(requests.map(r => r.body.id_token)).toEqual(['real', 'mock:ana@iteso.mx']);
  });

  test('si el backend es mock, se muestra el error del reintento', async ({ page }) => {
    await mockLoginApi(page, body =>
      String(body.id_token).startsWith('mock:')
        ? { status: 403, body: envelope('DOMAIN_NOT_ALLOWED', 'Solo @iteso.mx') }
        : {
            status: 401,
            body: envelope('UNAUTHENTICATED', 'Mock mode expects an id_token like mock:<email>.'),
          },
    );
    const outcome = await callExchange(page, { idToken: 'real', accessToken: 'at' }, true);
    expect(outcome.message).toBe('Solo @iteso.mx');
  });

  test('si fallan los dos intentos se queda el error original', async ({ page }) => {
    await mockLoginApi(page, body => ({
      status: 403,
      body: envelope(
        'PERMISSION_DENIED',
        String(body.id_token).startsWith('mock:') ? 'error del mock' : 'error original',
      ),
    }));
    const outcome = await callExchange(page, { idToken: 'real', accessToken: 'at' }, true);
    expect(outcome.message).toBe('error original');
  });
});
