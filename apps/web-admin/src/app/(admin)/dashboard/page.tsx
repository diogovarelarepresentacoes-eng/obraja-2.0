'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Stats {
  pending: number;
  approved: number;
  rejected: number;
  buyers: number;
  total: number;
}

const STAT_CARDS = (stats: Stats) => [
  {
    label: 'Aguardando Aprovação',
    value: stats.pending,
    color: '#FFB800',
    bg: '#FFFBEB',
    icon: '⏳',
    href: '/aprovacoes',
  },
  {
    label: 'Fornecedores Aprovados',
    value: stats.approved,
    color: '#16A34A',
    bg: '#F0FDF4',
    icon: '✅',
    href: '/fornecedores',
  },
  {
    label: 'Compradores',
    value: stats.buyers,
    color: '#2563EB',
    bg: '#EFF6FF',
    icon: '🛒',
    href: '/usuarios',
  },
  {
    label: 'Total de Usuários',
    value: stats.total,
    color: '#6B7280',
    bg: '#F9FAFB',
    icon: '👥',
    href: '/usuarios',
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Stats>('/approvals/stats')
      .then(setStats)
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

  if (!stats) return null;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Visão geral da plataforma</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {STAT_CARDS(stats).map((card) => (
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
            <p className="text-3xl font-bold" style={{ color: card.color }}>
              {card.value}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
          </button>
        ))}
      </div>

      {stats.pending > 0 && (
        <div
          className="mt-6 rounded-xl p-4 flex items-center justify-between"
          style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-semibold text-amber-800">
                {stats.pending} cadastro{stats.pending > 1 ? 's' : ''} aguardando análise
              </p>
              <p className="text-sm text-amber-700">Revise e aprove os cadastros pendentes</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/aprovacoes')}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: '#F05A28' }}
          >
            Ver aprovações
          </button>
        </div>
      )}
    </div>
  );
}
