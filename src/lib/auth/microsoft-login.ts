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
 * Sends the real ID token exactly once, so a rejected login surfaces the backend's
 * own error (tenant, domain, Graph) instead of a second, unrelated attempt.
 */
export async function exchangeMicrosoftSignIn(
  result: MicrosoftSignInResult,
): Promise<LoginResponse> {
  if (!result.idToken) {
    throw new Error('Microsoft no devolvió un token de identidad. Intenta de nuevo.');
  }
  const accessToken = result.accessToken || (await getMicrosoftAccessToken(result.account));
  return loginWithMicrosoft(result.idToken, accessToken);
}
