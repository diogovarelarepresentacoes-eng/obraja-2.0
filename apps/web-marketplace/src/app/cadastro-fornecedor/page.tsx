'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Step = 1 | 2 | 3 | 4 | 5 | 6;
type UploadStatus = 'idle' | 'uploading' | 'done' | 'error';

interface FormData {
  supplierType: 'SUPPLIER_STORE' | 'SUPPLIER_FACTORY';
  companyName: string; tradeName: string; cnpj: string; stateRegistration: string;
  email: string; phone: string;
  cep: string; street: string; number: string; complement: string; neighborhood: string; city: string; state: string;
  password: string; confirmPassword: string;
}

const INITIAL: FormData = {
  supplierType: 'SUPPLIER_STORE',
  companyName: '', tradeName: '', cnpj: '', stateRegistration: '',
  email: '', phone: '',
  cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '',
  password: '', confirmPassword: '',
};

const STEPS = ['Tipo', 'Empresa', 'Contato', 'Endereço', 'Acesso', 'Documentos'];
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

const DOC_CONFIG = [
  { type: 'CONTRATO_SOCIAL', label: 'Contrato Social', required: true },
  { type: 'CARTAO_CNPJ',     label: 'Cartão CNPJ',    required: true },
  { type: 'COMPROVANTE_IE',  label: 'Comprovante de IE', required: false },
] as const;

type DocType = typeof DOC_CONFIG[number]['type'];

function maskCnpj(v: string) {
  return v.replace(/\D/g, '').replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5').slice(0, 18);
}
function maskPhone(v: string) {
  return v.replace(/\D/g, '').replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3').slice(0, 15);
}
function maskCep(v: string) {
  return v.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2').slice(0, 9);
}

const inputCls =
  'w-full px-4 py-3 rounded-xl text-sm text-gray-900 placeholder-gray-400 bg-gray-50 border border-transparent focus:outline-none focus:ring-2 focus:ring-orange-400 transition';
const labelCls = 'block text-xs font-medium text-gray-600 mb-1.5';
const btnBack = 'flex-1 py-3 rounded-xl text-sm border border-gray-200 text-gray-600 hover:bg-gray-50';
const btnNext = 'flex-1 py-3 rounded-xl font-bold text-white text-sm hover:opacity-90 transition-opacity';

