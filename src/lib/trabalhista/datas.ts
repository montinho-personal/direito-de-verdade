// Datas do contrato de trabalho. Tudo em UTC, a partir de textos AAAA-MM-DD, para a
// conta não mudar com o fuso nem com o horário de verão do aparelho.

export type Data = { ano: number; mes: number; dia: number }; // mes de 1 a 12

const MS_POR_DIA = 86_400_000;

// "2026-02-29" e outras datas impossíveis voltam null
export function lerData(texto: string): Data | null {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (!partes) return null;
  const [ano, mes, dia] = partes.slice(1).map(Number);
  if (mes < 1 || mes > 12 || dia < 1 || dia > diasDoMes(ano, mes)) return null;
  return { ano, mes, dia };
}

export function diasDoMes(ano: number, mes: number) {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

// Número do dia desde 1970, para comparar e somar dias sem fuso
export function numeroDoDia(data: Data) {
  return Date.UTC(data.ano, data.mes - 1, data.dia) / MS_POR_DIA;
}

export function deNumero(numero: number): Data {
  const d = new Date(numero * MS_POR_DIA);
  return { ano: d.getUTCFullYear(), mes: d.getUTCMonth() + 1, dia: d.getUTCDate() };
}

export function somarDias(data: Data, dias: number) {
  return deNumero(numeroDoDia(data) + dias);
}

export function compararDatas(a: Data, b: Data) {
  return numeroDoDia(a) - numeroDoDia(b);
}

// Mesmo dia, n meses depois. Dia que não existe no mês de destino (31 em abril,
// 29/02 em ano comum) vira o último dia daquele mês.
export function somarMeses(data: Data, meses: number): Data {
  const total = data.ano * 12 + (data.mes - 1) + meses;
  const ano = Math.floor(total / 12);
  const mes = (total % 12) + 1;
  return { ano, mes, dia: Math.min(data.dia, diasDoMes(ano, mes)) };
}

// Anos completos entre a admissão e a data (o aniversário de contrato conta como completo)
export function anosCompletos(admissao: Data, data: Data) {
  let anos = data.ano - admissao.ano;
  if (compararDatas(data, somarMeses(admissao, anos * 12)) < 0) anos -= 1;
  return Math.max(0, anos);
}

export function formatarData(data: Data) {
  return `${String(data.dia).padStart(2, "0")}/${String(data.mes).padStart(2, "0")}/${data.ano}`;
}

export function paraTexto(data: Data) {
  return `${data.ano}-${String(data.mes).padStart(2, "0")}-${String(data.dia).padStart(2, "0")}`;
}
