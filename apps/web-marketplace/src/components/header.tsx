'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

export function Header() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  async function handleLogout() {
    await logout();
    router.push('/');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50" style={{ backgroundColor: '#111111' }}>
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex-shrink-0 text-2xl font-black"
          style={{ fontFamily: 'var(--font-montserrat)' }}
        >
          <span className="text-white">Obra</span>
          <span style={{ color: '#E8622C' }}>Já</span>
        </Link>

        {/* Search */}
        <form method="GET" action="/catalogo" className="flex-1 flex gap-2 max-w-2xl mx-auto">
          <input
            type="text"
            name="search"
            placeholder="Buscar materiais de construção..."
            className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': '#E8622C' } as React.CSSProperties}
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white flex-shrink-0 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#E8622C' }}
          >
            Filtrar
          </button>
        </form>

        {/* Right side */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {user ? (
            <>
              <Link
                href="/meus-pedidos"
                className="text-gray-300 hover:text-white text-sm font-medium transition-colors hidden sm:block"
              >
                Olá, {user.firstName ?? user.email.split('@')[0]}
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-white text-sm transition-colors"
                aria-label="Sair da conta"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-gray-300 hover:text-white text-sm font-medium transition-colors hidden sm:block"
              >
                Entrar
              </Link>
              <Link
                href="/cadastro"
                className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 hidden sm:block"
                style={{ backgroundColor: '#E8622C' }}
              >
                Cadastre-se
              </Link>
              {/* Mobile: ícone de conta */}
              <Link
                href="/login"
                className="text-gray-300 hover:text-white transition-colors sm:hidden"
                aria-label="Entrar"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
              </Link>
            </>
          )}

          {/* Cart */}
          <Link
            href="/carrinho"
            className="relative text-gray-300 hover:text-white transition-colors"
            aria-label="Carrinho"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
              />
            </svg>
            <span
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
              style={{ backgroundColor: '#E8622C' }}
            >
              0
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
