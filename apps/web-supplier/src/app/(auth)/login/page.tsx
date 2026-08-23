'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, setSupplierToken } from '@/lib/api';

export default function SupplierLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await api.post<{ accessToken: string }>('/auth/login', { email, password });
      setSupplierToken(result.accessToken);
      router.push('/dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha no login';
      if (msg.toLowerCase().includes('aguardando aprovação') || msg.toLowerCase().includes('aguardando aprovacao')) {
        router.push('/pendente');
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold" style={{ color: '#F05A28' }}>ObraJá</h1>
          <p className="text-sm text-gray-500 mt-1">Painel do Fornecedor</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="empresa@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg font-semibold text-white text-sm disabled:opacity-60"
            style={{ backgroundColor: '#F05A28' }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Ainda não tem conta?{' '}
          <Link href="/cadastro" className="font-semibold" style={{ color: '#F05A28' }}>
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}
