'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Step = 1 | 2 | 3 | 4;
type UploadStatus = 'idle' | 'uploading' | 'done' | 'error';

interface FormData {
  firstName: string; lastName: string; cpf: string;
  email: string; phone: string; password: string; confirmPassword: string;
  vehicleType: string; vehiclePlate: string; vehicleBrand: string;
  vehicleModel: string; vehicleYear: string; vehicleColor: string;
}

const INITIAL: FormData = {
  firstName: '', lastName: '', cpf: '', email: '', phone: '',
  password: '', confirmPassword: '',
  vehicleType: 'MOTO', vehiclePlate: '', vehicleBrand: '',
  vehicleModel: '', vehicleYear: '', vehicleColor: '',
};

const STEPS = ['Dados pessoais', 'Veículo', 'Acesso', 'Documentos'];
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

const VEHICLE_TYPES = [
  { value: 'MOTO', label: 'Moto' },
  { value: 'CARRO', label: 'Carro' },
  { value: 'VAN', label: 'Van' },
  { value: 'CAMINHONETE', label: 'Caminhonete' },
  { value: 'CAMINHAO', label: 'Caminhão' },
];

const DOC_CONFIG = [
  { type: 'CNH_FRENTE', label: 'CNH (Frente)', required: true },
  { type: 'CNH_VERSO', label: 'CNH (Verso)', required: true },
  { type: 'CRLV', label: 'CRLV do Veículo', required: true },
  { type: 'SELFIE_DOCUMENTO', label: 'Selfie com Documento', required: true },
] as const;

function maskCpf(v: string) {
  return v.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4').slice(0, 14);
}
function maskPhone(v: string) {
  return v.replace(/\D/g, '').replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3').slice(0, 15);
}
function maskPlate(v: string) {
  return v.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 7);
}

const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300';
const labelCls = 'block text-xs font-medium text-gray-600 mb-1';

