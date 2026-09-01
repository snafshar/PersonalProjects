export type AuthUser = { id: string; email: string };
export type AuthSession = { accessToken: string; refreshToken: string; user: AuthUser; demo: boolean };

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, '') ?? '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

export const isAuthConfigured = Boolean(supabaseUrl && supabaseKey);
export const backendConfig = { url: supabaseUrl, key: supabaseKey };

function userFromPayload(value: unknown): AuthUser {
  const candidate = value as { id?: unknown; email?: unknown };
  if (typeof candidate?.id !== 'string') throw new Error('The authentication response did not contain a user.');
  return { id: candidate.id, email: typeof candidate.email === 'string' ? candidate.email : '' };
}

async function authFetch(path: string, body?: object, accessToken?: string) {
  if (!isAuthConfigured) throw new Error('Supabase is not configured. Use demo mode or add the environment variables.');
  const response = await fetch(`${supabaseUrl}/auth/v1${path}`, {
    method: 'POST',
    headers: {
      apikey: supabaseKey,
      'content-type': 'application/json',
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) throw new Error(String(payload.msg ?? payload.error_description ?? payload.message ?? 'Authentication failed.'));
  return payload;
}

function sessionFromPayload(payload: Record<string, unknown>): AuthSession | null {
  if (typeof payload.access_token !== 'string' || typeof payload.refresh_token !== 'string' || !payload.user) return null;
  return { accessToken: payload.access_token, refreshToken: payload.refresh_token, user: userFromPayload(payload.user), demo: false };
}

export async function signInWithPassword(email: string, password: string) {
  const payload = await authFetch('/token?grant_type=password', { email, password });
  const session = sessionFromPayload(payload);
  if (!session) throw new Error('The server did not return a session.');
  return session;
}

export async function signUpWithPassword(email: string, password: string) {
  const payload = await authFetch('/signup', { email, password });
  return { session: sessionFromPayload(payload), needsEmailConfirmation: !payload.access_token };
}

export async function signOutSession(accessToken: string) {
  await authFetch('/logout', undefined, accessToken);
}

export function createDemoSession(): AuthSession {
  return { accessToken: 'demo', refreshToken: 'demo', user: { id: 'demo-user', email: 'photographer@demo.local' }, demo: true };
}
