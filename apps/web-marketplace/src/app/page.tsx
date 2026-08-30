import Link from 'next/link';
import { api } from '@/lib/api';
import { Header } from '@/components/header';

interface Category {
  id: string;
  name: string;
  slug: string;
  children: { id: string; name: string; slug: string }[];
}

type CapsuleTheme = { bg: string; color: string };

const CATEGORY_COLORS: Record<string, CapsuleTheme> = {
  estrutura: { bg: '#FDE8D8', color: '#9A3412' },
  cimento: { bg: '#FDE8D8', color: '#9A3412' },
  revestimento: { bg: '#D1FAE5', color: '#065F46' },
  hidraulica: { bg: '#DBEAFE', color: '#1D4ED8' },
  hidráulica: { bg: '#DBEAFE', color: '#1D4ED8' },
  eletrica: { bg: '#FEF9C3', color: '#854D0E' },
  elétrica: { bg: '#FEF9C3', color: '#854D0E' },
  ferramentas: { bg: '#F3F4F6', color: '#374151' },
  acabamento: { bg: '#EDE9FE', color: '#5B21B6' },
  madeira: { bg: '#FEF3C7', color: '#92400E' },
};

const CATEGORY_EMOJIS: Record<string, string> = {
  estrutura: '🧱',
  cimento: '🧱',
  revestimento: '🪨',
  hidraulica: '🔧',
  hidráulica: '🔧',
  eletrica: '⚡',
  elétrica: '⚡',
  ferramentas: '🔨',
  acabamento: '🎨',
  madeira: '🪵',
};

