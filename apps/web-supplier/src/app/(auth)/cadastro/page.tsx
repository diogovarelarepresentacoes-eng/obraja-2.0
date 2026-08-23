'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

type Step = 1 | 2 | 3 | 4 | 5;
type UploadStatus = 'idle' | 'uploading' | 'done' | 'error';

interface FormData {
  role: 'SUPPLIER_STORE' | 'SUPPLIER_FACTORY';
  companyName: string;
  tradeName: string;
  cnpj: string;
  ie: string;
  phone: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const INITIAL: FormData = {
  role: 'SUPPLIER_STORE',
  companyName: '', tradeName: '', cnpj: '', ie: '', phone: '',
  cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '',
  email: '', password: '', confirmPassword: '',
};

function maskCnpj(v: string) {
  return v.replace(/\D/g, '').replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5').slice(0, 18);
}

function maskPhone(v: string) {
  return v.replace(/\D/g, '').replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3').slice(0, 15);
}

function maskCep(v: string) {
  return v.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2').slice(0, 9);
}

async function fetchCep(cep: string): Promise<Partial<FormData> | null> {
  const clean = cep.replace(/\D/g, '');
  if (clean.length !== 8) return null;
  try {
    const r = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    const d = await r.json() as { logradouro?: string; bairro?: string; localidade?: string; uf?: string; erro?: boolean };
    if (d.erro) return null;
    return { street: d.logradouro ?? '', neighborhood: d.bairro ?? '', city: d.localidade ?? '', state: d.uf ?? '' };
  } catch { return null; }
}

const STEPS = ['Tipo', 'Empresa', 'Endereço', 'Acesso', 'Documentos'];

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

const DOC_CONFIG = [
  { type: 'CONTRATO_SOCIAL', label: 'Contrato Social', required: true },
  { type: 'CNPJ', label: 'Cartão CNPJ', required: true },
  { type: 'INSCRICAO_ESTADUAL', label: 'Inscrição Estadual', required: false },
] as const;

export default function CadastroPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [uploads, setUploads] = useState<Record<string, UploadStatus>>({
    CONTRATO_SOCIAL: 'idle',
    CNPJ: 'idle',
    INSCRICAO_ESTADUAL: 'idle',
  });

