import type { Page } from '@playwright/test';
import type { AuthUser, UserRole } from '@/types/auth';

/**
 * Valid dummy JWT token with exp in 2050 so isTokenExpired() returns false.
 */
export const MOCK_JWT_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjI1MjQ2MDgwMDAsInVzZXJfaWQiOiJ0ZXN0LXVzZXIifQ.mock-signature';

interface MockSessionOptions {
  role?: UserRole | string;
  user?: Partial<AuthUser>;
  token?: string;
}

/**
 * Injects session credentials into sessionStorage before the page is loaded.
 */
export async function mockAuthenticatedSession(
  page: Page,
  options?: MockSessionOptions,
): Promise<AuthUser> {
  const role = options?.role ?? 'STUDENT';
  const mockUser: AuthUser = {
    id: 'test-user-id',
    email: 'usuario.test@iteso.mx',
    firstName: 'Usuario',
    lastName: 'Prueba',
    role,
    ...options?.user,
  };

  const token = options?.token ?? MOCK_JWT_TOKEN;

  await page.addInitScript(
    ({ sessionToken, sessionUser }) => {
      sessionStorage.setItem('greeniteso.access_token', sessionToken);
      sessionStorage.setItem('greeniteso.refresh_token', sessionToken);
      sessionStorage.setItem('greeniteso.user', JSON.stringify(sessionUser));
    },
    { sessionToken: token, sessionUser: mockUser },
  );

  return mockUser;
}

export async function mockAdminSession(page: Page, user?: Partial<AuthUser>): Promise<AuthUser> {
  return mockAuthenticatedSession(page, { role: 'ADMIN', user });
}

export async function mockStudentSession(page: Page, user?: Partial<AuthUser>): Promise<AuthUser> {
  return mockAuthenticatedSession(page, { role: 'STUDENT', user });
}

export async function mockStaffSession(page: Page, user?: Partial<AuthUser>): Promise<AuthUser> {
  return mockAuthenticatedSession(page, { role: 'STAFF', user });
}
