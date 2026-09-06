'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
const POLL_INTERVAL = 30_000; // 30 segundos

type StatusResult = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | null;

export default function PendentePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('uid');

  const [status, setStatus] = useState<StatusResult>(null);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkStatus = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE}/approvals/check/${userId}`);
      if (!res.ok) return;
      const body = await res.json() as { success: boolean; data: { status: string } };
      const s = body.data?.status as StatusResult;
      setStatus(s);
      setLastCheck(new Date());

      if (s === 'APPROVED') {
        router.push('/login?approved=1');
      }
    } catch {
      // network error — tenta novamente no próximo ciclo
    }
  }, [userId, router]);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [checkStatus]);

  const isRejected = status === 'REJECTED';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">

        {isRejected ? (
          <>
            <div className="text-6xl mb-5">❌</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Cadastro não aprovado</h1>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Nossa equipe analisou sua solicitação e não conseguiu aprovar o cadastro no momento.
              Verifique o e-mail cadastrado para mais detalhes.
            </p>
            <div className="bg-red-50 rounded-xl border border-red-100 p-4 mb-6 text-left">
              <p className="text-sm text-red-700">
                Se acredita que houve um engano, entre em contato pelo e-mail{' '}
                <strong>contato@obraja.com.br</strong>.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="text-6xl mb-5">⏳</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Cadastro em análise</h1>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Recebemos sua solicitação e estamos analisando os documentos. Nossa equipe
              entrará em contato em até <strong>48 horas úteis</strong> pelo e-mail cadastrado.
            </p>

            <div className="bg-amber-50 rounded-xl border border-amber-100 p-4 mb-6 text-left">
              <p className="text-sm font-semibold text-amber-800 mb-2">O que acontece agora?</p>
              <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
                <li>Nossa equipe verifica seus documentos</li>
                <li>Você recebe e-mail com o resultado</li>
                <li>Se aprovado, você acessa o painel para cadastrar produtos</li>
              </ol>
            </div>

            {userId && lastCheck && (
              <p className="text-xs text-gray-400 mb-4">
                Verificando automaticamente a cada 30s •{' '}
                última verificação {lastCheck.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            )}
          </>
        )}

        <Link
          href="/login"
          className="inline-block w-full py-2.5 rounded-lg text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Voltar ao login
        </Link>
      </div>
    </div>
  );
}
