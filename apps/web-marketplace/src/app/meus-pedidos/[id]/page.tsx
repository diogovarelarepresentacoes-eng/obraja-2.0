'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { getBuyerToken, authApi } from '@/lib/api';
import { Header } from '@/components/header';

interface OrderItem { productName: string; quantity: number; unitPrice: number; totalPrice: number; }

interface SubOrder {
  id: string;
  status: string;
  subtotal: number;
  supplier: { companyName: string; tradeName?: string };
  items: OrderItem[];
}

interface Order {
  id: string;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  deliveryAddress: { street: string; number: string; city: string; state: string };
  subOrders: SubOrder[];
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: 'Aguardando pagamento',
  PAYMENT_CONFIRMED: 'Pagamento confirmado',
  IN_PROGRESS: 'Em andamento',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
};

const ORDER_STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  PENDING_PAYMENT: { bg: '#FEF9C3', color: '#854D0E' },
  PAYMENT_CONFIRMED: { bg: '#D1FAE5', color: '#065F46' },
  IN_PROGRESS: { bg: '#DBEAFE', color: '#1D4ED8' },
  DELIVERED: { bg: '#D1FAE5', color: '#065F46' },
  CANCELLED: { bg: '#FEE2E2', color: '#991B1B' },
};

const SUBORDER_STATUS_LABELS: Record<string, string> = {
  AWAITING_SEPARATION: 'Em separação',
  IN_TRANSIT: 'A caminho',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
};

const SUBORDER_TIMELINE: { key: string; label: string; icon: string }[] = [
  { key: 'AWAITING_SEPARATION', label: 'Em separação', icon: '📦' },
  { key: 'IN_TRANSIT', label: 'A caminho', icon: '🚚' },
  { key: 'DELIVERED', label: 'Entregue', icon: '✅' },
];

const PAYMENT_LABELS: Record<string, string> = {
  PIX: 'PIX ⚡',
  BOLETO: 'Boleto bancário 🧾',
  CREDIT_CARD: 'Cartão de crédito 💳',
};

function fmt(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function StatusBadge({ status, labels, styles }: { status: string; labels: Record<string, string>; styles: Record<string, { bg: string; color: string }> }) {
  const style = styles[status] ?? { bg: '#F3F4F6', color: '#374151' };
  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: style.bg, color: style.color }}>
      {labels[status] ?? status}
    </span>
  );
}

