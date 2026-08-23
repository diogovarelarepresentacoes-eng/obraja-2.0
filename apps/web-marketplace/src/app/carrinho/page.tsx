'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cartApi } from '@/lib/cart-api';

interface CartItemProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  unit: string;
  stock: number;
  status: string;
  supplier: { companyName: string; tradeName?: string };
  images: { url: string; isPrimary: boolean }[];
}

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: CartItemProduct;
}

interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
}

type GroupedItems = Record<string, CartItem[]>;

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function supplierName(product: CartItemProduct) {
  return product.supplier.tradeName ?? product.supplier.companyName;
}

function primaryImage(product: CartItemProduct) {
  return product.images.find((i) => i.isPrimary)?.url ?? product.images[0]?.url;
}

function groupBySupplier(items: CartItem[]): GroupedItems {
  return items.reduce<GroupedItems>((acc, item) => {
    const key = supplierName(item.product);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

export default function CarrinhoPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function fetchCart() {
    try {
      setError(null);
      const data = await cartApi.get<Cart>('/cart');
      setCart(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar carrinho');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchCart(); }, []);

  async function updateQuantity(productId: string, quantity: number) {
    setUpdatingId(productId);
    try {
      const updated = await cartApi.patch<Cart>(`/cart/items/${productId}`, { quantity });
      setCart(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao atualizar item');
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 text-sm">Carregando carrinho...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-500 text-sm">{error}</p>
        <button
          onClick={fetchCart}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ backgroundColor: '#F05A28' }}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const items = cart?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-6xl">🛒</p>
        <h2 className="text-xl font-bold text-gray-900">Seu carrinho está vazio</h2>
        <p className="text-gray-500 text-sm text-center">Explore o catálogo e adicione produtos</p>
        <Link
          href="/catalogo"
          className="px-6 py-3 rounded-lg font-semibold text-white text-sm"
          style={{ backgroundColor: '#F05A28' }}
        >
          Ir para o catálogo
        </Link>
      </div>
    );
  }

  const grouped = groupBySupplier(items);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Carrinho</h1>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-6">
            {Object.entries(grouped).map(([supplier, supplierItems]) => (
              <div key={supplier} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{supplier}</p>
                </div>
                <div className="divide-y divide-gray-50">
                  {supplierItems.map((item) => {
                    const img = primaryImage(item.product);
                    const isOutOfStock = item.product.status === 'OUT_OF_STOCK' || item.product.stock === 0;
                    const isUpdating = updatingId === item.productId;

                    return (
                      <div key={item.id} className="flex items-start gap-4 px-5 py-4">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                          {img ? (
                            <img src={img} alt={item.product.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl">📦</span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm leading-snug">{item.product.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{item.product.unit}</p>
                          {isOutOfStock && (
                            <p className="text-xs text-red-500 font-medium mt-1">Produto fora de estoque</p>
                          )}
                          <p className="text-sm font-semibold text-gray-900 mt-1">
                            {fmt(item.product.price)}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                            <button
                              disabled={isUpdating || item.quantity <= 1}
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                            >
                              −
                            </button>
                            <span className="w-8 text-center text-sm font-semibold text-gray-900">
                              {isUpdating ? '…' : item.quantity}
                            </span>
                            <button
                              disabled={isUpdating || item.quantity >= item.product.stock}
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                            >
                              +
                            </button>
                          </div>
                          <p className="text-sm font-bold" style={{ color: '#F05A28' }}>
                            {fmt(item.product.price * item.quantity)}
                          </p>
                          <button
                            disabled={isUpdating}
                            onClick={() => updateQuantity(item.productId, 0)}
                            className="text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="lg:w-72 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-6">
              <h2 className="font-bold text-gray-900 mb-4">Resumo do pedido</h2>

              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Subtotal ({items.length} {items.length === 1 ? 'item' : 'itens'})</span>
                <span>{fmt(cart?.subtotal ?? 0)}</span>
              </div>

              <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between font-bold text-gray-900">
                <span>Total</span>
                <span>{fmt(cart?.subtotal ?? 0)}</span>
              </div>

              <Link
                href="/checkout"
                className="mt-5 block w-full py-3 rounded-lg font-semibold text-white text-sm text-center transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#F05A28' }}
              >
                Ir para o checkout
              </Link>

              <Link
                href="/catalogo"
                className="mt-3 block text-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Continuar comprando
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
