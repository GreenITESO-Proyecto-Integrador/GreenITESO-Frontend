import {
  PublicClientApplication,
  type AccountInfo,
  type AuthenticationResult,
  type Configuration,
} from '@azure/msal-browser';

const microsoftClientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID;
const redirectUri = `${window.location.origin}/login`;

const microsoftConfiguration: Configuration = {
  auth: {
    clientId: microsoftClientId ?? '',
    authority:
      import.meta.env.VITE_MICROSOFT_AUTHORITY || 'https://login.microsoftonline.com/organizations',
    redirectUri,
  },
  cache: {
    cacheLocation: 'sessionStorage',
  },
};

let msalInstance: PublicClientApplication | null = null;
let initialization: Promise<PublicClientApplication> | null = null;

export function isMicrosoftLoginConfigured(): boolean {
  return typeof microsoftClientId === 'string' && microsoftClientId.trim().length > 0;
}

export async function getMicrosoftClient(): Promise<PublicClientApplication> {
  if (!isMicrosoftLoginConfigured()) {
    throw new Error('Microsoft login is not configured. Set VITE_MICROSOFT_CLIENT_ID.');
  }

  if (msalInstance) {
    return msalInstance;
  }

  initialization ??= (async () => {
    const instance = new PublicClientApplication(microsoftConfiguration);
    await instance.initialize();
    msalInstance = instance;
    return instance;
  })();

  return initialization;
}

export async function startMicrosoftLogin(): Promise<void> {
  const client = await getMicrosoftClient();

  await client.loginRedirect({
    scopes: ['openid', 'profile', 'email', 'offline_access', 'User.Read'],
    redirectStartPage: window.location.href,
  });
}

export async function handleMicrosoftRedirect(): Promise<AuthenticationResult | null> {
  const client = await getMicrosoftClient();
  const result = await client.handleRedirectPromise();

  if (result?.account) {
    client.setActiveAccount(result.account);
  }

  return result;
}

export async function getMicrosoftAccessToken(account: AccountInfo): Promise<string> {
  const client = await getMicrosoftClient();
  const result = await client.acquireTokenSilent({
    account,
    scopes: ['User.Read'],
  });

  return result.accessToken;
}
