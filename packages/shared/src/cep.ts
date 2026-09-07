export interface CepResult {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

export type CepError = 'not_found' | 'timeout' | 'invalid_response';

export type CepLookupResult =
  | { ok: true; data: CepResult }
  | { ok: false; error: CepError };

export const CEP_ERROR_MESSAGES: Record<CepError, string> = {
  not_found: 'CEP não encontrado.',
  timeout: 'Busca de CEP expirou. Preencha o endereço manualmente.',
  invalid_response: 'Resposta inválida do serviço de CEP.',
};

export async function fetchCepData(cep: string): Promise<CepLookupResult> {
  const raw = cep.replace(/\D/g, '');
  if (raw.length !== 8) return { ok: false, error: 'not_found' };

  try {
    const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { ok: false, error: 'not_found' };
    const ct = res.headers.get('content-type') ?? '';
    if (!ct.includes('application/json')) return { ok: false, error: 'invalid_response' };
    const d = await res.json() as {
      logradouro?: string;
      bairro?: string;
      localidade?: string;
      uf?: string;
      erro?: boolean;
    };
    if (d.erro) return { ok: false, error: 'not_found' };
    return {
      ok: true,
      data: {
        street: d.logradouro ?? '',
        neighborhood: d.bairro ?? '',
        city: d.localidade ?? '',
        state: d.uf ?? '',
      },
    };
  } catch (e) {
    if (e instanceof DOMException && e.name === 'TimeoutError') {
      return { ok: false, error: 'timeout' };
    }
    return { ok: false, error: 'not_found' };
  }
}
