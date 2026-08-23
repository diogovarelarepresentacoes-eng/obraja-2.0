const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    next: { revalidate: 60 },
  });

  const body = await res.json();

  if (!res.ok) {
    throw new Error(body?.message ?? `Erro ${res.status}`);
  }

  return (body as { success: boolean; data: T }).data;
}

export const api = {
  get: <T>(path: string, options?: RequestInit) => request<T>(path, options),
};

// ─── Buyer auth token helpers (client-side only) ───────────────────────────

const TOKEN_KEY = 'obraja_buyer_token';
const TOKEN_COOKIE = 'obraja_has_token';
const TOKEN_COOKIE_MAX_AGE = 60 * 60 * 23; // 23h — matches JWT access token lifetime

export function getBuyerToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setBuyerToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  document.cookie = `${TOKEN_COOKIE}=1; path=/; max-age=${TOKEN_COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function clearBuyerToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0`;
}

// ─── authApi — always sends the buyer token ────────────────────────────────

function buildAuthHeaders(extra?: HeadersInit): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = getBuyerToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return { ...headers, ...(extra ?? {}) };
}

async function authRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: buildAuthHeaders(options?.headers),
  });

  const body = await res.json() as { success: boolean; data: T; message?: string };

  if (!res.ok) {
    throw new Error(body?.message ?? `Erro ${res.status}`);
  }

  return body.data;
}

export const authApi = {
  get: <T>(path: string, options?: RequestInit) =>
    authRequest<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body: unknown, options?: RequestInit) =>
    authRequest<T>(path, { ...options, method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown, options?: RequestInit) =>
    authRequest<T>(path, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
};
