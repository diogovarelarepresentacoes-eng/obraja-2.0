'use client';

import { useEffect, useState, ChangeEvent } from 'react';
import Link from 'next/link';
import { cartApi } from '@/lib/cart-api';

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    unit: string;
    stock: number;
    status: string;
    supplier: { companyName: string; tradeName?: string };
    images: { url: string; isPrimary: boolean }[];
  };
}

interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
}

interface Address {
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
}

type PaymentMethod = 'PIX' | 'BOLETO' | 'CREDIT_CARD';

interface OrderResult {
  id: string;
}

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; description: string }[] = [
  { value: 'PIX', label: 'PIX', description: 'Aprovação imediata' },
  { value: 'BOLETO', label: 'Boleto', description: 'Vence em 3 dias úteis' },
  { value: 'CREDIT_CARD', label: 'Cartão de crédito', description: 'Até 12x sem juros' },
];

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function maskCep(value: string) {
  return value.replace(/\D/g, '').slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');
}

const EMPTY_ADDRESS: Address = {
  cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
};

export default function CheckoutPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartLoading, setCartLoading] = useState(true);
  const [cartError, setCartError] = useState<string | null>(null);

  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderResult | null>(null);

  useEffect(() => {
    cartApi.get<Cart>('/cart')
      .then(setCart)
      .catch((e) => setCartError(e instanceof Error ? e.message : 'Erro ao carregar carrinho'))
      .finally(() => setCartLoading(false));
  }, []);

  function handleAddressChange(field: keyof Address, value: string) {
    setAddress((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCepBlur() {
    const raw = address.cep.replace(/\D/g, '');
    if (raw.length !== 8) return;
    setCepLoading(true);
    setCepError(null);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
      const data = await res.json() as {
        erro?: boolean;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      };
      if (data.erro) {
        setCepError('CEP não encontrado');
        return;
      }
      setAddress((prev) => ({
        ...prev,
        rua: data.logradouro ?? prev.rua,
        bairro: data.bairro ?? prev.bairro,
        cidade: data.localidade ?? prev.cidade,
        estado: data.uf ?? prev.estado,
      }));
    } catch {
      setCepError('Erro ao consultar CEP');
    } finally {
      setCepLoading(false);
    }
  }

  function validate(): string | null {
    const { cep, rua, numero, bairro, cidade, estado } = address;
    if (!cep || cep.replace(/\D/g, '').length !== 8) return 'CEP inválido';
    if (!rua.trim()) return 'Rua obrigatória';
    if (!numero.trim()) return 'Número obrigatório';
    if (!bairro.trim()) return 'Bairro obrigatório';
    if (!cidade.trim()) return 'Cidade obrigatória';
    if (!estado.trim()) return 'Estado obrigatório';
    if (!paymentMethod) return 'Selecione a forma de pagamento';
    if (!cart || cart.items.length === 0) return 'Carrinho vazio';
    return null;
  }

  async function handleSubmit() {
    const validationError = validate();
    if (validationError) {
      setSubmitError(validationError);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await cartApi.post<OrderResult>('/orders', {
        paymentMethod,
        deliveryAddress: {
          cep: address.cep.replace(/\D/g, ''),
          rua: address.rua,
          numero: address.numero,
          complemento: address.complemento || undefined,
          bairro: address.bairro,
          cidade: address.cidade,
          estado: address.estado,
        },
        notes: notes.trim() || undefined,
      });
      setOrder(result);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Erro ao criar pedido');
    } finally {
      setSubmitting(false);
    }
  }

  if (order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 px-4">
        <div className="text-6xl">✅</div>
        <h2 className="text-2xl font-bold text-gray-900">Pedido realizado!</h2>
        <p className="text-gray-500 text-sm text-center">
          Seu pedido <span className="font-mono font-semibold text-gray-700">#{order.id.slice(0, 8).toUpperCase()}</span> foi registrado com sucesso.
        </p>
        <Link
          href="/meus-pedidos"
          className="px-6 py-3 rounded-lg font-semibold text-white text-sm"
          style={{ backgroundColor: '#F05A28' }}
        >
          Ver meus pedidos
        </Link>
        <Link href="/catalogo" className="text-sm text-gray-500 hover:text-gray-700">
          Continuar comprando
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="space-y-6">
          <section className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-5">1. Endereço de entrega</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">CEP</label>
                <input
                  type="text"
                  value={address.cep}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleAddressChange('cep', maskCep(e.target.value))
                  }
                  onBlur={handleCepBlur}
                  placeholder="00000-000"
                  maxLength={9}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400"
                />
                {cepLoading && <p className="text-xs text-gray-400 mt-1">Consultando CEP...</p>}
                {cepError && <p className="text-xs text-red-500 mt-1">{cepError}</p>}
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Rua / Logradouro</label>
                <input
                  type="text"
                  value={address.rua}
                  onChange={(e) => handleAddressChange('rua', e.target.value)}
                  placeholder="Rua das Flores"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Número</label>
                <input
                  type="text"
                  value={address.numero}
                  onChange={(e) => handleAddressChange('numero', e.target.value)}
                  placeholder="123"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Complemento</label>
                <input
                  type="text"
                  value={address.complemento}
                  onChange={(e) => handleAddressChange('complemento', e.target.value)}
                  placeholder="Apto 4 (opcional)"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Bairro</label>
                <input
                  type="text"
                  value={address.bairro}
                  onChange={(e) => handleAddressChange('bairro', e.target.value)}
                  placeholder="Centro"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Cidade</label>
                <input
                  type="text"
                  value={address.cidade}
                  onChange={(e) => handleAddressChange('cidade', e.target.value)}
                  placeholder="São Paulo"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
                <input
                  type="text"
                  value={address.estado}
                  onChange={(e) => handleAddressChange('estado', e.target.value)}
                  placeholder="SP"
                  maxLength={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400 uppercase"
                />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4">2. Resumo do pedido</h2>

            {cartLoading && <p className="text-sm text-gray-400">Carregando itens...</p>}
            {cartError && <p className="text-sm text-red-500">{cartError}</p>}

            {cart && (
              <>
                <div className="divide-y divide-gray-50">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-2.5 text-sm">
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="text-gray-900 font-medium truncate">{item.product.name}</p>
                        <p className="text-gray-400 text-xs">{item.quantity} × {fmt(item.product.price)}</p>
                      </div>
                      <p className="font-semibold text-gray-900 flex-shrink-0">
                        {fmt(item.product.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between text-sm font-bold text-gray-900">
                  <span>Subtotal</span>
                  <span>{fmt(cart.subtotal)}</span>
                </div>
              </>
            )}
          </section>

          <section className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4">3. Forma de pagamento</h2>

            <div className="space-y-3">
              {PAYMENT_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    paymentMethod === option.value
                      ? 'border-orange-400 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={option.value}
                    checked={paymentMethod === option.value}
                    onChange={() => setPaymentMethod(option.value)}
                    className="accent-orange-500"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{option.label}</p>
                    <p className="text-xs text-gray-500">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">Observações (opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Ex: entregar após as 14h"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400 resize-none"
              />
            </div>
          </section>

          <div className="bg-white rounded-xl border border-gray-100 p-6">
            {cart && (
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-700 font-medium">Total do pedido</span>
                <span className="text-2xl font-bold" style={{ color: '#F05A28' }}>
                  {fmt(cart.subtotal)}
                </span>
              </div>
            )}

            {submitError && (
              <p className="text-sm text-red-500 mb-3">{submitError}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting || cartLoading || !cart || cart.items.length === 0}
              className="w-full py-3.5 rounded-lg font-bold text-white text-sm transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#F05A28' }}
            >
              {submitting ? 'Confirmando pedido...' : 'Confirmar pedido'}
            </button>

            <Link
              href="/carrinho"
              className="mt-3 block text-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Voltar ao carrinho
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
