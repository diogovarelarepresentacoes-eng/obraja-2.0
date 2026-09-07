import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
      <p className="text-8xl font-black" style={{ color: '#E8622C', fontFamily: 'var(--font-montserrat)' }}>404</p>
      <h1 className="text-2xl font-black text-gray-900 mt-4" style={{ fontFamily: 'var(--font-montserrat)' }}>
        Página não encontrada
      </h1>
      <p className="text-gray-500 text-sm mt-2 max-w-sm">
        O endereço que você acessou não existe ou foi removido.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/"
          className="px-6 py-3 rounded-xl font-bold text-white text-sm hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#E8622C' }}
        >
          Ir para o início
        </Link>
        <Link
          href="/catalogo"
          className="px-6 py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors"
        >
          Ver catálogo
        </Link>
      </div>
    </div>
  );
}
