// Horas extras de quem tem carteira assinada: valor da hora, adicional de 50%, 100% ou
// da convenção, hora extra noturna, descanso semanal remunerado (DSR) e reflexos.
// Valores em centavos inteiros; horas em minutos. Não sabe nada de tela.
//
// Regras (fontes em docs/calculadoras/horas-extras.md):
// - Adicional mínimo de 50% (Constituição, art. 7º, XVI; CLT, art. 59, § 1º); trabalho em
//   domingo ou feriado sem folga compensatória, em dobro (Súmula 146 do TST; Decreto
//   10.854/2021, art. 154, § 3º). Convenção, contrato ou acordo podem prever mais (Súmula 264).
// - Hora normal = (salário + parcelas salariais fixas) ÷ divisor (Súmula 264). Divisor pela
//   regra do TST (IRR-849-83.2013.5.03.0138, teses 4 e 7; Súmula 431): horas semanais ÷ 6 × 30
//   (44h → 220; 40h → 200; 36h → 180). Convenção pode fixar outro.
// - Hora extra noturna: o adicional noturno entra na base da hora extra (OJ 97 da SBDI-1).
//   Urbano e doméstico: 20% e hora de 52min30s (CLT, art. 73; LC 150/2015, art. 14). Rural:
//   25%, sem hora reduzida na lei (Lei 5.889/1973, art. 7º).
// - DSR: as horas extras habituais entram no descanso (Lei 605/1949, art. 7º; Decreto
//   10.854/2021, art. 157; Súmula 172). A conta (horas extras ÷ dias úteis × domingos e
//   feriados) é a da prática, descrita pelo TST, sem fórmula em norma.
// - Reflexos (13º, férias + 1/3, FGTS): Súmulas 45 e 63; CLT, art. 142, § 5º. Pela OJ 394
//   (redação de 20/03/2023), o DSR das horas extras também reflete nessas verbas, mas só
//   para horas trabalhadas a partir de 20/03/2023; antes disso, só as horas extras.
//
// Arredondamento: cada linha é calculada exata e arredondada ao centavo no fim (meio para
// cima); a hora mostrada na tela é arredondada só para exibir. O holerite pode diferir em
// centavos se a empresa arredonda a hora antes de multiplicar.
import { compararSalarios, type Comparacao, dividirArredondando } from "../tributos/calculo.ts";

export const HORAS_EXTRAS_2026 = {
  revisadoEm: "2026-10-21",
  adicionalMinimoPorMil: 500,
  adicionalDomingoPorMil: 1000,
  // OJ 394, item II: a nova redação vale para horas trabalhadas a partir desta data
  inicioDaOj394: { ano: 2023, mes: 3, dia: 20 },
  fgtsPorMil: 80,
  noturno: {
    urbano: { adicionalPorMil: 200, horaReduzida: true },
    domestico: { adicionalPorMil: 200, horaReduzida: true },
    rural: { adicionalPorMil: 250, horaReduzida: false },
  },
  // Divisores que aparecem em súmula ou tese do TST
  divisoresOficiais: { 44: 220, 40: 200, 36: 180 } as Record<number, number>,
} as const;

export type Regime = keyof typeof HORAS_EXTRAS_2026.noturno;

// Divisor pela regra do TST: horas semanais ÷ 6 dias úteis × 30
export function divisorSugerido(horasSemanais: number) {
  return dividirArredondando(horasSemanais * 30, 6);
}

export function divisorEhOficial(horasSemanais: number, divisor: number) {
  return HORAS_EXTRAS_2026.divisoresOficiais[horasSemanais] === divisor;
}

// "1h30", "1:30", "1h", "90min", "45 min", "2", "1,5" (horas decimais) → minutos
export function lerHoras(texto: string): number | null {
  const t = texto.trim().toLowerCase().replace(/\s+/g, "");
  if (!t) return null;
  let m = t.match(/^(\d{1,3})(?:h|:)(\d{1,2})?(?:m|min)?$/);
  if (m) {
    const minutos = m[2] ? Number(m[2]) : 0;
    if (minutos >= 60) return null;
    return Number(m[1]) * 60 + minutos;
  }
  m = t.match(/^(\d{1,4})(?:m|min|minutos?)$/);
  if (m) return Number(m[1]);
  m = t.match(/^(\d{1,3})(?:[,.](\d{1,2}))?(?:h|horas?)?$/);
  if (m) {
    const decimais = m[2] ? Number(m[2].padEnd(2, "0")) : 0;
    // Horas centesimais: 1,5 = 1h30; 0,25 = 15 min
    return Number(m[1]) * 60 + dividirArredondando(decimais * 60, 100);
  }
  return null;
}

export function formatarHoras(minutos: number) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (!h) return `${m} min`;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

export type LancamentoDeHoras = {
  // Horas de relógio, em minutos
  minutos: number;
  // Adicional da hora extra, em décimos de ponto percentual (50% = 500)
  adicionalPorMil: number;
  // Feitas entre 22h e 5h (no rural, 21h–5h na lavoura e 20h–4h na pecuária)
  noturna?: boolean;
  rotulo?: string;
};

