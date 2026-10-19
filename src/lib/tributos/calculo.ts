// Motor de cálculo do INSS do empregado e do imposto de renda retido na fonte sobre
// rendimentos mensais (salário CLT e 13º). Não sabe nada de tela: recebe e devolve
// centavos inteiros. As calculadoras convertem reais ↔ centavos na borda.
//
// Arredondamento: as contas intermediárias são exatas (inteiros); cada etapa que a
// folha mostra (INSS, imposto pela tabela, redução, imposto final) é arredondada ao
// centavo mais próximo, com meio centavo para cima. A Receita não fixa a regra de
// arredondamento da folha: o holerite pode diferir em 1 centavo.
import { PARAMETROS_2026, type ParametrosTributarios } from "./parametros-2026.ts";

// Divisão de inteiros não negativos com arredondamento ao inteiro mais próximo (meio para cima)
export function dividirArredondando(numerador: number, divisor: number) {
  return Math.floor((2 * numerador + divisor) / (2 * divisor));
}

export type FaixaDoInss = {
  // Começo e fim da parte do salário que cai na faixa, em centavos
  de: number;
  ate: number;
  aliquotaPorMil: number;
  // Contribuição da faixa, em centavos (com arredondamento só para exibir)
  valor: number;
};

export type DetalheDoInss = {
  faixas: FaixaDoInss[];
  total: number;
  // O salário passou do teto do INSS (a contribuição para no teto)
  acimaDoTeto: boolean;
};

// INSS progressivo: cada alíquota vale só para a parte do salário dentro da faixa
export function calcularInss(
  salarioDeContribuicao: number,
  parametros: ParametrosTributarios = PARAMETROS_2026,
): DetalheDoInss {
  const faixas: FaixaDoInss[] = [];
  let inicio = 0;
  // Soma exata em milésimos de centavo
  let totalPorMil = 0;
  for (const faixa of parametros.inss) {
    if (salarioDeContribuicao <= inicio) break;
    const fim = Math.min(salarioDeContribuicao, faixa.ate);
    const parcela = (fim - inicio) * faixa.aliquotaPorMil;
    totalPorMil += parcela;
    faixas.push({
      de: inicio,
      ate: fim,
      aliquotaPorMil: faixa.aliquotaPorMil,
      valor: dividirArredondando(parcela, 1000),
    });
    inicio = faixa.ate;
  }
  const teto = parametros.inss[parametros.inss.length - 1].ate;
  return {
    faixas,
    total: dividirArredondando(totalPorMil, 1000),
    acimaDoTeto: salarioDeContribuicao > teto,
  };
}

export type EntradaDoIrrf = {
  // Rendimentos tributáveis do mês (salário bruto com horas extras, adicionais etc.)
  rendimentos: number;
  // Contribuição ao INSS descontada no mês
  previdencia: number;
  dependentes?: number;
  // Pensão alimentícia por decisão judicial, acordo homologado ou escritura pública
  pensaoAlimenticia?: number;
};

export type DetalheDoIrrf = {
  // Deduções legais somadas (INSS + dependentes + pensão)
  deducoesLegais: number;
  deducaoDosDependentes: number;
  descontoSimplificado: number;
  usaDescontoSimplificado: boolean;
  // Dedução que entrou na conta (a maior das duas)
  deducaoUsada: number;
  base: number;
  faixa: number; // 1 a 5
  aliquotaPorMil: number;
  parcelaADeduzir: number;
  impostoPelaTabela: number;
  // Faixa da tabela de redução: "isencao" (até R$ 5 mil), "parcial" ou "nenhuma"
  tipoDeReducao: "isencao" | "parcial" | "nenhuma";
  reducao: number;
  imposto: number;
};

