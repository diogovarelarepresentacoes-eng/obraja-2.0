'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface SupplierItem {
  id: string;
  companyName: string;
  tradeName?: string;
  cnpj: string;
  phone: string;
  commissionRate: number;
  isVerified: boolean;
  user: { email: string; status: string; createdAt: string };
  address?: { city: string; state: string };
}

interface SupplierList {
  data: SupplierItem[];
  total: number;
}

function formatCnpj(cnpj: string): string {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return cnpj;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  APPROVED: { label: 'Aprovado', className: 'bg-green-50 text-green-700' },
  PENDING_REVIEW: { label: 'Pendente', className: 'bg-amber-50 text-amber-700' },
  REJECTED: { label: 'Rejeitado', className: 'bg-red-50 text-red-700' },
  SUSPENDED: { label: 'Suspenso', className: 'bg-gray-100 text-gray-500' },
};

export default function FornecedoresPage() {
  const router = useRouter();
  const [list, setList] = useState<SupplierList | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get<SupplierList>('/suppliers?limit=50')
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

  const allSuppliers = list?.data ?? [];

  const filtered = search.trim() === ''
    ? allSuppliers
    : allSuppliers.filter((s) => {
        const q = search.toLowerCase();
        return (
          s.companyName.toLowerCase().includes(q) ||
          (s.tradeName ?? '').toLowerCase().includes(q) ||
          s.cnpj.replace(/\D/g, '').includes(q.replace(/\D/g, ''))
        );
      });

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fornecedores</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {list?.total ?? 0} fornecedor{(list?.total ?? 0) !== 1 ? 'es' : ''} cadastrado{(list?.total ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por empresa, nome fantasia ou CNPJ…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-transparent"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-5xl mb-3">🏪</p>
          <p className="font-semibold text-gray-700">
            {search ? 'Nenhum fornecedor encontrado' : 'Nenhum fornecedor cadastrado'}
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
                <th className="text-left px-5 py-3 font-medium text-gray-600">Comissão</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Verificado</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Cadastro</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((supplier) => {
                const statusInfo = STATUS_BADGE[supplier.user.status] ?? {
                  label: supplier.user.status,
                  className: 'bg-gray-100 text-gray-500',
                };
                const isPending = supplier.user.status === 'PENDING_REVIEW';
                const location = supplier.address
                  ? `${supplier.address.city} / ${supplier.address.state}`
                  : '—';

                return (
                  <tr key={supplier.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-900">{supplier.companyName}</p>
                      {supplier.tradeName && (
                        <p className="text-xs text-gray-400 mt-0.5">{supplier.tradeName}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 font-mono text-xs">
                      {formatCnpj(supplier.cnpj)}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{location}</td>
                    <td className="px-5 py-3.5 text-gray-700">
                      {supplier.commissionRate.toFixed(1)}%
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.className}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {supplier.isVerified ? (
                        <span className="text-green-600 font-semibold" title="Verificado">✓</span>
                      ) : (
                        <span className="text-gray-300 font-semibold" title="Não verificado">✗</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {new Date(supplier.user.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-5 py-3.5">
                      {isPending ? (
                        <button
                          onClick={() => router.push(`/aprovacoes/${supplier.id}`)}
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
