// Motor das férias de quem tem carteira assinada e recebe por mês: o recibo pago antes
// das férias. Valores em centavos inteiros, cada etapa arredondada ao centavo (meio
// centavo para cima). Regras e fontes em docs/artigos/como-calcular-ferias.md.
// - Dias de direito pelas faltas sem justificativa (CLT, art. 130); mais de 32: sem férias
// - Remuneração da data das férias, com a média dos adicionais e variáveis (art. 142)
// - 1/3 a mais (Constituição, art. 7º, XVII)
// - Abono pecuniário: até 1/3 dos dias de direito, no valor dos dias (art. 143); sem INSS
//   (Lei 8.212, art. 28, § 9º, "e", 6) e sem imposto (Receita, Perguntas e Respostas IRPF
//   2026, pergunta 178). O 1/3 do abono paga imposto (Solução de Consulta Cosit
//   209/2021) e fica fora do INSS, como o abono
// - Imposto das férias + 1/3 em separado do salário do mês, com as deduções do mês
//   (pergunta 178); a redução da Lei 15.270 é aplicada sobre esse rendimento, com o
//   imposto sem ela mostrado à parte, porque as folhas divergem
// - Pagamento até 2 dias antes do início (art. 145)
import {
  calcularInss,
  calcularIrrf,
  type DetalheDoInss,
  type DetalheDoIrrf,
  dividirArredondando,
} from "../tributos/calculo.ts";
import { type Data, lerData, somarDias } from "./datas.ts";

export type EntradaDasFerias = {
  // Salário mensal fixo, em centavos
  salario: number;
  // Média mensal de horas extras, adicional noturno, comissões e outros adicionais
  mediaVariaveis?: number;
  // Faltas sem justificativa no período aquisitivo
  faltas?: number;
  // Dias de férias que vai tirar agora (padrão: todos os que sobram depois da venda)
  diasDeDescanso?: number;
  // Dias vendidos (abono pecuniário), até 1/3 dos dias de direito
  diasVendidos?: number;
  dependentes?: number;
  // Pensão alimentícia judicial descontada das férias (deduz do imposto)
  pensao?: number;
  // 1ª parcela do 13º junto com as férias (pedida em janeiro)
  adiantar13?: boolean;
  // Início das férias (AAAA-MM-DD), para o prazo de pagamento e a volta
  inicio?: string;
};

export type ResultadoDasFerias = {
  ok: true;
  diasDeDireito: number;
  diasDeDescanso: number;
  diasVendidos: number;
  diasQueSobram: number;
  remuneracao: number;
  mediaVariavel: number;
  ferias: number;
  tercoDasFerias: number;
  abono: number;
  tercoDoAbono: number;
  adiantamento13: number;
  baseDoInss: number;
  inss: DetalheDoInss;
  // Férias + 1/3 + 1/3 do abono
  rendimentosDoIr: number;
  irrf: DetalheDoIrrf;
  pensao: number;
  bruto: number;
  descontos: number;
  liquido: number;
  // O que a venda dos dias põe no recibo, antes do imposto sobre o 1/3 do abono
  ganhoDaVenda: number;
  datas: { inicio: Data; pagamentoAte: Data; ultimoDia: Data; volta: Data } | null;
};

export type ErroDasFerias = { ok: false; erros: { campo: string; mensagem: string }[] };

// Dias de férias pelas faltas sem justificativa no período aquisitivo (art. 130)
export function diasPelasFaltas(faltas: number) {
  if (faltas <= 5) return 30;
  if (faltas <= 14) return 24;
  if (faltas <= 23) return 18;
  if (faltas <= 32) return 12;
  return 0;
}