// IRRF mensal com a redução da Lei 15.270/2025. A base usa a maior dedução entre as
// legais e o desconto simplificado (nunca as duas); a redução olha os rendimentos
// tributáveis, e não a base de cálculo (Lei 9.250/1995, arts. 3º-A e 4º).
export function calcularIrrf(
  entrada: EntradaDoIrrf,
  parametros: ParametrosTributarios = PARAMETROS_2026,
): DetalheDoIrrf {
  const { rendimentos, previdencia } = entrada;
  const dependentes = Math.max(0, Math.floor(entrada.dependentes ?? 0));
  const pensao = Math.max(0, entrada.pensaoAlimenticia ?? 0);

  const deducaoDosDependentes = dependentes * parametros.deducaoPorDependente;
  const deducoesLegais = previdencia + deducaoDosDependentes + pensao;
  const usaDescontoSimplificado = parametros.descontoSimplificado > deducoesLegais;
  const deducaoUsada = usaDescontoSimplificado ? parametros.descontoSimplificado : deducoesLegais;
  const base = Math.max(0, rendimentos - deducaoUsada);

  const indice = parametros.ir.findIndex((faixa) => base <= faixa.ate);
  const faixa = parametros.ir[indice];
  const impostoPelaTabela = Math.max(
    0,
    dividirArredondando(base * faixa.aliquotaPorMil, 1000) - faixa.deduzir,
  );

  const { limiteIsencao, limiteReducao, fixo, fatorPorMilhao } = parametros.reducao;
  let tipoDeReducao: DetalheDoIrrf["tipoDeReducao"];
  let reducaoDaLei: number;
  if (rendimentos <= limiteIsencao) {
    tipoDeReducao = "isencao";
    reducaoDaLei = impostoPelaTabela;
  } else if (rendimentos <= limiteReducao) {
    tipoDeReducao = "parcial";
    // Em milionésimos de centavo para a conta ser exata; nunca negativa
    const exata = fixo * 1_000_000 - rendimentos * fatorPorMilhao;
    reducaoDaLei = exata > 0 ? dividirArredondando(exata, 1_000_000) : 0;
  } else {
    tipoDeReducao = "nenhuma";
    reducaoDaLei = 0;
  }
  // A redução não pode passar do imposto da tabela (art. 3º-A, § 1º)
  const reducao = Math.min(reducaoDaLei, impostoPelaTabela);

  return {
    deducoesLegais,
    deducaoDosDependentes,
    descontoSimplificado: parametros.descontoSimplificado,
    usaDescontoSimplificado,
    deducaoUsada,
    base,
    faixa: indice + 1,
    aliquotaPorMil: faixa.aliquotaPorMil,
    parcelaADeduzir: faixa.deduzir,
    impostoPelaTabela,
    tipoDeReducao,
    reducao,
    imposto: impostoPelaTabela - reducao,
  };
}

export type EntradaDoSalario = {
  // Salário bruto mensal, em centavos
  salario: number;
  // Horas extras, adicionais e comissões do mês (entram no INSS e no IR)
  variaveis?: number;
  dependentes?: number;
  pensaoAlimenticia?: number;
};

export type ResultadoDoSalario = {
  bruto: number;
  inss: DetalheDoInss;
  irrf: DetalheDoIrrf;
  pensaoAlimenticia: number;
  totalDeDescontos: number;
  // Depois do INSS e do IR
  liquidoAntesDaPensao: number;
  // Depois do INSS, do IR e da pensão (o que cai na conta, sem outros descontos)
  liquido: number;
};

// Salário líquido de quem tem carteira assinada: INSS, IRRF e, se houver, pensão
export function calcularSalario(
  entrada: EntradaDoSalario,
  parametros: ParametrosTributarios = PARAMETROS_2026,
): ResultadoDoSalario {
  const bruto = entrada.salario + (entrada.variaveis ?? 0);
  const pensaoAlimenticia = entrada.pensaoAlimenticia ?? 0;
  const inss = calcularInss(bruto, parametros);
  const irrf = calcularIrrf(
    {
      rendimentos: bruto,
      previdencia: inss.total,
      dependentes: entrada.dependentes,
      pensaoAlimenticia,
    },
    parametros,
  );
  const liquidoAntesDaPensao = bruto - inss.total - irrf.imposto;
  const totalDeDescontos = inss.total + irrf.imposto + pensaoAlimenticia;
  return {
    bruto,
    inss,
    irrf,
    pensaoAlimenticia,
    totalDeDescontos,
    liquidoAntesDaPensao,
    liquido: bruto - totalDeDescontos,
  };
}

export type Comparacao = {
  atual: ResultadoDoSalario;
  novo: ResultadoDoSalario;
  aumentoBruto: number;
  aumentoLiquido: number;
  diferencaInss: number;
  diferencaIrrf: number;
  // Parte do aumento bruto que fica com o trabalhador, em décimos de ponto
  // percentual (875 = 87,5%); null se não houve aumento
  percentualQueFicaPorMil: number | null;
};

// Dois salários na mesma conta, para ver quanto de um aumento sobra no bolso
export function compararSalarios(
  atual: EntradaDoSalario,
  novo: EntradaDoSalario,
  parametros: ParametrosTributarios = PARAMETROS_2026,
): Comparacao {
  const a = calcularSalario(atual, parametros);
  const n = calcularSalario(novo, parametros);
  const aumentoBruto = n.bruto - a.bruto;
  const aumentoLiquido = n.liquidoAntesDaPensao - a.liquidoAntesDaPensao;
  return {
    atual: a,
    novo: n,
    aumentoBruto,
    aumentoLiquido,
    diferencaInss: n.inss.total - a.inss.total,
    diferencaIrrf: n.irrf.imposto - a.irrf.imposto,
    percentualQueFicaPorMil:
      aumentoBruto > 0 ? dividirArredondando(Math.max(0, aumentoLiquido) * 1000, aumentoBruto) : null,
  };
}
