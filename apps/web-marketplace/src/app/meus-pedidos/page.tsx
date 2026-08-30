'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getBuyerToken, authApi } from '@/lib/api';
import { Header } from '@/components/header';

interface SubOrder {
  id: string;
  status: string;
  subtotal: number;
  supplier: { companyName: string; tradeName?: string };
  items: { productName: string; quantity: number; unitPrice: number; totalPrice: number }[];
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

interface OrderList { data: Order[]; total: number; }

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: 'Aguardando pagamento',
  PAYMENT_CONFIRMED: 'Pagamento confirmado',
  IN_PROGRESS: 'Em andamento',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
};

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  PENDING_PAYMENT: { bg: '#FEF9C3', color: '#854D0E' },
  PAYMENT_CONFIRMED: { bg: '#D1FAE5', color: '#065F46' },
  IN_PROGRESS: { bg: '#DBEAFE', color: '#1D4ED8' },
  DELIVERED: { bg: '#D1FAE5', color: '#065F46' },
  CANCELLED: { bg: '#FEE2E2', color: '#991B1B' },
};

const PAYMENT_LABELS: Record<string, string> = {
  PIX: 'PIX ⚡',
  BOLETO: 'Boleto 🧾',
  CREDIT_CARD: 'Cartão 💳',
};

function fmt(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StatusBadge({ status }: { status: string }) {
  const label = STATUS_LABELS[status] ?? status;
  const style = STATUS_STYLES[status] ?? { bg: '#F3F4F6', color: '#374151' };
  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: style.bg, color: style.color }}>
      {label}
    </span>
  );
}

function OrderSkeleton() {
  return (
    <div className="bg-white rounded-[20px] px-6 py-5 animate-pulse" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-gray-100 rounded w-40" />
          <div className="h-3 bg-gray-100 rounded w-24" />
          <div className="h-3 bg-gray-100 rounded w-56" />
        </div>
        <div className="space-y-2 items-end flex flex-col">
          <div className="h-5 bg-gray-100 rounded w-20" />
          <div className="h-3 bg-gray-100 rounded w-16" />
        </div>
      </div>
    </div>
  );
}

export default function MeusPedidosPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getBuyerToken()) { router.replace('/login?returnUrl=/meus-pedidos'); return; }
    authApi.get<OrderList>('/orders')
      .then((r) => setOrders(r.data ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro ao carregar pedidos'))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'var(--font-montserrat)' }}>
            Meus Pedidos
          </h1>
          {orders.length > 0 && (
            <span className="text-sm text-gray-400">{orders.length} pedido{orders.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => <OrderSkeleton key={n} />)}
          </div>
        )}

        {error && (
          <div className="rounded-[20px] px-6 py-5 text-sm text-red-700 bg-red-50 border border-red-100">
            {error}
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="flex flex-col items-center gap-5 py-24 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl" style={{ backgroundColor: '#FEF0EA' }}>
              📋
            </div>
            <h2 className="text-xl font-black text-gray-900" style={{ fontFamily: 'var(--font-montserrat)' }}>
              Nenhum pedido ainda
            </h2>
            <p className="text-gray-500 text-sm max-w-xs">
              Explore o catálogo e faça seu primeiro pedido de materiais.
            </p>
            <Link
              href="/catalogo"
              className="mt-2 px-8 py-3.5 rounded-full font-bold text-white text-sm hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#E8622C' }}
            >
              Ver catálogo →
            </Link>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => {
              const suppliers = order.subOrders
                .map((s) => s.supplier.tradeName ?? s.supplier.companyName)
                .join(', ');

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-[20px] px-6 py-5 hover:shadow-lg transition-shadow"
                  style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-1">
                        <span className="font-black text-gray-900 text-sm" style={{ fontFamily: 'var(--font-montserrat)' }}>
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                      {suppliers && (
                        <p className="text-xs text-gray-500 mt-2 truncate">
                          {order.subOrders.length} fornecedor{order.subOrders.length !== 1 ? 'es' : ''}: {suppliers}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
                      </p>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <p className="text-base font-black" style={{ color: '#E8622C' }}>
                        {fmt(order.totalAmount)}
                      </p>
                      <Link
                        href={`/meus-pedidos/${order.id}`}
                        className="mt-1.5 inline-block text-xs font-semibold hover:underline"
                        style={{ color: '#E8622C' }}
                      >
                        Detalhes →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
