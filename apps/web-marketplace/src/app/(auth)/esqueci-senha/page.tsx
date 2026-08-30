'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

const inputCls =
  'w-full px-4 py-3 rounded-xl text-sm text-gray-900 placeholder-gray-400 bg-gray-50 border border-gray-100 focus:outline-none focus:border-transparent focus:ring-2 focus:ring-orange-400 transition';

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !email.includes('@')) {
      setError('Informe um e-mail válido');
      return;
    }
    setLoading(true);
    try {
      await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      setSent(true);
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="w-full max-w-sm text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-6"
          style={{ backgroundColor: '#D1FAE5' }}
        >
          ✉️
        </div>
        <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'var(--font-montserrat)' }}>
          Verifique seu e-mail
        </h1>
        <p className="text-gray-500 text-sm mt-3 leading-relaxed">
          Enviamos as instruções de recuperação para{' '}
          <strong className="text-gray-700">{email}</strong>.
          Verifique também a caixa de spam.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-block px-8 py-3 rounded-xl font-bold text-white text-sm hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#E8622C' }}
        >
          Voltar ao login
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: 'var(--font-montserrat)' }}>
          Recuperar senha
        </h1>
        <p className="text-gray-500 mt-1.5 text-sm">
          Informe seu e-mail e enviaremos um link de redefinição
        </p>
      </div>

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

        {error && (
          <div className="px-4 py-3 rounded-xl text-sm font-medium bg-red-50 text-red-600 border border-red-100">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#E8622C' }}
        >
          {loading ? 'Enviando...' : 'Enviar link de recuperação'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Lembrou a senha?{' '}
        <Link href="/login" className="font-semibold hover:underline" style={{ color: '#E8622C' }}>
          Voltar ao login
        </Link>
      </p>
    </div>
  );
}
