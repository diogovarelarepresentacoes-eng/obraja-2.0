'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface PendingUser {
  id: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
  supplierProfile?: { companyName: string; cnpj: string };
  contractorProfile?: { companyName: string; cnpj: string };
  driverProfile?: { firstName: string; lastName: string; cpf: string };
  documents: { id: string; type: string; status: string }[];
}

interface PendingList {
  data: PendingUser[];
  total: number;
}

const ROLE_LABEL: Record<string, string> = {
  SUPPLIER_STORE: 'Loja',
  SUPPLIER_FACTORY: 'Fábrica',
  CONTRACTOR: 'Construtora',
  DRIVER: 'Entregador',
};

const ROLE_COLOR: Record<string, string> = {
  SUPPLIER_STORE: '#2563EB',
  SUPPLIER_FACTORY: '#7C3AED',
  CONTRACTOR: '#D97706',
  DRIVER: '#059669',
};

export default function AprovacoesPage() {
  const router = useRouter();
  const [list, setList] = useState<PendingList | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<PendingList>('/approvals?limit=50')
      .then(setList)
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

  const users = list?.data ?? [];

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Aprovações</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {list?.total ?? 0} cadastro{(list?.total ?? 0) !== 1 ? 's' : ''} aguardando análise
          </p>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-5xl mb-3">🎉</p>
          <p className="font-semibold text-gray-700">Nenhum cadastro pendente</p>
          <p className="text-sm text-gray-400 mt-1">Todos os cadastros foram revisados</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Empresa / Nome</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">E-mail</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Tipo</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Docs</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Solicitado em</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => {
                const name =
                  user.supplierProfile?.companyName ??
                  user.contractorProfile?.companyName ??
                  (user.driverProfile
                    ? `${user.driverProfile.firstName} ${user.driverProfile.lastName}`
                    : '—');

                return (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-900">{name}</p>
                      <p className="text-xs text-gray-400">
                        {user.supplierProfile?.cnpj ?? user.contractorProfile?.cnpj ?? user.driverProfile?.cpf ?? ''}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{user.email}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: ROLE_COLOR[user.role] ?? '#6B7280' }}
                      >
                        {ROLE_LABEL[user.role] ?? user.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-gray-700">{user.documents.length}</span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => router.push(`/aprovacoes/${user.id}`)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
                        style={{ backgroundColor: '#F05A28' }}
                      >
                        Analisar
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
