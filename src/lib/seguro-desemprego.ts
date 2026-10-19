// Conta do seguro-desemprego com os valores de 2026 (trabalhador com carteira
// assinada e empregado doméstico). Fontes em docs/artigos/seguro-desemprego-2026.md.
// Revisar todo ano: a tabela muda em janeiro.

export const SALARIO_MINIMO_2026 = 1621;
export const FAIXA_1_2026 = 2222.17;
export const FAIXA_2_2026 = 3703.99;
export const PARCELA_FIXA_FAIXA_2_2026 = 1777.74;
export const TETO_2026 = 2518.65;

const centavos = (valor: number) => Math.round(valor * 100 + 1e-6) / 100;

// Valor da parcela a partir do salário médio dos 3 meses antes da dispensa
export function valorDaParcela2026(salarioMedio: number) {
  if (!(salarioMedio > 0)) return 0;
  let valor: number;
  if (salarioMedio <= FAIXA_1_2026) valor = salarioMedio * 0.8;
  else if (salarioMedio <= FAIXA_2_2026) {
    valor = (salarioMedio - FAIXA_1_2026) * 0.5 + PARCELA_FIXA_FAIXA_2_2026;
  } else valor = TETO_2026;
  return centavos(Math.min(TETO_2026, Math.max(SALARIO_MINIMO_2026, valor)));
}

// 1, 2 ou 3 (3 vale para o terceiro pedido em diante)
export type Pedido = 1 | 2 | 3;

// Carência: meses trabalhados exigidos para ter direito em cada pedido
export const CARENCIA: Record<Pedido, number> = { 1: 12, 2: 9, 3: 6 };

// Número de parcelas pelos meses trabalhados nos últimos 36 meses (Lei 7.998/1990,
// art. 4º). Zero quando não cumpre a carência do pedido.
export function numeroDeParcelas(pedido: Pedido, meses: number) {
  if (meses < CARENCIA[pedido]) return 0;
  if (meses >= 24) return 5;
  if (meses >= 12) return 4;
  return 3;
}

export type EntradaSeguro = {
  // Salários brutos dos últimos meses antes da dispensa (até 3; os vazios ficam de fora)
  salarios: number[];
  meses: number;
  pedido: Pedido;
  domestico?: boolean;
};

export type Seguro = {
  salarioMedio: number;
  parcela: number;
  parcelas: number;
  total: number;
  temDireito: boolean;
};

export function calcularSeguro(entrada: EntradaSeguro): Seguro | null {
  const salarios = entrada.salarios.filter((valor) => valor > 0).slice(0, 3);
  if (salarios.length === 0 || !(entrada.meses >= 0)) return null;
  const salarioMedio = centavos(salarios.reduce((soma, valor) => soma + valor, 0) / salarios.length);

  // Doméstico: 3 parcelas de um salário mínimo, com 15 meses nos últimos 24
  // (Lei Complementar 150/2015, art. 26)
  if (entrada.domestico) {
    const temDireito = entrada.meses >= 15;
    const parcelas = temDireito ? 3 : 0;
    return {
      salarioMedio,
      parcela: SALARIO_MINIMO_2026,
      parcelas,
      total: centavos(SALARIO_MINIMO_2026 * parcelas),
      temDireito,
    };
  }

  const parcela = valorDaParcela2026(salarioMedio);
  const parcelas = numeroDeParcelas(entrada.pedido, entrada.meses);
  return {
    salarioMedio,
    parcela,
    parcelas,
    total: centavos(parcela * parcelas),
    temDireito: parcelas > 0,
  };
}
