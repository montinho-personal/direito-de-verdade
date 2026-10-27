// Análise da calculadora de juros abusivos: descobre a taxa do contrato, compara com a
// média do Banco Central da mesma modalidade e simula o mesmo contrato à taxa média.
// Valores em centavos, taxas como fração ao mês. Uma taxa acima da média NÃO comprova
// abusividade (STJ, Súmula 382 e Tema 27): a análise só aponta pontos para verificar.
import { reais } from "../dinheiro.ts";
import { compararDatas, formatarData, lerData } from "../trabalhista/datas.ts";
import {
  anualParaMensal,
  type Liquidacao,
  liquidacaoAntecipada,
  type LinhaDaTabela,
  MAXIMO_DE_PARCELAS,
  mensalParaAnual,
  percentual,
  tabelaPrice,
  tabelaSac,
  taxaDoSac,
  taxaImplicita,
} from "./financeiro.ts";
import {
  EH_ROTATIVO,
  type Modalidade,
  NOME_DA_MODALIDADE,
  type Referencia,
  referencia,
  SUBTIPOS,
  TETO_CHEQUE_ESPECIAL,
  TETO_DO_ROTATIVO,
} from "./modalidades.ts";

export type Sistema = "price" | "sac";

export type EntradaDeJuros = {
  modalidade: Modalidade;
  subtipo?: string;
  // Data da contratação, AAAA-MM-DD
  data: string;
  hoje: string;
  // Centavos; 0 = não informado
  valorRecebido: number;
  valorFinanciado: number;
  parcela: number;
  // 0 = não informado
  parcelas: number;
  sistema: Sistema;
  // Frações; null = não informado
  taxaMensal: number | null;
  taxaAnual: number | null;
  cetAnual: number | null;
  // Tarifas, seguros e outros encargos pagos fora das parcelas, em centavos
  encargosAParte: number;
  parcelasPagas: number;
  // Rotativo e cheque especial: saldo devedor ou valor usado, em centavos
  saldo: number;
};

export type CampoDeJuros =
  | "data"
  | "subtipo"
  | "valorRecebido"
  | "valorFinanciado"
  | "parcela"
  | "parcelas"
  | "taxaMensal"
  | "taxaAnual"
  | "cetAnual"
  | "parcelasPagas"
  | "encargosAParte"
  | "saldo";

export type ErroDeJuros = { campo: CampoDeJuros; mensagem: string };

export type OrigemDaTaxa = "mensal-informada" | "anual-informada" | "calculada-financiado" | "calculada-recebido";

export type Cenario = {
  principal: number;
  parcela: number;
  ultimaParcela: number;
  total: number;
  juros: number;
  tabela: LinhaDaTabela[];
};

export type Sinal =
  | { id: "acima-da-media"; diferencaPp: number }
  | { id: "abaixo-da-media" }
  | { id: "acima-do-teto-cheque-especial" }
  | { id: "teto-do-rotativo"; vale: boolean }
  | { id: "teto-consignado-inss" }
  | { id: "indexador-imobiliario" }
  | { id: "taxas-informadas-nao-batem"; anualDaMensal: number; nominal: boolean }
  | { id: "taxa-calculada-maior"; calculada: number }
  | { id: "encargos-financiados"; valor: number }
  | { id: "cet-maior-que-a-taxa"; cetMensal: number }
  | { id: "referencia-defasada" };

export type AnaliseDeJuros =
  | { ok: false; erros: ErroDeJuros[]; faltando: string[] }
  | {
      ok: true;
      modalidade: Modalidade;
      rotativo: boolean;
      // Taxa do contrato usada na comparação (null se não deu para saber)
      taxa: { mensal: number; anual: number; origem: OrigemDaTaxa } | null;
      // Taxa efetiva sobre o dinheiro que a pessoa recebeu (inclui encargos financiados)
      taxaSobreORecebido: { mensal: number; anual: number } | null;
      cet: { anual: number; mensal: number } | null;
      referencia: Referencia;
      comparacao: { diferencaPp: number; relativa: number } | null;
      cenarioA: Cenario | null;
      cenarioB: (Cenario & { diferencaMensal: number; diferencaTotal: number }) | null;
      custo: {
        recebido: number;
        totalDasParcelas: number;
        juros: number;
        encargosFinanciados: number;
        encargosAParte: number;
        custoTotal: number;
      } | null;
      andamento: { pagas: number; saldo: number; liquidacao: Liquidacao } | null;
      rotativo_: { saldo: number; jurosDoMes: number; jurosDoMesNaMedia: number | null } | null;
      sinais: Sinal[];
      faltando: string[];
      hipoteses: string[];
      memoria: string[];
    };

