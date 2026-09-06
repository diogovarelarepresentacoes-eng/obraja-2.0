'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';

interface ContractorItem {
  id: string;
  userId: string;
  companyName: string;
  cnpj: string;
  ie?: string;
  phone: string;
  creditLimit: number;
  usedCredit: number;
  paymentTermDays: number;
  user: { email: string; status: string };
  address?: { city: string; state: string };
}

interface ContractorList {
  data: ContractorItem[];
  total: number;
}

function formatCnpj(cnpj: string): string {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return cnpj;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  APPROVED: { label: 'Aprovado', className: 'bg-green-50 text-green-700' },
  PENDING_REVIEW: { label: 'Pendente', className: 'bg-amber-50 text-amber-700' },
  REJECTED: { label: 'Rejeitado', className: 'bg-red-50 text-red-700' },
  SUSPENDED: { label: 'Suspenso', className: 'bg-gray-100 text-gray-500' },
};

export default function ConstrutoresPage() {
  const router = useRouter();
  const [list, setList] = useState<ContractorList | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<ContractorList>('/contractors?limit=50')
      .then(setList)
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 401) {
          router.push('/login');
        } else {
          setError('Erro ao carregar construtoras. Recarregue a página.');
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <p className="text-gray-400 text-sm">Carregando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  const all = list?.data ?? [];
  const filtered = search.trim() === ''
    ? all
    : all.filter((c) => {
        const q = search.toLowerCase();
        return (
          c.companyName.toLowerCase().includes(q) ||
          c.cnpj.replace(/\D/g, '').includes(q.replace(/\D/g, ''))
        );
      });

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Construtoras</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {list?.total ?? 0} construtora{(list?.total ?? 0) !== 1 ? 's' : ''} cadastrada{(list?.total ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por empresa ou CNPJ…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-transparent"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-5xl mb-3">🏗️</p>
          <p className="font-semibold text-gray-700">
            {search ? 'Nenhuma construtora encontrada' : 'Nenhuma construtora cadastrada'}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {search ? 'Tente uma busca diferente' : 'Aguardando o primeiro cadastro'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Empresa</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">CNPJ</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Cidade/UF</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Limite de Crédito</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Prazo (dias)</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((contractor) => {
                const statusInfo = STATUS_BADGE[contractor.user.status] ?? {
                  label: contractor.user.status,
                  className: 'bg-gray-100 text-gray-500',
                };
                const isPending = contractor.user.status === 'PENDING_REVIEW';
                const location = contractor.address
                  ? `${contractor.address.city} / ${contractor.address.state}`
                  : '—';

                return (
                  <tr key={contractor.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-900">{contractor.companyName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{contractor.user.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 font-mono text-xs">
                      {formatCnpj(contractor.cnpj)}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{location}</td>
                    <td className="px-5 py-3.5 text-gray-700">
                      {formatCurrency(contractor.creditLimit)}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {contractor.paymentTermDays === 0 ? '—' : `${contractor.paymentTermDays}d`}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.className}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {isPending ? (
                        <button
                          onClick={() => router.push(`/aprovacoes/${contractor.userId}`)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
                          style={{ backgroundColor: '#F05A28' }}
                        >
                          Ver aprovação
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
