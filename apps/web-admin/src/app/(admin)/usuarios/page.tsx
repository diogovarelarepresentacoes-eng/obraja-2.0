'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface UserItem {
  id: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  createdAt: string;
  supplierProfile?: { companyName: string };
  contractorProfile?: { companyName: string };
  buyerProfile?: { firstName: string; lastName: string };
}

interface UserList {
  data: UserItem[];
  total: number;
}

const ROLE_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  BUYER: { label: 'Comprador', bg: '#EDE9FE', color: '#5B21B6' },
  CONTRACTOR: { label: 'Construtora', bg: '#DBEAFE', color: '#1D4ED8' },
  DRIVER: { label: 'Entregador', bg: '#D1FAE5', color: '#065F46' },
  ADMIN: { label: 'Admin', bg: '#111827', color: '#fff' },
  SUPPLIER_STORE: { label: 'Fornecedor', bg: '#FEF3C7', color: '#92400E' },
  SUPPLIER_FACTORY: { label: 'Fornecedor', bg: '#FEF3C7', color: '#92400E' },
};

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  APPROVED: { label: 'Aprovado', className: 'bg-green-50 text-green-700' },
  PENDING_REVIEW: { label: 'Pendente', className: 'bg-amber-50 text-amber-700' },
  REJECTED: { label: 'Rejeitado', className: 'bg-red-50 text-red-700' },
  SUSPENDED: { label: 'Suspenso', className: 'bg-gray-100 text-gray-500' },
};

type FilterTab = 'all' | 'BUYER' | 'CONTRACTOR' | 'DRIVER';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'BUYER', label: 'Compradores' },
  { key: 'CONTRACTOR', label: 'Construtoras' },
  { key: 'DRIVER', label: 'Entregadores' },
];

function getUserDisplayName(user: UserItem): string | null {
  if (user.buyerProfile) {
    return `${user.buyerProfile.firstName} ${user.buyerProfile.lastName}`;
  }
  if (user.contractorProfile) {
    return user.contractorProfile.companyName;
  }
  if (user.supplierProfile) {
    return user.supplierProfile.companyName;
  }
  return null;
}

export default function UsuariosPage() {
  const router = useRouter();
  const [list, setList] = useState<UserList | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [suspending, setSuspending] = useState<string | null>(null);

  useEffect(() => {
    api.get<UserList>('/users?limit=100')
      .then(setList)
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleSuspend(userId: string, email: string) {
    const confirmed = window.confirm(
      `Tem certeza que deseja suspender o usuário "${email}"?\nEsta ação pode ser revertida posteriormente.`
    );
    if (!confirmed) return;

    setSuspending(userId);
    try {
      await api.patch(`/users/${userId}/suspend`, {});
      setList((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          data: prev.data.map((u) =>
            u.id === userId ? { ...u, status: 'SUSPENDED' } : u
          ),
        };
      });
    } catch {
      alert('Erro ao suspender usuário. Tente novamente.');
    } finally {
      setSuspending(null);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <p className="text-gray-400 text-sm">Carregando...</p>
      </div>
    );
  }

  const allUsers = list?.data ?? [];

  const tabFiltered =
    activeTab === 'all'
      ? allUsers
      : allUsers.filter((u) => u.role === activeTab);

  const filtered =
    search.trim() === ''
      ? tabFiltered
      : tabFiltered.filter((u) =>
          u.email.toLowerCase().includes(search.toLowerCase())
        );

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {list?.total ?? 0} usuário{(list?.total ?? 0) !== 1 ? 's' : ''} cadastrado{(list?.total ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por e-mail…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-transparent"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-5xl mb-3">👥</p>
          <p className="font-semibold text-gray-700">
            {search ? 'Nenhum usuário encontrado' : 'Nenhum usuário nesta categoria'}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {search ? 'Tente uma busca diferente' : 'Aguardando cadastros nesta categoria'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Usuário</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Perfil</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Cadastro</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((user) => {
                const roleConfig = ROLE_CONFIG[user.role] ?? {
                  label: user.role,
                  bg: '#F3F4F6',
                  color: '#374151',
                };
                const statusInfo = STATUS_BADGE[user.status] ?? {
                  label: user.status,
                  className: 'bg-gray-100 text-gray-500',
                };
                const displayName = getUserDisplayName(user);
                const isSuspending = suspending === user.id;

                return (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-900">{user.email}</p>
                      {displayName && (
                        <p className="text-xs text-gray-400 mt-0.5">{displayName}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: roleConfig.bg, color: roleConfig.color }}
                      >
                        {roleConfig.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.className}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-5 py-3.5">
                      {user.status === 'APPROVED' ? (
                        <button
                          onClick={() => handleSuspend(user.id, user.email)}
                          disabled={isSuspending}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSuspending ? 'Suspendendo…' : 'Suspender'}
                        </button>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
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