const LIMITE_MENSAL = 1; // 100% ao mês
const LIMITE_ANUAL = 100; // 10.000% ao ano

function validar(e: EntradaDeJuros) {
  const erros: ErroDeJuros[] = [];
  const hoje = lerData(e.hoje)!;
  const data = lerData(e.data);
  if (!e.data) erros.push({ campo: "data", mensagem: "Informe a data da contratação." });
  else if (!data) erros.push({ campo: "data", mensagem: "Data inválida." });
  else if (data.ano < 2000) erros.push({ campo: "data", mensagem: "Use uma data a partir de 2000." });
  else if (compararDatas(data, hoje) > 0) erros.push({ campo: "data", mensagem: "A data não pode ser depois de hoje." });
  const sub = SUBTIPOS[e.modalidade];
  if (sub && !sub.opcoes.some((o) => o.valor === e.subtipo)) erros.push({ campo: "subtipo", mensagem: "Escolha uma opção." });
  for (const campo of ["valorRecebido", "valorFinanciado", "parcela", "saldo", "encargosAParte"] as const)
    if (!Number.isInteger(e[campo]) || e[campo] < 0) erros.push({ campo, mensagem: "Valor inválido." });
  if (!Number.isInteger(e.parcelas) || e.parcelas < 0 || e.parcelas > MAXIMO_DE_PARCELAS)
    erros.push({ campo: "parcelas", mensagem: `Use de 1 a ${MAXIMO_DE_PARCELAS} parcelas.` });
  if (e.taxaMensal !== null && !(e.taxaMensal > 0 && e.taxaMensal <= LIMITE_MENSAL))
    erros.push({ campo: "taxaMensal", mensagem: "Use uma taxa entre 0,01% e 100% ao mês." });
  if (e.taxaAnual !== null && !(e.taxaAnual > 0 && e.taxaAnual <= LIMITE_ANUAL))
    erros.push({ campo: "taxaAnual", mensagem: "Use uma taxa entre 0,01% e 10.000% ao ano." });
  if (e.cetAnual !== null && !(e.cetAnual > 0 && e.cetAnual <= LIMITE_ANUAL))
    erros.push({ campo: "cetAnual", mensagem: "Use um CET entre 0,01% e 10.000% ao ano." });
  if (!Number.isInteger(e.parcelasPagas) || e.parcelasPagas < 0 || (e.parcelas > 0 && e.parcelasPagas > e.parcelas))
    erros.push({ campo: "parcelasPagas", mensagem: "As parcelas pagas não podem passar do total." });
  if (e.valorRecebido > 0 && e.valorFinanciado > 0 && e.valorRecebido > e.valorFinanciado)
    erros.push({ campo: "valorRecebido", mensagem: "O valor recebido não pode ser maior que o financiado." });
  return { erros, data };
}

const nomeDoMes = (m: { ano: number; mes: number }) =>
  `${["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"][m.mes - 1]}/${m.ano}`;

function cenario(principal: number, taxa: number, n: number, sistema: Sistema): Cenario {
  const tabela = sistema === "sac" ? tabelaSac(principal, taxa, n) : tabelaPrice(principal, taxa, n);
  const total = tabela.reduce((s, l) => s + l.parcela, 0);
  return { principal, parcela: tabela[0].parcela, ultimaParcela: tabela.at(-1)!.parcela, total, juros: total - principal, tabela };
}

