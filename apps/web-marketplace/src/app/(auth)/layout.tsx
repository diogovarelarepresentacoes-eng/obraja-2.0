import Link from 'next/link';

const BRAND_BULLETS = [
  { icon: '🏗️', text: 'Mais de 5.000 produtos de construção civil' },
  { icon: '🚚', text: 'Entrega com rastreamento em tempo real' },
  { icon: '🧾', text: 'NF-e automática em todas as compras' },
  { icon: '💳', text: 'PIX, boleto e cartão — sem surpresas' },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* ── Left brand panel (hidden on mobile) ── */}
      <aside
        className="hidden lg:flex lg:w-[480px] xl:w-[520px] flex-col justify-between p-12 flex-shrink-0"
        style={{ backgroundColor: '#111111' }}
      >
        {/* Logo */}
        <Link href="/" className="text-3xl font-black" style={{ fontFamily: 'var(--font-montserrat)' }}>
          <span className="text-white">Obra</span>
          <span style={{ color: '#E8622C' }}>Já</span>
        </Link>

        {/* Middle content */}
        <div>
          <h2 className="text-3xl font-black text-white leading-tight" style={{ fontFamily: 'var(--font-montserrat)' }}>
            O marketplace de construção civil
            <span style={{ color: '#E8622C' }}> que a sua obra merecia.</span>
          </h2>
          <ul className="mt-8 space-y-4">
            {BRAND_BULLETS.map(({ icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ backgroundColor: 'rgba(232,98,44,0.15)' }}
                >
                  {icon}
                </span>
                <span className="text-gray-300 text-sm">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Social proof quote */}
        <blockquote
          className="rounded-2xl p-5"
          style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
        >
          <p className="text-gray-300 text-sm leading-relaxed">
            "Economizamos 30% no custo de materiais usando o ObraJá.
            A NF-e automática poupou horas da nossa equipe de compras."
          </p>
          <footer className="mt-3 flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ backgroundColor: '#E8622C' }}
            >
              RM
            </div>
            <div>
              <p className="text-white text-xs font-semibold">Ricardo Melo</p>
              <p className="text-gray-500 text-xs">Construtora Horizonte, SP</p>
            </div>
          </footer>
        </blockquote>
      </aside>

      {/* ── Right form area ── */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden px-6 py-4" style={{ backgroundColor: '#111111' }}>
          <Link href="/" className="text-2xl font-black" style={{ fontFamily: 'var(--font-montserrat)' }}>
            <span className="text-white">Obra</span>
            <span style={{ color: '#E8622C' }}>Já</span>
          </Link>
        </header>

        {/* Form centered */}
        <main className="flex-1 flex items-center justify-center px-6 py-10 bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}
