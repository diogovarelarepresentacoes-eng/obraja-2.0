'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface UserDetail {
  id: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  createdAt: string;
  supplierProfile?: {
    companyName: string;
    tradeName?: string;
    cnpj: string;
    ie?: string;
    phone: string;
    address?: {
      cep: string; street: string; number: string; complement?: string;
      neighborhood: string; city: string; state: string;
    };
  };
  contractorProfile?: {
    companyName: string; cnpj: string; ie?: string; phone: string;
    address?: { cep: string; street: string; number: string; complement?: string; city: string; state: string };
  };
  driverProfile?: {
    firstName: string; lastName: string; cpf: string; vehicleType: string;
    vehiclePlate: string; vehicleBrand: string; vehicleModel: string;
  };
  documents: { id: string; type: string; fileUrl: string; status: string }[];
}

const DOC_LABEL: Record<string, string> = {
  CONTRATO_SOCIAL: 'Contrato Social',
  CNPJ: 'Cartão CNPJ',
  INSCRICAO_ESTADUAL: 'Inscrição Estadual',
  CPF: 'CPF',
  CNH_FRENTE: 'CNH (Frente)',
  CNH_VERSO: 'CNH (Verso)',
  CRLV: 'CRLV',
  SELFIE_DOCUMENTO: 'Selfie com Documento',
  COMPROVANTE_RESIDENCIA: 'Comprovante de Residência',
};

