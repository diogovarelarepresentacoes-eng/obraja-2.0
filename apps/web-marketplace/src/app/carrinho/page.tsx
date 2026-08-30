'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/header';
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

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function sellerName(p: CartItemProduct) {
  return p.supplier.tradeName ?? p.supplier.companyName;
}

function primaryImage(p: CartItemProduct) {
  return p.images.find((i) => i.isPrimary)?.url ?? p.images[0]?.url;
}

function groupBySupplier(items: CartItem[]) {
  return items.reduce<Record<string, CartItem[]>>((acc, item) => {
    const key = sellerName(item.product);
    (acc[key] ??= []).push(item);
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
      setCart(await cartApi.get<Cart>('/cart'));
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
      setCart(await cartApi.patch<Cart>(`/cart/items/${productId}`, { quantity }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao atualizar item');
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-10 space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="bg-white rounded-[20px] h-28 animate-pulse" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-10 flex flex-col items-center gap-4">
          <p className="text-red-500 text-sm">{error}</p>
          <button onClick={fetchCart} className="px-5 py-2.5 rounded-full text-sm font-bold text-white hover:opacity-90" style={{ backgroundColor: '#E8622C' }}>
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const items = cart?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-24 flex flex-col items-center gap-5 text-center">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
            style={{ backgroundColor: '#FEF0EA' }}
          >
            🛒
          </div>
          <h2 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'var(--font-montserrat)' }}>
            Seu carrinho está vazio
          </h2>
          <p className="text-gray-500 text-sm max-w-xs">
            Explore o catálogo, encontre o que sua obra precisa e adicione aqui.
          </p>
          <Link
            href="/catalogo"
            className="mt-2 px-8 py-3.5 rounded-full font-bold text-white text-sm hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#E8622C' }}
          >
            Ver catálogo →
          </Link>
        </div>
      </div>
    );
  }

  const grouped = groupBySupplier(items);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-black text-gray-900 mb-8" style={{ fontFamily: 'var(--font-montserrat)' }}>
          Carrinho
        </h1>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Items */}
          <div className="flex-1 space-y-5">
            {Object.entries(grouped).map(([supplier, supplierItems]) => (
              <div
                key={supplier}
                className="bg-white rounded-[20px] overflow-hidden"
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
              >
                {/* Supplier header */}
                <div
                  className="px-5 py-3 flex items-center gap-2 border-b border-gray-50"
                  style={{ backgroundColor: '#F9FAFB' }}
                >
                  <span className="text-sm">🏪</span>
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">{supplier}</p>
                </div>

                <div className="divide-y divide-gray-50">
                  {supplierItems.map((item) => {
                    const img = primaryImage(item.product);
                    const isOut = item.product.status === 'OUT_OF_STOCK' || item.product.stock === 0;
                    const isUpdating = updatingId === item.productId;

                    return (
                      <div key={item.id} className="flex items-start gap-4 px-5 py-4">
                        {/* Image */}
                        <Link href={`/produto/${item.product.slug}`} className="flex-shrink-0">
                          <div className="w-16 h-16 rounded-[12px] overflow-hidden bg-gray-50 flex items-center justify-center">
                            {img
                              ? <img src={img} alt={item.product.name} className="w-full h-full object-cover" />
                              : <span className="text-2xl">📦</span>
                            }
                          </div>
                        </Link>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <Link href={`/produto/${item.product.slug}`}>
                            <p className="text-sm font-semibold text-gray-900 leading-snug hover:underline line-clamp-2">
                              {item.product.name}
                            </p>
                          </Link>
                          <p className="text-xs text-gray-400 mt-0.5">{item.product.unit}</p>
                          {isOut && (
                            <span className="inline-block mt-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                              Sem estoque
                            </span>
                          )}
                          <p className="text-sm font-bold text-gray-900 mt-1.5">
                            {fmt(item.product.price)}
                          </p>
                        </div>

                        {/* Qty controls */}
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <div className="flex items-center rounded-xl border border-gray-200 overflow-hidden">
                            <button
                              disabled={isUpdating || item.quantity <= 1}
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-colors text-lg leading-none"
                            >
                              −
                            </button>
                            <span className="w-9 text-center text-sm font-bold text-gray-900">
                              {isUpdating ? '…' : item.quantity}
                            </span>
                            <button
                              disabled={isUpdating || item.quantity >= item.product.stock}
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-colors text-lg leading-none"
                            >
                              +
                            </button>
                          </div>
                          <p className="text-sm font-bold" style={{ color: '#E8622C' }}>
                            {fmt(item.product.price * item.quantity)}
                          </p>
                          <button
                            disabled={isUpdating}
                            onClick={() => updateQuantity(item.productId, 0)}
                            className="text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30"
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

          {/* Summary */}
          <div className="lg:w-72 flex-shrink-0">
            <div
              className="bg-white rounded-[20px] p-6 sticky top-24"
              style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
            >
              <h2 className="font-bold text-gray-900 text-base mb-5">Resumo</h2>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>{items.length} {items.length === 1 ? 'item' : 'itens'}</span>
                  <span>{fmt(cart?.subtotal ?? 0)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Frete</span>
                  <span>Calculado no checkout</span>
                </div>
              </div>

              <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between font-black text-gray-900 text-lg">
                <span>Total</span>
                <span>{fmt(cart?.subtotal ?? 0)}</span>
              </div>

              <Link
                href="/checkout"
                className="mt-5 flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-white text-sm hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#E8622C' }}
              >
                Finalizar compra →
              </Link>
              <Link
                href="/catalogo"
                className="mt-3 block text-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
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
