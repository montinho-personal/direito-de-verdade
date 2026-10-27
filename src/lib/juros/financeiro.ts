// Matemática financeira da calculadora de juros abusivos. Taxas como fração ao mês
// (0,02 = 2% a.m.), valores em centavos inteiros; nada aqui depende da tela.
//
// - Price: PMT = PV × i(1+i)^n / ((1+i)^n − 1); com i = 0, PMT = PV / n.
// - SAC: amortização PV / n; juros sobre o saldo; parcelas decrescentes.
// - Taxa implícita: a taxa i que zera VP(parcelas, i) − valor recebido, por bisseção (o VP
//   cai sempre que a taxa sobe, então a raiz é única quando existe).
// - Conversão: anual = (1+mensal)^12 − 1, mensal = (1+anual)^(1/12) − 1. Multiplicar a
//   mensal por 12 dá a taxa nominal, não a efetiva.
// - Arredondamento: cada valor em centavos, meio centavo para cima; a última parcela da
//   tabela absorve a sobra para o saldo fechar em zero.

export const MAXIMO_DE_PARCELAS = 600;

const arredondar = (x: number) => Math.round(x + 1e-9);

export function mensalParaAnual(mensal: number) {
  return Math.pow(1 + mensal, 12) - 1;
}

export function anualParaMensal(anual: number) {
  return Math.pow(1 + anual, 1 / 12) - 1;
}

// Prestação da tabela Price, em centavos
export function prestacaoPrice(principal: number, taxa: number, n: number) {
  if (taxa === 0) return arredondar(principal / n);
  const f = Math.pow(1 + taxa, n);
  return arredondar((principal * taxa * f) / (f - 1));
}

export type LinhaDaTabela = { numero: number; parcela: number; juros: number; amortizacao: number; saldo: number };

export function tabelaPrice(principal: number, taxa: number, n: number): LinhaDaTabela[] {
  const pmt = prestacaoPrice(principal, taxa, n);
  const linhas: LinhaDaTabela[] = [];
  let saldo = principal;
  for (let k = 1; k <= n; k++) {
    const juros = arredondar(saldo * taxa);
    const ultima = k === n;
    const amortizacao = ultima ? saldo : Math.min(saldo, pmt - juros);
    saldo -= amortizacao;
    linhas.push({ numero: k, parcela: amortizacao + juros, juros, amortizacao, saldo });
  }
  return linhas;
}

export function tabelaSac(principal: number, taxa: number, n: number): LinhaDaTabela[] {
  const amortizacaoBase = arredondar(principal / n);
  const linhas: LinhaDaTabela[] = [];
  let saldo = principal;
  for (let k = 1; k <= n; k++) {
    const juros = arredondar(saldo * taxa);
    const amortizacao = k === n ? saldo : Math.min(saldo, amortizacaoBase);
    saldo -= amortizacao;
    linhas.push({ numero: k, parcela: amortizacao + juros, juros, amortizacao, saldo });
  }
  return linhas;
}

// Valor presente de parcelas mensais (a primeira um mês depois da liberação)
export function valorPresente(parcelas: readonly number[], taxa: number) {
  let vp = 0;
  let desconto = 1;
  for (const p of parcelas) {
    desconto /= 1 + taxa;
    vp += p * desconto;
  }
  return vp;
}

export type TaxaImplicita =
  | { ok: true; taxa: number }
  | { ok: false; motivo: "parcelas-menores-que-o-valor" | "taxa-alta-demais" | "dados-invalidos" };

// Taxa mensal que iguala as parcelas ao valor recebido
export function taxaImplicita(valorRecebido: number, parcelas: readonly number[]): TaxaImplicita {
  if (valorRecebido <= 0 || parcelas.length === 0 || parcelas.some((p) => p < 0)) return { ok: false, motivo: "dados-invalidos" };
  const soma = parcelas.reduce((a, b) => a + b, 0);
  if (soma < valorRecebido) return { ok: false, motivo: "parcelas-menores-que-o-valor" };
  if (soma === valorRecebido) return { ok: true, taxa: 0 };
  let baixa = 0;
  let alta = 1; // 100% ao mês
  if (valorPresente(parcelas, alta) > valorRecebido) return { ok: false, motivo: "taxa-alta-demais" };
  for (let i = 0; i < 200; i++) {
    const meio = (baixa + alta) / 2;
    if (valorPresente(parcelas, meio) > valorRecebido) baixa = meio;
    else alta = meio;
  }
  return { ok: true, taxa: (baixa + alta) / 2 };
}

// Taxa do SAC a partir da primeira parcela: P1 = PV/n + PV × i
export function taxaDoSac(principal: number, primeiraParcela: number, n: number): TaxaImplicita {
  if (principal <= 0 || n <= 0) return { ok: false, motivo: "dados-invalidos" };
  const taxa = (primeiraParcela - principal / n) / principal;
  if (taxa < 0) return { ok: false, motivo: "parcelas-menores-que-o-valor" };
  if (taxa > 1) return { ok: false, motivo: "taxa-alta-demais" };
  return { ok: true, taxa };
}

export type Liquidacao = {
  parcelasRestantes: number;
  somaDasRestantes: number;
  // Valor presente das parcelas restantes, pela taxa do contrato
  valorParaQuitar: number;
  reducaoDeJuros: number;
};

// Quitação depois de k parcelas pagas: valor presente do que falta, à taxa contratada
export function liquidacaoAntecipada(parcelas: readonly number[], pagas: number, taxa: number): Liquidacao {
  const restantes = parcelas.slice(pagas);
  const soma = restantes.reduce((a, b) => a + b, 0);
  const vp = arredondar(valorPresente(restantes, taxa));
  return { parcelasRestantes: restantes.length, somaDasRestantes: soma, valorParaQuitar: vp, reducaoDeJuros: soma - vp };
}

// "2,35%" a partir de 0,0235; com casas fixas
export function percentual(taxa: number, casas = 2) {
  return `${(taxa * 100).toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas })}%`;
}
