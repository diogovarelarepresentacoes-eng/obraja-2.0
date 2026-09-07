'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-6" style={{ backgroundColor: '#FDE8D8' }}>
        ⚠️
      </div>
      <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'var(--font-montserrat)' }}>
        Algo deu errado
      </h1>
      <p className="text-gray-500 text-sm mt-2 max-w-sm">
        Ocorreu um erro inesperado. Nossa equipe foi notificada.
      </p>
      <div className="mt-8 flex gap-3">
        <button
          onClick={reset}
          className="px-6 py-3 rounded-xl font-bold text-white text-sm hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#E8622C' }}
        >
          Tentar novamente
        </button>
        <Link
          href="/"
          className="px-6 py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors"
        >
          Ir para o início
        </Link>
      </div>
    </div>
  );
}
