const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export function getSessionId(): string {
  const key = 'obraja_session_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

function buildHeaders(extra?: HeadersInit): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-session-id': getSessionId(),
  };
  const token = localStorage.getItem('obraja_buyer_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return { ...headers, ...(extra ?? {}) };
}

async function cartRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: buildHeaders(options?.headers),
  });

  const body = await res.json();

  if (!res.ok) {
    throw new Error(body?.message ?? `Erro ${res.status}`);
  }

  return (body as { success: boolean; data: T }).data;
}

export const cartApi = {
  get: <T>(path: string, options?: RequestInit) =>
    cartRequest<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body: unknown, options?: RequestInit) =>
    cartRequest<T>(path, { ...options, method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown, options?: RequestInit) =>
    cartRequest<T>(path, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string, options?: RequestInit) =>
    cartRequest<T>(path, { ...options, method: 'DELETE' }),
};
