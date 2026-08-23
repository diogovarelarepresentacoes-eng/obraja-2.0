'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { getBuyerToken, authApi } from '@/lib/api';
import { Header } from '@/components/header';

interface OrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

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

type StatusStyle = { bg: string; color: string };

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: 'Aguardando pagamento',
  PAYMENT_CONFIRMED: 'Pago',
  CANCELLED: 'Cancelado',
};

const ORDER_STATUS_STYLES: Record<string, StatusStyle> = {
  PENDING_PAYMENT: { bg: '#FEF9C3', color: '#854D0E' },
  PAYMENT_CONFIRMED: { bg: '#D1FAE5', color: '#065F46' },
  CANCELLED: { bg: '#FEE2E2', color: '#991B1B' },
};

const SUBORDER_STATUS_LABELS: Record<string, string> = {
  AWAITING_SEPARATION: 'Em separação',
  IN_TRANSIT: 'A caminho',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
};

const SUBORDER_STATUS_STYLES: Record<string, StatusStyle> = {
  AWAITING_SEPARATION: { bg: '#FEF9C3', color: '#854D0E' },
  IN_TRANSIT: { bg: '#DBEAFE', color: '#1D4ED8' },
  DELIVERED: { bg: '#D1FAE5', color: '#065F46' },
  CANCELLED: { bg: '#FEE2E2', color: '#991B1B' },
};

const PAYMENT_LABELS: Record<string, string> = {
  PIX: 'PIX',
  BOLETO: 'Boleto bancário',
  CREDIT_CARD: 'Cartão de crédito',
};

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function StatusBadge({ status, labels, styles }: { status: string; labels: Record<string, string>; styles: Record<string, StatusStyle> }) {
  const label = labels[status] ?? status;
  const style = styles[status] ?? { bg: '#F3F4F6', color: '#374151' };
  return (
    <span
      className="text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ backgroundColor: style.bg, color: style.color }}
    >
      {label}
    </span>
  );
}

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const orderId = params.id;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getBuyerToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    authApi
      .get<Order>(`/orders/${orderId}`)
      .then(setOrder)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro ao carregar pedido'))
      .finally(() => setLoading(false));
  }, [orderId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="rounded-[20px] bg-gray-100 animate-pulse h-28" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="rounded-[20px] px-6 py-5 text-sm text-red-700" style={{ backgroundColor: '#FEE2E2' }}>
            {error ?? 'Pedido não encontrado.'}
          </div>
          <Link href="/meus-pedidos" className="inline-block mt-4 text-sm font-semibold hover:underline" style={{ color: '#E8622C' }}>
            ← Meus Pedidos
          </Link>
        </div>
      </div>
    );
  }

  const { deliveryAddress: addr } = order;

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        {/* Back link */}
        <Link href="/meus-pedidos" className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline" style={{ color: '#E8622C' }}>
          ← Meus Pedidos
        </Link>

        {/* Order header */}
        <div className="bg-white rounded-[20px] px-6 py-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                Pedido #{order.id.slice(0, 8).toUpperCase()}
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">{formatDate(order.createdAt)}</p>
            </div>
            <StatusBadge status={order.status} labels={ORDER_STATUS_LABELS} styles={ORDER_STATUS_STYLES} />
          </div>
        </div>

        {/* Delivery address */}
        <div className="bg-white rounded-[20px] px-6 py-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <h2 className="text-sm font-bold text-gray-700 mb-3">Endereço de entrega</h2>
          <p className="text-sm text-gray-900">
            {addr.street}, {addr.number}
          </p>
          <p className="text-sm text-gray-500">
            {addr.city} — {addr.state}
          </p>
        </div>

        {/* Payment method */}
        <div className="bg-white rounded-[20px] px-6 py-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <h2 className="text-sm font-bold text-gray-700 mb-3">Forma de pagamento</h2>
          <span
            className="text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ backgroundColor: '#F3F4F6', color: '#374151' }}
          >
            {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
          </span>
        </div>

        {/* Sub-orders */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-gray-700">Itens do pedido</h2>

          {order.subOrders.map((sub) => {
            const supplierName = sub.supplier.tradeName ?? sub.supplier.companyName;
            return (
              <div
                key={sub.id}
                className="bg-white rounded-[20px] px-6 py-5"
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
              >
                {/* Sub-order header */}
                <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                  <p className="font-semibold text-sm text-gray-900">{supplierName}</p>
                  <StatusBadge status={sub.status} labels={SUBORDER_STATUS_LABELS} styles={SUBORDER_STATUS_STYLES} />
                </div>

                {/* Items table */}
                <div className="w-full">
                  {/* Header row */}
                  <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-400 pb-2 border-b border-gray-100">
                    <span className="col-span-5">Produto</span>
                    <span className="col-span-2 text-center">Qtd</span>
                    <span className="col-span-2 text-right">Unit.</span>
                    <span className="col-span-3 text-right">Total</span>
                  </div>

                  {sub.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 py-2.5 border-b border-gray-50 text-sm">
                      <span className="col-span-5 text-gray-900 font-medium line-clamp-2">{item.productName}</span>
                      <span className="col-span-2 text-center text-gray-600">{item.quantity}</span>
                      <span className="col-span-2 text-right text-gray-600">{fmt(item.unitPrice)}</span>
                      <span className="col-span-3 text-right font-semibold text-gray-900">{fmt(item.totalPrice)}</span>
                    </div>
                  ))}

                  {/* Sub-total */}
                  <div className="flex justify-between items-center pt-3 text-sm">
                    <span className="text-gray-500">Subtotal {supplierName}</span>
                    <span className="font-bold text-gray-900">{fmt(sub.subtotal)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order total */}
        <div
          className="bg-white rounded-[20px] px-6 py-5 flex items-center justify-between"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
        >
          <span className="font-bold text-gray-900">Total do pedido</span>
          <span className="text-2xl font-black" style={{ color: '#E8622C' }}>
            {fmt(order.totalAmount)}
          </span>
        </div>
      </div>
    </div>
  );
}

