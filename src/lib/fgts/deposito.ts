// Depósito de FGTS de um mês: o que entra na base e quanto a empresa deve depositar
import { dividirArredondando } from "../tributos/calculo.ts";
import { type Competencia, vencimentoDoDeposito, type Vencimento } from "./competencias.ts";
import { FGTS_2026 as P, type Vinculo } from "./parametros.ts";

export type EntradaDoDeposito = {
  vinculo: Vinculo;
  competencia: Competencia;
  // Salário do mês (proporcional, se entrou ou saiu no meio do mês)
  salario: number;
  // Horas extras, adicionais (noturno, insalubridade, periculosidade), comissões, gorjetas
  variaveis?: number;
  // 13º pago no mês (1ª ou 2ª parcela, ou o proporcional da rescisão)
  decimoTerceiro?: number;
  // Férias gozadas no mês, com o 1/3
  feriasGozadas?: number;
  // Aviso prévio, trabalhado ou indenizado (Súmula 305 do TST)
  avisoPrevio?: number;
};

export type ResultadoDoDeposito = {
  ok: true;
  base: number;
  aliquotaPorMil: number;
  deposito: number;
  // Só doméstico: 3,2% em conta separada, que não é FGTS
  indenizacaoDomestico: number;
  competencia: Competencia;
  vencimento: Vencimento;
  parcelas: { nome: string; valor: number }[];
};

export type ErroDoDeposito = { ok: false; erros: { campo: string; mensagem: string }[] };

export function aliquotaDoVinculo(vinculo: Vinculo) {
  return P.aliquotaPorMil[vinculo];
}

export function calcularDeposito(e: EntradaDoDeposito): ResultadoDoDeposito | ErroDoDeposito {
  const parcelas = [
    { nome: "Salário", valor: e.salario },
    { nome: "Horas extras, adicionais e comissões", valor: e.variaveis ?? 0 },
    { nome: "13º salário", valor: e.decimoTerceiro ?? 0 },
    { nome: "Férias gozadas com 1/3", valor: e.feriasGozadas ?? 0 },
    { nome: "Aviso prévio", valor: e.avisoPrevio ?? 0 },
  ];
  const erros: ErroDoDeposito["erros"] = [];
  if (!(e.salario >= 0)) erros.push({ campo: "salario", mensagem: "Digite o salário do mês." });
  if (parcelas.some((p) => !(p.valor >= 0))) erros.push({ campo: "parcelas", mensagem: "Os valores não podem ser negativos." });
  const base = parcelas.reduce((s, p) => s + p.valor, 0);
  if (!erros.length && base === 0) erros.push({ campo: "salario", mensagem: "Digite o salário do mês." });
  if (erros.length) return { ok: false, erros };

  const aliquotaPorMil = aliquotaDoVinculo(e.vinculo);
  return {
    ok: true,
    base,
    aliquotaPorMil,
    deposito: dividirArredondando(base * aliquotaPorMil, 1000),
    indenizacaoDomestico: e.vinculo === "domestico" ? dividirArredondando(base * P.indenizacaoDomesticoPorMil, 1000) : 0,
    competencia: e.competencia,
    vencimento: vencimentoDoDeposito(e.competencia),
    parcelas: parcelas.filter((p) => p.valor > 0),
  };
}
