import { Suspense } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

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
  isHighlighted: boolean;
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

interface PageProps {
  searchParams: Promise<{
    search?: string;
    categoryId?: string;
    page?: string;
  }>;
}

async function CatalogContent({ search, categoryId, page }: { search?: string; categoryId?: string; page: number }) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (categoryId) params.set('categoryId', categoryId);
  params.set('page', String(page));
  params.set('limit', '24');

  const list = await api.get<ProductList>(`/products?${params.toString()}`).catch(
    () => ({ data: [], total: 0, page: 1, limit: 24 } as ProductList),
  );
  const products = list?.data ?? [];

  if (products.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-5xl mb-4">🔍</p>
        <p className="text-lg font-semibold text-gray-700">Nenhum produto encontrado</p>
        <p className="text-sm text-gray-400 mt-1">Tente outros termos ou categorias</p>
      </div>
    );
  }

  return (
    <>
      <p className="text-sm text-gray-500 mb-4">
        {list.total} produto{list.total !== 1 ? 's' : ''} encontrado{list.total !== 1 ? 's' : ''}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => {
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
                {product.isHighlighted && (
                  <span className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
                    Destaque
                  </span>
                )}
              </div>
              <div className="p-3">
                <p className="text-xs text-gray-400 truncate">{supplierName}</p>
                <p className="text-sm font-medium text-gray-900 line-clamp-2 mt-0.5 min-h-[2.5rem]">{product.name}</p>
                <p className="text-xs text-gray-400 mt-1">{product.category.name}</p>
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

      {/* Pagination */}
      {list.total > 24 && (
        <div className="mt-8 flex justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/catalogo?${new URLSearchParams({ ...(search ? { search } : {}), ...(categoryId ? { categoryId } : {}), page: String(page - 1) }).toString()}`}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:text-white transition-colors"
              style={{ border: '1px solid #e5e7eb' }}
            >
              ← Anterior
            </Link>
          )}
          {page * 24 < list.total && (
            <Link
              href={`/catalogo?${new URLSearchParams({ ...(search ? { search } : {}), ...(categoryId ? { categoryId } : {}), page: String(page + 1) }).toString()}`}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: '#E8622C' }}
            >
              Próxima →
            </Link>
          )}
        </div>
      )}
    </>
  );
}

export default async function CatalogoPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const search = sp.search;
  const categoryId = sp.categoryId;
  const page = Number(sp.page ?? '1');

  const categories = await api.get<Category[]>('/categories').catch(() => [] as Category[]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10" style={{ backgroundColor: '#111111' }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/" className="font-black text-xl flex-shrink-0" style={{ fontFamily: 'var(--font-montserrat)' }}>
            <span className="text-white">Obra</span>
            <span style={{ color: '#E8622C' }}>Já</span>
          </Link>
          <form method="GET" action="/catalogo" className="flex-1 max-w-xl flex gap-2">
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Buscar produtos..."
              className="flex-1 pl-4 pr-4 py-2 rounded-xl text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': '#E8622C' } as React.CSSProperties}
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity flex-shrink-0"
              style={{ backgroundColor: '#E8622C' }}
            >
              Buscar
            </button>
            {categoryId && <input type="hidden" name="categoryId" value={categoryId} />}
          </form>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar categorias */}
        <aside className="w-52 flex-shrink-0 hidden md:block">
          <div className="bg-white rounded-[20px] p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Categorias</p>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/catalogo"
                  className="block text-sm px-2 py-1.5 rounded-lg transition-colors"
                  style={!categoryId ? { color: '#E8622C', backgroundColor: '#FEF0EA', fontWeight: 600 } : { color: '#374151' }}
                >
                  Todos os produtos
                </Link>
              </li>
              {(categories as Category[]).map((cat) => (
                <li key={cat.id}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-3 mb-1 px-2">{cat.name}</p>
                  {cat.children.map((child) => (
                    <Link
                      key={child.id}
                      href={`/catalogo?categoryId=${child.id}`}
                      className="block text-sm px-2 py-1.5 rounded-lg transition-colors"
                      style={
                        categoryId === child.id
                          ? { color: '#E8622C', backgroundColor: '#FEF0EA', fontWeight: 600 }
                          : { color: '#6b7280' }
                      }
                    >
                      {child.name}
                    </Link>
                  ))}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          {search && (
            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm text-gray-600">Resultados para: <strong>"{search}"</strong></span>
              <Link href="/catalogo" className="text-xs text-red-500 hover:underline">Limpar</Link>
            </div>
          )}

          <Suspense fallback={
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-white rounded-[20px] overflow-hidden animate-pulse" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                  <div className="aspect-square bg-gray-100" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                    <div className="h-4 bg-gray-100 rounded" />
                    <div className="h-5 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          }>
            <CatalogContent search={search} categoryId={categoryId} page={page} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
