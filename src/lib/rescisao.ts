// Conta da rescisão de quem é demitido sem justa causa, com os valores de 2026.
// Fontes em docs/artigos/demissao-sem-justa-causa.md. Revisar todo ano.
import { detalheDoImposto2026, impostoDeRenda13, inss2026 } from "@/lib/decimo-terceiro";

const centavos = (valor: number) => Math.round(valor * 100 + 1e-6) / 100;

// Datas no formato AAAA-MM-DD, tratadas em UTC para não variar com o fuso
function lerData(texto: string) {
  const [ano, mes, dia] = texto.split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia));
}

function somarDias(data: Date, dias: number) {
  return new Date(data.getTime() + dias * 86_400_000);
}

function diasDoMes(ano: number, mes: number) {
  return new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
}

// Anos completos de casa entre a admissão e a saída
export function anosCompletos(admissao: Date, saida: Date) {
  let anos = saida.getUTCFullYear() - admissao.getUTCFullYear();
  const aniversario = new Date(
    Date.UTC(saida.getUTCFullYear(), admissao.getUTCMonth(), admissao.getUTCDate()),
  );
  if (saida < aniversario) anos -= 1;
  return Math.max(0, anos);
}

// Aviso prévio: 30 dias + 3 por ano completo de casa, até 90 dias (Lei 12.506/2011)
export function diasDeAviso(anos: number) {
  return Math.min(90, 30 + 3 * anos);
}

// Avos de 13º no ano: meses do ano com 15 dias ou mais de trabalho
function avosDe13NoAno(ano: number, inicio: Date, fim: Date) {
  let avos = 0;
  for (let mes = 0; mes < 12; mes++) {
    const primeiro = new Date(Date.UTC(ano, mes, 1));
    const ultimo = new Date(Date.UTC(ano, mes, diasDoMes(ano, mes)));
    const de = inicio > primeiro ? inicio : primeiro;
    const ate = fim < ultimo ? fim : ultimo;
    if (ate < de) continue;
    const dias = Math.round((ate.getTime() - de.getTime()) / 86_400_000) + 1;
    if (dias >= 15) avos++;
  }
  return avos;
}

// Avos de férias do período aquisitivo em curso: cada mês contado a partir do
// aniversário da admissão, com fração de mais de 14 dias valendo um mês
function avosDeFerias(admissao: Date, fim: Date) {
  let inicio = new Date(
    Date.UTC(fim.getUTCFullYear(), admissao.getUTCMonth(), admissao.getUTCDate()),
  );
  if (inicio > fim) {
    inicio = new Date(
      Date.UTC(fim.getUTCFullYear() - 1, admissao.getUTCMonth(), admissao.getUTCDate()),
    );
  }
  if (inicio < admissao) inicio = admissao;
  let avos = 0;
  let marco = inicio;
  while (avos < 12) {
    const proximo = new Date(
      Date.UTC(marco.getUTCFullYear(), marco.getUTCMonth() + 1, marco.getUTCDate()),
    );
    if (proximo <= somarDias(fim, 1)) {
      avos++;
      marco = proximo;
      continue;
    }
    const dias = Math.round((fim.getTime() - marco.getTime()) / 86_400_000) + 1;
    if (dias > 14) avos++;
    break;
  }
  return avos;
}

export type EntradaRescisao = {
  salario: number;
  // AAAA-MM-DD
  admissao: string;
  // Último dia trabalhado (AAAA-MM-DD)
  saida: string;
  avisoIndenizado: boolean;
  // Períodos de férias vencidos e não tirados (0 ou 1)
  feriasVencidas: number;
  saldoFgts?: number;
  dependentes?: number;
};

export type Rescisao = {
  diasTrabalhadosNoMes: number;
  saldoDeSalario: number;
  diasDeAviso: number;
  avisoPrevio: number;
  avos13: number;
  decimoTerceiro: number;
  avosFerias: number;
  feriasProporcionais: number;
  feriasVencidas: number;
  tercoDeFerias: number;
  inss: number;
  impostoDeRenda: number;
  bruto: number;
  liquido: number;
  multaFgts: number;
  depositoFgts: number;
};

export function calcularRescisao(entrada: EntradaRescisao): Rescisao | null {
  const { salario, avisoIndenizado, feriasVencidas: vencidas, dependentes = 0 } = entrada;
  if (!(salario > 0) || !entrada.admissao || !entrada.saida) return null;
  const admissao = lerData(entrada.admissao);
  const saida = lerData(entrada.saida);
  if (Number.isNaN(admissao.getTime()) || Number.isNaN(saida.getTime()) || saida < admissao) {
    return null;
  }

  const anos = anosCompletos(admissao, saida);
  const dias = diasDeAviso(anos);
  // O aviso indenizado conta como tempo de serviço: o contrato é projetado até o fim dele
  const fimProjetado = avisoIndenizado ? somarDias(saida, dias) : saida;

  const diaDaSaida = saida.getUTCDate();
  const diasTrabalhadosNoMes = Math.min(30, diaDaSaida);
  const saldoDeSalario = centavos((salario / 30) * diasTrabalhadosNoMes);
  const avisoPrevio = avisoIndenizado ? centavos((salario / 30) * dias) : 0;

  // 13º do ano da saída (e do ano seguinte, se a projeção do aviso passar de dezembro);
  // o dos anos anteriores já devia ter sido pago
  let avos13 = 0;
  for (let ano = saida.getUTCFullYear(); ano <= fimProjetado.getUTCFullYear(); ano++) {
    avos13 += avosDe13NoAno(ano, admissao, fimProjetado);
  }
  const decimoTerceiro = centavos((salario / 12) * avos13);

  const avosFerias = avosDeFerias(admissao, fimProjetado);
  const feriasProporcionais = centavos((salario / 12) * avosFerias);
  const feriasVencidas = centavos(salario * vencidas);
  const tercoDeFerias = centavos((feriasProporcionais + feriasVencidas) / 3);

  // INSS e IR: sobre o saldo de salário e, à parte, sobre o 13º. Aviso prévio
  // indenizado e férias indenizadas com o terço não têm INSS nem IR.
  const inssSalario = inss2026(saldoDeSalario);
  const inss13 = inss2026(decimoTerceiro);
  const irSalario = detalheDoImposto2026(saldoDeSalario, inssSalario, dependentes).imposto;
  const ir13 = impostoDeRenda13(decimoTerceiro, inss13, dependentes);

  const bruto = centavos(
    saldoDeSalario + avisoPrevio + decimoTerceiro + feriasProporcionais + feriasVencidas + tercoDeFerias,
  );
  const inss = centavos(inssSalario + inss13);
  const impostoDeRenda = centavos(irSalario + ir13);

  // FGTS: 8% sobre saldo de salário, aviso indenizado e 13º, e multa de 40% sobre
  // tudo o que foi depositado no contrato
  const depositoFgts = centavos(0.08 * (saldoDeSalario + avisoPrevio + decimoTerceiro));
  const multaFgts = centavos(0.4 * ((entrada.saldoFgts ?? 0) + depositoFgts));

  return {
    diasTrabalhadosNoMes,
    saldoDeSalario,
    diasDeAviso: dias,
    avisoPrevio,
    avos13,
    decimoTerceiro,
    avosFerias,
    feriasProporcionais,
    feriasVencidas,
    tercoDeFerias,
    inss,
    impostoDeRenda,
    bruto,
    liquido: centavos(bruto - inss - impostoDeRenda),
    multaFgts,
    depositoFgts,
  };
}