export default function AprovacaoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<'approving' | 'rejecting' | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [creditLimit, setCreditLimit] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    api.get<UserDetail>(`/approvals/${id}`)
      .then(setUser)
      .catch(() => router.push('/aprovacoes'))
      .finally(() => setLoading(false));
  }, [id, router]);

  async function handleApprove() {
    setAction('approving');
    try {
      await api.post(`/approvals/${id}/approve`, {
        creditLimit: creditLimit ? Number(creditLimit) : undefined,
      });
      setFeedback({ type: 'success', msg: 'Cadastro aprovado com sucesso!' });
      setTimeout(() => router.push('/aprovacoes'), 1500);
    } catch (e) {
      setFeedback({ type: 'error', msg: e instanceof Error ? e.message : 'Erro ao aprovar' });
    } finally {
      setAction(null);
    }
  }

  async function handleReject() {
    if (!rejectReason.trim() || rejectReason.length < 10) return;
    setAction('rejecting');
    try {
      await api.post(`/approvals/${id}/reject`, { reason: rejectReason });
      setFeedback({ type: 'success', msg: 'Cadastro reprovado.' });
      setTimeout(() => router.push('/aprovacoes'), 1500);
    } catch (e) {
      setFeedback({ type: 'error', msg: e instanceof Error ? e.message : 'Erro ao reprovar' });
    } finally {
      setAction(null);
      setShowRejectModal(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-gray-400 text-sm">Carregando...</div>;
  }

  if (!user) return null;

  const profile = user.supplierProfile ?? user.contractorProfile;
  const address = user.supplierProfile?.address ?? user.contractorProfile?.address;
  const isContractor = user.role === 'CONTRACTOR';

  return (
    <div className="p-8 max-w-3xl">
      <button
        onClick={() => router.push('/aprovacoes')}
        className="text-sm text-gray-500 hover:text-gray-800 mb-5 flex items-center gap-1"
      >
        ← Voltar às aprovações
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {profile?.companyName ?? `${user.driverProfile?.firstName} ${user.driverProfile?.lastName}`}
      </h1>

      {feedback && (
        <div
          className={`mb-5 rounded-lg px-4 py-3 text-sm font-medium ${
            feedback.type === 'success'
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {feedback.msg}
        </div>
      )}

      {/* Dados da empresa (fornecedor ou construtora) */}
      {profile && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
            Dados da empresa
          </h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-gray-400 text-xs">CNPJ</p><p className="font-medium">{profile.cnpj ?? '—'}</p></div>
            <div><p className="text-gray-400 text-xs">Inscrição Estadual</p><p className="font-medium">{profile.ie ?? '—'}</p></div>
            <div><p className="text-gray-400 text-xs">E-mail</p><p className="font-medium">{user.email}</p></div>
            <div><p className="text-gray-400 text-xs">Telefone</p><p className="font-medium">{profile.phone ?? user.phone ?? '—'}</p></div>
            {address && (
              <div className="col-span-2">
                <p className="text-gray-400 text-xs">Endereço</p>
                <p className="font-medium">
                  {address.street}, {address.number}
                  {address.complement ? `, ${address.complement}` : ''} — {address.city}/{address.state}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dados do entregador */}
      {user.driverProfile && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
            Dados pessoais
          </h2>
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div><p className="text-gray-400 text-xs">E-mail</p><p className="font-medium">{user.email}</p></div>
            <div><p className="text-gray-400 text-xs">CPF</p><p className="font-medium">{user.driverProfile.cpf}</p></div>
            <div><p className="text-gray-400 text-xs">Telefone</p><p className="font-medium">{user.phone ?? '—'}</p></div>
          </div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
            Dados do veículo
          </h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-gray-400 text-xs">Tipo</p><p className="font-medium">{user.driverProfile.vehicleType}</p></div>
            <div><p className="text-gray-400 text-xs">Placa</p><p className="font-medium">{user.driverProfile.vehiclePlate}</p></div>
            <div><p className="text-gray-400 text-xs">Marca</p><p className="font-medium">{user.driverProfile.vehicleBrand}</p></div>
            <div><p className="text-gray-400 text-xs">Modelo</p><p className="font-medium">{user.driverProfile.vehicleModel}</p></div>
          </div>
        </div>
      )}

      {/* Documentos */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
          Documentos ({user.documents.length})
        </h2>
        {user.documents.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum documento enviado</p>
        ) : (
          <div className="space-y-2">
            {user.documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-700">{DOC_LABEL[doc.type] ?? doc.type}</span>
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium px-3 py-1 rounded-lg border border-gray-200 hover:border-orange-300 hover:text-orange-600 transition-colors"
                >
                  Visualizar
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Crédito B2B (apenas construtora) */}
      {isContractor && (
        <div className="bg-amber-50 rounded-xl border border-amber-100 p-5 mb-4">
          <h2 className="text-sm font-semibold text-amber-800 mb-2">Limite de Crédito B2B</h2>
          <p className="text-xs text-amber-700 mb-3">
            Defina o limite de crédito para compras a prazo (opcional)
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-amber-700 font-medium">R$</span>
            <input
              type="number"
              value={creditLimit}
              onChange={(e) => setCreditLimit(e.target.value)}
              placeholder="0,00"
              className="w-40 px-3 py-1.5 border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>
        </div>
      )}

      {/* Ações */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={handleApprove}
          disabled={!!action}
          className="flex-1 py-3 rounded-xl font-semibold text-white text-sm transition-opacity disabled:opacity-60"
          style={{ backgroundColor: '#16A34A' }}
        >
          {action === 'approving' ? 'Aprovando...' : '✅ Aprovar cadastro'}
        </button>

        <button
          onClick={() => setShowRejectModal(true)}
          disabled={!!action}
          className="flex-1 py-3 rounded-xl font-semibold text-sm border-2 border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
        >
          ❌ Reprovar cadastro
        </button>
      </div>

      {/* Modal de rejeição */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-bold text-gray-900 mb-1">Reprovar cadastro</h3>
            <p className="text-sm text-gray-500 mb-4">
              O solicitante receberá este motivo por e-mail.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="Ex: Documento ilegível. Por favor, reenvie o contrato social com maior resolução."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
            />
            <p className="text-xs text-gray-400 mt-1 mb-4">
              Mínimo de 10 caracteres ({rejectReason.length}/10)
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleReject}
                disabled={rejectReason.length < 10 || action === 'rejecting'}
                className="flex-1 py-2.5 rounded-lg font-semibold text-white text-sm disabled:opacity-50"
                style={{ backgroundColor: '#DC2626' }}
              >
                {action === 'rejecting' ? 'Reprovando...' : 'Confirmar reprovação'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
