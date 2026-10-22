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
// - Períodos (com a data de admissão): aquisitivo de 12 meses (art. 130), concessivo nos
//   12 meses seguintes (art. 134), pedido do abono até 15 dias antes do fim do aquisitivo
//   (art. 143, § 1º). Férias individuais antes de completar o 1º período: não (só as
//   coletivas, art. 140). Dias gozados depois do concessivo: remuneração em dobro (art.
//   137; Súmula 81 do TST), com o 1/3 (Súmula 328). A dobra fica à parte e fora do
//   líquido, porque o imposto sobre ela não está conferido em fonte oficial (sem INSS:
//   Lei 8.212, art. 28, § 9º, "d")
// - Início nos 2 dias antes do repouso semanal ou de feriado: vedado (art. 134, § 3º);
//   a calculadora avisa quando cai na sexta ou no sábado, para quem folga no domingo
import {
  calcularInss,
  calcularIrrf,
  type DetalheDoInss,
  type DetalheDoIrrf,
  dividirArredondando,
} from "../tributos/calculo.ts";
import { compararDatas, type Data, lerData, numeroDoDia, somarDias, somarMeses } from "./datas.ts";

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
  // Admissão (AAAA-MM-DD), para os períodos aquisitivo e concessivo
  admissao?: string;
  // Número do período aquisitivo a que as férias se referem (1 = primeiro ano);
  // sem ele, o último período completo antes do início
  periodo?: number;
};

export type PeriodoDeFerias = {
  numero: number;
  // Período aquisitivo: 12 meses de contrato
  inicio: Data;
  fim: Data;
  // Último dia para a empresa conceder as férias desse período (art. 134)
  concederAte: Data;
  // Último dia para pedir a venda de 1/3 (art. 143, § 1º)
  pedirAbonoAte: Data;
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
  // Período a que as férias se referem (quando a admissão é informada)
  periodo: PeriodoDeFerias | null;
  // Dias gozados depois do prazo de concessão: a empresa deve a remuneração desses dias
  // em dobro (art. 137; Súmula 81). Valor a mais (dias + 1/3), fora do bruto e do líquido
  diasForaDoPrazo: number;
  dobra: number;
  // Início na sexta ou no sábado: vedado para quem tem o repouso no domingo (art. 134, § 3º)
  inicioAntesDoDomingo: boolean;
};

export type ErroDasFerias = { ok: false; erros: { campo: string; mensagem: string }[] };

// Período aquisitivo número n, contado da admissão
export function periodoAquisitivo(admissao: Data, numero: number): PeriodoDeFerias {
  const inicio = somarMeses(admissao, 12 * (numero - 1));
  const fim = somarDias(somarMeses(admissao, 12 * numero), -1);
  return {
    numero,
    inicio,
    fim,
    concederAte: somarDias(somarMeses(admissao, 12 * (numero + 1)), -1),
    pedirAbonoAte: somarDias(fim, -15),
  };
}

// Períodos aquisitivos já completos numa data (o último dia do período conta)
export function periodosCompletos(admissao: Data, data: Data): PeriodoDeFerias[] {
  const lista: PeriodoDeFerias[] = [];
  for (let n = 1; n <= 80; n++) {
    const p = periodoAquisitivo(admissao, n);
    if (compararDatas(p.fim, data) >= 0) break;
    lista.push(p);
  }
  return lista;
}

// 0 = domingo ... 6 = sábado (1/1/1970 foi uma quinta)
export function diaDaSemana(data: Data) {
  return (((numeroDoDia(data) + 4) % 7) + 7) % 7;
}

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
  let admissao: Data | null = null;
  if (entrada.admissao) {
    admissao = lerData(entrada.admissao);
    if (!admissao) erros.push({ campo: "admissao", mensagem: "Informe uma data válida." });
  }
  let periodo: PeriodoDeFerias | null = null;
  if (admissao && inicio) {
    const completos = periodosCompletos(admissao, inicio);
    if (!completos.length) {
      erros.push({
        campo: "inicio",
        mensagem: "As férias só podem começar depois de 12 meses de empresa (antes disso, só nas férias coletivas).",
      });
    } else if (entrada.periodo !== undefined) {
      const n = Math.floor(entrada.periodo);
      if (n < 1 || n > completos.length) {
        erros.push({ campo: "periodo", mensagem: "Esse período ainda não estava completo na data de início." });
      } else periodo = completos[n - 1];
    } else periodo = completos[completos.length - 1];
  } else if (admissao && entrada.periodo !== undefined) {
    periodo = periodoAquisitivo(admissao, Math.max(1, Math.floor(entrada.periodo)));
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
  // Dias de descanso que caem depois do último dia do prazo de concessão
  const diasForaDoPrazo =
    periodo && inicio
      ? Math.max(0, Math.min(diasDeDescanso, numeroDoDia(inicio) + diasDeDescanso - 1 - numeroDoDia(periodo.concederAte)))
      : 0;
  const valorDosDiasFora = dividirArredondando(remuneracao * diasForaDoPrazo, 30);
  const dobra = valorDosDiasFora + dividirArredondando(valorDosDiasFora, 3);
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
    periodo,
    diasForaDoPrazo,
    dobra,
    inicioAntesDoDomingo: inicio ? [5, 6].includes(diaDaSemana(inicio)) : false,
  };
}

// Vale mais tirar todos os dias ou vender 1/3? Os dois cenários no mesmo período de
// descanso de direito (30 dias, se não houve faltas), com os dias vendidos trabalhados
// e pagos como salário na folha do mês.
export type ComparacaoDaVenda = {
  integral: ResultadoDasFerias;
  vendendo: ResultadoDasFerias;
  // Salário bruto dos dias vendidos, que são trabalhados (pago na folha, com os
  // descontos do mês)
  salarioDosDiasTrabalhados: number;
  // Bruto no período: férias + 1/3 (integral) contra férias + 1/3 + abono + 1/3 do
  // abono + salário dos dias trabalhados (vendendo)
  brutoIntegral: number;
  brutoVendendo: number;
  diferencaBruta: number;
};

export function compararVenda(entrada: EntradaDasFerias): ComparacaoDaVenda | null {
  const base = { ...entrada, diasDeDescanso: undefined };
  const integral = calcularFerias({ ...base, diasVendidos: 0 });
  if (!integral.ok) return null;
  const maximo = Math.floor(integral.diasDeDireito / 3);
  if (!maximo) return null;
  const vendendo = calcularFerias({ ...base, diasVendidos: maximo });
  if (!vendendo.ok) return null;
  const salarioDosDiasTrabalhados = dividirArredondando(vendendo.remuneracao * maximo, 30);
  const brutoIntegral = integral.ferias + integral.tercoDasFerias;
  const brutoVendendo =
    vendendo.ferias + vendendo.tercoDasFerias + vendendo.ganhoDaVenda + salarioDosDiasTrabalhados;
  return {
    integral,
    vendendo,
    salarioDosDiasTrabalhados,
    brutoIntegral,
    brutoVendendo,
    diferencaBruta: brutoVendendo - brutoIntegral,
  };
}
