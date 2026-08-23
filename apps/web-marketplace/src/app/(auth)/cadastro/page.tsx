'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { setBuyerToken } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

interface RegisterResponse {
  success: boolean;
  data: {
    accessToken?: string;
    user?: { id: string; email: string; role: string };
  };
  message?: string;
}

export default function CadastroPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    if (!firstName.trim()) return 'Nome obrigatório';
    if (!lastName.trim()) return 'Sobrenome obrigatório';
    if (!email.trim() || !email.includes('@')) return 'E-mail inválido';
    if (password.length < 6) return 'Senha deve ter ao menos 6 caracteres';
    if (password !== confirmPassword) return 'As senhas não coincidem';
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, string> = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        role: 'BUYER',
      };
      if (phone.trim()) body['phone'] = phone.trim();

      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as RegisterResponse;

      if (!res.ok) {
        setError(data?.message ?? 'Erro ao criar conta');
        return;
      }

      if (data.data?.accessToken) {
        setBuyerToken(data.data.accessToken);
        if (data.data.user) useAuthStore.getState().setUser(data.data.user);
        router.push('/meus-pedidos');
      } else {
        router.push('/login?success=Conta+criada+com+sucesso%21+Faça+login+para+continuar.');
      }
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
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Criar conta</h1>
      <p className="text-sm text-gray-500 mb-8">Compre materiais de construção com facilidade</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Nome</label>
            <input
              type="text"
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="João"
              className="w-full px-4 py-3 rounded-xl text-sm text-gray-900 placeholder-gray-400 bg-gray-50 focus:outline-none focus:ring-2 transition"
              style={{ '--tw-ring-color': '#E8622C' } as React.CSSProperties}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Sobrenome</label>
            <input
              type="text"
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Silva"
              className="w-full px-4 py-3 rounded-xl text-sm text-gray-900 placeholder-gray-400 bg-gray-50 focus:outline-none focus:ring-2 transition"
              style={{ '--tw-ring-color': '#E8622C' } as React.CSSProperties}
            />
          </div>
        </div>

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
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Telefone <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <input
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(11) 99999-9999"
            className="w-full px-4 py-3 rounded-xl text-sm text-gray-900 placeholder-gray-400 bg-gray-50 focus:outline-none focus:ring-2 transition"
            style={{ '--tw-ring-color': '#E8622C' } as React.CSSProperties}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Senha</label>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            className="w-full px-4 py-3 rounded-xl text-sm text-gray-900 placeholder-gray-400 bg-gray-50 focus:outline-none focus:ring-2 transition"
            style={{ '--tw-ring-color': '#E8622C' } as React.CSSProperties}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Confirmar senha</label>
          <input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repita a senha"
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
          className="w-full py-3 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          style={{ backgroundColor: '#E8622C' }}
        >
          {loading ? 'Criando conta...' : 'Criar conta'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Já tem conta?{' '}
        <Link href="/login" className="font-semibold hover:underline" style={{ color: '#E8622C' }}>
          Entrar
        </Link>
      </p>
    </div>
  );
}
