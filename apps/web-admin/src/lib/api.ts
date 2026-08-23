'use client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('obraja_admin_token');
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Erro desconhecido' }));
    throw new Error(err.message ?? `Erro ${res.status}`);
  }

  const envelope = await res.json() as { success: boolean; data: T };
  return envelope.data;
}

export const api = {
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),

  get: <T>(path: string) =>
    request<T>(path, { method: 'GET' }),

  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
};

const ADMIN_COOKIE = 'obraja_admin_has_token';
const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 23; // 23h

export function setAdminToken(token: string) {
  localStorage.setItem('obraja_admin_token', token);
  document.cookie = `${ADMIN_COOKIE}=1; path=/; max-age=${ADMIN_COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function clearAdminToken() {
  localStorage.removeItem('obraja_admin_token');
  document.cookie = `${ADMIN_COOKIE}=; path=/; max-age=0`;
}
