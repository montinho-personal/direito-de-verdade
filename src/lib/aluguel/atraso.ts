// Aluguel atrasado: multa, correção e juros de mora do contrato.
//
// Regras (Código Civil, texto da Câmara conferido em 16/11/2026):
// - a mora começa no vencimento, sem aviso (art. 397);
// - a correção segue o índice do contrato; se ele não disser, o IPCA (art. 389, par. único);
// - os juros seguem a taxa do contrato; se ele não disser, a taxa legal (Selic menos IPCA,
//   divulgada pelo Banco Central, art. 406). A taxa legal muda todo mês e não está embutida
//   aqui: sem taxa no contrato, a calculadora não calcula juros e manda conferir no BC;
// - a multa é a do contrato; a lei do inquilinato não fixa limite, e o juiz pode reduzir a
//   multa manifestamente excessiva (art. 413).
//
// Convenções desta calculadora (explicadas na página):
// - multa sobre o valor em atraso, sem correção;
// - correção pelos meses completos de atraso, mês a mês, a partir do mês do vencimento;
//   correção negativa (deflação) vira zero;
// - juros simples sobre o valor corrigido, proporcionais aos dias: taxa ao mês × dias ÷ 30;
// - valores em centavos, arredondados a cada parcela (meio centavo para cima).
import { IGPM_VARIACAO_X100, PRIMEIRO_MES_DO_IGPM } from "./igpm.ts";
import {
  IPCA_NUMERO_INDICE_X100,
  PRIMEIRO_MES_DO_IPCA,
} from "../cobranca-indevida/ipca.ts";

export type Indice = "igpm" | "ipca" | "nenhum";

export type PedidoDeAtraso = {
  valorEmCentavos: number;
  // AAAA-MM-DD
  vencimento: string;
  pagamento: string;
  // Multa do contrato em décimos de ponto percentual: 10% = 100
  multaPorMil: number;
  // Juros do contrato ao mês, em milésimos de ponto percentual: 1% = 1000; null = o contrato não diz
  jurosAoMesPorCemMil: number | null;
  indice: Indice;
};

export type Aviso =
  | "sem-atraso"
  | "juros-pela-taxa-legal"
  | "indice-incompleto"
  | "correcao-negativa"
  | "multa-alta"
  | "juros-altos";

export type ResultadoDoAtraso = {
  diasDeAtraso: number;
  mesesCompletos: number;
  // Meses com índice usados na correção
  mesesCorrigidos: number;
  correcaoEmCentavos: number;
  multaEmCentavos: number;
  jurosEmCentavos: number | null;
  totalEmCentavos: number;
  avisos: Aviso[];
};

type Data = { ano: number; mes: number; dia: number };

function lerData(texto: string): Data | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (!m) return null;
  const [ano, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  if (data.getUTCFullYear() !== ano || data.getUTCMonth() !== mes - 1 || data.getUTCDate() !== dia) {
    return null;
  }
  return { ano, mes, dia };
}

export function dataValida(texto: string) {
  return lerData(texto) !== null;
}

const emDias = (d: Data) => Date.UTC(d.ano, d.mes - 1, d.dia) / 86_400_000;

// Meses completos entre duas datas (mesmo dia do mês; dia 31 vira o último dia do mês curto)
function mesesCompletosEntre(inicio: Data, fim: Data) {
  let meses = (fim.ano - inicio.ano) * 12 + (fim.mes - inicio.mes);
  const ultimoDiaDoMesFinal = new Date(Date.UTC(fim.ano, fim.mes, 0)).getUTCDate();
  if (fim.dia < Math.min(inicio.dia, ultimoDiaDoMesFinal)) meses -= 1;
  return Math.max(0, meses);
}

// Variação do mês (ano, mes) como fração; undefined se o índice ainda não saiu
function variacao(indice: Exclude<Indice, "nenhum">, ano: number, mes: number): number | undefined {
  if (indice === "igpm") {
    const i = (ano - PRIMEIRO_MES_DO_IGPM.ano) * 12 + (mes - PRIMEIRO_MES_DO_IGPM.mes);
    if (i < 0 || i >= IGPM_VARIACAO_X100.length) return undefined;
    return IGPM_VARIACAO_X100[i] / 10_000;
  }
  const i = (ano - PRIMEIRO_MES_DO_IPCA.ano) * 12 + (mes - PRIMEIRO_MES_DO_IPCA.mes);
  if (i < 1 || i >= IPCA_NUMERO_INDICE_X100.length) return undefined;
  return IPCA_NUMERO_INDICE_X100[i] / IPCA_NUMERO_INDICE_X100[i - 1] - 1;
}

const arredondar = (valor: number) => Math.round(valor + 1e-9);

export function calcularAtraso(pedido: PedidoDeAtraso): ResultadoDoAtraso | null {
  const vencimento = lerData(pedido.vencimento);
  const pagamento = lerData(pedido.pagamento);
  if (!vencimento || !pagamento || pedido.valorEmCentavos <= 0) return null;

  const avisos: Aviso[] = [];
  const diasDeAtraso = emDias(pagamento) - emDias(vencimento);
  if (diasDeAtraso <= 0) {
    return {
      diasDeAtraso: 0,
      mesesCompletos: 0,
      mesesCorrigidos: 0,
      correcaoEmCentavos: 0,
      multaEmCentavos: 0,
      jurosEmCentavos: 0,
      totalEmCentavos: pedido.valorEmCentavos,
      avisos: ["sem-atraso"],
    };
  }

  // Correção: um mês do índice por mês completo de atraso, a partir do mês do vencimento
  const mesesCompletos = mesesCompletosEntre(vencimento, pagamento);
  let fator = 1;
  let mesesCorrigidos = 0;
  if (pedido.indice !== "nenhum") {
    for (let k = 0; k < mesesCompletos; k++) {
      const total = vencimento.mes - 1 + k;
      const v = variacao(pedido.indice, vencimento.ano + Math.floor(total / 12), (total % 12) + 1);
      if (v === undefined) {
        avisos.push("indice-incompleto");
        break;
      }
      fator *= 1 + v;
      mesesCorrigidos += 1;
    }
  }
  if (fator < 1) {
    avisos.push("correcao-negativa");
    fator = 1;
  }
  const correcaoEmCentavos = arredondar(pedido.valorEmCentavos * (fator - 1));
  const corrigido = pedido.valorEmCentavos + correcaoEmCentavos;

  const multaEmCentavos = arredondar((pedido.valorEmCentavos * pedido.multaPorMil) / 1000);
  if (pedido.multaPorMil > 100) avisos.push("multa-alta");

  let jurosEmCentavos: number | null = null;
  if (pedido.jurosAoMesPorCemMil === null) {
    avisos.push("juros-pela-taxa-legal");
  } else {
    jurosEmCentavos = arredondar(
      (corrigido * pedido.jurosAoMesPorCemMil * diasDeAtraso) / (100_000 * 30),
    );
    if (pedido.jurosAoMesPorCemMil > 1000) avisos.push("juros-altos");
  }

  return {
    diasDeAtraso,
    mesesCompletos,
    mesesCorrigidos,
    correcaoEmCentavos,
    multaEmCentavos,
    jurosEmCentavos,
    totalEmCentavos: corrigido + multaEmCentavos + (jurosEmCentavos ?? 0),
    avisos,
  };
}
