import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F5F5' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#111111' }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center">
          <Link
            href="/"
            className="text-2xl font-black"
            style={{ fontFamily: 'var(--font-montserrat)' }}
          >
            <span className="text-white">Obra</span>
            <span style={{ color: '#E8622C' }}>Já</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>
    </div>
  );
}