export function analisarJuros(e: EntradaDeJuros): AnaliseDeJuros {
  const { erros, data } = validar(e);
  if (erros.length > 0 || !data) return { ok: false, erros, faltando: [] };

  const rotativo = EH_ROTATIVO[e.modalidade];
  const ref = referencia(e.modalidade, e.subtipo, data);
  const memoria: string[] = [];
  const hipoteses: string[] = [];
  const faltando: string[] = [];
  const sinais: Sinal[] = [];

  // ---------- rotativo e cheque especial: só a taxa do mês ----------
  if (rotativo) {
    const mensal = e.taxaMensal ?? (e.taxaAnual !== null ? anualParaMensal(e.taxaAnual) : null);
    if (mensal === null)
      return {
        ok: false,
        erros: [{ campo: "taxaMensal", mensagem: "Informe a taxa de juros (está na fatura ou no extrato)." }],
        faltando: ["a taxa de juros do mês, que aparece na fatura do cartão ou no extrato da conta"],
      };
    const origem: OrigemDaTaxa = e.taxaMensal !== null ? "mensal-informada" : "anual-informada";
    memoria.push(`Taxa ${origem === "mensal-informada" ? "informada" : "anual informada, convertida"}: ${percentual(mensal)} ao mês = ${percentual(mensalParaAnual(mensal))} ao ano (juros compostos).`);
    if (e.modalidade === "cheque-especial" && compararDatas(data, TETO_CHEQUE_ESPECIAL.desde) >= 0 && mensal > TETO_CHEQUE_ESPECIAL.taxaMensal + 1e-9)
      sinais.push({ id: "acima-do-teto-cheque-especial" });
    if (e.modalidade === "rotativo") sinais.push({ id: "teto-do-rotativo", vale: compararDatas(data, TETO_DO_ROTATIVO.desde) >= 0 });
    const comparacao = ref.ok ? { diferencaPp: (mensal - ref.taxaMensal) * 100, relativa: mensal / ref.taxaMensal - 1 } : null;
    if (comparacao && ref.ok) {
      sinais.unshift(comparacao.diferencaPp > 0.005 ? { id: "acima-da-media", diferencaPp: comparacao.diferencaPp } : { id: "abaixo-da-media" });
      if (ref.defasada) sinais.push({ id: "referencia-defasada" });
      memoria.push(`Média do Banco Central (série ${ref.serie}, ${nomeDoMes(ref.mes)}): ${percentual(ref.taxaMensal)} ao mês.`);
    }
    const jurosDoMes = Math.round(e.saldo * mensal);
    const jurosDoMesNaMedia = ref.ok ? Math.round(e.saldo * ref.taxaMensal) : null;
    if (e.saldo > 0) memoria.push(`Juros de um mês sobre ${reais(e.saldo)}: ${reais(jurosDoMes)}${jurosDoMesNaMedia !== null ? `; pela média, ${reais(jurosDoMesNaMedia)}` : ""}.`);
    else faltando.push("o saldo devedor ou o valor usado, para ver os juros em reais");
    hipoteses.push("Juros de um mês, sem IOF, multa nem juros de mora, que são cobrados à parte em caso de atraso.");
    return {
      ok: true,
      modalidade: e.modalidade,
      rotativo,
      taxa: { mensal, anual: mensalParaAnual(mensal), origem },
      taxaSobreORecebido: null,
      cet: e.cetAnual !== null ? { anual: e.cetAnual, mensal: anualParaMensal(e.cetAnual) } : null,
      referencia: ref,
      comparacao,
      cenarioA: null,
      cenarioB: null,
      custo: null,
      andamento: null,
      rotativo_: e.saldo > 0 ? { saldo: e.saldo, jurosDoMes, jurosDoMesNaMedia } : null,
      sinais,
      faltando,
      hipoteses,
      memoria,
    };
  }

  // ---------- crédito parcelado ----------
  const n = e.parcelas;
  const principal = e.valorFinanciado || e.valorRecebido;
  if (!n) faltando.push("o número de parcelas");
  if (!principal) faltando.push("o valor recebido ou o valor financiado");
  if (!e.parcela && e.taxaMensal === null && e.taxaAnual === null) faltando.push("o valor da parcela ou a taxa de juros do contrato");

  // Taxa sobre um valor a partir das parcelas
  const calcular = (valor: number) => {
    if (!valor || !n || !e.parcela) return null;
    const r = e.sistema === "sac" ? taxaDoSac(valor, e.parcela, n) : taxaImplicita(valor, Array(n).fill(e.parcela));
    return r;
  };
  const doFinanciado = e.valorFinanciado ? calcular(e.valorFinanciado) : null;
  const doRecebido = e.valorRecebido ? calcular(e.valorRecebido) : null;
  for (const r of [doFinanciado, doRecebido])
    if (r && !r.ok && r.motivo === "parcelas-menores-que-o-valor")
      return {
        ok: false,
        erros: [{ campo: "parcela", mensagem: "As parcelas somam menos que o valor do empréstimo. Confira os valores." }],
        faltando: [],
      };

  let taxa: { mensal: number; anual: number; origem: OrigemDaTaxa } | null = null;
  if (e.taxaMensal !== null) taxa = { mensal: e.taxaMensal, anual: mensalParaAnual(e.taxaMensal), origem: "mensal-informada" };
  else if (e.taxaAnual !== null) taxa = { mensal: anualParaMensal(e.taxaAnual), anual: e.taxaAnual, origem: "anual-informada" };
  else if (doFinanciado?.ok) taxa = { mensal: doFinanciado.taxa, anual: mensalParaAnual(doFinanciado.taxa), origem: "calculada-financiado" };
  else if (doRecebido?.ok) taxa = { mensal: doRecebido.taxa, anual: mensalParaAnual(doRecebido.taxa), origem: "calculada-recebido" };

  const taxaSobreORecebido = doRecebido?.ok ? { mensal: doRecebido.taxa, anual: mensalParaAnual(doRecebido.taxa) } : null;

  if (taxa) {
    const origemTexto: Record<OrigemDaTaxa, string> = {
      "mensal-informada": "informada por você",
      "anual-informada": "anual informada, convertida para mensal",
      "calculada-financiado": `calculada a partir do valor financiado, das ${n} parcelas e do valor da parcela (${e.sistema === "sac" ? "SAC, pela primeira parcela" : "Price"})`,
      "calculada-recebido": `calculada a partir do valor recebido, das ${n} parcelas e do valor da parcela (${e.sistema === "sac" ? "SAC, pela primeira parcela" : "Price"})`,
    };
    memoria.push(`Taxa do contrato: ${percentual(taxa.mensal)} ao mês = ${percentual(taxa.anual)} ao ano, ${origemTexto[taxa.origem]}.`);
  }

  // Taxas informadas que não batem entre si
  if (e.taxaMensal !== null && e.taxaAnual !== null) {
    const anualDaMensal = mensalParaAnual(e.taxaMensal);
    if (Math.abs(anualDaMensal - e.taxaAnual) > 0.005)
      sinais.push({ id: "taxas-informadas-nao-batem", anualDaMensal, nominal: Math.abs(e.taxaAnual - 12 * e.taxaMensal) < 0.0005 });
  }
  // Taxa calculada das parcelas acima da informada: há encargos dentro das parcelas
  if (taxa && (taxa.origem === "mensal-informada" || taxa.origem === "anual-informada")) {
    const calculada = doFinanciado?.ok ? doFinanciado.taxa : doRecebido?.ok ? doRecebido.taxa : null;
    if (calculada !== null && calculada - taxa.mensal > 0.0005) sinais.push({ id: "taxa-calculada-maior", calculada });
  }
  const encargosFinanciados = e.valorFinanciado && e.valorRecebido ? e.valorFinanciado - e.valorRecebido : 0;
  if (encargosFinanciados > 0) sinais.push({ id: "encargos-financiados", valor: encargosFinanciados });
  const cet = e.cetAnual !== null ? { anual: e.cetAnual, mensal: anualParaMensal(e.cetAnual) } : null;
  if (cet && taxa && cet.mensal - taxa.mensal > 0.0005) sinais.push({ id: "cet-maior-que-a-taxa", cetMensal: cet.mensal });
  if (e.modalidade === "consignado" && e.subtipo === "inss") sinais.push({ id: "teto-consignado-inss" });
  if (e.modalidade === "imobiliario") sinais.push({ id: "indexador-imobiliario" });
  if (e.modalidade === "parcelamento-fatura") sinais.push({ id: "teto-do-rotativo", vale: compararDatas(data, TETO_DO_ROTATIVO.desde) >= 0 });

  const comparacao = taxa && ref.ok ? { diferencaPp: (taxa.mensal - ref.taxaMensal) * 100, relativa: taxa.mensal / ref.taxaMensal - 1 } : null;
  if (comparacao && ref.ok) {
    sinais.unshift(comparacao.diferencaPp > 0.005 ? { id: "acima-da-media", diferencaPp: comparacao.diferencaPp } : { id: "abaixo-da-media" });
    if (ref.defasada) sinais.push({ id: "referencia-defasada" });
    memoria.push(`Média do Banco Central para ${NOME_DA_MODALIDADE[e.modalidade].toLowerCase()} (série ${ref.serie}, ${nomeDoMes(ref.mes)}): ${percentual(ref.taxaMensal)} ao mês = ${percentual(mensalParaAnual(ref.taxaMensal))} ao ano.`);
    memoria.push(`Diferença: ${comparacao.diferencaPp.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} ponto(s) percentual(is) ao mês; a taxa do contrato é ${percentual(Math.abs(comparacao.relativa), 0)} ${comparacao.relativa >= 0 ? "maior" : "menor"} que a média (diferença relativa).`);
  }

  let cenarioA: Cenario | null = null;
  let cenarioB: (Cenario & { diferencaMensal: number; diferencaTotal: number }) | null = null;
  let custo = null;
  let andamento = null;
  if (taxa && n && principal) {
    cenarioA = cenario(principal, taxa.mensal, n, e.sistema);
    // Parcela informada na Price: vale a parcela do contrato para o total
    if (e.parcela && e.sistema === "price") {
      const total = e.parcela * n;
      cenarioA = { ...cenarioA, parcela: e.parcela, ultimaParcela: e.parcela, total, juros: total - principal };
    }
    memoria.push(
      `Cenário A (contrato): ${n} parcelas ${e.sistema === "sac" ? `de ${reais(cenarioA.parcela)} a ${reais(cenarioA.ultimaParcela)} (SAC)` : `de ${reais(cenarioA.parcela)} (Price)`}; total ${reais(cenarioA.total)}; juros ${reais(cenarioA.juros)} sobre ${reais(principal)}.`,
    );
    if (ref.ok) {
      const b = cenario(principal, ref.taxaMensal, n, e.sistema);
      cenarioB = { ...b, diferencaMensal: cenarioA.parcela - b.parcela, diferencaTotal: cenarioA.total - b.total };
      memoria.push(
        `Cenário B (mesmo valor e prazo, à taxa média): parcela ${e.sistema === "sac" ? "inicial " : ""}${reais(b.parcela)}; total ${reais(b.total)}. Diferença: ${reais(cenarioB.diferencaMensal)} na parcela e ${reais(cenarioB.diferencaTotal)} no total. É uma comparação matemática, não um valor devido.`,
      );
    }
    const recebido = e.valorRecebido || principal;
    custo = {
      recebido,
      totalDasParcelas: cenarioA.total,
      juros: cenarioA.total - principal,
      encargosFinanciados,
      encargosAParte: e.encargosAParte,
      custoTotal: cenarioA.total + e.encargosAParte - recebido,
    };
    memoria.push(
      `Custo total estimado: ${reais(cenarioA.total)} em parcelas${e.encargosAParte ? ` + ${reais(e.encargosAParte)} pagos à parte` : ""} − ${reais(recebido)} recebidos = ${reais(custo.custoTotal)}.`,
    );
    if (e.parcelasPagas > 0) {
      const parcelasDoContrato = cenarioA.tabela.map((l) => (e.parcela && e.sistema === "price" ? e.parcela : l.parcela));
      const liquidacao = liquidacaoAntecipada(parcelasDoContrato, e.parcelasPagas, taxa.mensal);
      // Saldo = valor presente das parcelas que faltam, à taxa do contrato (é o valor para quitar)
      andamento = { pagas: e.parcelasPagas, saldo: liquidacao.valorParaQuitar, liquidacao };
      if (liquidacao.parcelasRestantes > 0)
        memoria.push(
          `Depois de ${e.parcelasPagas} parcela(s) paga(s), faltam ${liquidacao.parcelasRestantes} (${reais(liquidacao.somaDasRestantes)}). Valor estimado para quitar hoje, descontando os juros futuros à taxa do contrato: ${reais(liquidacao.valorParaQuitar)}.`,
        );
    }
    hipoteses.push(
      e.sistema === "sac" ? "Sistema SAC: amortização constante e parcelas decrescentes." : "Sistema Price: parcelas iguais e mensais, a primeira um mês depois da liberação.",
      "Taxa prefixada, sem indexador (TR, IPCA) e sem atraso; os valores são estimativas e podem diferir alguns centavos do contrato.",
    );
  }
  if (taxa?.origem === "calculada-recebido")
    hipoteses.push("A taxa foi calculada sobre o que você recebeu: se houver tarifas, seguros ou IOF dentro das parcelas, ela fica acima da taxa de juros do contrato e mais perto do CET.");
  if (!taxa && faltando.length === 0) faltando.push("a taxa de juros ou dados suficientes para calculá-la");

  return {
    ok: true,
    modalidade: e.modalidade,
    rotativo,
    taxa,
    taxaSobreORecebido,
    cet,
    referencia: ref,
    comparacao,
    cenarioA,
    cenarioB,
    custo,
    andamento,
    rotativo_: null,
    sinais,
    faltando,
    hipoteses,
    memoria,
  };
}

export const formatarDataBr = (texto: string) => formatarData(lerData(texto)!);
