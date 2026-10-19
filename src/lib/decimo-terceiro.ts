// Conta do 13º salário de quem trabalha com carteira assinada, com os valores de 2026.
// Fontes de cada número em docs/artigos/13-salario.md e
// docs/calculadoras/13-salario.md. Revisar todo ano.

import { PARAMETROS_2026 } from "@/lib/tributos/parametros-2026.ts";
import { calcularInss, calcularIrrf } from "@/lib/tributos/calculo.ts";

// As tabelas e a conta do INSS e do imposto de renda ficam em src/lib/tributos. Estas
// funções só convertem reais ↔ centavos para a calculadora do 13º e a de rescisão.

// Usado no lugar das deduções (INSS e dependentes) quando for maior que elas
export const DESCONTO_SIMPLIFICADO_2026 = PARAMETROS_2026.descontoSimplificado / 100;

// Até este valor de 13º não há imposto de renda em 2026 (Lei 15.270/2025, que
// também vale para o 13º). Até R$ 7.350 o imposto tem uma redução menor.
export const LIMITE_ISENCAO_IR_2026 = PARAMETROS_2026.reducao.limiteIsencao / 100;

export const SALARIO_MINIMO_2026 = PARAMETROS_2026.salarioMinimo / 100;

// Arredonda para o centavo mais próximo (meio centavo para cima, como na folha).
// A folga corrige contas como 1621 × 7,5% = 121,575, que o computador guarda como 121,57499…
const centavos = (valor: number) => Math.round(valor * 100 + 1e-6) / 100;
const emCentavos = (valor: number) => Math.round(valor * 100);

export function inss2026(valor: number) {
  return calcularInss(emCentavos(valor)).total / 100;
}

// Imposto de renda de 2026 sobre um rendimento mensal (salário) ou sobre o 13º, que
// é calculado à parte do salário com as mesmas regras. A redução da Lei 15.270/2025
// usa o rendimento bruto, e não a base de cálculo (exemplos da Receita Federal).
export function detalheDoImposto2026(bruto: number, inss: number, dependentes = 0) {
  const ir = calcularIrrf({
    rendimentos: emCentavos(bruto),
    previdencia: emCentavos(inss),
    dependentes,
  });
  return {
    base: ir.base / 100,
    usaDescontoSimplificado: ir.usaDescontoSimplificado,
    pelaTabela: ir.impostoPelaTabela / 100,
    reducao: ir.reducao / 100,
    imposto: ir.imposto / 100,
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
