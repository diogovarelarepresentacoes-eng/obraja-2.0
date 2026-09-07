'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-6" style={{ backgroundColor: '#FEF3C7' }}>
        ⚠️
      </div>
      <h1 className="text-xl font-bold text-gray-900">Erro inesperado</h1>
      <p className="text-gray-500 text-sm mt-2 max-w-sm">
        {error.message ?? 'Ocorreu um erro interno. Tente recarregar a página.'}
      </p>
      <button
        onClick={reset}
        className="mt-6 px-6 py-2.5 rounded-lg font-semibold text-white text-sm hover:opacity-90 transition-opacity"
        style={{ backgroundColor: '#F05A28' }}
      >
        Tentar novamente
      </button>
    </div>
  );
}
