'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';

interface DriverItem {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  cpf: string;
  vehicleType: string;
  vehiclePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  vehicleColor: string;
  isOnline: boolean;
  rating: number;
  totalDeliveries: number;
  user: { email: string; status: string };
}

interface DriverList {
  data: DriverItem[];
  total: number;
}

function formatCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return cpf;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

const VEHICLE_LABEL: Record<string, string> = {
  MOTO: 'Moto',
  CARRO: 'Carro',
  VAN: 'Van',
  CAMINHONETE: 'Caminhonete',
  CAMINHAO: 'Caminhão',
};

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  APPROVED: { label: 'Aprovado', className: 'bg-green-50 text-green-700' },
  PENDING_REVIEW: { label: 'Pendente', className: 'bg-amber-50 text-amber-700' },
  REJECTED: { label: 'Rejeitado', className: 'bg-red-50 text-red-700' },
  SUSPENDED: { label: 'Suspenso', className: 'bg-gray-100 text-gray-500' },
};

export default function EntregadoresPage() {
  const router = useRouter();
  const [list, setList] = useState<DriverList | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<DriverList>('/drivers?limit=50')
      .then(setList)
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 401) {
          router.push('/login');
        } else {
          setError('Erro ao carregar entregadores. Recarregue a página.');
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
    : all.filter((d) => {
        const q = search.toLowerCase();
        const name = `${d.firstName} ${d.lastName}`.toLowerCase();
        return (
          name.includes(q) ||
          d.cpf.replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
          d.vehiclePlate.toLowerCase().includes(q)
        );
      });

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Entregadores</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {list?.total ?? 0} entregador{(list?.total ?? 0) !== 1 ? 'es' : ''} cadastrado{(list?.total ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nome, CPF ou placa…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-transparent"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-5xl mb-3">🛵</p>
          <p className="font-semibold text-gray-700">
            {search ? 'Nenhum entregador encontrado' : 'Nenhum entregador cadastrado'}
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
                <th className="text-left px-5 py-3 font-medium text-gray-600">Entregador</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">CPF</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Veículo</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Placa</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Entregas</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Nota</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((driver) => {
                const statusInfo = STATUS_BADGE[driver.user.status] ?? {
                  label: driver.user.status,
                  className: 'bg-gray-100 text-gray-500',
                };
                const isPending = driver.user.status === 'PENDING_REVIEW';

                return (
                  <tr key={driver.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-900">{driver.firstName} {driver.lastName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{driver.user.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 font-mono text-xs">
                      {formatCpf(driver.cpf)}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      <span>{VEHICLE_LABEL[driver.vehicleType] ?? driver.vehicleType}</span>
                      <span className="text-xs text-gray-400 ml-1">{driver.vehicleBrand} {driver.vehicleModel} {driver.vehicleYear}</span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-700">
                      {driver.vehiclePlate}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 text-center">
                      {driver.totalDeliveries}
                    </td>
                    <td className="px-5 py-3.5 text-gray-700">
                      ⭐ {driver.rating.toFixed(1)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.className}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {isPending ? (
                        <button
                          onClick={() => router.push(`/aprovacoes/${driver.userId}`)}
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