export type EntradaDasHorasExtras = {
  salario: number;
  // Parcelas salariais fixas que entram na hora (periculosidade, gratificação...)
  adicionaisFixos?: number;
  divisor: number;
  lancamentos: LancamentoDeHoras[];
  regime?: Regime;
  // Adicional noturno da convenção, se maior que o da lei
  adicionalNoturnoPorMil?: number;
  // DSR: só com horas extras habituais
  dsr?: { diasUteis: number; repousos: number } | null;
  // Mês das horas extras, para a regra da OJ 394
  referencia?: { ano: number; mes: number };
};

export type LinhaDasHorasExtras = {
  rotulo: string;
  minutos: number;
  // Horas que valem no cálculo, em minutos (a noturna reduzida vale mais que a de relógio)
  minutosConsiderados: number;
  adicionalPorMil: number;
  noturna: boolean;
  valorDaHora: number;
  valor: number;
};

export type ResultadoDasHorasExtras = {
  ok: true;
  base: number;
  divisor: number;
  horaNormal: number;
  adicionalNoturnoPorMil: number;
  linhas: LinhaDasHorasExtras[];
  minutosTotais: number;
  horasExtras: number;
  dsr: number;
  diasUteis: number | null;
  repousos: number | null;
  total: number;
  reflexos: {
    regra: "nova" | "antiga" | "transicao";
    baseMensal: number;
    decimoTerceiro: number;
    feriasComUmTerco: number;
    fgts: number;
  };
};

export type ErroDasHorasExtras = { ok: false; erros: { campo: string; mensagem: string }[] };

// a × b × ... ÷ divisor, exato em BigInt, arredondado ao inteiro (meio para cima)
function produtoDividido(fatores: number[], divisor: number) {
  const n = fatores.reduce((p, f) => p * BigInt(f), BigInt(1));
  const d = BigInt(divisor);
  return Number((BigInt(2) * n + d) / (BigInt(2) * d));
}

export function calcularHorasExtras(entrada: EntradaDasHorasExtras): ResultadoDasHorasExtras | ErroDasHorasExtras {
  const erros: ErroDasHorasExtras["erros"] = [];
  if (!(entrada.salario > 0)) erros.push({ campo: "salario", mensagem: "Digite o salário bruto." });
  if (!(entrada.divisor >= 60 && entrada.divisor <= 300)) {
    erros.push({ campo: "divisor", mensagem: "O divisor fica entre 60 e 300 (o mais comum é 220)." });
  }
  const lancamentos = entrada.lancamentos.filter((l) => l.minutos > 0);
  if (!lancamentos.length) erros.push({ campo: "horas", mensagem: "Digite as horas extras do mês." });
  if (lancamentos.some((l) => l.minutos > 200 * 60)) {
    erros.push({ campo: "horas", mensagem: "Confira as horas: o limite legal é de 2 horas extras por dia." });
  }
  if (lancamentos.some((l) => !(l.adicionalPorMil >= 500 && l.adicionalPorMil <= 3000))) {
    erros.push({ campo: "adicional", mensagem: "O adicional mínimo da hora extra é de 50%." });
  }
  const dsr = entrada.dsr ?? null;
  if (dsr && !(dsr.diasUteis >= 1 && dsr.diasUteis <= 31 && dsr.repousos >= 0 && dsr.diasUteis + dsr.repousos <= 31)) {
    erros.push({ campo: "dsr", mensagem: "Confira os dias úteis e os domingos e feriados do mês." });
  }
  if (erros.length) return { ok: false, erros };

  const P = HORAS_EXTRAS_2026;
  const regime = entrada.regime ?? "urbano";
  const noturno = P.noturno[regime];
  const adicionalNoturno = Math.max(noturno.adicionalPorMil, entrada.adicionalNoturnoPorMil ?? 0);
  const base = entrada.salario + (entrada.adicionaisFixos ?? 0);
  const divisor = entrada.divisor;

  const linhas = lancamentos.map((l): LinhaDasHorasExtras => {
    const noturna = Boolean(l.noturna);
    const fatorNoturno = noturna ? 1000 + adicionalNoturno : 1000;
    // Hora noturna de 52min30s: cada hora de relógio vale 60 ÷ 52,5 = 8/7 de hora
    const reduz = noturna && noturno.horaReduzida;
    const valor = produtoDividido(
      [base, l.minutos, 1000 + l.adicionalPorMil, fatorNoturno, reduz ? 8 : 7],
      divisor * 60 * 1000 * 1000 * 7,
    );
    return {
      rotulo: l.rotulo ?? `Horas extras de ${l.adicionalPorMil / 10}%${noturna ? " noturnas" : ""}`,
      minutos: l.minutos,
      minutosConsiderados: reduz ? dividirArredondando(l.minutos * 8, 7) : l.minutos,
      adicionalPorMil: l.adicionalPorMil,
      noturna,
      valorDaHora: produtoDividido([base, 1000 + l.adicionalPorMil, fatorNoturno], divisor * 1000 * 1000),
      valor,
    };
  });

  const horasExtras = linhas.reduce((s, l) => s + l.valor, 0);
  const valorDoDsr = dsr ? dividirArredondando(horasExtras * dsr.repousos, dsr.diasUteis) : 0;
  const total = horasExtras + valorDoDsr;

  const regra = regraDaOj394(entrada.referencia);
  const baseMensal = regra === "nova" ? total : horasExtras;

  return {
    ok: true,
    base,
    divisor,
    horaNormal: dividirArredondando(base, divisor),
    adicionalNoturnoPorMil: adicionalNoturno,
    linhas,
    minutosTotais: linhas.reduce((s, l) => s + l.minutos, 0),
    horasExtras,
    dsr: valorDoDsr,
    diasUteis: dsr?.diasUteis ?? null,
    repousos: dsr?.repousos ?? null,
    total,
    reflexos: {
      regra,
      baseMensal,
      decimoTerceiro: dividirArredondando(baseMensal, 12),
      // 1/12 por mês, com o terço constitucional: × 4/3
      feriasComUmTerco: dividirArredondando(baseMensal * 4, 36),
      fgts: dividirArredondando(baseMensal * P.fgtsPorMil, 1000),
    },
  };
}

