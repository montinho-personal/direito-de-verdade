// Simulação do FGTS de um contrato, mês a mês: depósitos devidos e um saldo estimado.
//
// O saldo é só uma estimativa: soma os depósitos e os juros de 3% ao ano (Lei 8.036,
// art. 13), mas não tem a TR (que muda todo mês) nem a distribuição anual de
// resultados, e conta os juros a partir do mês seguinte a cada depósito. O extrato da
// Caixa costuma ser um pouco maior. Os depósitos devidos, esses, saem exatos para os
// salários informados.
//
// Premissas:
// - Mês de entrada e de saída: salário proporcional aos dias corridos (no máximo 30).
// - 13º: 1/12 por mês do ano com 15 dias ou mais de trabalho (Decreto 10.854/2021,
//   art. 76), todo na competência de dezembro (ou no mês da saída, se o contrato
//   terminou). Na prática, a 1ª parcela entra no mês em que é paga, em geral novembro.
// - 1/3 de férias: uma vez por período aquisitivo completo, no mês em que ele se
//   completa (as férias em si substituem o salário do mês). Férias indenizadas na saída
//   não têm FGTS e ficam de fora.
// - Afastamento por doença pelo INSS (depois do 15º dia): sem depósito. Acidente de
//   trabalho, licença-maternidade e serviço militar: o depósito continua (Lei 8.036,
//   art. 15, § 5º; Decreto 99.684/1990, art. 28).
// - Base da multa: depósitos com os juros, sem descontar os saques (art. 18, § 1º).
import { dividirArredondando } from "../tributos/calculo.ts";
import { compararDatas, type Data, diasDoMes, lerData, somarDias, somarMeses } from "../trabalhista/datas.ts";
import { type Competencia, competenciasEntre, indice, lerCompetencia } from "./competencias.ts";
import { aliquotaDoVinculo } from "./deposito.ts";
import { FGTS_2026 as P, type Vinculo } from "./parametros.ts";

export type EntradaDoSaldo = {
  vinculo: Vinculo;
  admissao: string; // AAAA-MM-DD
  fim: string; // AAAA-MM-DD, último dia da simulação
  salario: number; // salário na admissão
  // Reajustes conhecidos: o novo salário vale a partir da competência
  reajustes?: { aPartirDe: string; salario: number }[];
  // Média mensal de horas extras, adicionais e comissões
  variaveis?: number;
  // O contrato terminou na data final (13º proporcional entra no último mês)
  contratoEncerrado?: boolean;
  incluir13?: boolean;
  incluirTercoDeFerias?: boolean;
  // Meses afastado pelo INSS por doença, sem depósito ("AAAA-MM" a "AAAA-MM")
  afastamentos?: { inicio: string; fim: string }[];
  // Saques conhecidos durante o contrato
  saques?: { competencia: string; valor: number }[];
  // Saldo que já estava na conta no começo da simulação (não entra na base da multa)
  saldoInicial?: number;
  // Remuneração conhecida de cada competência ("AAAA-MM"), no lugar da estimada
  remuneracoes?: Record<string, number>;
};

export type MesDoSaldo = {
  competencia: Competencia;
  remuneracao: number;
  decimoTerceiro: number;
  tercoDeFerias: number;
  deposito: number;
  indenizacaoDomestico: number;
  juros: number;
  saque: number;
  saldo: number;
  baseDaMulta: number;
  afastado: boolean;
  proporcional: boolean;
};

export type AnoDoSaldo = { ano: number; depositos: number; juros: number; saques: number; saldo: number };

export type ResultadoDoSaldo = {
  ok: true;
  meses: MesDoSaldo[];
  anos: AnoDoSaldo[];
  depositos: number;
  juros: number;
  saques: number;
  saldoInicial: number;
  saldo: number;
  baseDaMulta: number;
  indenizacaoDomestico: number;
  aliquotaPorMil: number;
  // Algum saque foi maior que o saldo estimado no mês
  saqueMaiorQueOSaldo: boolean;
};

export type ErroDoSaldo = { ok: false; erros: { campo: string; mensagem: string }[] };

const juros = (saldo: number) => dividirArredondando(saldo * P.jurosMensaisPorDezBilhoes, 10_000_000_000);

// Dias corridos trabalhados na competência, entre a admissão e o fim
function diasNoMes(c: Competencia, admissao: Data, fim: Data) {
  const total = diasDoMes(c.ano, c.mes);
  const primeiro = admissao.ano === c.ano && admissao.mes === c.mes ? admissao.dia : 1;
  const ultimo = fim.ano === c.ano && fim.mes === c.mes ? fim.dia : total;
  return { dias: ultimo - primeiro + 1, total };
}

