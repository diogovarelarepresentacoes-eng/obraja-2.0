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

function maskPhone(v: string) {
  return v.replace(/\D/g, '').replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3').slice(0, 15);
}

function passwordStrength(pwd: string): { level: 0 | 1 | 2 | 3; label: string; color: string } {
  if (pwd.length === 0) return { level: 0, label: '', color: '' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { level: 1, label: 'Fraca', color: '#EF4444' };
  if (score === 2) return { level: 2, label: 'Média', color: '#F59E0B' };
  return { level: 3, label: 'Forte', color: '#22C55E' };
}

const inputCls =
  'w-full px-4 py-3 rounded-xl text-sm text-gray-900 placeholder-gray-400 bg-gray-50 border border-gray-100 focus:outline-none focus:border-transparent focus:ring-2 focus:ring-orange-400 transition';
const labelCls = 'block text-xs font-semibold text-gray-600 mb-1.5';

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

  const strength = passwordStrength(password);

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
    if (validationError) { setError(validationError); return; }

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

      if (!res.ok) { setError(data?.message ?? 'Erro ao criar conta'); return; }

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
    <div className="w-full max-w-sm">
      {/* Header text */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: 'var(--font-montserrat)' }}>
          Criar conta
        </h1>
        <p className="text-gray-500 mt-1.5 text-sm">
          Gratuito. Sem burocracia. Comece agora.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nome */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Nome *</label>
            <input
              type="text"
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="João"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Sobrenome *</label>
            <input
              type="text"
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Silva"
              className={inputCls}
            />
          </div>
        </div>

        {/* E-mail */}
        <div>
          <label className={labelCls}>E-mail *</label>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className={inputCls}
          />
        </div>

        {/* Telefone */}
        <div>
          <label className={labelCls}>
            Telefone{' '}
            <span className="font-normal text-gray-400">(opcional)</span>
          </label>
          <input
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(maskPhone(e.target.value))}
            placeholder="(11) 99999-9999"
            className={inputCls}
          />
        </div>

        {/* Senha + strength */}
        <div>
          <label className={labelCls}>Senha *</label>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            className={inputCls}
          />
          {strength.level > 0 && (
            <div className="mt-2">
              <div className="flex gap-1">
                {[1, 2, 3].map((bar) => (
                  <div
                    key={bar}
                    className="flex-1 h-1 rounded-full transition-colors duration-300"
                    style={{ backgroundColor: bar <= strength.level ? strength.color : '#E5E7EB' }}
                  />
                ))}
              </div>
              <p className="text-xs mt-1" style={{ color: strength.color }}>
                {strength.label}
              </p>
            </div>
          )}
        </div>

        {/* Confirmar senha */}
        <div>
          <label className={labelCls}>Confirmar senha *</label>
          <input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repita a senha"
            className={inputCls}
          />
          {confirmPassword && password !== confirmPassword && (
            <p className="text-xs mt-1 text-red-500">As senhas não coincidem</p>
          )}
          {confirmPassword && password === confirmPassword && password.length > 0 && (
            <p className="text-xs mt-1 text-green-600">Senhas coincidem ✓</p>
          )}
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
          {loading ? 'Criando conta...' : 'Criar conta grátis →'}
        </button>

        <p className="text-xs text-gray-400 text-center">
          Ao criar uma conta você concorda com os{' '}
          <a href="#" className="underline">Termos de Uso</a>
        </p>
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
