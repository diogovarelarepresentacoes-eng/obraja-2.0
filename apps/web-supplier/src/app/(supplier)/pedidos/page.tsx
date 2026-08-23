'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface OrderItem {
  id: string;
  productName: string;
  productSku?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface SubOrder {
  id: string;
  orderId: string;
  status: string;
  subtotal: number;
  commissionRate: number;
  commissionValue: number;
  createdAt: string;
  items: OrderItem[];
  order: {
    id: string;
    paymentMethod: string;
    deliveryAddress: {
      cep: string;
      street: string;
      number: string;
      complement?: string;
      neighborhood: string;
      city: string;
      state: string;
    };
    user: { email: string; phone?: string };
  };
}

interface SubOrderList {
  data: SubOrder[];
  total: number;
}

const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  AWAITING_SEPARATION: { bg: '#FEF9C3', color: '#854D0E', label: 'Aguardando' },
  IN_TRANSIT: { bg: '#DBEAFE', color: '#1D4ED8', label: 'Em trânsito' },
  DELIVERED: { bg: '#D1FAE5', color: '#065F46', label: 'Entregue' },
  CANCELLED: { bg: '#FEE2E2', color: '#991B1B', label: 'Cancelado' },
};

const TABS = [
  { key: 'ALL', label: 'Todos' },
  { key: 'AWAITING_SEPARATION', label: 'Aguardando' },
  { key: 'IN_TRANSIT', label: 'Em trânsito' },
  { key: 'DELIVERED', label: 'Entregues' },
];

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

export default function PedidosPage() {
  const router = useRouter();
  const [subOrders, setSubOrders] = useState<SubOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');

  useEffect(() => {
    setLoading(true);
    api
      .get<SubOrderList>('/orders/supplier?limit=100')
      .then((res) => {
        const sorted = [...res.data].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setSubOrders(sorted);
        setTotal(res.total);
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  const filtered =
    activeTab === 'ALL' ? subOrders : subOrders.filter((o) => o.status === activeTab);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <p className="text-gray-400 text-sm">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {total} pedido{total !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 bg-white rounded-xl p-1" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)', width: 'fit-content' }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={
                isActive
                  ? { backgroundColor: '#E8622C', color: '#fff' }
                  : { color: '#6B7280' }
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div
          className="bg-white rounded-[20px] p-12 text-center"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
        >
          <p className="text-5xl mb-3">📋</p>
          <p className="font-semibold text-gray-700">Nenhum pedido encontrado</p>
          <p className="text-sm text-gray-400 mt-1">
            {activeTab === 'ALL'
              ? 'Você ainda não recebeu pedidos.'
              : 'Nenhum pedido neste status.'}
          </p>
        </div>
      ) : (
        <div
          className="bg-white rounded-[20px] overflow-hidden"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
        >
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Pedido #</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Cliente</th>
                <th className="text-center px-5 py-3 font-medium text-gray-600">Itens</th>
                <th className="text-right px-5 py-3 font-medium text-gray-600">Valor</th>
                <th className="text-center px-5 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Cidade/UF</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Data</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((order) => {
                const statusInfo = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.AWAITING_SEPARATION;
                const shortId = order.orderId.slice(0, 8).toUpperCase();
                const { city, state } = order.order.deliveryAddress;

                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-medium text-gray-900">
                      {shortId}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 max-w-[180px]">
                      <span className="truncate block">{order.order.user.email}</span>
                    </td>
                    <td className="px-5 py-3.5 text-center text-gray-600">
                      {order.items.length}
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium text-gray-900">
                      {formatCurrency(order.subtotal)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{ color: statusInfo.color, backgroundColor: statusInfo.bg }}
                      >
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {city}/{state}
                    </td>
                    <td className="px-5 py-3.5 text-gray-400">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => router.push(`/pedidos/${order.id}`)}
                        className="px-3 py-1.5 text-xs rounded-lg font-medium transition-colors"
                        style={{ backgroundColor: '#FFF3EE', color: '#E8622C' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#E8622C';
                          e.currentTarget.style.color = '#fff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#FFF3EE';
                          e.currentTarget.style.color = '#E8622C';
                        }}
                      >
                        Ver detalhes
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