function SubOrderTimeline({ status }: { status: string }) {
  const cancelledIdx = status === 'CANCELLED' ? -1 : null;
  const currentIdx = SUBORDER_TIMELINE.findIndex((s) => s.key === status);

  if (status === 'CANCELLED') {
    return (
      <div className="flex items-center gap-2 py-2">
        <span className="text-sm">❌</span>
        <span className="text-sm text-red-600 font-semibold">Cancelado</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 mt-3">
      {SUBORDER_TIMELINE.map((step, i) => {
        const done = i <= currentIdx;
        const active = i === currentIdx;
        return (
          <div key={step.key} className="flex items-center gap-1 flex-1">
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-base transition-all"
                style={{ backgroundColor: done ? '#E8622C' : '#E5E7EB' }}
              >
                {done ? step.icon : <span className="w-2.5 h-2.5 rounded-full bg-white" />}
              </div>
              <p className={`text-xs mt-1 text-center leading-tight max-w-[56px] ${active ? 'font-bold text-gray-900' : done ? 'text-gray-500' : 'text-gray-300'}`}>
                {step.label}
              </p>
            </div>
            {i < SUBORDER_TIMELINE.length - 1 && (
              <div className="flex-1 h-0.5 mb-4 transition-colors" style={{ backgroundColor: done && i < currentIdx ? '#E8622C' : '#E5E7EB' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function OrderDetailPage() {
  const router = useRouter();
  const { id: orderId } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getBuyerToken()) { router.replace('/login'); return; }
    authApi.get<Order>(`/orders/${orderId}`)
      .then(setOrder)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro ao carregar pedido'))
      .finally(() => setLoading(false));
  }, [orderId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-[20px] h-28 animate-pulse" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="rounded-[20px] px-6 py-5 text-sm text-red-700 bg-red-50 border border-red-100">
            {error ?? 'Pedido não encontrado.'}
          </div>
          <Link href="/meus-pedidos" className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold hover:underline" style={{ color: '#E8622C' }}>
            ← Meus Pedidos
          </Link>
        </div>
      </div>
    );
  }

  const { deliveryAddress: addr } = order;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-5">
        <Link href="/meus-pedidos" className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline" style={{ color: '#E8622C' }}>
          ← Meus Pedidos
        </Link>

        {/* Order header */}
        <div className="bg-white rounded-[20px] px-7 py-6" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-black text-gray-900" style={{ fontFamily: 'var(--font-montserrat)' }}>
                Pedido #{order.id.slice(0, 8).toUpperCase()}
              </h1>
              <p className="text-sm text-gray-400 mt-1">{formatDate(order.createdAt)}</p>
            </div>
            <StatusBadge status={order.status} labels={ORDER_STATUS_LABELS} styles={ORDER_STATUS_STYLES} />
          </div>
        </div>

        {/* Delivery + Payment */}
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="bg-white rounded-[20px] px-6 py-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Entrega</p>
            <p className="text-sm font-semibold text-gray-900">{addr.street}, {addr.number}</p>
            <p className="text-sm text-gray-500">{addr.city} — {addr.state}</p>
          </div>
          <div className="bg-white rounded-[20px] px-6 py-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Pagamento</p>
            <p className="text-sm font-semibold text-gray-900">
              {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
            </p>
          </div>
        </div>

        {/* Sub-orders */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Itens por fornecedor
          </p>
          <div className="space-y-4">
            {order.subOrders.map((sub) => {
              const supplier = sub.supplier.tradeName ?? sub.supplier.companyName;
              return (
                <div key={sub.id} className="bg-white rounded-[20px] px-6 py-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                  <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                    <p className="font-bold text-sm text-gray-900">{supplier}</p>
                    <StatusBadge status={sub.status} labels={SUBORDER_STATUS_LABELS} styles={ORDER_STATUS_STYLES} />
                  </div>

                  <SubOrderTimeline status={sub.status} />

                  <div className="mt-5 border-t border-gray-50 pt-4">
                    <div className="grid grid-cols-12 gap-2 text-xs font-bold text-gray-400 pb-2 border-b border-gray-50">
                      <span className="col-span-5">Produto</span>
                      <span className="col-span-2 text-center">Qtd</span>
                      <span className="col-span-2 text-right">Unit.</span>
                      <span className="col-span-3 text-right">Total</span>
                    </div>
                    {sub.items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 py-2.5 border-b border-gray-50 text-sm last:border-0">
                        <span className="col-span-5 text-gray-800 font-medium line-clamp-2">{item.productName}</span>
                        <span className="col-span-2 text-center text-gray-600">{item.quantity}</span>
                        <span className="col-span-2 text-right text-gray-600">{fmt(item.unitPrice)}</span>
                        <span className="col-span-3 text-right font-bold text-gray-900">{fmt(item.totalPrice)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-3 text-sm">
                      <span className="text-gray-500">Subtotal {supplier}</span>
                      <span className="font-bold text-gray-900">{fmt(sub.subtotal)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Total */}
        <div
          className="bg-white rounded-[20px] px-7 py-5 flex items-center justify-between"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
        >
          <span className="font-bold text-gray-800 text-base">Total do pedido</span>
          <span className="text-2xl font-black" style={{ color: '#E8622C', fontFamily: 'var(--font-montserrat)' }}>
            {fmt(order.totalAmount)}
          </span>
        </div>
      </div>
    </div>
  );
}
