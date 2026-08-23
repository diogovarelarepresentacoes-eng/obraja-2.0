'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Stats {
  products: number;
  pendingOrders: number;
  completedOrders: number;
}

interface Profile {
  companyName: string;
  tradeName?: string;
  isVerified: boolean;
  user: { status: string };
}

export default function SupplierDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Profile>('/suppliers/me'),
      api.get<Stats>('/suppliers/me/stats'),
    ])
      .then(([p, s]) => {
        setProfile(p);
        setStats(s);
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <p className="text-gray-400 text-sm">Carregando...</p>
      </div>
    );
  }

  if (!profile || !stats) return null;

  const STAT_CARDS = [
    { label: 'Produtos ativos', value: stats.products, icon: '📦', href: '/produtos', color: '#2563EB', bg: '#EFF6FF' },
    { label: 'Pedidos pendentes', value: stats.pendingOrders, icon: '⏳', href: '/pedidos', color: '#D97706', bg: '#FFFBEB' },
    { label: 'Pedidos entregues', value: stats.completedOrders, icon: '✅', href: '/pedidos', color: '#16A34A', bg: '#F0FDF4' },
  ];

  return (
    <div className="p-8">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">
          Olá, {profile.tradeName ?? profile.companyName}! 👋
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Bem-vindo ao seu painel de fornecedor ObraJá
        </p>
      </div>

      {!profile.isVerified && (
        <div
          className="mb-6 rounded-xl p-4 flex items-center gap-3"
          style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A' }}
        >
          <span className="text-2xl">📋</span>
          <div>
            <p className="font-semibold text-amber-800 text-sm">Conta em verificação</p>
            <p className="text-xs text-amber-700">
              Nossa equipe está analisando seus documentos. Você será notificado por e-mail em até 48h úteis.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-8">
        {STAT_CARDS.map((card) => (
          <button
            key={card.label}
            onClick={() => router.push(card.href)}
            className="bg-white rounded-xl border border-gray-100 p-5 text-left hover:shadow-sm transition-shadow"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-3"
              style={{ backgroundColor: card.bg }}
            >
              {card.icon}
            </div>
            <p className="text-3xl font-bold" style={{ color: card.color }}>{card.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
          </button>
        ))}
      </div>

      {/* Ações rápidas */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
          Ações rápidas
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Adicionar produto', icon: '➕', href: '/produtos/novo' },
            { label: 'Ver pedidos pendentes', icon: '🧾', href: '/pedidos' },
            { label: 'Atualizar perfil', icon: '✏️', href: '/perfil' },
            { label: 'Configurar frete', icon: '🚛', href: '/perfil#frete' },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => router.push(action.href)}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-orange-200 hover:bg-orange-50 transition-all text-left"
            >
              <span className="text-xl">{action.icon}</span>
              <span className="text-sm text-gray-700 font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
