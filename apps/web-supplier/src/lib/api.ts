'use client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('obraja_supplier_token');
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

  const body = await res.json();

  if (!res.ok) {
    throw new Error(body?.message ?? `Erro ${res.status}`);
  }

  return (body as { success: boolean; data: T }).data;
}

export const api = {
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  get: <T>(path: string) => request<T>(path),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
};

const SUPPLIER_COOKIE = 'obraja_supplier_has_token';
const SUPPLIER_COOKIE_MAX_AGE = 60 * 60 * 23; // 23h

export function setSupplierToken(token: string) {
  localStorage.setItem('obraja_supplier_token', token);
  document.cookie = `${SUPPLIER_COOKIE}=1; path=/; max-age=${SUPPLIER_COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function clearSupplierToken() {
  localStorage.removeItem('obraja_supplier_token');
  document.cookie = `${SUPPLIER_COOKIE}=; path=/; max-age=0`;
}
