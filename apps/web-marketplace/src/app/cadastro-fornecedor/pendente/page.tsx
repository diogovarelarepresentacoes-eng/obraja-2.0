import Link from 'next/link';

export default function CadastroFornecedorPendentePage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F5F5' }}>
      <header style={{ backgroundColor: '#111111' }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center">
          <Link href="/" className="text-2xl font-black" style={{ fontFamily: 'var(--font-montserrat)' }}>
            <span className="text-white">Obra</span>
            <span style={{ color: '#E8622C' }}>Já</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div
          className="w-full max-w-md bg-white rounded-[20px] px-8 py-10 text-center"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-6"
            style={{ backgroundColor: '#FEF9C3' }}
          >
            ⏳
          </div>
          <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'var(--font-montserrat)' }}>
            Cadastro enviado!
          </h1>
          <p className="mt-3 text-gray-500 text-sm leading-relaxed">
            Recebemos seu cadastro e ele está em análise pela equipe ObraJá.
            Você receberá um e-mail em até <strong>2 dias úteis</strong> com o resultado.
          </p>

          <div
            className="mt-6 rounded-xl px-5 py-4 text-left space-y-2"
            style={{ backgroundColor: '#F3F4F6' }}
          >
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Próximos passos</p>
            {[
              'Verificação de CNPJ e documentos',
              'Revisão do perfil pela equipe ObraJá',
              'E-mail de aprovação ou solicitação de ajustes',
              'Acesso ao painel do fornecedor',
            ].map((item, i) => (
              <div key={item} className="flex items-start gap-3">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: '#E8622C' }}
                >
                  {i + 1}
                </span>
                <p className="text-sm text-gray-600">{item}</p>
              </div>
            ))}
          </div>

          <Link
            href="/"
            className="mt-8 inline-block px-8 py-3 rounded-full font-bold text-white text-sm hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#E8622C' }}
          >
            Voltar ao início
          </Link>
        </div>
      </main>
    </div>
  );
}
