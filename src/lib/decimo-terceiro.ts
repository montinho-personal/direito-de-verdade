// Conta do 13º salário de quem trabalha com carteira assinada, com os valores de 2026.
// Fontes de cada número em docs/artigos/13-salario.md. Revisar todo ano.

// Tabela de contribuição do INSS de 2026 (Portaria Interministerial MPS/MF nº 13/2026).
// A alíquota de cada faixa vale só para a parte do valor que cai nela.
const FAIXAS_INSS_2026 = [
  { ate: 1621.0, aliquota: 0.075 },
  { ate: 2902.84, aliquota: 0.09 },
  { ate: 4354.27, aliquota: 0.12 },
  { ate: 8475.55, aliquota: 0.14 },
];

// Até este valor de 13º não há imposto de renda em 2026 (Lei 15.270/2025, que
// também vale para o 13º). Acima dele, o imposto depende das deduções de cada um.
export const LIMITE_ISENCAO_IR_2026 = 5000;

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

export type Resultado13 = {
  bruto: number;
  primeiraParcela: number;
  inss: number;
  // null: acima do limite de isenção, o imposto depende das deduções de cada um
  impostoDeRenda: number | null;
  // Sem o imposto de renda quando ele não pôde ser calculado
  segundaParcela: number;
};

export function calcular13({
  salario,
  meses,
  mediaVariaveis = 0,
}: {
  salario: number;
  // Meses com 15 dias ou mais de trabalho no ano (1 a 12)
  meses: number;
  // Média mensal de horas extras, comissões e adicionais que entram no 13º
  mediaVariaveis?: number;
}): Resultado13 {
  const bruto = centavos(((salario + mediaVariaveis) / 12) * meses);
  // A 1ª parcela é a metade, sem descontos
  const primeiraParcela = centavos(bruto / 2);
  // INSS e imposto de renda saem da 2ª parcela, calculados sobre o 13º inteiro
  const inss = inss2026(bruto);
  const impostoDeRenda = bruto <= LIMITE_ISENCAO_IR_2026 ? 0 : null;
  const segundaParcela = centavos(bruto - primeiraParcela - inss - (impostoDeRenda ?? 0));
  return { bruto, primeiraParcela, inss, impostoDeRenda, segundaParcela };
}
