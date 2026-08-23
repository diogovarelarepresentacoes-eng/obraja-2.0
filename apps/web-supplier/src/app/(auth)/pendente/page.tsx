import Link from 'next/link';

export default function PendentePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
        <div className="text-6xl mb-5">⏳</div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Cadastro em análise
        </h1>

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
