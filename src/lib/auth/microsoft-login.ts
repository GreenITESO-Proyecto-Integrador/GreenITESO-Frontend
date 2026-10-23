import type { AccountInfo } from '@azure/msal-browser';
import { loginWithMicrosoft } from '@/lib/api/auth';
import { getMicrosoftAccessToken } from '@/lib/auth/microsoft';
import type { LoginResponse } from '@/types/auth';

export interface MicrosoftSignInResult {
  account: AccountInfo;
  idToken?: string;
  accessToken?: string;
}

/**
 * Exchange a Microsoft sign-in for GreenITESO tokens.
 *
 * Sends the real ID token once, so a rejected login surfaces the backend's own error
 * (tenant, domain, Graph). Only the Vite dev server retries with `mock:<email>`, for a
 * local backend running MICROSOFT_AUTH_MODE=mock; `import.meta.env.DEV` is false in every
 * build, so deployed bundles never send a mock token.
 */
export async function exchangeMicrosoftSignIn(
  result: MicrosoftSignInResult,
  { allowMockRetry = import.meta.env.DEV }: { allowMockRetry?: boolean } = {},
): Promise<LoginResponse> {
  if (!result.idToken) {
    throw new Error('Microsoft no devolvió un token de identidad. Intenta de nuevo.');
  }
  const accessToken = result.accessToken || (await getMicrosoftAccessToken(result.account));
  try {
    return await loginWithMicrosoft(result.idToken, accessToken);
  } catch (error) {
    if (!allowMockRetry) throw error;
    return loginWithMicrosoft(`mock:${result.account.username}`, accessToken);
  }
}
