'use client';

import { useState } from 'react';
import { cartApi } from '@/lib/cart-api';

interface Props {
  productId: string;
  moq: number;
  stock: number;
  unit: string;
  inStock: boolean;
}

export function AddToCartButton({ productId, moq, stock, unit, inStock }: Props) {
  const [qty, setQty] = useState(moq);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  function adjust(delta: number) {
    setQty((prev) => Math.max(moq, Math.min(stock, prev + delta)));
  }

  async function handleAdd() {
    setLoading(true);
    setFeedback(null);
    try {
      await cartApi.post('/cart/items', { productId, quantity: qty });
      setFeedback({ type: 'success', msg: 'Item adicionado ao carrinho!' });
    } catch (e) {
      setFeedback({ type: 'error', msg: e instanceof Error ? e.message : 'Erro ao adicionar item' });
    } finally {
      setLoading(false);
    }
  }

  if (!inStock) {
    return (
      <button
        disabled
        className="mt-5 w-full py-3.5 rounded-[20px] font-semibold text-white text-sm opacity-40 cursor-not-allowed"
        style={{ backgroundColor: '#E8622C' }}
      >
        Produto indisponível
      </button>
    );
  }

  return (
    <div className="mt-5 space-y-3">
      {/* Quantity selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">Quantidade:</span>
        <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => adjust(-1)}
            disabled={qty <= moq}
            className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-colors"
          >
            −
          </button>
          <span className="px-4 text-sm font-semibold text-gray-900 min-w-[3rem] text-center">
            {qty}
          </span>
          <button
            onClick={() => adjust(1)}
            disabled={qty >= stock}
            className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-colors"
          >
            +
          </button>
        </div>
        <span className="text-xs text-gray-400">{unit}</span>
      </div>

      {moq > 1 && (
        <p className="text-xs text-gray-400">Pedido mínimo: {moq} {unit}</p>
      )}

      <button
        onClick={handleAdd}
        disabled={loading}
        className="w-full py-3.5 rounded-[20px] font-semibold text-white text-sm transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: '#E8622C' }}
      >
        {loading ? 'Adicionando...' : 'Adicionar ao carrinho'}
      </button>

      {feedback && (
        <p
          className="text-sm font-medium text-center"
          style={{ color: feedback.type === 'success' ? '#065F46' : '#991B1B' }}
        >
          {feedback.msg}
        </p>
      )}
    </div>
  );
}
