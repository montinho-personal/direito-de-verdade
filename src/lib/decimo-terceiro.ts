// Conta do 13º salário de quem trabalha com carteira assinada, com os valores de 2026,
// e o imposto de renda mensal de 2026 (calculadora do artigo da isenção de R$ 5 mil).
// Fontes de cada número em docs/artigos/13-salario.md e
// docs/calculadoras/13-salario.md. Revisar todo ano.

// Tabela de contribuição do INSS de 2026 (Portaria Interministerial MPS/MF nº 13/2026).
// A alíquota de cada faixa vale só para a parte do valor que cai nela.
const FAIXAS_INSS_2026 = [
  { ate: 1621.0, aliquota: 0.075 },
  { ate: 2902.84, aliquota: 0.09 },
  { ate: 4354.27, aliquota: 0.12 },
  { ate: 8475.55, aliquota: 0.14 },
];

// Tabela mensal do imposto de renda de 2026 (Receita Federal), que também vale para o
// 13º: alíquota e parcela a deduzir de cada faixa
const FAIXAS_IR_2026 = [
  { ate: 2428.8, aliquota: 0, deduzir: 0 },
  { ate: 2826.65, aliquota: 0.075, deduzir: 182.16 },
  { ate: 3751.05, aliquota: 0.15, deduzir: 394.16 },
  { ate: 4664.68, aliquota: 0.225, deduzir: 675.49 },
  { ate: Infinity, aliquota: 0.275, deduzir: 908.73 },
];
const DEDUCAO_POR_DEPENDENTE_2026 = 189.59;
// Usado no lugar das deduções (INSS e dependentes) quando for maior que elas
export const DESCONTO_SIMPLIFICADO_2026 = 607.2;

// Até este valor de 13º não há imposto de renda em 2026 (Lei 15.270/2025, que
// também vale para o 13º). Até R$ 7.350 o imposto tem uma redução menor.
export const LIMITE_ISENCAO_IR_2026 = 5000;
const LIMITE_REDUCAO_IR_2026 = 7350;

export const SALARIO_MINIMO_2026 = 1621;

// Arredonda para o centavo mais próximo (meio centavo para cima, como na folha).
// A folga corrige contas como 1621 × 7,5% = 121,575, que o computador guarda como 121,57499…
const centavos = (valor: number) => Math.round(valor * 100 + 1e-6) / 100;

export function inss2026(valor: number) {
  let total = 0;
  let inicio = 0;
  for (const faixa of FAIXAS_INSS_2026) {
    if (valor <= inicio) break;
    total += (Math.min(valor, faixa.ate) - inicio) * faixa.aliquota;
    inicio = faixa.ate;
  }
  return centavos(total);
}

// Imposto de renda de 2026 sobre um rendimento mensal (salário) ou sobre o 13º, que
// é calculado à parte do salário com as mesmas regras. A redução da Lei 15.270/2025
// usa o rendimento bruto, e não a base de cálculo (exemplos da Receita Federal).
export function detalheDoImposto2026(bruto: number, inss: number, dependentes = 0) {
  const deducoes = inss + dependentes * DEDUCAO_POR_DEPENDENTE_2026;
  const usaDescontoSimplificado = DESCONTO_SIMPLIFICADO_2026 > deducoes;
  const base = Math.max(0, bruto - Math.max(deducoes, DESCONTO_SIMPLIFICADO_2026));
  const faixa = FAIXAS_IR_2026.find((f) => base <= f.ate) ?? FAIXAS_IR_2026[4];
  const pelaTabela = centavos(Math.max(0, base * faixa.aliquota - faixa.deduzir));
  const reducaoDaLei =
    bruto <= LIMITE_ISENCAO_IR_2026
      ? pelaTabela
      : bruto <= LIMITE_REDUCAO_IR_2026
        ? 978.62 - 0.133145 * bruto
        : 0;
  const imposto = centavos(Math.max(0, pelaTabela - reducaoDaLei));
  return {
    base: centavos(base),
    usaDescontoSimplificado,
    pelaTabela,
    reducao: centavos(pelaTabela - imposto),
    imposto,
  };
}

export function impostoDeRenda13(bruto: number, inss: number, dependentes = 0) {
  return detalheDoImposto2026(bruto, inss, dependentes).imposto;
}

export type Resultado13 = {
  bruto: number;
  primeiraParcela: number;
  inss: number;
  impostoDeRenda: number;
  segundaParcela: number;
};

export function calcular13({
  salario,
  meses,
  mediaVariaveis = 0,
  dependentes = 0,
}: {
  salario: number;
  // Meses com 15 dias ou mais de trabalho no ano (1 a 12)
  meses: number;
  // Média mensal de horas extras, comissões e adicionais que entram no 13º
  mediaVariaveis?: number;
  // Dependentes declarados à empresa para o imposto de renda
  dependentes?: number;
}): Resultado13 {
  const bruto = centavos(((salario + mediaVariaveis) / 12) * meses);
  // A 1ª parcela é a metade, sem descontos
  const primeiraParcela = centavos(bruto / 2);
  // INSS e imposto de renda saem da 2ª parcela, calculados sobre o 13º inteiro
  const inss = inss2026(bruto);
  const impostoDeRenda = impostoDeRenda13(bruto, inss, dependentes);
  const segundaParcela = centavos(bruto - primeiraParcela - inss - impostoDeRenda);
  return { bruto, primeiraParcela, inss, impostoDeRenda, segundaParcela };
}
