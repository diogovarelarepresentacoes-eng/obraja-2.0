'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  b2bPrice?: number;
  stock: number;
  status: string;
  unit: string;
  createdAt: string;
  category: { name: string };
  images: { url: string; isPrimary: boolean }[];
}

interface ProductList {
  data: Product[];
  total: number;
}

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: 'Ativo', color: '#166534', bg: '#DCFCE7' },
  INACTIVE: { label: 'Inativo', color: '#6B7280', bg: '#F3F4F6' },
  OUT_OF_STOCK: { label: 'Sem estoque', color: '#9A3412', bg: '#FEE2E2' },
};

export default function ProdutosPage() {
  const router = useRouter();
  const [list, setList] = useState<ProductList | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    api.get<ProductList>('/products/mine?limit=100')
      .then(setList)
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remover "${name}"?`)) return;
    setDeletingId(id);
    try {
      await api.patch(`/products/${id}`, { status: 'INACTIVE' });
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao remover produto');
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <p className="text-gray-400 text-sm">Carregando...</p>
      </div>
    );
  }

  const products = list?.data ?? [];

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-sm text-gray-500 mt-0.5">{list?.total ?? 0} produto{(list?.total ?? 0) !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => router.push('/produtos/novo')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-white text-sm"
          style={{ backgroundColor: '#F05A28' }}
        >
          + Novo produto
        </button>
      </div>

      {products.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-5xl mb-3">📦</p>
          <p className="font-semibold text-gray-700">Nenhum produto cadastrado</p>
          <p className="text-sm text-gray-400 mt-1 mb-5">Comece adicionando seu primeiro produto</p>
          <button
            onClick={() => router.push('/produtos/novo')}
            className="px-5 py-2.5 rounded-lg font-semibold text-white text-sm"
            style={{ backgroundColor: '#F05A28' }}
          >
            Adicionar produto
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Produto</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Categoria</th>
                <th className="text-right px-5 py-3 font-medium text-gray-600">Preço B2C</th>
                <th className="text-right px-5 py-3 font-medium text-gray-600">Preço B2B</th>
                <th className="text-right px-5 py-3 font-medium text-gray-600">Estoque</th>
                <th className="text-center px-5 py-3 font-medium text-gray-600">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((product) => {
                const statusInfo = STATUS_LABEL[product.status] ?? STATUS_LABEL.INACTIVE;
                const img = product.images[0]?.url;

                return (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {img ? (
                          <img src={img} alt={product.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-lg">📦</div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-1">{product.name}</p>
                          <p className="text-xs text-gray-400">{product.unit}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{product.category.name}</td>
                    <td className="px-5 py-3.5 text-right font-medium text-gray-900">
                      {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="px-5 py-3.5 text-right text-gray-500">
                      {product.b2bPrice
                        ? product.b2bPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={product.stock === 0 ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{ color: statusInfo.color, backgroundColor: statusInfo.bg }}
                      >
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => router.push(`/produtos/${product.id}`)}
                          className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 hover:border-orange-300 hover:text-orange-600 transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          disabled={deletingId === product.id}
                          className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 hover:border-red-300 hover:text-red-600 transition-colors disabled:opacity-50"
                        >
                          Remover
                        </button>
                      </div>
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