  function set(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCepBlur() {
    setCepLoading(true);
    const result = await fetchCep(form.cep);
    if (result) setForm((prev) => ({ ...prev, ...result }));
    setCepLoading(false);
  }

  function nextStep() {
    setError('');
    if (step === 2) {
      if (!form.companyName || !form.cnpj || !form.phone) {
        setError('Preencha todos os campos obrigatórios');
        return;
      }
    }
    if (step === 3) {
      if (!form.cep || !form.street || !form.number || !form.city) {
        setError('Preencha o endereço completo');
        return;
      }
    }
    setStep((s) => Math.min(s + 1, 4) as Step);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('As senhas não conferem');
      return;
    }
    if (form.password.length < 8) {
      setError('Senha deve ter ao menos 8 caracteres');
      return;
    }

    setLoading(true);
    try {
      const result = await api.post<{ userId: string }>('/suppliers/register', {
        email: form.email,
        password: form.password,
        phone: form.phone,
        companyName: form.companyName,
        tradeName: form.tradeName || undefined,
        cnpj: form.cnpj,
        ie: form.ie || undefined,
        role: form.role,
        address: {
          cep: form.cep,
          street: form.street,
          number: form.number,
          complement: form.complement || undefined,
          neighborhood: form.neighborhood,
          city: form.city,
          state: form.state,
        },
      });
      setUserId(result.userId);
      setStep(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold" style={{ color: '#F05A28' }}>ObraJá</h1>
          <p className="text-sm text-gray-500 mt-1">Cadastro de Fornecedor</p>
          <p className="text-sm text-gray-400 mt-1">
            Já tem conta?{' '}
            <Link href="/login" className="font-semibold" style={{ color: '#F05A28' }}>
              Entrar
            </Link>
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center mb-8 px-2">
          {STEPS.map((label, i) => {
            const s = (i + 1) as Step;
            const done = step > s;
            const active = step === s;
            return (
              <div key={s} className="flex-1 flex items-center">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{
                      backgroundColor: done ? '#16A34A' : active ? '#F05A28' : '#D1D5DB',
                    }}
                  >
                    {done ? '✓' : s}
                  </div>
                  <span className="text-xs mt-1 text-gray-500 whitespace-nowrap">{label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className="flex-1 h-0.5 mx-2"
                    style={{ backgroundColor: done ? '#16A34A' : '#E5E7EB' }}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
          {error && (
            <p className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          {/* Etapa 1 — Tipo */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Que tipo de empresa você representa?</h2>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { value: 'SUPPLIER_STORE' as const, icon: '🏪', label: 'Loja de Materiais', desc: 'Venda para construtoras e consumidores finais' },
                  { value: 'SUPPLIER_FACTORY' as const, icon: '🏭', label: 'Fábrica / Indústria', desc: 'Atacado para revendedores e construtoras' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => set('role', opt.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      form.role === opt.value
                        ? 'border-orange-400 bg-orange-50'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="text-3xl mb-2">{opt.icon}</div>
                    <p className="font-semibold text-sm text-gray-900">{opt.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
              <button
                onClick={nextStep}
                className="w-full py-2.5 rounded-lg font-semibold text-white text-sm"
                style={{ backgroundColor: '#F05A28' }}
              >
                Continuar →
              </button>
            </div>
          )}

          {/* Etapa 2 — Dados empresa */}
          {step === 2 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Dados da empresa</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Razão Social *</label>
                  <input value={form.companyName} onChange={(e) => set('companyName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    placeholder="Empresa LTDA" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nome Fantasia</label>
                  <input value={form.tradeName} onChange={(e) => set('tradeName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    placeholder="Opcional" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">CNPJ *</label>
                    <input value={form.cnpj} onChange={(e) => set('cnpj', maskCnpj(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                      placeholder="00.000.000/0001-00" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Inscrição Estadual</label>
                    <input value={form.ie} onChange={(e) => set('ie', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                      placeholder="Opcional" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Telefone *</label>
                  <input value={form.phone} onChange={(e) => set('phone', maskPhone(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    placeholder="(00) 00000-0000" />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-lg text-sm border border-gray-200 text-gray-600">← Voltar</button>
                <button onClick={nextStep} className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: '#F05A28' }}>Continuar →</button>
              </div>
            </div>
          )}

          {/* Etapa 3 — Endereço */}
          {step === 3 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Endereço da empresa</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">CEP *</label>
                  <input value={form.cep}
                    onChange={(e) => set('cep', maskCep(e.target.value))}
                    onBlur={handleCepBlur}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    placeholder="00000-000" />
                  {cepLoading && <p className="text-xs text-orange-500 mt-1">Buscando CEP...</p>}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Rua *</label>
                    <input value={form.street} onChange={(e) => set('street', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Número *</label>
                    <input value={form.number} onChange={(e) => set('number', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Complemento</label>
                    <input value={form.complement} onChange={(e) => set('complement', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                      placeholder="Sala, andar..." />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Bairro</label>
                    <input value={form.neighborhood} onChange={(e) => set('neighborhood', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Cidade *</label>
                    <input value={form.city} onChange={(e) => set('city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">UF *</label>
                    <input value={form.state} onChange={(e) => set('state', e.target.value.toUpperCase().slice(0, 2))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                      placeholder="CE" maxLength={2} />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setStep(2)} className="flex-1 py-2.5 rounded-lg text-sm border border-gray-200 text-gray-600">← Voltar</button>
                <button onClick={nextStep} className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: '#F05A28' }}>Continuar →</button>
              </div>
            </div>
          )}

          {/* Etapa 4 — Acesso */}
          {step === 4 && (
            <form onSubmit={handleSubmit}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Dados de acesso</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">E-mail *</label>
                  <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    placeholder="contato@empresa.com" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Senha *</label>
                  <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    placeholder="Mínimo 8 caracteres" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Confirmar senha *</label>
                  <input type="password" value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    placeholder="••••••••" />
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Ao criar uma conta, você concorda com os{' '}
                  <a href="#" className="underline">Termos de Uso</a> e{' '}
                  <a href="#" className="underline">Política de Privacidade</a> da ObraJá.
                </p>
              </div>
              <div className="flex gap-3 mt-5">
                <button type="button" onClick={() => setStep(3)} className="flex-1 py-2.5 rounded-lg text-sm border border-gray-200 text-gray-600">← Voltar</button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: '#F05A28' }}>
                  {loading ? 'Processando...' : 'Continuar →'}
                </button>
              </div>
            </form>
          )}

          {/* Etapa 5 — Documentos */}
          {step === 5 && userId && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Documentos</h2>
              <p className="text-xs text-gray-400 mb-4">
                Envie os documentos da empresa para análise. Formatos aceitos: PDF, JPG, PNG (máx. 10 MB).
              </p>
              <div className="space-y-3">
                {DOC_CONFIG.map(({ type, label, required }) => {
                  const status = uploads[type];
                  return (
                    <div key={type} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {label}
                          {required && <span className="text-red-400 ml-1">*</span>}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {status === 'done' ? '✓ Enviado' : status === 'error' ? '✗ Erro — tente novamente' : status === 'uploading' ? 'Enviando...' : 'Não enviado'}
                        </p>
                      </div>
                      <label className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        status === 'done'
                          ? 'border-green-200 text-green-700 bg-green-50'
                          : status === 'uploading'
                          ? 'border-gray-200 text-gray-400 pointer-events-none'
                          : 'border-orange-200 text-orange-600 hover:bg-orange-50'
                      }`}>
                        {status === 'done' ? 'Trocar' : status === 'uploading' ? '...' : 'Escolher'}
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          className="hidden"
                          disabled={status === 'uploading'}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploads((prev) => ({ ...prev, [type]: 'uploading' }));
                            try {
                              const fd = new FormData();
                              fd.append('file', file);
                              const res = await fetch(
                                `${API_BASE}/documents/pending/${userId}?type=${type}`,
                                { method: 'POST', body: fd },
                              );
                              if (!res.ok) {
                                const body = await res.json().catch(() => ({})) as { message?: string };
                                throw new Error(body.message ?? 'Erro ao enviar');
                              }
                              setUploads((prev) => ({ ...prev, [type]: 'done' }));
                            } catch (err) {
                              setUploads((prev) => ({ ...prev, [type]: 'error' }));
                              setError(err instanceof Error ? err.message : 'Erro ao enviar documento');
                            }
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 mt-3">
                * Obrigatórios. Você pode enviar a Inscrição Estadual depois.
              </p>
              <button
                onClick={() => router.push('/pendente')}
                disabled={uploads.CONTRATO_SOCIAL !== 'done' || uploads.CNPJ !== 'done'}
                className="w-full mt-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: '#F05A28' }}
              >
                Concluir cadastro
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
