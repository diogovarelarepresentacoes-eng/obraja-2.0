import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
      <p className="text-7xl font-black text-gray-200">404</p>
      <h1 className="text-xl font-bold text-gray-900 mt-3">Página não encontrada</h1>
      <p className="text-gray-500 text-sm mt-1">
        O endereço solicitado não existe no painel administrativo.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 px-6 py-2.5 rounded-lg font-semibold text-white text-sm hover:opacity-90 transition-opacity"
        style={{ backgroundColor: '#F05A28' }}
      >
        Voltar ao dashboard
      </Link>
    </div>
  );
}
