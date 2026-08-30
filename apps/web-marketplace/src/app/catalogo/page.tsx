import { Suspense } from 'react';
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
  searchParams: Promise<{ search?: string; categoryId?: string; page?: string }>;
}

function ProductSkeleton() {
  return (
    <div className="bg-white rounded-[20px] overflow-hidden animate-pulse" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
      <div className="aspect-square bg-gray-100" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-gray-100 rounded w-2/3" />
        <div className="h-4 bg-gray-100 rounded w-full" />
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-5 bg-gray-100 rounded w-1/2 mt-2" />
      </div>
    </div>
  );
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
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <span className="text-6xl">🔍</span>
        <p className="text-lg font-bold text-gray-800">Nenhum produto encontrado</p>
        <p className="text-sm text-gray-400">Tente outros termos ou navegue pelas categorias</p>
        <Link
          href="/catalogo"
          className="mt-2 px-6 py-2.5 rounded-full text-sm font-bold text-white hover:opacity-90"
          style={{ backgroundColor: '#E8622C' }}
        >
          Ver todos os produtos
        </Link>
      </div>
    );
  }

  const prevParams = new URLSearchParams({ ...(search ? { search } : {}), ...(categoryId ? { categoryId } : {}) });
  const nextParams = new URLSearchParams({ ...Object.fromEntries(prevParams), page: String(page + 1) });
  prevParams.set('page', String(page - 1));

  return (
    <>
      <p className="text-sm text-gray-500 mb-5">
        <span className="font-semibold text-gray-800">{list.total}</span>{' '}
        produto{list.total !== 1 ? 's' : ''} encontrado{list.total !== 1 ? 's' : ''}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => {
          const img = product.images.find((i) => i.isPrimary)?.url ?? product.images[0]?.url;
          const seller = product.supplier.tradeName ?? product.supplier.companyName;
          return (
            <Link
              key={product.id}
              href={`/produto/${product.slug}`}
              className="group bg-white rounded-[20px] overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
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
              <div className="p-4">
                <p className="text-xs text-gray-400 truncate mb-0.5">{seller}</p>
                <p className="text-sm font-semibold text-gray-900 line-clamp-2 min-h-[2.5rem] leading-snug">
                  {product.name}
                </p>
                <p className="text-xs text-gray-400 mt-1">{product.category.name}</p>
                <div className="mt-2.5 flex items-baseline gap-1">
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

      {list.total > 24 && (
        <div className="mt-10 flex justify-center gap-3">
          {page > 1 && (
            <Link
              href={`/catalogo?${prevParams.toString()}`}
              className="px-5 py-2.5 rounded-full text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              ← Anterior
            </Link>
          )}
          {page * 24 < list.total && (
            <Link
              href={`/catalogo?${nextParams.toString()}`}
              className="px-5 py-2.5 rounded-full text-sm font-bold text-white hover:opacity-90 transition-opacity"
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
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8 flex gap-7">
        {/* Sidebar */}
        <aside className="w-56 flex-shrink-0 hidden md:block">
          <div
            className="bg-white rounded-[20px] p-5 sticky top-24"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}
          >
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Categorias</p>
            <ul className="space-y-0.5">
              <li>
                <Link
                  href="/catalogo"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors"
                  style={!categoryId
                    ? { color: '#E8622C', backgroundColor: '#FEF0EA', fontWeight: 600 }
                    : { color: '#6B7280' }}
                >
                  <span>📦</span> Todos
                </Link>
              </li>
              {(categories as Category[]).map((cat) => (
                <li key={cat.id}>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mt-4 mb-1 px-3">
                    {cat.name}
                  </p>
                  {cat.children.map((child) => (
                    <Link
                      key={child.id}
                      href={`/catalogo?categoryId=${child.id}`}
                      className="block px-3 py-2 rounded-xl text-sm transition-colors"
                      style={
                        categoryId === child.id
                          ? { color: '#E8622C', backgroundColor: '#FEF0EA', fontWeight: 600 }
                          : { color: '#6B7280' }
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
          {(search || categoryId) && (
            <div className="mb-5 flex items-center flex-wrap gap-2">
              {search && (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-white border border-gray-200">
                  <span className="text-gray-500">Busca:</span>
                  <strong className="text-gray-800">{search}</strong>
                  <Link href={categoryId ? `/catalogo?categoryId=${categoryId}` : '/catalogo'} className="text-gray-400 hover:text-red-500 ml-1">✕</Link>
                </span>
              )}
              {categoryId && (
                <Link href={search ? `/catalogo?search=${search}` : '/catalogo'} className="text-xs text-gray-400 hover:text-red-500 hover:underline">
                  Limpar filtro
                </Link>
              )}
            </div>
          )}

          <Suspense
            fallback={
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 12 }).map((_, i) => <ProductSkeleton key={i} />)}
              </div>
            }
          >
            <CatalogContent search={search} categoryId={categoryId} page={page} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
