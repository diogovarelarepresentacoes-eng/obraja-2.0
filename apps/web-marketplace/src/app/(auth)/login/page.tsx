'use client';

import { useState, FormEvent, Suspense } from 'react';
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

const inputCls =
  'w-full px-4 py-3 rounded-xl text-sm text-gray-900 placeholder-gray-400 bg-gray-50 border border-gray-100 focus:outline-none focus:border-transparent focus:ring-2 focus:ring-orange-400 transition';

function LoginPageContent() {
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
    <div className="w-full max-w-sm">
      {/* Header text */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: 'var(--font-montserrat)' }}>
          Bem-vindo de volta
        </h1>
        <p className="text-gray-500 mt-1.5 text-sm">
          Entre com seu e-mail e senha para continuar
        </p>
      </div>

      {successMsg && (
        <div className="mb-6 px-4 py-3 rounded-xl text-sm font-medium bg-green-50 text-green-700 border border-green-100">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">E-mail</label>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className={inputCls}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-gray-600">Senha</label>
            <Link
              href="/esqueci-senha"
              className="text-xs hover:underline"
              style={{ color: '#E8622C' }}
            >
              Esqueceu a senha?
            </Link>
          </div>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={inputCls}
          />
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl text-sm font-medium bg-red-50 text-red-600 border border-red-100">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#E8622C' }}
        >
          {loading ? 'Entrando...' : 'Entrar na conta'}
        </button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-xs text-gray-400">ou</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      {/* Outros acessos */}
      <div className="space-y-3">
        <Link
          href="/cadastro-fornecedor"
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <span className="flex items-center gap-2">
            <span>🏭</span>
            <span>Acessar como <strong>fornecedor</strong></span>
          </span>
          <span className="text-gray-400">→</span>
        </Link>
        <Link
          href="/cadastro-entregador"
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <span className="flex items-center gap-2">
            <span>🚛</span>
            <span>Acessar como <strong>entregador</strong></span>
          </span>
          <span className="text-gray-400">→</span>
        </Link>
      </div>

      <p className="mt-8 text-center text-sm text-gray-500">
        Ainda não tem conta?{' '}
        <Link href="/cadastro" className="font-semibold hover:underline" style={{ color: '#E8622C' }}>
          Criar conta grátis
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageContent />
    </Suspense>
  );
}
