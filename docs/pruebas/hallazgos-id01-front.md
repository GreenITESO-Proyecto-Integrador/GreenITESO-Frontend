# Hallazgos ID01: login institucional (frontend)

ID01 = Identidad 1 en la división de trabajo: login con Microsoft (mock y Entra ID),
dominio @iteso.mx, alta o actualización del usuario y rol por puesto.

Generado por Playwright el 2026-11-23. Cada hallazgo tiene una prueba que afirma el
comportamiento correcto y usa `test.fail()` mientras el problema siga ahí.

## Resumen por integrante

| Integrante | Pendientes | Resueltos |
|---|---|---|
| DehBarca | 4 | 0 |

## Detalle

### 1. Un 429 del login se muestra como "Login failed (429)"

- **Integrante:** DehBarca
- **Severidad:** media
- **Estado:** pendiente
- **Qué pasa:** El backend limita los intentos de login (10/min). Cuando responde 429 sin el sobre {"error": ...}, el front muestra "Login failed (429)" en inglés y sin decir que espere.
- **Qué hacer:** En readErrorMessage de src/lib/api/auth.ts, convertir los estados conocidos (429, 5xx) en mensajes en español, por ejemplo "Demasiados intentos. Espera un momento".
- **Prueba:** `tests/login-institucional/hallazgos.spec.ts` › demasiados intentos de login se explican en español

### 2. El login muestra errores del backend en inglés

- **Integrante:** DehBarca
- **Severidad:** media
- **Estado:** pendiente
- **Qué pasa:** Si Microsoft no se puede verificar (401) o Entra no responde (503), el backend manda "The Microsoft sign-in could not be verified." o "The identity provider is temporarily unavailable." y Login.tsx lo muestra tal cual al usuario.
- **Qué hacer:** Traducir por `code` (UNAUTHENTICATED, SERVER_ERROR) en getLoginErrorMessage, o pasar el error por translateMessage de src/lib/api/errors.ts como el resto de la app.
- **Prueba:** `tests/login-institucional/hallazgos.spec.ts` › los errores de verificación del login se muestran en español

### 3. El aviso de dominio @iteso.mx de Login.tsx nunca se usa

- **Integrante:** DehBarca
- **Severidad:** baja
- **Estado:** pendiente
- **Qué pasa:** Login.tsx busca "DOMAIN_NOT_ALLOWED" dentro de error.message, pero readErrorMessage solo guarda el texto y tira el código. Esa rama nunca se cumple; hoy funciona porque el texto del backend ya viene en español, pero cualquier cambio de texto la rompe.
- **Qué hacer:** Lanzar un ApiError con `code` desde loginWithMicrosoft y en Login.tsx comparar error.code === "DOMAIN_NOT_ALLOWED" en vez de buscar en el mensaje.
- **Prueba:** `tests/login-institucional/hallazgos.spec.ts` › el error de dominio conserva su código para que la pantalla lo reconozca

### 4. Las respuestas inválidas del login muestran textos técnicos en inglés

- **Integrante:** DehBarca
- **Severidad:** baja
- **Estado:** pendiente
- **Qué pasa:** Si el backend responde 200 con datos incompletos, el usuario ve "Malformed login response" o "Unexpected login response shape".
- **Qué hacer:** Usar un mensaje en español como "No pudimos completar el inicio de sesión. Intenta de nuevo." y dejar el detalle técnico solo en la consola.
- **Prueba:** `tests/login-institucional/hallazgos.spec.ts` › una respuesta rota del login se explica en español
