// Ponto de integração para quem traz os dados da página de resultados.
//
// Hoje existe um só: o navegador supervisionado (coletor.mjs), em que uma pessoa acompanha
// cada busca. Para pesquisar em escala, o caminho é um provedor autorizado de dados de SERP
// (serviço pago que entrega os resultados por API), e não automatizar o Google sem
// supervisão. Um provedor novo implementa esta interface e devolve a mesma Coleta; o
// armazenamento, o painel, a análise e a exportação não mudam.
import type { Coleta, Dispositivo } from "./tipos.ts";

export type PedidoDeColeta = {
  palavra: string;
  dispositivo: Dispositivo;
  // Códigos do Google: hl (idioma) e gl (país)
  idioma: string;
  pais: string;
};

export interface ProvedorDeSerp {
  // Nome gravado em Coleta.provedor
  nome: string;
  // true quando há uma pessoa acompanhando cada busca
  supervisionado: boolean;
  coletar(pedido: PedidoDeColeta): Promise<Coleta>;
}

export const PEDIDO_PADRAO: Omit<PedidoDeColeta, "palavra"> = {
  dispositivo: "computador",
  idioma: "pt-BR",
  pais: "BR",
};

// Esqueleto de um provedor por API. A chave fica em variável de ambiente local
// (SEO_LAB_SERP_API_KEY, em .env.local, que o Git ignora) e nunca no código.
export function provedorPorApi(nome: string): ProvedorDeSerp {
  return {
    nome,
    supervisionado: false,
    async coletar() {
      throw new Error(
        `Provedor "${nome}" ainda não foi implementado. Escolha um provedor autorizado de dados de SERP, ` +
          "leia os termos de uso dele e converta a resposta da API para o tipo Coleta (lib/tipos.ts).",
      );
    },
  };
}
