// Parâmetros oficiais de 2026 do INSS do empregado e do imposto de renda retido na
// fonte (IRRF) sobre rendimentos mensais. Único lugar com esses números: o motor
// (calculo.ts) e as calculadoras leem daqui. Valores em centavos, para a conta não
// sofrer com os arredondamentos do ponto flutuante.
//
// Fontes (conferidas em 19/10/2026):
// - INSS: Portaria Interministerial MPS/MF nº 13, de 09/01/2026, na tabela do gov.br/inss
//   (https://www.gov.br/inss/pt-br/direitos-e-deveres/inscricao-e-contribuicao/tabela-de-contribuicao-mensal)
// - IRRF: tabela progressiva mensal, dedução por dependente e desconto simplificado
//   (https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2026)
// - Redução da Lei nº 15.270/2025: Lei nº 9.250/1995, art. 3º-A, e exemplos da Receita
//   (https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/exemplos-de-aplicacao-da-lei-15-270-2025)
// - Deduções mensais: Lei nº 9.250/1995, art. 4º (pensão alimentícia, dependentes,
//   previdência) e § 2º (desconto simplificado, alternativo às deduções)
//
// Para outro ano: criar parametros-AAAA.ts com os valores oficiais daquele ano, sem
// supor que nada se repete, e rodar `npm test` com os exemplos oficiais novos.

export type FaixaInss = {
  // Teto da faixa, em centavos
  ate: number;
  // Alíquota em milésimos (7,5% = 75)
  aliquotaPorMil: number;
};

export type FaixaIr = {
  // Teto da faixa da base de cálculo, em centavos (Infinity na última)
  ate: number;
  aliquotaPorMil: number;
  // Parcela a deduzir, em centavos
  deduzir: number;
};

export type ParametrosTributarios = {
  ano: number;
  // Data da última conferência dos valores com as fontes oficiais (AAAA-MM-DD).
  // Só mudar depois de conferir de novo, nunca automaticamente.
  revisadoEm: string;
  inss: FaixaInss[];
  ir: FaixaIr[];
  deducaoPorDependente: number;
  descontoSimplificado: number;
  reducao: {
    // Até este rendimento, a redução zera o imposto
    limiteIsencao: number;
    // Acima deste rendimento, não há redução
    limiteReducao: number;
    // Redução na faixa intermediária: fixo − fator × rendimento
    fixo: number;
    // Fator em milionésimos (0,133145 = 133145)
    fatorPorMilhao: number;
  };
  salarioMinimo: number;
};

export const PARAMETROS_2026: ParametrosTributarios = {
  ano: 2026,
  revisadoEm: "2026-10-19",
  inss: [
    { ate: 162100, aliquotaPorMil: 75 },
    { ate: 290284, aliquotaPorMil: 90 },
    { ate: 435427, aliquotaPorMil: 120 },
    { ate: 847555, aliquotaPorMil: 140 },
  ],
  ir: [
    { ate: 242880, aliquotaPorMil: 0, deduzir: 0 },
    { ate: 282665, aliquotaPorMil: 75, deduzir: 18216 },
    { ate: 375105, aliquotaPorMil: 150, deduzir: 39416 },
    { ate: 466468, aliquotaPorMil: 225, deduzir: 67549 },
    { ate: Infinity, aliquotaPorMil: 275, deduzir: 90873 },
  ],
  deducaoPorDependente: 18959,
  descontoSimplificado: 60720,
  reducao: {
    limiteIsencao: 500000,
    limiteReducao: 735000,
    fixo: 97862,
    fatorPorMilhao: 133145,
  },
  salarioMinimo: 162100,
};
