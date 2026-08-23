'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Category {
  id: string;
  name: string;
  children: { id: string; name: string }[];
}

interface Product {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  description?: string;
  categoryId: string;
  price: number;
  b2bPrice?: number;
  moq: number;
  stock: number;
  unit: string;
  weightKg?: number;
  widthCm?: number;
  heightCm?: number;
  depthCm?: number;
  isHighlighted: boolean;
  status: string;
  category: { id: string; name: string };
}

const UNITS = ['un', 'kg', 'g', 't', 'm', 'm²', 'm³', 'L', 'ml', 'cx', 'pc', 'rolo', 'fardo', 'saco', 'barra'];
const STATUSES = [
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'INACTIVE', label: 'Inativo' },
  { value: 'OUT_OF_STOCK', label: 'Sem estoque' },
];

export default function EditarProdutoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    name: '',
    sku: '',
    description: '',
    categoryId: '',
    price: '',
    b2bPrice: '',
    moq: '1',
    stock: '0',
    unit: 'un',
    weightKg: '',
    widthCm: '',
    heightCm: '',
    depthCm: '',
    isHighlighted: false,
    status: 'ACTIVE',
  });

  useEffect(() => {
    Promise.all([
      api.get<Category[]>('/categories'),
      api.get<Product>(`/products/${id}`),
    ])
      .then(([cats, product]) => {
        setCategories(cats);
        setForm({
          name: product.name,
          sku: product.sku ?? '',
          description: product.description ?? '',
          categoryId: product.categoryId,
          price: String(product.price),
          b2bPrice: product.b2bPrice ? String(product.b2bPrice) : '',
          moq: String(product.moq),
          stock: String(product.stock),
          unit: product.unit,
          weightKg: product.weightKg ? String(product.weightKg) : '',
          widthCm: product.widthCm ? String(product.widthCm) : '',
          heightCm: product.heightCm ? String(product.heightCm) : '',
          depthCm: product.depthCm ? String(product.depthCm) : '',
          isHighlighted: product.isHighlighted,
          status: product.status,
        });
      })
      .catch(() => router.push('/produtos'))
      .finally(() => setLoading(false));
  }, [id]);

  function set(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!form.name.trim()) return setError('Nome obrigatório');
    if (!form.categoryId) return setError('Selecione uma categoria');
    if (!form.price || isNaN(Number(form.price))) return setError('Preço inválido');

    setSaving(true);
    try {
      await api.patch(`/products/${id}`, {
        name: form.name.trim(),
        sku: form.sku.trim() || undefined,
        description: form.description.trim() || undefined,
        categoryId: form.categoryId,
        price: Number(form.price),
        b2bPrice: form.b2bPrice ? Number(form.b2bPrice) : undefined,
        moq: Number(form.moq) || 1,
        stock: Number(form.stock) || 0,
        unit: form.unit,
        weightKg: form.weightKg ? Number(form.weightKg) : undefined,
        widthCm: form.widthCm ? Number(form.widthCm) : undefined,
        heightCm: form.heightCm ? Number(form.heightCm) : undefined,
        depthCm: form.depthCm ? Number(form.depthCm) : undefined,
        isHighlighted: form.isHighlighted,
        status: form.status,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar produto');
    } finally {
      setSaving(false);
    }
  }

  const allCategories = categories.flatMap((cat) =>
    cat.children.length > 0
      ? cat.children.map((c) => ({ id: c.id, label: `${cat.name} › ${c.name}` }))
      : [{ id: cat.id, label: cat.name }]
  );

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <p className="text-gray-400 text-sm">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-500 hover:text-gray-700 mb-3 flex items-center gap-1"
        >
          ← Voltar
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Editar produto</h1>
      </div>

      {error && (
        <div className="mb-5 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-5 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
          Produto atualizado com sucesso.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Status */}
        <section className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide mb-4">Status</h2>
          <div className="flex gap-2">
            {STATUSES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => set('status', s.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                style={
                  form.status === s.value
                    ? { backgroundColor: '#F05A28', color: '#fff', borderColor: '#F05A28' }
                    : { backgroundColor: '#fff', color: '#4B5563', borderColor: '#E5E7EB' }
                }
              >
                {s.label}
              </button>
            ))}
          </div>
        </section>

        {/* Informações básicas */}
        <section className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Informações básicas</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU / Código</label>
              <input
                type="text"
                value={form.sku}
                onChange={(e) => set('sku', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
              <select
                value={form.categoryId}
                onChange={(e) => set('categoryId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400 bg-white"
              >
                <option value="">Selecione</option>
                {allCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400 resize-none"
            />
          </div>
        </section>

        {/* Preços */}
        <section className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Preços</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preço B2C (R$) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preço B2B (R$)
                <span className="ml-1 text-xs text-gray-400 font-normal">atacado</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.b2bPrice}
                onChange={(e) => set('b2bPrice', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400"
              />
            </div>
          </div>
        </section>

        {/* Estoque */}
        <section className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Estoque</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estoque atual</label>
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => set('stock', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">MOQ mínimo</label>
              <input
                type="number"
                min="1"
                value={form.moq}
                onChange={(e) => set('moq', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
              <select
                value={form.unit}
                onChange={(e) => set('unit', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400 bg-white"
              >
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* Dimensões */}
        <section className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
            Dimensões e peso
            <span className="ml-2 text-xs text-gray-400 font-normal normal-case">para cálculo de frete</span>
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
              <input type="number" min="0" step="0.001" value={form.weightKg} onChange={(e) => set('weightKg', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Largura (cm)</label>
              <input type="number" min="0" step="0.1" value={form.widthCm} onChange={(e) => set('widthCm', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Altura (cm)</label>
              <input type="number" min="0" step="0.1" value={form.heightCm} onChange={(e) => set('heightCm', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Profundidade (cm)</label>
              <input type="number" min="0" step="0.1" value={form.depthCm} onChange={(e) => set('depthCm', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400" />
            </div>
          </div>
        </section>

        {/* Destaque */}
        <section className="bg-white rounded-xl border border-gray-100 p-5">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isHighlighted}
              onChange={(e) => set('isHighlighted', e.target.checked)}
              className="w-4 h-4 rounded accent-orange-500"
            />
            <div>
              <p className="text-sm font-medium text-gray-800">Produto em destaque</p>
              <p className="text-xs text-gray-400">Aparece no topo do catálogo público</p>
            </div>
          </label>
        </section>

        <div className="flex gap-3 pb-8">
          <button
            type="button"
            onClick={() => router.push('/produtos')}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: '#F05A28' }}
          >
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </form>
    </div>
  );
}