export function calcularFerias(entrada: EntradaDasFerias): ResultadoDasFerias | ErroDasFerias {
  const erros: ErroDasFerias["erros"] = [];
  if (!(entrada.salario > 0)) erros.push({ campo: "salario", mensagem: "Digite um salário maior que zero." });

  const faltas = Math.max(0, Math.floor(entrada.faltas ?? 0));
  const diasDeDireito = diasPelasFaltas(faltas);
  if (diasDeDireito === 0) {
    erros.push({ campo: "faltas", mensagem: "Com mais de 32 faltas sem justificativa, não há direito a férias nesse período." });
  }
  const maximoParaVender = Math.floor(diasDeDireito / 3);
  const diasVendidos = Math.max(0, Math.floor(entrada.diasVendidos ?? 0));
  if (diasVendidos > maximoParaVender) {
    erros.push({ campo: "diasVendidos", mensagem: `Dá para vender até ${maximoParaVender} dias (1/3 das férias).` });
  }
  const disponiveis = diasDeDireito - diasVendidos;
  const diasDeDescanso = Math.floor(entrada.diasDeDescanso ?? disponiveis);
  const diasQueSobram = disponiveis - diasDeDescanso;
  if (diasDeDireito && diasVendidos <= maximoParaVender) {
    if (diasDeDescanso < 5 || diasDeDescanso > disponiveis) {
      erros.push({ campo: "diasDeDescanso", mensagem: `Escolha de 5 a ${disponiveis} dias.` });
    } else if (diasQueSobram > 0 && diasQueSobram < 5) {
      erros.push({ campo: "diasDeDescanso", mensagem: `Sobrariam ${diasQueSobram} dias, e cada período precisa ter pelo menos 5.` });
    } else if (diasQueSobram > 0 && diasDeDescanso < 14 && diasQueSobram < 14) {
      erros.push({ campo: "diasDeDescanso", mensagem: "Um dos períodos precisa ter pelo menos 14 dias." });
    }
  }
  let inicio: Data | null = null;
  if (entrada.inicio) {
    inicio = lerData(entrada.inicio);
    if (!inicio) erros.push({ campo: "inicio", mensagem: "Informe uma data válida." });
  }
  if (erros.length) return { ok: false, erros };

  const mediaVariavel = Math.max(0, entrada.mediaVariaveis ?? 0);
  const remuneracao = entrada.salario + mediaVariavel;
  const ferias = dividirArredondando(remuneracao * diasDeDescanso, 30);
  const tercoDasFerias = dividirArredondando(ferias, 3);
  const abono = dividirArredondando(remuneracao * diasVendidos, 30);
  const tercoDoAbono = dividirArredondando(abono, 3);
  // 1ª parcela do 13º: metade da remuneração do mês anterior, sem descontos
  const adiantamento13 = entrada.adiantar13 ? dividirArredondando(remuneracao, 2) : 0;

  const baseDoInss = ferias + tercoDasFerias;
  const inss = calcularInss(baseDoInss);
  const rendimentosDoIr = baseDoInss + tercoDoAbono;
  const pensao = Math.max(0, entrada.pensao ?? 0);
  const irrf = calcularIrrf({
    rendimentos: rendimentosDoIr,
    previdencia: inss.total,
    dependentes: entrada.dependentes,
    pensaoAlimenticia: pensao,
  });

  const bruto = ferias + tercoDasFerias + abono + tercoDoAbono + adiantamento13;
  const descontos = inss.total + irrf.imposto + pensao;
  const datas = inicio
    ? {
        inicio,
        pagamentoAte: somarDias(inicio, -2),
        ultimoDia: somarDias(inicio, diasDeDescanso - 1),
        volta: somarDias(inicio, diasDeDescanso),
      }
    : null;

  return {
    ok: true,
    diasDeDireito,
    diasDeDescanso,
    diasVendidos,
    diasQueSobram,
    remuneracao,
    mediaVariavel,
    ferias,
    tercoDasFerias,
    abono,
    tercoDoAbono,
    adiantamento13,
    baseDoInss,
    inss,
    rendimentosDoIr,
    irrf,
    pensao,
    bruto,
    descontos,
    liquido: bruto - descontos,
    ganhoDaVenda: abono + tercoDoAbono,
    datas,
  };
}
