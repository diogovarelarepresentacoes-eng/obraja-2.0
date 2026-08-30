'use client';

import { useEffect, useState, ChangeEvent } from 'react';
import Link from 'next/link';
import { Header } from '@/components/header';
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

interface Cart { id: string; items: CartItem[]; subtotal: number; }
interface Address { cep: string; rua: string; numero: string; complemento: string; bairro: string; cidade: string; estado: string; }
interface OrderResult { id: string; }

type PaymentMethod = 'PIX' | 'BOLETO' | 'CREDIT_CARD';

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; desc: string; icon: string }[] = [
  { value: 'PIX', label: 'PIX', desc: 'Aprovação imediata', icon: '⚡' },
  { value: 'BOLETO', label: 'Boleto Bancário', desc: 'Vence em 3 dias úteis', icon: '🧾' },
  { value: 'CREDIT_CARD', label: 'Cartão de crédito', desc: 'Até 12x sem juros', icon: '💳' },
];

function fmt(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function maskCep(v: string) { return v.replace(/\D/g, '').slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2'); }

const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition';
const labelCls = 'block text-xs font-semibold text-gray-600 mb-1.5';
const EMPTY: Address = { cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' };

export default function CheckoutPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartLoading, setCartLoading] = useState(true);
  const [cartError, setCartError] = useState<string | null>(null);
  const [address, setAddress] = useState<Address>(EMPTY);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [payment, setPayment] = useState<PaymentMethod>('PIX');
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

  function addr(field: keyof Address, value: string) {
    setAddress((p) => ({ ...p, [field]: value }));
  }

  async function lookupCep() {
    const raw = address.cep.replace(/\D/g, '');
    if (raw.length !== 8) return;
    setCepLoading(true); setCepError(null);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
      const d = await res.json() as { erro?: boolean; logradouro?: string; bairro?: string; localidade?: string; uf?: string };
      if (d.erro) { setCepError('CEP não encontrado'); return; }
      setAddress((p) => ({
        ...p,
        rua: d.logradouro ?? p.rua,
        bairro: d.bairro ?? p.bairro,
        cidade: d.localidade ?? p.cidade,
        estado: d.uf ?? p.estado,
      }));
    } catch { setCepError('Erro ao consultar CEP'); }
    finally { setCepLoading(false); }
  }

  function validate(): string | null {
    if (!address.cep || address.cep.replace(/\D/g, '').length !== 8) return 'CEP inválido';
    if (!address.rua.trim()) return 'Rua obrigatória';
    if (!address.numero.trim()) return 'Número obrigatório';
    if (!address.bairro.trim()) return 'Bairro obrigatório';
    if (!address.cidade.trim()) return 'Cidade obrigatória';
    if (!address.estado.trim()) return 'Estado obrigatório';
    if (!cart || cart.items.length === 0) return 'Carrinho vazio';
    return null;
  }

  async function handleSubmit() {
    const err = validate();
    if (err) { setSubmitError(err); return; }
    setSubmitting(true); setSubmitError(null);
    try {
      const result = await cartApi.post<OrderResult>('/orders', {
        paymentMethod: payment,
        deliveryAddress: {
          cep: address.cep.replace(/\D/g, ''),
          rua: address.rua, numero: address.numero,
          complemento: address.complemento || undefined,
          bairro: address.bairro, cidade: address.cidade, estado: address.estado,
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
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-lg mx-auto px-4 py-24 flex flex-col items-center gap-5 text-center">
          <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl bg-green-50">✅</div>
          <h2 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'var(--font-montserrat)' }}>
            Pedido confirmado!
          </h2>
          <p className="text-gray-500 text-sm">
            Pedido{' '}
            <span className="font-mono font-bold text-gray-800">
              #{order.id.slice(0, 8).toUpperCase()}
            </span>{' '}
            registrado com sucesso. Você receberá atualizações por e-mail.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Link
              href="/meus-pedidos"
              className="px-7 py-3 rounded-full font-bold text-white text-sm hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#E8622C' }}
            >
              Ver meus pedidos
            </Link>
            <Link href="/catalogo" className="px-7 py-3 rounded-full font-semibold text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
              Continuar comprando
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-black text-gray-900 mb-2" style={{ fontFamily: 'var(--font-montserrat)' }}>
          Checkout
        </h1>
        <p className="text-sm text-gray-500 mb-8">Confirme seu endereço e forma de pagamento</p>

        <div className="space-y-5">
          {/* Endereço */}
          <section className="bg-white rounded-[20px] p-7" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
            <h2 className="font-black text-gray-900 mb-6 flex items-center gap-2" style={{ fontFamily: 'var(--font-montserrat)' }}>
              <span className="w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#E8622C' }}>1</span>
              Endereço de entrega
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className={labelCls}>CEP *</label>
                <input
                  type="text"
                  value={address.cep}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => addr('cep', maskCep(e.target.value))}
                  onBlur={lookupCep}
                  placeholder="00000-000"
                  maxLength={9}
                  className={inputCls}
                />
                {cepLoading && <p className="text-xs text-gray-400 mt-1">Buscando endereço...</p>}
                {cepError && <p className="text-xs text-red-500 mt-1">{cepError}</p>}
              </div>

              <div className="col-span-2">
                <label className={labelCls}>Rua / Logradouro *</label>
                <input type="text" value={address.rua} onChange={(e) => addr('rua', e.target.value)} placeholder="Rua das Flores" className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Número *</label>
                <input type="text" value={address.numero} onChange={(e) => addr('numero', e.target.value)} placeholder="123" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Complemento</label>
                <input type="text" value={address.complemento} onChange={(e) => addr('complemento', e.target.value)} placeholder="Apto 4B (opcional)" className={inputCls} />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className={labelCls}>Bairro *</label>
                <input type="text" value={address.bairro} onChange={(e) => addr('bairro', e.target.value)} placeholder="Centro" className={inputCls} />
              </div>
              <div className="col-span-2 grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className={labelCls}>Cidade *</label>
                  <input type="text" value={address.cidade} onChange={(e) => addr('cidade', e.target.value)} placeholder="São Paulo" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>UF *</label>
                  <input type="text" value={address.estado} onChange={(e) => addr('estado', e.target.value.toUpperCase().slice(0, 2))} placeholder="SP" maxLength={2} className={inputCls + ' uppercase'} />
                </div>
              </div>
            </div>
          </section>

          {/* Resumo */}
          <section className="bg-white rounded-[20px] p-7" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
            <h2 className="font-black text-gray-900 mb-5 flex items-center gap-2" style={{ fontFamily: 'var(--font-montserrat)' }}>
              <span className="w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#E8622C' }}>2</span>
              Resumo do pedido
            </h2>
            {cartLoading && <p className="text-sm text-gray-400">Carregando itens...</p>}
            {cartError && <p className="text-sm text-red-500">{cartError}</p>}
            {cart && (
              <>
                <div className="divide-y divide-gray-50">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-3 text-sm">
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="text-gray-800 font-medium truncate">{item.product.name}</p>
                        <p className="text-gray-400 text-xs mt-0.5">{item.quantity} × {fmt(item.product.price)}</p>
                      </div>
                      <p className="font-bold text-gray-900 flex-shrink-0">
                        {fmt(item.product.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between font-black text-gray-900">
                  <span>Subtotal</span>
                  <span>{fmt(cart.subtotal)}</span>
                </div>
              </>
            )}
          </section>

          {/* Pagamento */}
          <section className="bg-white rounded-[20px] p-7" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
            <h2 className="font-black text-gray-900 mb-5 flex items-center gap-2" style={{ fontFamily: 'var(--font-montserrat)' }}>
              <span className="w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#E8622C' }}>3</span>
              Forma de pagamento
            </h2>

            <div className="space-y-3">
              {PAYMENT_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-4 p-4 rounded-[16px] border-2 cursor-pointer transition-all"
                  style={payment === opt.value
                    ? { borderColor: '#E8622C', backgroundColor: '#FFF7F4' }
                    : { borderColor: '#E5E7EB', backgroundColor: '#fff' }}
                >
                  <input type="radio" name="payment" value={opt.value} checked={payment === opt.value} onChange={() => setPayment(opt.value)} className="sr-only" />
                  <span className="text-2xl">{opt.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">{opt.label}</p>
                    <p className="text-xs text-gray-500">{opt.desc}</p>
                  </div>
                  <div
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                    style={payment === opt.value ? { borderColor: '#E8622C', backgroundColor: '#E8622C' } : { borderColor: '#D1D5DB' }}
                  >
                    {payment === opt.value && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-5">
              <label className={labelCls}>Observações</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Ex: entregar no período da tarde, portão preto"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400 transition resize-none"
              />
            </div>
          </section>

          {/* CTA */}
          <div className="bg-white rounded-[20px] p-7" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
            {cart && (
              <div className="flex items-center justify-between mb-5">
                <span className="text-gray-700 font-semibold">Total do pedido</span>
                <span className="text-2xl font-black" style={{ color: '#E8622C' }}>{fmt(cart.subtotal)}</span>
              </div>
            )}

            {submitError && (
              <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium bg-red-50 text-red-600 border border-red-100">
                {submitError}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting || cartLoading || !cart || cart.items.length === 0}
              className="w-full py-4 rounded-xl font-black text-white text-base hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#E8622C', fontFamily: 'var(--font-montserrat)' }}
            >
              {submitting ? 'Confirmando pedido...' : 'Confirmar pedido →'}
            </button>
            <Link href="/carrinho" className="mt-3 block text-center text-sm text-gray-400 hover:text-gray-600 transition-colors">
              ← Voltar ao carrinho
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
