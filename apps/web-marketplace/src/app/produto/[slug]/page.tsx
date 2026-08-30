import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { api } from '@/lib/api';
import { Header } from '@/components/header';
import { AddToCartButton } from '@/components/add-to-cart-button';
import { ProductGallery } from '@/components/product-gallery';

interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description?: string;
  sku?: string;
  price: number;
  b2bPrice?: number;
  moq: number;
  stock: number;
  unit: string;
  weightKg?: number;
  widthCm?: number;
  heightCm?: number;
  depthCm?: number;
  isHighlighted: boolean;
  status: string;
  category: {
    id: string;
    name: string;
    slug: string;
    parent?: { id: string; name: string; slug: string };
  };
  supplier: {
    id: string;
    companyName: string;
    tradeName?: string;
    logoUrl?: string;
    isVerified: boolean;
    address?: { city: string; state: string };
  };
  images: { url: string; alt?: string; isPrimary: boolean; sortOrder: number }[];
}

interface PageProps { params: Promise<{ slug: string }>; }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const p = await api.get<ProductDetail>(`/products/${slug}`, { next: { revalidate: 300 } });
    return { title: p.name, description: p.description ?? `${p.name} — disponível no ObraJá` };
  } catch {
    return { title: 'Produto não encontrado' };
  }
}

function InfoCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[20px] p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
      {children}
    </div>
  );
}

export default async function ProdutoPage({ params }: PageProps) {
  const { slug } = await params;

  let product: ProductDetail;
  try {
    product = await api.get<ProductDetail>(`/products/${slug}`, { next: { revalidate: 300 } });
  } catch {
    notFound();
  }

  const supplierName = product.supplier.tradeName ?? product.supplier.companyName;
  const inStock = product.stock > 0 && product.status === 'ACTIVE';
  const hasDimensions = product.weightKg || product.widthCm || product.heightCm || product.depthCm;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Breadcrumb */}
      <div style={{ backgroundColor: '#111111' }}>
        <nav className="max-w-7xl mx-auto px-4 pb-2.5 text-xs text-gray-400 flex items-center gap-1.5 flex-wrap">
          <Link href="/catalogo" className="hover:text-white transition-colors">Catálogo</Link>
          {product.category.parent && (
            <>
              <span className="text-gray-600">›</span>
              <Link href={`/catalogo?categoryId=${product.category.parent.id}`} className="hover:text-white transition-colors">
                {product.category.parent.name}
              </Link>
            </>
          )}
          <span className="text-gray-600">›</span>
          <Link href={`/catalogo?categoryId=${product.category.id}`} className="hover:text-white transition-colors">
            {product.category.name}
          </Link>
          <span className="text-gray-600">›</span>
          <span className="text-gray-200 font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14">
          {/* Gallery */}
          <ProductGallery images={product.images} name={product.name} />

          {/* Details */}
          <div className="space-y-4">
            {product.isHighlighted && (
              <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-yellow-100 text-yellow-800">
                ⭐ Destaque
              </span>
            )}

            <div>
              <p className="text-sm text-gray-400 mb-0.5">{product.category.name}</p>
              <h1 className="text-2xl font-black text-gray-900 leading-tight" style={{ fontFamily: 'var(--font-montserrat)' }}>
                {product.name}
              </h1>
              {product.sku && <p className="text-xs text-gray-400 mt-1">SKU: {product.sku}</p>}
            </div>

            {/* Price card */}
            <InfoCard>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-gray-900">
                  {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
                <span className="text-sm text-gray-400">/{product.unit}</span>
              </div>
              {product.b2bPrice && (
                <p className="text-xs text-blue-600 font-semibold mt-1">
                  Preço B2B: {product.b2bPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/{product.unit}
                </p>
              )}
              {product.moq > 1 && (
                <p className="text-xs text-gray-500 mt-1.5">Pedido mínimo: {product.moq} {product.unit}</p>
              )}

              <div className="flex items-center gap-2 mt-3">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${inStock ? 'bg-green-500' : 'bg-red-400'}`} />
                <span className={`text-sm font-semibold ${inStock ? 'text-green-700' : 'text-red-600'}`}>
                  {inStock ? `${product.stock} unidades em estoque` : 'Sem estoque'}
                </span>
              </div>
            </InfoCard>

            {/* CTA */}
            <AddToCartButton
              productId={product.id}
              moq={product.moq}
              stock={product.stock}
              unit={product.unit}
              inStock={inStock}
            />

            {/* Supplier */}
            <InfoCard>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Vendido por</p>
              <div className="flex items-center gap-3">
                {product.supplier.logoUrl ? (
                  <img src={product.supplier.logoUrl} alt={supplierName} className="w-11 h-11 rounded-xl object-contain" />
                ) : (
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: '#FEF0EA' }}>
                    🏪
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-gray-800 truncate">{supplierName}</p>
                    {product.supplier.isVerified && (
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600">✓ Verificado</span>
                    )}
                  </div>
                  {product.supplier.address && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {product.supplier.address.city}, {product.supplier.address.state}
                    </p>
                  )}
                </div>
                <Link
                  href={`/catalogo?supplierId=${product.supplier.id}`}
                  className="text-xs font-bold hover:underline flex-shrink-0"
                  style={{ color: '#E8622C' }}
                >
                  Ver loja →
                </Link>
              </div>
            </InfoCard>

            {/* Dimensions */}
            {hasDimensions && (
              <InfoCard>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Especificações</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  {product.weightKg && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Peso</span>
                      <span className="font-semibold text-gray-900">{product.weightKg} kg</span>
                    </div>
                  )}
                  {product.widthCm && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Largura</span>
                      <span className="font-semibold text-gray-900">{product.widthCm} cm</span>
                    </div>
                  )}
                  {product.heightCm && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Altura</span>
                      <span className="font-semibold text-gray-900">{product.heightCm} cm</span>
                    </div>
                  )}
                  {product.depthCm && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Profundidade</span>
                      <span className="font-semibold text-gray-900">{product.depthCm} cm</span>
                    </div>
                  )}
                </div>
              </InfoCard>
            )}
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <div className="mt-12 bg-white rounded-[20px] p-7" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
            <h2 className="font-black text-gray-900 mb-4" style={{ fontFamily: 'var(--font-montserrat)' }}>
              Descrição do produto
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