export default function CadastroFornecedorPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingCep, setFetchingCep] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [uploads, setUploads] = useState<Record<DocType, UploadStatus>>({
    CONTRATO_SOCIAL: 'idle', CARTAO_CNPJ: 'idle', COMPROVANTE_IE: 'idle',
  });

  function set<K extends keyof FormData>(field: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function lookupCep(cep: string) {
    const raw = cep.replace(/\D/g, '');
    if (raw.length !== 8) return;
    setFetchingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
      if (!res.ok) return;
      const data = await res.json() as { logradouro?: string; bairro?: string; localidade?: string; uf?: string; erro?: boolean };
      if (data.erro) return;
      setForm((prev) => ({
        ...prev,
        street: data.logradouro ?? prev.street,
        neighborhood: data.bairro ?? prev.neighborhood,
        city: data.localidade ?? prev.city,
        state: data.uf ?? prev.state,
      }));
    } catch { /* ignore */ } finally { setFetchingCep(false); }
  }

  function validate(s: Step): string | null {
    if (s === 2) {
      if (!form.companyName.trim()) return 'Razão social obrigatória';
      if (form.cnpj.replace(/\D/g, '').length !== 14) return 'CNPJ inválido (14 dígitos)';
    }
    if (s === 3) {
      if (!form.email.trim() || !form.email.includes('@')) return 'E-mail inválido';
      if (!form.phone.trim()) return 'Telefone obrigatório';
    }
    if (s === 4) {
      if (form.cep.replace(/\D/g, '').length !== 8) return 'CEP inválido';
      if (!form.street.trim()) return 'Rua obrigatória';
      if (!form.number.trim()) return 'Número obrigatório';
      if (!form.city.trim() || !form.state.trim()) return 'Cidade e estado obrigatórios';
    }
    return null;
  }

  function nextStep() {
    setError('');
    const msg = validate(step);
    if (msg) { setError(msg); return; }
    setStep((s) => (s < 6 ? (s + 1) as Step : s));
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) { setError('Senha deve ter ao menos 8 caracteres'); return; }
    if (form.password !== form.confirmPassword) { setError('As senhas não coincidem'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/suppliers/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
          role: form.supplierType,
          companyName: form.companyName.trim(),
          tradeName: form.tradeName.trim() || undefined,
          cnpj: form.cnpj.replace(/\D/g, ''),
          ie: form.stateRegistration.trim() || undefined,
          phone: form.phone.trim(),
          address: {
            cep: form.cep.replace(/\D/g, ''), street: form.street.trim(), number: form.number.trim(),
            complement: form.complement.trim() || undefined, neighborhood: form.neighborhood.trim(),
            city: form.city.trim(), state: form.state.trim(),
          },
        }),
      });
      const body = await res.json() as { userId?: string; message?: string };
      if (!res.ok) { setError(body?.message ?? 'Erro ao criar conta'); return; }
      setUserId(body.userId ?? null);
      setStep(6);
    } catch { setError('Erro de conexão. Tente novamente.'); }
    finally { setLoading(false); }
  }

  const allRequiredUploaded = DOC_CONFIG.filter((d) => d.required).every((d) => uploads[d.type] === 'done');

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F5F5' }}>
      <header style={{ backgroundColor: '#111111' }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center">
          <Link href="/" className="text-2xl font-black" style={{ fontFamily: 'var(--font-montserrat)' }}>
            <span className="text-white">Obra</span><span style={{ color: '#E8622C' }}>Já</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'var(--font-montserrat)' }}>
              Cadastro de Fornecedor
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Já tem conta?{' '}
              <Link href="/login" className="font-semibold hover:underline" style={{ color: '#E8622C' }}>Entrar</Link>
            </p>
          </div>

          {/* Progress */}
          <div className="flex items-center mb-8 px-1">
            {STEPS.map((label, i) => {
              const s = (i + 1) as Step;
              const done = step > s;
              const active = step === s;
              return (
                <div key={s} className="flex-1 flex items-center">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                      style={{ backgroundColor: done ? '#16A34A' : active ? '#E8622C' : '#D1D5DB' }}>
                      {done ? '✓' : s}
                    </div>
                    <span className="text-xs mt-1 text-gray-500 whitespace-nowrap hidden sm:block">{label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 h-0.5 mx-1" style={{ backgroundColor: done ? '#16A34A' : '#E5E7EB' }} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-[20px] p-8" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            {error && <p className="mb-5 px-4 py-3 rounded-xl text-sm font-medium bg-red-50 text-red-600">{error}</p>}

            {/* Step 1 — Tipo */}
            {step === 1 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Tipo de fornecedor</h2>
                <p className="text-sm text-gray-500 mb-6">Selecione o modelo do seu negócio</p>
                <div className="space-y-4">
                  {([
                    { value: 'SUPPLIER_STORE' as const, title: 'Loja de materiais', desc: 'Revenda produtos de diferentes marcas ao consumidor final ou empresas.', icon: '🏪' },
                    { value: 'SUPPLIER_FACTORY' as const, title: 'Fábrica / Indústria', desc: 'Venda produtos de fabricação própria com tabela B2B e MOQ.', icon: '🏭' },
                  ]).map(({ value, title, desc, icon }) => (
                    <button key={value} type="button" onClick={() => set('supplierType', value)}
                      className="w-full flex items-start gap-4 p-5 rounded-[16px] border-2 text-left transition-all"
                      style={{ borderColor: form.supplierType === value ? '#E8622C' : '#E5E7EB', backgroundColor: form.supplierType === value ? '#FFF7F4' : '#fff' }}>
                      <span className="text-3xl">{icon}</span>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <button onClick={nextStep} className={`w-full mt-6 ${btnNext}`} style={{ backgroundColor: '#E8622C' }}>
                  Continuar →
                </button>
              </div>
            )}

            {/* Step 2 — Empresa */}
            {step === 2 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-5">Dados da empresa</h2>
                <div className="space-y-4">
                  <div><label className={labelCls}>Razão social *</label>
                    <input value={form.companyName} onChange={(e) => set('companyName', e.target.value)} className={inputCls} placeholder="Nome Comércio Ltda." /></div>
                  <div><label className={labelCls}>Nome fantasia</label>
                    <input value={form.tradeName} onChange={(e) => set('tradeName', e.target.value)} className={inputCls} placeholder="Como é conhecido no mercado" /></div>
                  <div><label className={labelCls}>CNPJ *</label>
                    <input value={form.cnpj} onChange={(e) => set('cnpj', maskCnpj(e.target.value))} className={inputCls} placeholder="00.000.000/0000-00" /></div>
                  <div><label className={labelCls}>Inscrição Estadual</label>
                    <input value={form.stateRegistration} onChange={(e) => set('stateRegistration', e.target.value)} className={inputCls} placeholder="Opcional" /></div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setStep(1)} className={btnBack}>← Voltar</button>
                  <button onClick={nextStep} className={btnNext} style={{ backgroundColor: '#E8622C' }}>Continuar →</button>
                </div>
              </div>
            )}

            {/* Step 3 — Contato */}
            {step === 3 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-5">Dados de contato</h2>
                <div className="space-y-4">
                  <div><label className={labelCls}>E-mail *</label>
                    <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputCls} placeholder="contato@empresa.com.br" /></div>
                  <div><label className={labelCls}>Telefone *</label>
                    <input value={form.phone} onChange={(e) => set('phone', maskPhone(e.target.value))} className={inputCls} placeholder="(11) 99999-9999" /></div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setStep(2)} className={btnBack}>← Voltar</button>
                  <button onClick={nextStep} className={btnNext} style={{ backgroundColor: '#E8622C' }}>Continuar →</button>
                </div>
              </div>
            )}

            {/* Step 4 — Endereço */}
            {step === 4 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-5">Endereço da empresa</h2>
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>CEP *</label>
                    <input value={form.cep} onChange={(e) => { const v = maskCep(e.target.value); set('cep', v); if (v.replace(/\D/g, '').length === 8) lookupCep(v); }}
                      className={inputCls} placeholder="00000-000" />
                    {fetchingCep && <p className="text-xs text-gray-400 mt-1">Buscando endereço...</p>}
                  </div>
                  <div><label className={labelCls}>Rua *</label>
                    <input value={form.street} onChange={(e) => set('street', e.target.value)} className={inputCls} placeholder="Rua / Avenida" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className={labelCls}>Número *</label>
                      <input value={form.number} onChange={(e) => set('number', e.target.value)} className={inputCls} placeholder="123" /></div>
                    <div><label className={labelCls}>Complemento</label>
                      <input value={form.complement} onChange={(e) => set('complement', e.target.value)} className={inputCls} placeholder="Sala, Galpão..." /></div>
                  </div>
                  <div><label className={labelCls}>Bairro</label>
                    <input value={form.neighborhood} onChange={(e) => set('neighborhood', e.target.value)} className={inputCls} placeholder="Bairro" /></div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2"><label className={labelCls}>Cidade *</label>
                      <input value={form.city} onChange={(e) => set('city', e.target.value)} className={inputCls} placeholder="São Paulo" /></div>
                    <div><label className={labelCls}>UF *</label>
                      <input value={form.state} onChange={(e) => set('state', e.target.value.toUpperCase().slice(0, 2))} className={inputCls} placeholder="SP" maxLength={2} /></div>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setStep(3)} className={btnBack}>← Voltar</button>
                  <button onClick={nextStep} className={btnNext} style={{ backgroundColor: '#E8622C' }}>Continuar →</button>
                </div>
              </div>
            )}

            {/* Step 5 — Acesso */}
            {step === 5 && (
              <form onSubmit={handleRegister}>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Dados de acesso</h2>
                <p className="text-sm text-gray-500 mb-5">Crie a senha para o painel do fornecedor</p>
                <div className="space-y-4">
                  <div><label className={labelCls}>Senha *</label>
                    <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required className={inputCls} placeholder="Mínimo 8 caracteres" /></div>
                  <div><label className={labelCls}>Confirmar senha *</label>
                    <input type="password" value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} required className={inputCls} placeholder="Repita a senha" /></div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Ao criar uma conta, você concorda com os{' '}
                    <a href="#" className="underline">Termos de Uso</a> e{' '}
                    <a href="#" className="underline">Política de Privacidade</a>.
                    Seu cadastro passará por análise antes da aprovação.
                  </p>
                </div>
                <div className="flex gap-3 mt-6">
                  <button type="button" onClick={() => setStep(4)} className={btnBack}>← Voltar</button>
                  <button type="submit" disabled={loading} className={`${btnNext} disabled:opacity-50`} style={{ backgroundColor: '#E8622C' }}>
                    {loading ? 'Processando...' : 'Continuar →'}
                  </button>
                </div>
              </form>
            )}

            {/* Step 6 — Documentos */}
            {step === 6 && userId && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Documentos</h2>
                <p className="text-xs text-gray-400 mb-4">
                  Envie os documentos para análise. Formatos aceitos: PDF, JPG, PNG — máx. 10 MB cada.
                </p>
                <div className="space-y-3">
                  {DOC_CONFIG.map(({ type, label, required }) => {
                    const status = uploads[type];
                    return (
                      <div key={type} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl">
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {label}{required && <span className="text-red-400 ml-0.5">*</span>}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {status === 'done' ? '✓ Enviado'
                              : status === 'error' ? '✗ Erro — tente novamente'
                              : status === 'uploading' ? 'Enviando...'
                              : required ? 'Obrigatório' : 'Opcional'}
                          </p>
                        </div>
                        <label className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                          status === 'done' ? 'border-green-200 text-green-700 bg-green-50'
                            : status === 'uploading' ? 'border-gray-200 text-gray-400 pointer-events-none'
                            : 'border-orange-200 text-orange-600 hover:bg-orange-50'
                        }`}>
                          {status === 'done' ? 'Trocar' : status === 'uploading' ? '...' : 'Escolher'}
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden"
                            disabled={status === 'uploading'}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setUploads((prev) => ({ ...prev, [type]: 'uploading' }));
                              setError('');
                              try {
                                const fd = new FormData();
                                fd.append('file', file);
                                const res = await fetch(
                                  `${API_BASE}/documents/pending/${userId}?type=${type}`,
                                  { method: 'POST', body: fd },
                                );
                                if (!res.ok) {
                                  const b = await res.json().catch(() => ({})) as { message?: string };
                                  throw new Error(b.message ?? 'Erro ao enviar');
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
                <button
                  onClick={() => router.push('/cadastro-fornecedor/pendente')}
                  disabled={!allRequiredUploaded}
                  className={`w-full mt-5 ${btnNext} disabled:opacity-50`}
                  style={{ backgroundColor: '#E8622C' }}
                >
                  Concluir cadastro
                </button>
                {!allRequiredUploaded && (
                  <p className="text-center text-xs text-gray-400 mt-2">
                    Envie todos os documentos obrigatórios para continuar
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
