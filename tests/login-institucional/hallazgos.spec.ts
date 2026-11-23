/**
 * Login institucional (front): problemas que encontraron las pruebas.
 *
 * Referencia: ID01 ("Identidad 1" en la división de trabajo del equipo) = login
 * institucional con Microsoft (mock y Entra ID), dominio @iteso.mx, alta o
 * actualización del usuario y rol según el puesto.
 *
 * Cada prueba afirma cómo DEBERÍA comportarse el login y usa `test.fail()`: hoy falla
 * porque el problema existe. Cuando se arregle, Playwright la marca como inesperada y
 * `hallazgos-reporter.ts` la reporta como resuelta.
 */
import { expect, test } from '@playwright/test';
import { LOGIN_OK, callLoginApi, envelope, hallazgo, mockLoginApi } from './login-helpers';

const looksEnglish = /could not|unavailable|failed|unexpected|malformed|login response/i;

test.beforeEach(async ({ page }) => {
  await page.goto('/login');
});

test(
  'los errores de verificación del login se muestran en español',
  hallazgo({
    titulo: 'El login muestra errores del backend en inglés',
    integrante: 'DehBarca',
    severidad: 'media',
    detalle:
      'Si Microsoft no se puede verificar (401) o Entra no responde (503), el backend manda ' +
      '"The Microsoft sign-in could not be verified." o "The identity provider is temporarily ' +
      'unavailable." y Login.tsx lo muestra tal cual al usuario.',
    recomendacion:
      'Traducir por `code` (UNAUTHENTICATED, SERVER_ERROR) en getLoginErrorMessage, o pasar ' +
      'el error por translateMessage de src/lib/api/errors.ts como el resto de la app.',
  }),
  async ({ page }) => {
    test.fail();
    await mockLoginApi(page, () => ({
      status: 401,
      body: envelope('UNAUTHENTICATED', 'The Microsoft sign-in could not be verified.'),
    }));
    const outcome = await callLoginApi(page, 'id');
    expect(outcome.message).not.toMatch(looksEnglish);
  },
);

test(
  'demasiados intentos de login se explican en español',
  hallazgo({
    titulo: 'Un 429 del login se muestra como "Login failed (429)"',
    integrante: 'DehBarca',
    severidad: 'media',
    detalle:
      'El backend limita los intentos de login (10/min). Cuando responde 429 sin el sobre ' +
      '{"error": ...}, el front muestra "Login failed (429)" en inglés y sin decir que espere.',
    recomendacion:
      'En readErrorMessage de src/lib/api/auth.ts, convertir los estados conocidos (429, 5xx) ' +
      'en mensajes en español, por ejemplo "Demasiados intentos. Espera un momento".',
  }),
  async ({ page }) => {
    test.fail();
    await mockLoginApi(page, () => ({
      status: 429,
      body: { detail: 'Request was throttled.' },
    }));
    const outcome = await callLoginApi(page, 'id');
    expect(outcome.message).toMatch(/demasiados intentos|espera/i);
  },
);

test(
  'el error de dominio conserva su código para que la pantalla lo reconozca',
  hallazgo({
    titulo: 'El aviso de dominio @iteso.mx de Login.tsx nunca se usa',
    integrante: 'DehBarca',
    severidad: 'baja',
    detalle:
      'Login.tsx busca "DOMAIN_NOT_ALLOWED" dentro de error.message, pero readErrorMessage ' +
      'solo guarda el texto y tira el código. Esa rama nunca se cumple; hoy funciona porque ' +
      'el texto del backend ya viene en español, pero cualquier cambio de texto la rompe.',
    recomendacion:
      'Lanzar un ApiError con `code` desde loginWithMicrosoft y en Login.tsx comparar ' +
      'error.code === "DOMAIN_NOT_ALLOWED" en vez de buscar en el mensaje.',
  }),
  async ({ page }) => {
    test.fail();
    await mockLoginApi(page, () => ({
      status: 403,
      body: envelope('DOMAIN_NOT_ALLOWED', 'Solo se permiten cuentas institucionales @iteso.mx.'),
    }));
    const outcome = await callLoginApi(page, 'id');
    expect(
      outcome.code === 'DOMAIN_NOT_ALLOWED' || /DOMAIN_NOT_ALLOWED/.test(outcome.message ?? ''),
    ).toBe(true);
  },
);

test(
  'una respuesta rota del login se explica en español',
  hallazgo({
    titulo: 'Las respuestas inválidas del login muestran textos técnicos en inglés',
    integrante: 'DehBarca',
    severidad: 'baja',
    detalle:
      'Si el backend responde 200 con datos incompletos, el usuario ve "Malformed login ' +
      'response" o "Unexpected login response shape".',
    recomendacion:
      'Usar un mensaje en español como "No pudimos completar el inicio de sesión. Intenta de ' +
      'nuevo." y dejar el detalle técnico solo en la consola.',
  }),
  async ({ page }) => {
    test.fail();
    await mockLoginApi(page, () => ({ status: 200, body: { ...LOGIN_OK, access: '' } }));
    const outcome = await callLoginApi(page, 'id');
    expect(outcome.message).not.toMatch(looksEnglish);
  },
);