// Sem mês informado, vale a regra atual
function regraDaOj394(referencia?: { ano: number; mes: number }): ResultadoDasHorasExtras["reflexos"]["regra"] {
  if (!referencia) return "nova";
  const { ano, mes } = HORAS_EXTRAS_2026.inicioDaOj394;
  const n = referencia.ano * 12 + referencia.mes;
  if (n < ano * 12 + mes) return "antiga";
  if (n === ano * 12 + mes) return "transicao";
  return "nova";
}

// Dias úteis e repousos do mês: domingos contam como repouso, os demais dias como úteis
// (o sábado é dia útil, mesmo sem trabalho). Feriados de segunda a sábado saem dos dias
// úteis e entram nos repousos.
export function diasDoMesParaODsr(ano: number, mes: number, feriadosForaDoDomingo = 0) {
  const dias = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  let domingos = 0;
  for (let d = 1; d <= dias; d++) if (new Date(Date.UTC(ano, mes - 1, d)).getUTCDay() === 0) domingos++;
  const feriados = Math.max(0, Math.min(feriadosForaDoDomingo, dias - domingos - 1));
  return { dias, domingos, diasUteis: dias - domingos - feriados, repousos: domingos + feriados };
}

// Quanto o salário aumenta com as horas extras, bruto e líquido (INSS e IR de 2026)
export function simularSalarioComHorasExtras(
  salario: number,
  horasExtrasComDsr: number,
  dependentes = 0,
): Comparacao {
  return compararSalarios({ salario, dependentes }, { salario, variaveis: horasExtrasComDsr, dependentes });
}

export type EntradaDaConferencia = {
  pagoHorasExtras: number;
  // Quando o holerite mostra o DSR das horas extras em linha separada
  pagoDsr?: number | null;
  // Horas pagas no holerite, em minutos, se aparecerem
  minutosPagos?: number | null;
};

export type ResultadoDaConferencia = {
  // "confere": diferença de até R$ 1,00, que cabe em arredondamentos
  situacao: "confere" | "abaixo" | "acima";
  calculado: number;
  pago: number;
  diferenca: number;
  dsrConferido: boolean;
  horasDiferentes: boolean;
  // Divisor que explicaria o valor pago, quando todas as horas têm o mesmo adicional
  divisorDoHolerite: number | null;
};

const TOLERANCIA = 100;

export function conferirHolerite(r: ResultadoDasHorasExtras, pago: EntradaDaConferencia): ResultadoDaConferencia {
  const dsrConferido = pago.pagoDsr != null && r.diasUteis != null;
  // Sem DSR separado no holerite, compara as horas extras com as horas extras; com DSR,
  // o total com o total
  const calculado = dsrConferido ? r.total : r.horasExtras;
  const valorPago = pago.pagoHorasExtras + (dsrConferido ? (pago.pagoDsr ?? 0) : 0);
  const diferenca = valorPago - calculado;
  const situacao = Math.abs(diferenca) <= TOLERANCIA ? "confere" : diferenca < 0 ? "abaixo" : "acima";
  const horasDiferentes = pago.minutosPagos != null && pago.minutosPagos !== r.minutosTotais;

  let divisorDoHolerite: number | null = null;
  const unico = r.linhas.length === 1 && !r.linhas[0].noturna ? r.linhas[0] : null;
  const minutos = pago.minutosPagos ?? unico?.minutos;
  if (unico && minutos && pago.pagoHorasExtras > 0) {
    // pago = base × (1 + adicional) × horas ÷ divisor → divisor = base × (1 + a) × horas ÷ pago
    divisorDoHolerite = produtoDividido([r.base, 1000 + unico.adicionalPorMil, minutos], 60 * 1000 * pago.pagoHorasExtras);
  }
  return { situacao, calculado, pago: valorPago, diferenca, dsrConferido, horasDiferentes, divisorDoHolerite };
}
