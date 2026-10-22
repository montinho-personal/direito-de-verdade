// Conferência dos depósitos, competência por competência: o esperado (8% da remuneração)
// contra o que a pessoa viu no extrato. Campo vazio não vale zero: "não sei" e "não houve
// depósito" são situações diferentes. Uma diferença não prova irregularidade: o depósito
// pode ter caído em outra competência, ter sido retificado ou a remuneração ser outra.
import { compararDatas, type Data } from "../trabalhista/datas.ts";
import { dividirArredondando } from "../tributos/calculo.ts";
import { type Competencia, vencimentoDoDeposito } from "./competencias.ts";
import { aliquotaDoVinculo } from "./deposito.ts";
import type { Vinculo } from "./parametros.ts";

export type SituacaoInformada = "valor" | "sem-deposito" | "nao-sei";

export type LinhaParaConferir = {
  competencia: Competencia;
  // "13º" e outras competências extras ficam em linhas próprias
  rotulo?: string;
  remuneracao: number;
  situacao: SituacaoInformada;
  // Só com situação "valor"
  informado?: number;
};

export type StatusDaLinha = "confere" | "abaixo" | "acima" | "sem-deposito" | "nao-informado" | "nao-venceu";

export type LinhaConferida = LinhaParaConferir & {
  esperado: number;
  vencimento: Data;
  diferenca: number | null;
  status: StatusDaLinha;
};

export type ResultadoDaConferencia = {
  linhas: LinhaConferida[];
  // Só das linhas conferidas (com valor informado ou "sem depósito", já vencidas)
  esperadoConferido: number;
  informadoConferido: number;
  diferenca: number;
  conferidas: number;
  divergentes: number;
  pendentes: number;
  naoVencidas: number;
  // Soma do esperado de todas as linhas, conferidas ou não
  esperadoTotal: number;
};

// Até R$ 1,00 de diferença cabe em arredondamento e em centavos de retificação
export const TOLERANCIA = 100;

export function conferirDepositos(vinculo: Vinculo, linhas: LinhaParaConferir[], hoje: Data): ResultadoDaConferencia {
  const aliquota = aliquotaDoVinculo(vinculo);
  const conferidas: LinhaConferida[] = linhas.map((l) => {
    const esperado = dividirArredondando(Math.max(0, l.remuneracao) * aliquota, 1000);
    const vencimento = vencimentoDoDeposito(l.competencia).data;
    const vencido = compararDatas(hoje, vencimento) > 0;
    const informado = l.situacao === "valor" ? (l.informado ?? 0) : l.situacao === "sem-deposito" ? 0 : null;
    let status: StatusDaLinha;
    if (informado === null) status = vencido ? "nao-informado" : "nao-venceu";
    else if (!vencido && informado === 0) status = "nao-venceu";
    else {
      const d = informado - esperado;
      status = Math.abs(d) <= TOLERANCIA ? "confere" : l.situacao === "sem-deposito" ? "sem-deposito" : d < 0 ? "abaixo" : "acima";
    }
    const conta = status !== "nao-informado" && status !== "nao-venceu";
    return { ...l, esperado, vencimento, diferenca: conta && informado !== null ? informado - esperado : null, status };
  });
  const contadas = conferidas.filter((l) => l.diferenca !== null);
  const esperadoConferido = contadas.reduce((s, l) => s + l.esperado, 0);
  const informadoConferido = contadas.reduce((s, l) => s + l.esperado + (l.diferenca ?? 0), 0);
  return {
    linhas: conferidas,
    esperadoConferido,
    informadoConferido,
    diferenca: informadoConferido - esperadoConferido,
    conferidas: contadas.length,
    divergentes: contadas.filter((l) => l.status !== "confere").length,
    pendentes: conferidas.filter((l) => l.status === "nao-informado").length,
    naoVencidas: conferidas.filter((l) => l.status === "nao-venceu").length,
    esperadoTotal: conferidas.reduce((s, l) => s + l.esperado, 0),
  };
}
