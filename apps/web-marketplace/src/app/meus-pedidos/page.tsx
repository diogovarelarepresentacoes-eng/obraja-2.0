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

interface OrderList {
  data: Order[];
  total: number;
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

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function StatusBadge({ status }: { status: string }) {
  const label = ORDER_STATUS_LABELS[status] ?? status;
  const style = ORDER_STATUS_STYLES[status] ?? { bg: '#F3F4F6', color: '#374151' };
  return (
    <span
      className="text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ backgroundColor: style.bg, color: style.color }}
    >
      {label}
    </span>
  );
}

export default function MeusPedidosPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getBuyerToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    authApi
      .get<OrderList>('/orders')
      .then((result) => setOrders(result.data ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro ao carregar pedidos'))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Meus Pedidos</h1>

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="rounded-[20px] bg-gray-100 animate-pulse h-28" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }} />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-[20px] px-6 py-5 text-sm text-red-700" style={{ backgroundColor: '#FEE2E2' }}>
            {error}
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="flex flex-col items-center gap-5 py-20 text-center">
            <span className="text-6xl">📋</span>
            <p className="text-gray-500 text-sm">Você ainda não fez nenhum pedido.</p>
            <Link
              href="/catalogo"
              className="px-6 py-3 rounded-xl font-bold text-white text-sm hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#E8622C' }}
            >
              Ver catálogo
            </Link>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => {
              const supplierNames = order.subOrders
                .map((s) => s.supplier.tradeName ?? s.supplier.companyName)
                .join(', ');

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-[20px] px-6 py-5"
                  style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-bold text-gray-900 text-sm">
                          Pedido #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{formatDate(order.createdAt)}</p>
                      {supplierNames && (
                        <p className="text-xs text-gray-500 mt-2 truncate">
                          {order.subOrders.length} {order.subOrders.length === 1 ? 'fornecedor' : 'fornecedores'}: {supplierNames}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-base font-bold" style={{ color: '#E8622C' }}>
                        {fmt(order.totalAmount)}
                      </p>
                      <Link
                        href={`/meus-pedidos/${order.id}`}
                        className="mt-2 inline-block text-xs font-semibold hover:underline"
                        style={{ color: '#E8622C' }}
                      >
                        Ver detalhes →
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
