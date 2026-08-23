'use client';

import { use, useEffect, useState } from 'react';
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
  AWAITING_SEPARATION: { bg: '#FEF9C3', color: '#854D0E', label: 'Aguardando separação' },
  IN_TRANSIT: { bg: '#DBEAFE', color: '#1D4ED8', label: 'Em trânsito' },
  DELIVERED: { bg: '#D1FAE5', color: '#065F46', label: 'Entregue' },
  CANCELLED: { bg: '#FEE2E2', color: '#991B1B', label: 'Cancelado' },
};

const PAYMENT_LABELS: Record<string, string> = {
  PIX: 'PIX',
  BOLETO: 'Boleto',
  CREDIT_CARD: 'Cartão de crédito',
};

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface NextAction {
  label: string;
  nextStatus: string;
}

function getNextAction(status: string): NextAction | null {
  if (status === 'AWAITING_SEPARATION') {
    return { label: 'Iniciar separação / Enviar', nextStatus: 'IN_TRANSIT' };
  }
  if (status === 'IN_TRANSIT') {
    return { label: 'Confirmar entrega', nextStatus: 'DELIVERED' };
  }
  return null;
}

export default function PedidoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [subOrder, setSubOrder] = useState<SubOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .get<SubOrderList>('/orders/supplier?limit=100')
      .then((res) => {
        const found = res.data.find((o) => o.id === id);
        if (!found) {
          router.push('/pedidos');
          return;
        }
        setSubOrder(found);
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [id, router]);

  async function handleStatusUpdate(nextStatus: string) {
    if (!subOrder) return;
    setUpdating(true);
    setError(null);
    try {
      await api.patch<SubOrder>(`/orders/suborders/${id}/status`, { status: nextStatus });
      setSubOrder({ ...subOrder, status: nextStatus });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao atualizar status');
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <p className="text-gray-400 text-sm">Carregando...</p>
      </div>
    );
  }

  if (!subOrder) return null;

  const statusInfo = STATUS_CONFIG[subOrder.status] ?? STATUS_CONFIG.AWAITING_SEPARATION;
  const nextAction = getNextAction(subOrder.status);
  const shortId = subOrder.orderId.slice(0, 8).toUpperCase();
  const liquid = subOrder.subtotal - subOrder.commissionValue;
  const addr = subOrder.order.deliveryAddress;
  const fullAddress = `${addr.street}, ${addr.number}${addr.complement ? ` ${addr.complement}` : ''} — ${addr.neighborhood}, ${addr.city}/${addr.state} — CEP ${addr.cep}`;

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => router.push('/pedidos')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          ← Voltar
        </button>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Pedido #{shortId}</h1>
          <span
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
            style={{ color: statusInfo.color, backgroundColor: statusInfo.bg }}
          >
            {statusInfo.label}
          </span>
        </div>
        <p className="text-sm text-gray-400 ml-auto">{formatDate(subOrder.createdAt)}</p>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6 items-start">
        {/* Left — main content */}
        <div className="flex-1 min-w-0 flex flex-col gap-5">
          {/* Items table */}
          <div
            className="bg-white rounded-[20px] overflow-hidden"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
          >
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Itens do pedido</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Produto</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">SKU</th>
                  <th className="text-center px-6 py-3 font-medium text-gray-600">Qtd</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-600">Preço unit.</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {subOrder.items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-gray-900">{item.productName}</td>
                    <td className="px-6 py-3.5 text-gray-400 font-mono text-xs">
                      {item.productSku ?? '—'}
                    </td>
                    <td className="px-6 py-3.5 text-center text-gray-700">{item.quantity}</td>
                    <td className="px-6 py-3.5 text-right text-gray-700">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-6 py-3.5 text-right font-semibold text-gray-900">
                      {formatCurrency(item.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Order summary */}
          <div
            className="bg-white rounded-[20px] p-6"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
          >
            <h2 className="font-semibold text-gray-900 mb-4">Resumo financeiro</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal</span>
                <span className="font-medium">{formatCurrency(subOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Comissão ObraJá ({subOrder.commissionRate}%)</span>
                <span className="text-red-500">− {formatCurrency(subOrder.commissionValue)}</span>
              </div>
              <div className="h-px bg-gray-100" />
              <div className="flex justify-between text-base font-bold text-gray-900">
                <span>Seu líquido</span>
                <span style={{ color: '#E8622C' }}>{formatCurrency(liquid)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right — sidebar */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-4">
          {/* Delivery address */}
          <div
            className="bg-white rounded-[20px] p-5"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
          >
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Endereço de entrega</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{fullAddress}</p>
          </div>

          {/* Customer contact */}
          <div
            className="bg-white rounded-[20px] p-5"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
          >
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Contato do cliente</h3>
            <div className="space-y-1.5 text-sm text-gray-600">
              <p>{subOrder.order.user.email}</p>
              {subOrder.order.user.phone && <p>{subOrder.order.user.phone}</p>}
            </div>
          </div>

          {/* Payment method */}
          <div
            className="bg-white rounded-[20px] p-5"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
          >
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Forma de pagamento</h3>
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: '#F3F4F6', color: '#374151' }}
            >
              {PAYMENT_LABELS[subOrder.order.paymentMethod] ?? subOrder.order.paymentMethod}
            </span>
          </div>

          {/* Status update */}
          <div
            className="bg-white rounded-[20px] p-5"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
          >
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Atualizar status</h3>

            {nextAction ? (
              <div className="space-y-2">
                <button
                  onClick={() => handleStatusUpdate(nextAction.nextStatus)}
                  disabled={updating}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
                  style={{ backgroundColor: '#E8622C' }}
                >
                  {updating ? 'Atualizando...' : nextAction.label}
                </button>
                {error && (
                  <p className="text-xs text-red-600 mt-1">{error}</p>
                )}
              </div>
            ) : (
              <div className="text-sm">
                <span
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ color: statusInfo.color, backgroundColor: statusInfo.bg }}
                >
                  {statusInfo.label}
                </span>
                <p className="text-gray-400 text-xs mt-2">Nenhuma ação disponível.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
