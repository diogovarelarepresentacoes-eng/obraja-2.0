import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { api } from '@/lib/api';
import { Header } from '@/components/header';
import { AddToCartButton } from '@/components/add-to-cart-button';

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

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await api.get<ProductDetail>(`/products/${slug}`, { next: { revalidate: 300 } });
    return {
      title: product.name,
      description: product.description ?? `${product.name} — disponível no ObraJá`,
    };
  } catch {
    return { title: 'Produto não encontrado' };
  }
}

export default async function ProdutoPage({ params }: PageProps) {
  const { slug } = await params;

  let product: ProductDetail;
  try {
    product = await api.get<ProductDetail>(`/products/${slug}`, { next: { revalidate: 300 } });
  } catch {
    notFound();
  }

  const images = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder);
  const primaryImg = images.find((i) => i.isPrimary) ?? images[0];
  const supplierName = product.supplier.tradeName ?? product.supplier.companyName;
  const inStock = product.stock > 0 && product.status === 'ACTIVE';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Breadcrumb */}
      <div style={{ backgroundColor: '#111111' }}>
        <nav className="max-w-7xl mx-auto px-4 pb-2 text-sm text-gray-400 truncate">
          <Link href="/catalogo" className="hover:text-white transition-colors">Catálogo</Link>
          {product.category.parent && (
            <>
              <span className="mx-2">›</span>
              <Link href={`/catalogo?categoryId=${product.category.parent.id}`} className="hover:text-white transition-colors">
                {product.category.parent.name}
              </Link>
            </>
          )}
          <span className="mx-2">›</span>
          <Link href={`/catalogo?categoryId=${product.category.id}`} className="hover:text-white transition-colors">
            {product.category.name}
          </Link>
          <span className="mx-2">›</span>
          <span className="text-gray-200 font-medium">{product.name}</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Images */}
          <div className="space-y-3">
            <div
              className="aspect-square bg-white rounded-[20px] overflow-hidden"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.10)' }}
            >
              {primaryImg ? (
                <img
                  src={primaryImg.url}
                  alt={primaryImg.alt ?? product.name}
                  className="w-full h-full object-contain p-4"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-8xl">📦</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, i) => (
                  <div
                    key={i}
                    className="w-16 h-16 flex-shrink-0 bg-white rounded-[12px] overflow-hidden"
                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }}
                  >
                    <img src={img.url} alt={img.alt ?? `Imagem ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            {product.isHighlighted && (
              <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-bold px-2.5 py-1 rounded-full mb-3">
                ⭐ Destaque
              </span>
            )}

            <p className="text-sm text-gray-500 mb-1">{product.category.name}</p>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">{product.name}</h1>

            {product.sku && (
              <p className="text-xs text-gray-400 mt-1">Cód: {product.sku}</p>
            )}

            {/* Price */}
            <div
              className="mt-5 p-4 bg-white rounded-[20px]"
              style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}
            >
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">
                  {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
                <span className="text-sm text-gray-400">/{product.unit}</span>
              </div>
              {product.moq > 1 && (
                <p className="text-xs text-gray-500 mt-1">Pedido mínimo: {product.moq} {product.unit}</p>
              )}
            </div>

            {/* Stock */}
            <div className="mt-3 flex items-center gap-2">
              <span className={`inline-block w-2 h-2 rounded-full ${inStock ? 'bg-green-500' : 'bg-red-400'}`} />
              <span className={`text-sm font-medium ${inStock ? 'text-green-700' : 'text-red-600'}`}>
                {inStock ? `${product.stock} em estoque` : 'Sem estoque'}
              </span>
            </div>

            {/* CTA */}
            <AddToCartButton
              productId={product.id}
              moq={product.moq}
              stock={product.stock}
              unit={product.unit}
              inStock={inStock}
            />

            {/* Supplier */}
            <div
              className="mt-6 p-4 bg-white rounded-[20px] flex items-center gap-3"
              style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}
            >
              {product.supplier.logoUrl ? (
                <img
                  src={product.supplier.logoUrl}
                  alt={supplierName}
                  className="w-10 h-10 rounded-xl object-contain"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ backgroundColor: '#FEF0EA' }}
                >
                  🏪
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-gray-800 truncate">{supplierName}</p>
                  {product.supplier.isVerified && (
                    <span className="text-blue-500 text-xs">✓</span>
                  )}
                </div>
                {product.supplier.address && (
                  <p className="text-xs text-gray-400">
                    {product.supplier.address.city}, {product.supplier.address.state}
                  </p>
                )}
              </div>
              <Link
                href={`/catalogo?supplierId=${product.supplier.id}`}
                className="text-xs font-semibold hover:underline flex-shrink-0"
                style={{ color: '#E8622C' }}
              >
                Ver loja
              </Link>
            </div>

            {/* Dimensions */}
            {(product.weightKg || product.widthCm || product.heightCm || product.depthCm) && (
              <div
                className="mt-4 p-4 bg-white rounded-[20px]"
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}
              >
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Dimensões</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {product.weightKg && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Peso</span>
                      <span className="text-gray-900 font-medium">{product.weightKg} kg</span>
                    </div>
                  )}
                  {product.widthCm && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Largura</span>
                      <span className="text-gray-900 font-medium">{product.widthCm} cm</span>
                    </div>
                  )}
                  {product.heightCm && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Altura</span>
                      <span className="text-gray-900 font-medium">{product.heightCm} cm</span>
                    </div>
                  )}
                  {product.depthCm && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Profundidade</span>
                      <span className="text-gray-900 font-medium">{product.depthCm} cm</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <div
            className="mt-10 bg-white rounded-[20px] p-6"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}
          >
            <h2 className="font-semibold text-gray-800 mb-3">Descrição</h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
