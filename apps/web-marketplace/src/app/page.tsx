import Link from 'next/link';
import { api } from '@/lib/api';
import { Header } from '@/components/header';

interface Category {
  id: string;
  name: string;
  slug: string;
  children: { id: string; name: string; slug: string }[];
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  unit: string;
  category: { name: string };
  supplier: { companyName: string; tradeName?: string };
  images: { url: string; isPrimary: boolean }[];
}

interface ProductList {
  data: Product[];
  total: number;
  page: number;
  limit: number;
}

interface Supplier {
  id: string;
  companyName: string;
  tradeName?: string;
  address?: { city: string; state: string };
}

interface SupplierList {
  data: Supplier[];
  total: number;
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
    ))) {
      return CATEGORY_COLORS[key]!;
    }
  }
  return { bg: '#F3F4F6', color: '#374151' };
}

function getCapsuleEmoji(slug: string): string {
  const normalized = slug.toLowerCase().replace(/-/g, '');
  for (const key of Object.keys(CATEGORY_EMOJIS)) {
    if (normalized.includes(key.replace(/[áéíóúâêîôûã]/g, (c) =>
      ({ á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', â: 'a', ê: 'e', î: 'i', ô: 'o', û: 'u', ã: 'a' }[c] ?? c)
    ))) {
      return CATEGORY_EMOJIS[key]!;
    }
  }
  return '📦';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export default async function HomePage() {
  const [categories, productsResult, suppliersResult] = await Promise.all([
    api.get<Category[]>('/categories').catch(() => [] as Category[]),
    api.get<ProductList>('/products?limit=8').catch(() => ({ data: [], total: 0, page: 1, limit: 8 } as ProductList)),
    api.get<SupplierList>('/suppliers?limit=4').catch(() => ({ data: [], total: 0 } as SupplierList)),
  ]);

  const rootCategories = (categories as Category[]).filter((c) => c.children?.length > 0);
  const featuredProducts = productsResult.data ?? [];
  const suppliers = suppliersResult.data ?? [];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Body */}
      <div className="bg-white rounded-t-[20px] -mt-1">
        <div className="max-w-7xl mx-auto px-4 py-10 space-y-14">

          {/* Section 1: Categories */}
          {rootCategories.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Categorias</h2>
                <Link href="/catalogo" className="text-sm font-semibold hover:underline" style={{ color: '#E8622C' }}>
                  Ver todas →
                </Link>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-3">
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
            </section>
          )}

          {/* Section 2: Hero Banner */}
          <section
            className="rounded-[20px] px-8 py-12 text-center"
            style={{ backgroundColor: '#E8622C' }}
          >
            <h2 className="text-3xl md:text-4xl font-black text-white leading-tight" style={{ fontFamily: 'var(--font-montserrat)' }}>
              Os melhores materiais de construção
            </h2>
            <p className="mt-3 text-white/90 text-lg">
              Direto dos fornecedores para sua obra
            </p>
            <Link
              href="/catalogo"
              className="mt-6 inline-block px-8 py-3 bg-white rounded-full font-bold text-sm hover:opacity-90 transition-opacity"
              style={{ color: '#E8622C' }}
            >
              Ver catálogo
            </Link>
          </section>

          {/* Section 3: Featured Products */}
          {featuredProducts.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Em destaque</h2>
                <Link href="/catalogo" className="text-sm font-semibold hover:underline" style={{ color: '#E8622C' }}>
                  Ver todos →
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
                {featuredProducts.map((product) => {
                  const img = product.images.find((i) => i.isPrimary)?.url ?? product.images[0]?.url;
                  const supplierName = product.supplier.tradeName ?? product.supplier.companyName;
                  return (
                    <Link
                      key={product.id}
                      href={`/produto/${product.slug}`}
                      className="group bg-white rounded-[20px] overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
                    >
                      <div className="aspect-square bg-gray-50 relative overflow-hidden">
                        {img ? (
                          <img
                            src={img}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="text-xs text-gray-400 truncate">{supplierName}</p>
                        <p className="text-sm font-semibold text-gray-900 line-clamp-2 mt-0.5 min-h-[2.5rem]">{product.name}</p>
                        <div className="mt-2 flex items-baseline gap-1">
                          <span className="text-base font-bold text-gray-900">
                            {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                          <span className="text-xs text-gray-400">/{product.unit}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Section 4: Suppliers */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Fornecedores</h2>
              <Link href="/catalogo" className="text-sm font-semibold hover:underline" style={{ color: '#E8622C' }}>
                Ver todos →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
              {suppliers.length > 0
                ? suppliers.map((supplier) => {
                    const name = supplier.tradeName ?? supplier.companyName;
                    const initials = getInitials(name);
                    return (
                      <div
                        key={supplier.id}
                        className="bg-white rounded-[20px] overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                        style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
                      >
                        {/* Card top */}
                        <div className="h-24 flex items-center justify-center relative" style={{ backgroundColor: '#161616' }}>
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
                            style={{ backgroundColor: '#E8622C' }}
                          >
                            {initials}
                          </div>
                          <span
                            className="absolute top-3 right-3 text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: '#22C55E', color: '#fff' }}
                          >
                            Aberto
                          </span>
                        </div>
                        {/* Card bottom */}
                        <div className="p-4 bg-white">
                          <p className="font-semibold text-sm text-gray-900 truncate">{name}</p>
                          <p className="text-xs text-yellow-500 mt-0.5">★★★★★</p>
                          {supplier.address && (
                            <p className="text-xs text-gray-400 mt-0.5">{supplier.address.city}, {supplier.address.state}</p>
                          )}
                        </div>
                      </div>
                    );
                  })
                : /* Placeholder cards when no suppliers exist */
                  ['Construmais', 'AçoFácil', 'TijoloMestre', 'HidroTech'].map((name) => {
                    const initials = getInitials(name);
                    return (
                      <div
                        key={name}
                        className="bg-white rounded-[20px] overflow-hidden"
                        style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
                      >
                        <div className="h-24 flex items-center justify-center relative" style={{ backgroundColor: '#161616' }}>
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
                            style={{ backgroundColor: '#E8622C' }}
                          >
                            {initials}
                          </div>
                          <span
                            className="absolute top-3 right-3 text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: '#22C55E', color: '#fff' }}
                          >
                            Aberto
                          </span>
                        </div>
                        <div className="p-4 bg-white">
                          <p className="font-semibold text-sm text-gray-900 truncate">{name}</p>
                          <p className="text-xs text-yellow-500 mt-0.5">★★★★★</p>
                          <p className="text-xs text-gray-400 mt-0.5">São Paulo, SP</p>
                        </div>
                      </div>
                    );
                  })}
            </div>
          </section>

        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16" style={{ backgroundColor: '#111111' }}>
        <div className="max-w-7xl mx-auto px-4 py-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div>
            <span className="text-2xl font-black" style={{ fontFamily: 'var(--font-montserrat)' }}>
              <span className="text-white">Obra</span>
              <span style={{ color: '#E8622C' }}>Já</span>
            </span>
            <p className="text-gray-400 text-xs mt-2 max-w-xs">
              O maior marketplace de materiais de construção civil do Brasil.
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-6 text-sm text-gray-400">
            <Link href="/sobre" className="hover:text-white transition-colors">Sobre</Link>
            <Link href="/contato" className="hover:text-white transition-colors">Contato</Link>
            <Link href="/cadastro-fornecedor" className="hover:text-white transition-colors">Seja fornecedor</Link>
          </nav>
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