function getCapsuleTheme(slug: string): CapsuleTheme {
  const normalized = slug.toLowerCase().replace(/-/g, '');
  for (const key of Object.keys(CATEGORY_COLORS)) {
    if (normalized.includes(key.replace(/[áéíóúâêîôûã]/g, (c) =>
      ({ á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', â: 'a', ê: 'e', î: 'i', ô: 'o', û: 'u', ã: 'a' }[c] ?? c)
    ))) return CATEGORY_COLORS[key]!;
  }
  return { bg: '#F3F4F6', color: '#374151' };
}

function getCapsuleEmoji(slug: string): string {
  const normalized = slug.toLowerCase().replace(/-/g, '');
  for (const key of Object.keys(CATEGORY_EMOJIS)) {
    if (normalized.includes(key.replace(/[áéíóúâêîôûã]/g, (c) =>
      ({ á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', â: 'a', ê: 'e', î: 'i', ô: 'o', û: 'u', ã: 'a' }[c] ?? c)
    ))) return CATEGORY_EMOJIS[key]!;
  }
  return '📦';
}

export default async function LandingPage() {
  const categories = await api.get<Category[]>('/categories').catch(() => [] as Category[]);
  const rootCategories = (categories as Category[]).filter((c) => c.children?.length > 0).slice(0, 8);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* ── Hero ── */}
      <section style={{ backgroundColor: '#111111' }} className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 70% 50%, #E8622C 0%, transparent 60%)`,
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 py-24 md:py-32 text-center">
          <span
            className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{ backgroundColor: 'rgba(232,98,44,0.15)', color: '#E8622C' }}
          >
            O marketplace de construção civil do Brasil
          </span>
          <h1
            className="text-4xl md:text-6xl font-black text-white leading-tight max-w-3xl mx-auto"
            style={{ fontFamily: 'var(--font-montserrat)' }}
          >
            Materiais de construção{' '}
            <span style={{ color: '#E8622C' }}>direto de quem faz</span>
          </h1>
          <p className="mt-6 text-gray-300 text-lg md:text-xl max-w-2xl mx-auto">
            Conectamos compradores, lojas e fábricas de materiais de construção civil.
            Compre mais barato, venda mais fácil.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/cadastro"
              className="px-8 py-4 rounded-full font-bold text-white text-base hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#E8622C' }}
            >
              Criar conta grátis →
            </Link>
            <Link
              href="/catalogo"
              className="px-8 py-4 rounded-full font-semibold text-sm border border-white/20 text-white hover:bg-white/10 transition-colors"
            >
              Ver catálogo
            </Link>
          </div>
          <div className="mt-8 text-sm text-gray-500">
            Já tem conta?{' '}
            <Link href="/login" className="hover:underline" style={{ color: '#E8622C' }}>
              Entrar
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section style={{ backgroundColor: '#E8622C' }}>
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-white">
            {[
              { value: '5.000+', label: 'Produtos' },
              { value: '200+', label: 'Fornecedores' },
              { value: 'PIX & Boleto', label: 'Pagamentos' },
              { value: 'NF-e', label: 'Automática' },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-xl md:text-2xl font-black" style={{ fontFamily: 'var(--font-montserrat)' }}>{value}</p>
                <p className="text-xs text-white/80 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-16 space-y-20">

        {/* ── Como funciona ── */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900" style={{ fontFamily: 'var(--font-montserrat)' }}>
              Como funciona
            </h2>
            <p className="mt-3 text-gray-500">Simples e rápido para compradores</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Crie sua conta',
                desc: 'Cadastro gratuito em menos de 2 minutos. Sem burocracia.',
                icon: '👤',
                cta: { label: 'Criar conta', href: '/cadastro' },
              },
              {
                step: '02',
                title: 'Navegue no catálogo',
                desc: 'Mais de 5.000 produtos de centenas de fornecedores certificados.',
                icon: '🔍',
                cta: { label: 'Ver catálogo', href: '/catalogo' },
              },
              {
                step: '03',
                title: 'Receba em obra',
                desc: 'Frete calculado por CEP. Rastreamento em tempo real.',
                icon: '🚚',
                cta: null,
              },
            ].map(({ step, title, desc, icon, cta }) => (
              <div
                key={step}
                className="rounded-[20px] p-8 text-center"
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mx-auto mb-4"
                  style={{ backgroundColor: '#FDE8D8' }}
                >
                  {icon}
                </div>
                <span className="text-xs font-bold tracking-widest" style={{ color: '#E8622C' }}>{step}</span>
                <h3 className="text-lg font-bold text-gray-900 mt-1">{title}</h3>
                <p className="text-sm text-gray-500 mt-2">{desc}</p>
                {cta && (
                  <Link
                    href={cta.href}
                    className="mt-4 inline-block text-sm font-semibold hover:underline"
                    style={{ color: '#E8622C' }}
                  >
                    {cta.label} →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Categorias ── */}
        {rootCategories.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black text-gray-900" style={{ fontFamily: 'var(--font-montserrat)' }}>
                  Categorias
                </h2>
                <p className="mt-1 text-gray-500 text-sm">Encontre o que precisa para sua obra</p>
              </div>
              <Link href="/catalogo" className="text-sm font-semibold hover:underline hidden sm:block" style={{ color: '#E8622C' }}>
                Ver catálogo completo →
              </Link>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {rootCategories.map((cat) => {
                const theme = getCapsuleTheme(cat.slug);
                const emoji = getCapsuleEmoji(cat.slug);
                return (
                  <Link
                    key={cat.id}
                    href={`/catalogo?categoryId=${cat.id}`}
                    className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-[20px] text-center hover:scale-105 hover:shadow-md transition-all duration-200"
                    style={{ backgroundColor: theme.bg, color: theme.color }}
                  >
                    <span className="text-2xl leading-none">{emoji}</span>
                    <span className="text-xs font-semibold leading-tight line-clamp-2">{cat.name}</span>
                  </Link>
                );
              })}
            </div>
            <div className="mt-6 text-center sm:hidden">
              <Link href="/catalogo" className="text-sm font-semibold hover:underline" style={{ color: '#E8622C' }}>
                Ver catálogo completo →
              </Link>
            </div>
          </section>
        )}

        {/* ── Para compradores (CTA card) ── */}
        <section className="grid md:grid-cols-2 gap-6">
          {/* Comprador */}
          <div
            className="rounded-[20px] p-10 flex flex-col justify-between"
            style={{ backgroundColor: '#111111' }}
          >
            <div>
              <span className="text-4xl">🏗️</span>
              <h3 className="mt-4 text-2xl font-black text-white" style={{ fontFamily: 'var(--font-montserrat)' }}>
                Para compradores
              </h3>
              <p className="mt-3 text-gray-400 text-sm leading-relaxed">
                Pessoa física ou jurídica. Acesse centenas de fornecedores,
                compare preços e receba seus materiais com NF-e automática.
              </p>
              <ul className="mt-4 space-y-2">
                {['Preços competitivos', 'Múltiplos fornecedores no mesmo carrinho', 'NF-e automática', 'Rastreamento em tempo real'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-300">
                    <span style={{ color: '#E8622C' }}>✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/cadastro"
              className="mt-8 inline-block px-6 py-3 rounded-full font-bold text-white text-sm text-center hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#E8622C' }}
            >
              Criar conta grátis →
            </Link>
          </div>

          {/* Construtora B2B */}
          <div
            className="rounded-[20px] p-10 flex flex-col justify-between"
            style={{ backgroundColor: '#FDE8D8' }}
          >
            <div>
              <span className="text-4xl">🏢</span>
              <h3 className="mt-4 text-2xl font-black" style={{ fontFamily: 'var(--font-montserrat)', color: '#9A3412' }}>
                Para construtoras
              </h3>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: '#7C2D12' }}>
                Acesse preços de atacado, tabelas B2B por volume e crédito empresarial.
                Ideal para construtoras e incorporadoras.
              </p>
              <ul className="mt-4 space-y-2">
                {['Preços de atacado exclusivos', 'MOQ e tabelas de volume', 'Crédito B2B aprovado', 'Relatórios e notas fiscais'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm" style={{ color: '#7C2D12' }}>
                    <span style={{ color: '#E8622C' }}>✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/cadastro"
              className="mt-8 inline-block px-6 py-3 rounded-full font-bold text-sm text-center hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#9A3412', color: '#fff' }}
            >
              Cadastrar construtora →
            </Link>
          </div>
        </section>

        {/* ── Para fornecedores e entregadores ── */}
        <section className="grid md:grid-cols-2 gap-6">
          {/* Fornecedor */}
          <div
            className="rounded-[20px] p-10 flex flex-col justify-between border"
            style={{ borderColor: '#E8622C', backgroundColor: '#fff' }}
          >
            <div>
              <span className="text-4xl">🏭</span>
              <h3 className="mt-4 text-2xl font-black text-gray-900" style={{ fontFamily: 'var(--font-montserrat)' }}>
                Seja fornecedor
              </h3>
              <p className="mt-3 text-sm text-gray-500 leading-relaxed">
                Loja de materiais ou fábrica? Cadastre seus produtos e alcance
                milhares de compradores em todo o Brasil.
              </p>
              <ul className="mt-4 space-y-2">
                {['Vitrine digital gratuita', 'Gestão de pedidos centralizada', 'Pagamentos via Asaas', 'Comissão apenas na venda'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <span style={{ color: '#E8622C' }}>✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/cadastro-fornecedor"
              className="mt-8 inline-block px-6 py-3 rounded-full font-bold text-white text-sm text-center hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#E8622C' }}
            >
              Cadastrar minha empresa →
            </Link>
          </div>

          {/* Entregador */}
          <div
            className="rounded-[20px] p-10 flex flex-col justify-between"
            style={{ backgroundColor: '#F3F4F6' }}
          >
            <div>
              <span className="text-4xl">🚛</span>
              <h3 className="mt-4 text-2xl font-black text-gray-900" style={{ fontFamily: 'var(--font-montserrat)' }}>
                Seja entregador
              </h3>
              <p className="mt-3 text-sm text-gray-500 leading-relaxed">
                Tem veículo e quer trabalhar com entregas de materiais de construção?
                Cadastre-se e aceite pedidos pela região.
              </p>
              <ul className="mt-4 space-y-2">
                {['Trabalhe por conta própria', 'Aceite pedidos pelo app', 'Pagamento semanal', 'Suporte dedicado'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <span style={{ color: '#E8622C' }}>✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/cadastro-entregador"
              className="mt-8 inline-block px-6 py-3 rounded-full font-bold text-sm text-center hover:opacity-90 transition-opacity border border-gray-300 text-gray-800 hover:bg-gray-200"
            >
              Quero ser entregador →
            </Link>
          </div>
        </section>

      </div>

      {/* ── Footer ── */}
      <footer className="mt-8" style={{ backgroundColor: '#111111' }}>
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <span className="text-2xl font-black" style={{ fontFamily: 'var(--font-montserrat)' }}>
                <span className="text-white">Obra</span>
                <span style={{ color: '#E8622C' }}>Já</span>
              </span>
              <p className="text-gray-400 text-xs mt-2 max-w-xs">
                O maior marketplace de materiais de construção civil do Brasil.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Comprar</p>
              <nav className="space-y-2">
                <Link href="/cadastro" className="block text-sm text-gray-400 hover:text-white transition-colors">Criar conta</Link>
                <Link href="/login" className="block text-sm text-gray-400 hover:text-white transition-colors">Entrar</Link>
                <Link href="/catalogo" className="block text-sm text-gray-400 hover:text-white transition-colors">Ver catálogo</Link>
              </nav>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Parceiros</p>
              <nav className="space-y-2">
                <Link href="/cadastro-fornecedor" className="block text-sm text-gray-400 hover:text-white transition-colors">Seja fornecedor</Link>
                <Link href="/cadastro-entregador" className="block text-sm text-gray-400 hover:text-white transition-colors">Seja entregador</Link>
              </nav>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Empresa</p>
              <nav className="space-y-2">
                <Link href="/sobre" className="block text-sm text-gray-400 hover:text-white transition-colors">Sobre</Link>
                <Link href="/contato" className="block text-sm text-gray-400 hover:text-white transition-colors">Contato</Link>
              </nav>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10">
          <p className="text-center text-xs text-gray-500 py-4">
            © {new Date().getFullYear()} ObraJá. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