export default function CadastroEntregadorPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [uploads, setUploads] = useState<Record<string, UploadStatus>>({
    CNH_FRENTE: 'idle', CNH_VERSO: 'idle', CRLV: 'idle', SELFIE_DOCUMENTO: 'idle',
  });

  function set(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate(s: Step): string | null {
    if (s === 1) {
      if (!form.firstName || !form.lastName) return 'Nome obrigatório';
      if (form.cpf.replace(/\D/g, '').length !== 11) return 'CPF inválido';
      if (!form.email) return 'E-mail obrigatório';
      if (!form.phone) return 'Telefone obrigatório';
    }
    if (s === 2) {
      if (!form.vehicleType) return 'Tipo de veículo obrigatório';
      if (form.vehiclePlate.length !== 7) return 'Placa inválida (7 caracteres)';
      if (!form.vehicleBrand || !form.vehicleModel) return 'Marca e modelo obrigatórios';
    }
    return null;
  }

  function nextStep() {
    setError('');
    const msg = validate(step as 1 | 2);
    if (msg) { setError(msg); return; }
    setStep((s) => (s + 1) as Step);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('As senhas não conferem'); return; }
    if (form.password.length < 8) { setError('Senha deve ter ao menos 8 caracteres'); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/delivery/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          cpf: form.cpf,
          email: form.email,
          phone: form.phone,
          password: form.password,
          vehicleType: form.vehicleType,
          vehiclePlate: form.vehiclePlate,
          vehicleBrand: form.vehicleBrand,
          vehicleModel: form.vehicleModel,
          vehicleYear: form.vehicleYear ? Number(form.vehicleYear) : undefined,
          vehicleColor: form.vehicleColor || undefined,
        }),
      });
      const body = await res.json() as { success?: boolean; data?: { userId: string }; message?: string };
      if (!res.ok) throw new Error(body.message ?? 'Erro ao cadastrar');
      setUserId(body.data?.userId ?? null);
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  }

  const allRequiredUploaded = DOC_CONFIG.filter((d) => d.required).every(
    (d) => uploads[d.type] === 'done',
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold" style={{ color: '#E8622C' }}>ObraJá</Link>
          <p className="text-sm text-gray-500 mt-1">Cadastro de Entregador</p>
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
                    style={{ backgroundColor: done ? '#16A34A' : active ? '#E8622C' : '#D1D5DB' }}
                  >
                    {done ? '✓' : s}
                  </div>
                  <span className="text-xs mt-1 text-gray-500 whitespace-nowrap">{label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 mx-2" style={{ backgroundColor: done ? '#16A34A' : '#E5E7EB' }} />
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
          {error && <p className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          {/* Step 1 — Dados pessoais */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Dados pessoais</h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Nome *</label>
                    <input value={form.firstName} onChange={(e) => set('firstName', e.target.value)} className={inputCls} placeholder="João" />
                  </div>
                  <div>
                    <label className={labelCls}>Sobrenome *</label>
                    <input value={form.lastName} onChange={(e) => set('lastName', e.target.value)} className={inputCls} placeholder="Silva" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>CPF *</label>
                  <input value={form.cpf} onChange={(e) => set('cpf', maskCpf(e.target.value))} className={inputCls} placeholder="000.000.000-00" />
                </div>
                <div>
                  <label className={labelCls}>E-mail *</label>
                  <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputCls} placeholder="voce@email.com" />
                </div>
                <div>
                  <label className={labelCls}>Telefone *</label>
                  <input value={form.phone} onChange={(e) => set('phone', maskPhone(e.target.value))} className={inputCls} placeholder="(00) 99999-9999" />
                </div>
              </div>
              <button onClick={nextStep} className="w-full mt-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: '#E8622C' }}>
                Continuar →
              </button>
            </div>
          )}

          {/* Step 2 — Veículo */}
          {step === 2 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Dados do veículo</h2>
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Tipo de veículo *</label>
                  <select value={form.vehicleType} onChange={(e) => set('vehicleType', e.target.value)} className={inputCls}>
                    {VEHICLE_TYPES.map((vt) => <option key={vt.value} value={vt.value}>{vt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Placa * (7 caracteres, ex: ABC1D23)</label>
                  <input value={form.vehiclePlate} onChange={(e) => set('vehiclePlate', maskPlate(e.target.value))} className={inputCls} placeholder="ABC1D23" maxLength={7} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Marca *</label>
                    <input value={form.vehicleBrand} onChange={(e) => set('vehicleBrand', e.target.value)} className={inputCls} placeholder="Honda" />
                  </div>
                  <div>
                    <label className={labelCls}>Modelo *</label>
                    <input value={form.vehicleModel} onChange={(e) => set('vehicleModel', e.target.value)} className={inputCls} placeholder="CG 160" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Ano</label>
                    <input type="number" value={form.vehicleYear} onChange={(e) => set('vehicleYear', e.target.value)} className={inputCls} placeholder="2022" min={1990} max={2030} />
                  </div>
                  <div>
                    <label className={labelCls}>Cor</label>
                    <input value={form.vehicleColor} onChange={(e) => set('vehicleColor', e.target.value)} className={inputCls} placeholder="Vermelho" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-lg text-sm border border-gray-200 text-gray-600">← Voltar</button>
                <button onClick={nextStep} className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: '#E8622C' }}>Continuar →</button>
              </div>
            </div>
          )}

          {/* Step 3 — Acesso */}
          {step === 3 && (
            <form onSubmit={handleSubmit}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Dados de acesso</h2>
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Senha *</label>
                  <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required className={inputCls} placeholder="Mínimo 8 caracteres" />
                </div>
                <div>
                  <label className={labelCls}>Confirmar senha *</label>
                  <input type="password" value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} required className={inputCls} placeholder="••••••••" />
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Ao criar uma conta, você concorda com os{' '}
                  <a href="#" className="underline">Termos de Uso</a> e{' '}
                  <a href="#" className="underline">Política de Privacidade</a> da ObraJá.
                </p>
              </div>
              <div className="flex gap-3 mt-5">
                <button type="button" onClick={() => setStep(2)} className="flex-1 py-2.5 rounded-lg text-sm border border-gray-200 text-gray-600">← Voltar</button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: '#E8622C' }}>
                  {loading ? 'Processando...' : 'Continuar →'}
                </button>
              </div>
            </form>
          )}

          {/* Step 4 — Documentos */}
          {step === 4 && userId && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Documentos</h2>
              <p className="text-xs text-gray-400 mb-4">
                Envie os documentos para análise. Formatos aceitos: PDF, JPG, PNG (máx. 10 MB cada).
              </p>
              <div className="space-y-3">
                {DOC_CONFIG.map(({ type, label }) => {
                  const status = uploads[type];
                  return (
                    <div key={type} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{label} <span className="text-red-400">*</span></p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {status === 'done' ? '✓ Enviado' : status === 'error' ? '✗ Erro — tente novamente' : status === 'uploading' ? 'Enviando...' : 'Não enviado'}
                        </p>
                      </div>
                      <label className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        status === 'done' ? 'border-green-200 text-green-700 bg-green-50'
                          : status === 'uploading' ? 'border-gray-200 text-gray-400 pointer-events-none'
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
                            setError('');
                            try {
                              const fd = new FormData();
                              fd.append('file', file);
                              const res = await fetch(`${API_BASE}/documents/pending/${userId}?type=${type}`, {
                                method: 'POST', body: fd,
                              });
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
                onClick={() => router.push('/cadastro-entregador/pendente')}
                disabled={!allRequiredUploaded}
                className="w-full mt-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: '#E8622C' }}
              >
                Concluir cadastro
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-gray-400 mt-5">
          Já é entregador aprovado?{' '}
          <Link href="/login" className="font-semibold" style={{ color: '#E8622C' }}>Entrar</Link>
        </p>
      </div>
    </div>
  );
}
