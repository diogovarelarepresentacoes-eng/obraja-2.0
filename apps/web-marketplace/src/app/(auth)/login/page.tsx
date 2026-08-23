'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { setBuyerToken } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

interface LoginResponse {
  success: boolean;
  data: {
    accessToken: string;
    user: { id: string; email: string; role: string };
  };
  message?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const successMsg = searchParams.get('success');
  const returnUrl = searchParams.get('returnUrl') ?? '/meus-pedidos';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Preencha e-mail e senha');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const body = (await res.json()) as LoginResponse;

      if (!res.ok) {
        setError(body?.message ?? 'E-mail ou senha incorretos');
        return;
      }

      setBuyerToken(body.data.accessToken);
      useAuthStore.getState().setUser(body.data.user);
      router.push(returnUrl);
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="w-full max-w-md bg-white rounded-[20px] px-8 py-10"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
    >
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Entrar</h1>
      <p className="text-sm text-gray-500 mb-8">Acesse sua conta ObraJá</p>

      {successMsg && (
        <div className="mb-5 px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">E-mail</label>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="w-full px-4 py-3 rounded-xl text-sm text-gray-900 placeholder-gray-400 bg-gray-50 focus:outline-none focus:ring-2 transition"
            style={{ '--tw-ring-color': '#E8622C' } as React.CSSProperties}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Senha</label>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-xl text-sm text-gray-900 placeholder-gray-400 bg-gray-50 focus:outline-none focus:ring-2 transition"
            style={{ '--tw-ring-color': '#E8622C' } as React.CSSProperties}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 font-medium">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#E8622C' }}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Ainda não tem conta?{' '}
        <Link href="/cadastro" className="font-semibold hover:underline" style={{ color: '#E8622C' }}>
          Cadastre-se
        </Link>
      </p>
    </div>
  );
}
