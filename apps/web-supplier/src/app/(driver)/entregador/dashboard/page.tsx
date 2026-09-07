'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface DriverProfile {
  firstName: string;
  lastName: string;
  vehicleType: string;
  vehiclePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  rating?: number;
  totalDeliveries?: number;
  user: { email: string; status: string };
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: 'Ativo', color: '#16A34A', bg: '#F0FDF4' },
  PENDING_REVIEW: { label: 'Em análise', color: '#D97706', bg: '#FFFBEB' },
  SUSPENDED: { label: 'Suspenso', color: '#DC2626', bg: '#FEF2F2' },
};

export default function DriverDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<DriverProfile>('/drivers/me')
      .then(setProfile)
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

  if (!profile) return null;

  const status = STATUS_LABELS[profile.user.status] ?? STATUS_LABELS['PENDING_REVIEW']!;
  const totalDeliveries = profile.totalDeliveries ?? 0;
  const rating = profile.rating ?? null;

  const STAT_CARDS = [
    {
      label: 'Entregas realizadas',
      value: totalDeliveries,
      icon: '✅',
      color: '#16A34A',
      bg: '#F0FDF4',
    },
    {
      label: 'Avaliação média',
      value: rating !== null ? rating.toFixed(1) + ' ★' : '—',
      icon: '⭐',
      color: '#D97706',
      bg: '#FFFBEB',
    },
    {
      label: 'Entregas pendentes',
      value: 0,
      icon: '⏳',
      color: '#2563EB',
      bg: '#EFF6FF',
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-7 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Olá, {profile.firstName}! 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Bem-vindo ao seu painel de entregador ObraJá
          </p>
        </div>
        <span
          className="px-3 py-1 rounded-full text-xs font-semibold"
          style={{ backgroundColor: status.bg, color: status.color }}
        >
          {status.label}
        </span>
      </div>

      {/* Pending review banner */}
      {profile.user.status === 'PENDING_REVIEW' && (
        <div
          className="mb-6 rounded-xl p-4 flex items-center gap-3"
          style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A' }}
        >
          <span className="text-2xl">📋</span>
          <div>
            <p className="font-semibold text-amber-800 text-sm">Cadastro em análise</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Nossa equipe está revisando seus documentos. Você será notificado por e-mail em até 48h úteis.
              Certifique-se de enviar: CNH (frente e verso), CRLV e selfie com documento.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {STAT_CARDS.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-gray-100 p-5"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-3"
              style={{ backgroundColor: card.bg }}
            >
              {card.icon}
            </div>
            <p className="text-3xl font-bold" style={{ color: card.color }}>{card.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Vehicle info */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
            Meu Veículo
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Tipo', value: profile.vehicleType },
              { label: 'Marca / Modelo', value: `${profile.vehicleBrand} ${profile.vehicleModel}` },
              { label: 'Ano', value: profile.vehicleYear },
              { label: 'Placa', value: profile.vehiclePlate },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium text-gray-900">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
            Ações rápidas
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Ver entregas disponíveis', icon: '🔍', href: '/entregador/entregas' },
              { label: 'Ver histórico de entregas', icon: '🕐', href: '/entregador/historico' },
              { label: 'Atualizar meu perfil', icon: '✏️', href: '/entregador/perfil' },
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-orange-200 hover:bg-orange-50 transition-all"
              >
                <span className="text-xl">{action.icon}</span>
                <span className="text-sm text-gray-700 font-medium">{action.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Empty state for deliveries */}
      <div className="mt-6 bg-white rounded-xl border border-gray-100 p-8 text-center">
        <span className="text-4xl">🚛</span>
        <h3 className="mt-3 font-semibold text-gray-900">Nenhuma entrega disponível agora</h3>
        <p className="text-sm text-gray-500 mt-1.5 max-w-sm mx-auto">
          Quando houver entregas na sua região, elas aparecerão aqui.
          Mantenha o app aberto para receber notificações em tempo real.
        </p>
      </div>
    </div>
  );
}