export function simularSaldo(e: EntradaDoSaldo): ResultadoDoSaldo | ErroDoSaldo {
  const erros: ErroDoSaldo["erros"] = [];
  const admissao = lerData(e.admissao);
  const fim = lerData(e.fim);
  if (!admissao) erros.push({ campo: "admissao", mensagem: "Digite a data de admissão." });
  if (!fim) erros.push({ campo: "fim", mensagem: "Digite a data final da simulação." });
  if (admissao && fim && compararDatas(fim, admissao) < 0) {
    erros.push({ campo: "fim", mensagem: "A data final é antes da admissão." });
  }
  if (admissao && admissao.ano < 1990) erros.push({ campo: "admissao", mensagem: "Use uma admissão a partir de 1990." });
  if (admissao && fim && fim.ano - admissao.ano > 50) erros.push({ campo: "fim", mensagem: "O período passa de 50 anos." });
  if (!(e.salario > 0)) erros.push({ campo: "salario", mensagem: "Digite o salário." });
  const reajustes = (e.reajustes ?? []).map((r) => ({ c: lerCompetencia(r.aPartirDe), salario: r.salario }));
  if (reajustes.some((r) => !r.c || !(r.salario > 0))) erros.push({ campo: "reajustes", mensagem: "Confira o mês e o valor de cada reajuste." });
  const afastamentos = (e.afastamentos ?? []).map((a) => ({ inicio: lerCompetencia(a.inicio), fim: lerCompetencia(a.fim) }));
  if (afastamentos.some((a) => !a.inicio || !a.fim || indice(a.fim) < indice(a.inicio))) {
    erros.push({ campo: "afastamentos", mensagem: "Confira o começo e o fim de cada afastamento." });
  }
  const saques = (e.saques ?? []).map((s) => ({ c: lerCompetencia(s.competencia), valor: s.valor }));
  if (saques.some((s) => !s.c || !(s.valor > 0))) erros.push({ campo: "saques", mensagem: "Confira o mês e o valor de cada saque." });
  if (erros.length || !admissao || !fim) return { ok: false, erros };

  const aliquota = aliquotaDoVinculo(e.vinculo);
  const incluir13 = e.incluir13 ?? true;
  const incluirTerco = e.incluirTercoDeFerias ?? true;
  const variaveis = e.variaveis ?? 0;
  const ordenados = reajustes
    .map((r) => ({ n: indice(r.c!), salario: r.salario }))
    .sort((a, b) => a.n - b.n);
  const salarioEm = (c: Competencia) => {
    let s = e.salario;
    for (const r of ordenados) if (r.n <= indice(c)) s = r.salario;
    return s;
  };
  const afastado = (c: Competencia) =>
    afastamentos.some((a) => indice(a.inicio!) <= indice(c) && indice(c) <= indice(a.fim!));

  // Meses em que um período aquisitivo de férias se completa (fim = admissão + 12k meses − 1 dia)
  const fechamentoDeFerias = new Set<number>();
  for (let k = 1; ; k++) {
    const fimDoPeriodo = somarDias(somarMeses(admissao, 12 * k), -1);
    if (compararDatas(fimDoPeriodo, fim) > 0) break;
    fechamentoDeFerias.add(indice(fimDoPeriodo));
  }

  const competencias = competenciasEntre(admissao, fim);
  const ultima = competencias[competencias.length - 1];
  const avosDoAno = new Map<number, number>();
  const meses: MesDoSaldo[] = [];
  let saldo = e.saldoInicial ?? 0;
  let baseDaMulta = 0;
  let saqueMaiorQueOSaldo = false;

  for (const c of competencias) {
    const { dias, total } = diasNoMes(c, admissao, fim);
    const mesInteiro = dias === total;
    const estaAfastado = afastado(c);
    const mensal = salarioEm(c) + variaveis;
    const chave = `${c.ano}-${String(c.mes).padStart(2, "0")}`;
    let remuneracao = estaAfastado ? 0 : mesInteiro ? mensal : dividirArredondando(mensal * Math.min(dias, 30), 30);
    if (e.remuneracoes && chave in e.remuneracoes) remuneracao = e.remuneracoes[chave];
    if (!estaAfastado && dias >= 15) avosDoAno.set(c.ano, (avosDoAno.get(c.ano) ?? 0) + 1);

    const fechaO13 = c.mes === 12 || (e.contratoEncerrado && indice(c) === indice(ultima));
    const decimoTerceiro = incluir13 && fechaO13 ? dividirArredondando(mensal * (avosDoAno.get(c.ano) ?? 0), 12) : 0;
    const tercoDeFerias = incluirTerco && fechamentoDeFerias.has(indice(c)) ? dividirArredondando(mensal, 3) : 0;
    const base = remuneracao + decimoTerceiro + tercoDeFerias;
    const deposito = dividirArredondando(base * aliquota, 1000);
    const indenizacaoDomestico = e.vinculo === "domestico" ? dividirArredondando(base * P.indenizacaoDomesticoPorMil, 1000) : 0;

    const jurosDoMes = juros(saldo);
    const saque = saques.filter((s) => indice(s.c!) === indice(c)).reduce((soma, s) => soma + s.valor, 0);
    const disponivel = saldo + jurosDoMes + deposito;
    if (saque > disponivel) saqueMaiorQueOSaldo = true;
    saldo = Math.max(0, disponivel - saque);
    baseDaMulta += juros(baseDaMulta) + deposito;

    meses.push({
      competencia: c,
      remuneracao,
      decimoTerceiro,
      tercoDeFerias,
      deposito,
      indenizacaoDomestico,
      juros: jurosDoMes,
      saque: Math.min(saque, disponivel),
      saldo,
      baseDaMulta,
      afastado: estaAfastado,
      proporcional: !mesInteiro && !estaAfastado,
    });
  }

  const anos: AnoDoSaldo[] = [];
  for (const m of meses) {
    let ano = anos[anos.length - 1];
    if (!ano || ano.ano !== m.competencia.ano) anos.push((ano = { ano: m.competencia.ano, depositos: 0, juros: 0, saques: 0, saldo: 0 }));
    ano.depositos += m.deposito;
    ano.juros += m.juros;
    ano.saques += m.saque;
    ano.saldo = m.saldo;
  }
  const soma = (campo: "deposito" | "juros" | "saque" | "indenizacaoDomestico") => meses.reduce((s, m) => s + m[campo], 0);

  return {
    ok: true,
    meses,
    anos,
    depositos: soma("deposito"),
    juros: soma("juros"),
    saques: soma("saque"),
    saldoInicial: e.saldoInicial ?? 0,
    saldo,
    baseDaMulta,
    indenizacaoDomestico: soma("indenizacaoDomestico"),
    aliquotaPorMil: aliquota,
    saqueMaiorQueOSaldo,
  };
}
