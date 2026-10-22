// Competências (mês e ano a que o depósito se refere) e prazos de recolhimento do FGTS
import { type Data, diasDoMes } from "../trabalhista/datas.ts";
import { FGTS_2026 as P } from "./parametros.ts";

export type Competencia = { ano: number; mes: number }; // mes de 1 a 12

export const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const ABREVIADOS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export function indice(c: Competencia) {
  return c.ano * 12 + (c.mes - 1);
}

export function deIndice(n: number): Competencia {
  return { ano: Math.floor(n / 12), mes: (n % 12) + 1 };
}

export function somarMesesNaCompetencia(c: Competencia, meses: number) {
  return deIndice(indice(c) + meses);
}

// "2026-03" → { ano: 2026, mes: 3 }
export function lerCompetencia(texto: string): Competencia | null {
  const m = /^(\d{4})-(\d{2})$/.exec(texto.trim());
  if (!m) return null;
  const ano = Number(m[1]);
  const mes = Number(m[2]);
  if (mes < 1 || mes > 12 || ano < 1990 || ano > 2100) return null;
  return { ano, mes };
}

export function nomeDaCompetencia(c: Competencia, curto = false) {
  return curto ? `${ABREVIADOS[c.mes - 1]}/${c.ano}` : `${MESES[c.mes - 1]} de ${c.ano}`;
}

export function textoDaCompetencia(c: Competencia) {
  return `${c.ano}-${String(c.mes).padStart(2, "0")}`;
}

// 0 = domingo ... 6 = sábado
function diaDaSemana(d: Data) {
  return new Date(Date.UTC(d.ano, d.mes - 1, d.dia)).getUTCDay();
}

// Feriados nacionais de data fixa (Lei 662/1949; 20/11 desde 2024, Lei 14.759/2023).
// Carnaval, Sexta-feira Santa e feriados estaduais e municipais não entram.
function feriadoNacional(d: Data) {
  const fixos = ["1-1", "4-21", "5-1", "9-7", "10-12", "11-2", "11-15", "12-25"];
  if (d.ano >= 2024) fixos.push("11-20");
  return fixos.includes(`${d.mes}-${d.dia}`);
}

export function diaUtil(d: Data) {
  return ![0, 6].includes(diaDaSemana(d)) && !feriadoNacional(d);
}

export type Vencimento = { data: Data; regra: "dia-20" | "dia-7"; antecipado: boolean };

// Vencimento do depósito mensal da competência. Desde março/2024: dia 20 do mês seguinte,
// antecipado para o dia útil anterior quando cai em fim de semana ou feriado nacional.
// Antes: dia 7 do mês seguinte, como estava na lei.
export function vencimentoDoDeposito(c: Competencia): Vencimento {
  const seguinte = somarMesesNaCompetencia(c, 1);
  if (indice(c) < indice(P.prazoNovoDesde)) {
    return { data: { ano: seguinte.ano, mes: seguinte.mes, dia: P.diaDoPrazoAntigo }, regra: "dia-7", antecipado: false };
  }
  const data = { ano: seguinte.ano, mes: seguinte.mes, dia: P.diaDoPrazoNovo };
  while (!diaUtil(data)) data.dia--;
  return { data, regra: "dia-20", antecipado: data.dia !== P.diaDoPrazoNovo };
}

// Último dia útil do mês (sem fins de semana nem feriados nacionais de data fixa)
export function ultimoDiaUtil(ano: number, mes: number): Data {
  const d = { ano, mes, dia: diasDoMes(ano, mes) };
  while (!diaUtil(d)) d.dia--;
  return d;
}

export function competenciasEntre(inicio: Competencia, fim: Competencia): Competencia[] {
  const lista: Competencia[] = [];
  for (let n = indice(inicio); n <= indice(fim); n++) lista.push(deIndice(n));
  return lista;
}
