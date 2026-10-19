// Testes do motor do INSS e do imposto de renda de 2026 (src/lib/tributos).
// Os valores esperados NÃO vêm do código: são os exemplos oficiais da Receita
// Federal e uma conta independente em decimal (Python), feita a partir das tabelas
// oficiais. Se um teste falhar depois de mudar o motor, confira a regra antes de
// trocar o número esperado. Rodar com `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularInss, calcularIrrf, calcularSalario, compararSalarios } from "../src/lib/tributos/calculo.ts";
import { lerReais, lerQuantidade } from "../src/lib/dinheiro.ts";

const c = (reais) => Math.round(Number(reais) * 100);

test("exemplos oficiais da Receita Federal (Lei 15.270/2025)", () => {
  // [salário, INSS usado no exemplo, base, imposto pela tabela, redução, imposto final]
  const exemplos = [
    // O texto da Receita diz base de "R$ 2.428,00", mas 3.036,00 − 607,20 = 2.428,80
    // (erro de digitação no exemplo; o imposto é zero do mesmo jeito)
    ["3036.00", "257.73", "2428.80", "0", "0", "0"],
    ["4000.00", "373.41", "3392.80", "114.76", "114.76", "0"],
    ["5000.00", "509.60", "4392.80", "312.89", "312.89", "0"],
    ["6000.00", "649.60", "5350.40", "562.63", "179.75", "382.88"],
    ["7607.20", "0", "7000.00", "1016.27", "0", "1016.27"],
  ];
  for (const [salario, inss, base, tabela, reducao, imposto] of exemplos) {
    const r = calcularIrrf({ rendimentos: c(salario), previdencia: c(inss) });
    assert.equal(r.base, c(base), `base de ${salario}`);
    assert.equal(r.impostoPelaTabela, c(tabela), `tabela de ${salario}`);
    assert.equal(r.reducao, c(reducao), `redução de ${salario}`);
    assert.equal(r.imposto, c(imposto), `imposto de ${salario}`);
  }
});

// [salário, dependentes, pensão, INSS, base, imposto pela tabela, redução, IRRF, usa simplificado, líquido depois da pensão]
const CASOS = [
  [1621, 0, 0, 121.58, 1013.80, 0, 0, 0, true, 1499.42],
  [2000, 0, 0, 155.69, 1392.80, 0, 0, 0, true, 1844.31],
  [3000, 0, 0, 248.60, 2392.80, 0, 0, 0, true, 2751.40],
  [3036, 0, 0, 252.92, 2428.80, 0, 0, 0, true, 2783.08],
  [4000, 0, 0, 368.60, 3392.80, 114.76, 114.76, 0, true, 3631.40],
  [5000, 0, 0, 501.51, 4392.80, 312.89, 312.89, 0, true, 4498.49],
  [5000.01, 0, 0, 501.52, 4392.81, 312.89, 312.89, 0, true, 4498.49],
  [5500, 0, 0, 571.51, 4892.80, 436.79, 246.32, 190.47, true, 4738.02],
  [6000, 0, 0, 641.51, 5358.49, 564.85, 179.75, 385.10, false, 4973.39],
  [6500, 0, 0, 711.51, 5788.49, 683.10, 113.18, 569.92, false, 5218.57],
  [7000, 0, 0, 781.51, 6218.49, 801.35, 46.61, 754.74, false, 5463.75],
  [7350, 0, 0, 830.51, 6519.49, 884.13, 0, 884.13, false, 5635.36],
  [7350.01, 0, 0, 830.52, 6519.49, 884.13, 0, 884.13, false, 5635.36],
  [8000, 0, 0, 921.51, 7078.49, 1037.85, 0, 1037.85, false, 6040.64],
  [8475.55, 0, 0, 988.09, 7487.46, 1150.32, 0, 1150.32, false, 6337.14],
  [8475.56, 0, 0, 988.09, 7487.47, 1150.32, 0, 1150.32, false, 6337.15],
  [10000, 0, 0, 988.09, 9011.91, 1569.55, 0, 1569.55, false, 7442.36],
  [20000, 0, 0, 988.09, 19011.91, 4319.55, 0, 4319.55, false, 14692.36],
  [1621.01, 0, 0, 121.58, 1013.81, 0, 0, 0, true, 1499.43],
  [2902.84, 0, 0, 236.94, 2295.64, 0, 0, 0, true, 2665.90],
  [2902.85, 0, 0, 236.94, 2295.65, 0, 0, 0, true, 2665.91],
  [4354.27, 0, 0, 411.11, 3747.07, 167.90, 167.90, 0, true, 3943.16],
  [4354.28, 0, 0, 411.11, 3747.08, 167.90, 167.90, 0, true, 3943.17],
  // Dependentes
  [3000, 1, 0, 248.60, 2392.80, 0, 0, 0, true, 2751.40],
  [6000, 2, 0, 641.51, 4979.31, 460.58, 179.75, 280.83, false, 5077.66],
  [7000, 3, 0, 781.51, 5649.72, 644.94, 46.61, 598.33, false, 5620.16],
  [10000, 1, 0, 988.09, 8822.32, 1517.41, 0, 1517.41, false, 7494.50],
  // Pensão alimentícia judicial (dedução legal)
  [6000, 0, 800, 641.51, 4558.49, 350.17, 179.75, 170.42, false, 4388.07],
  [10000, 2, 1500, 988.09, 7132.73, 1052.77, 0, 1052.77, false, 6459.14],
];

test("salário: INSS, base, imposto, redução e líquido (conta independente)", () => {
  for (const [s, dep, pen, inss, base, tab, red, ir, simp, liq] of CASOS) {
    const nome = `${s} com ${dep} dependente(s) e pensão ${pen}`;
    const r = calcularSalario({ salario: c(s), dependentes: dep, pensaoAlimenticia: c(pen) });
    assert.equal(r.inss.total, c(inss), `INSS de ${nome}`);
    assert.equal(r.irrf.base, c(base), `base de ${nome}`);
    assert.equal(r.irrf.impostoPelaTabela, c(tab), `tabela de ${nome}`);
    assert.equal(r.irrf.reducao, c(red), `redução de ${nome}`);
    assert.equal(r.irrf.imposto, c(ir), `IRRF de ${nome}`);
    assert.equal(r.irrf.usaDescontoSimplificado, simp, `desconto simplificado de ${nome}`);
    assert.equal(r.liquido, c(liq), `líquido de ${nome}`);
  }
});

test("INSS: faixas progressivas somam o total e param no teto", () => {
  const r = calcularInss(c(3000));
  assert.deepEqual(
    r.faixas.map((f) => [f.de, f.ate, f.aliquotaPorMil]),
    [[0, 162100, 75], [162100, 290284, 90], [290284, 300000, 120]],
  );
  assert.equal(calcularInss(c(8475.55)).acimaDoTeto, false);
  assert.equal(calcularInss(c(8475.56)).acimaDoTeto, true);
  assert.equal(calcularInss(c(50000)).total, c(988.09));
  assert.equal(calcularInss(0).total, 0);
});

test("nunca soma desconto simplificado com deduções legais", () => {
  // Deduções legais de R$ 600 (menores que R$ 607,20): usa só o simplificado
  const r = calcularIrrf({ rendimentos: c(4000), previdencia: c(600) });
  assert.equal(r.usaDescontoSimplificado, true);
  assert.equal(r.deducaoUsada, c(607.2));
  // Deduções legais de R$ 607,21: usa só as legais
  const s = calcularIrrf({ rendimentos: c(4000), previdencia: c(607.21) });
  assert.equal(s.usaDescontoSimplificado, false);
  assert.equal(s.deducaoUsada, c(607.21));
});

test("a redução usa o rendimento, não a base", () => {
  // R$ 7.607,20 sem deduções: base de R$ 7.000, mas rendimento acima de R$ 7.350, sem redução
  const r = calcularIrrf({ rendimentos: c(7607.2), previdencia: 0 });
  assert.equal(r.tipoDeReducao, "nenhuma");
  assert.equal(r.reducao, 0);
});

test("horas extras e adicionais entram no INSS e no IR", () => {
  const comVariaveis = calcularSalario({ salario: c(5000), variaveis: c(1000) });
  const fixo = calcularSalario({ salario: c(6000) });
  assert.equal(comVariaveis.bruto, fixo.bruto);
  assert.equal(comVariaveis.irrf.imposto, fixo.irrf.imposto);
});

test("comparador: aumento de R$ 5.000 para R$ 6.000", () => {
  const r = compararSalarios({ salario: c(5000) }, { salario: c(6000) });
  assert.equal(r.aumentoBruto, c(1000));
  assert.equal(r.diferencaInss, c(140));
  assert.equal(r.diferencaIrrf, c(385.1));
  assert.equal(r.aumentoLiquido, c(474.9));
  assert.equal(r.percentualQueFicaPorMil, 475);
  assert.equal(compararSalarios({ salario: c(5000) }, { salario: c(5000) }).percentualQueFicaPorMil, null);
});

test("leitura dos campos", () => {
  assert.deepEqual(lerReais("2.500,50"), { tipo: "valido", centavos: 250050 });
  assert.deepEqual(lerReais("2500.50"), { tipo: "valido", centavos: 250050 });
  assert.deepEqual(lerReais("R$ 2.500"), { tipo: "valido", centavos: 250000 });
  assert.deepEqual(lerReais("2500"), { tipo: "valido", centavos: 250000 });
  assert.deepEqual(lerReais("0,1"), { tipo: "valido", centavos: 10 });
  assert.deepEqual(lerReais(""), { tipo: "vazio" });
  assert.equal(lerReais("abc").tipo, "invalido");
  assert.equal(lerReais("2,555").tipo, "invalido");
  assert.equal(lerReais("99999999999").tipo, "invalido");
  assert.deepEqual(lerQuantidade("", 20), { tipo: "valido", quantidade: 0 });
  assert.deepEqual(lerQuantidade("3", 20), { tipo: "valido", quantidade: 3 });
  assert.equal(lerQuantidade("2,5", 20).tipo, "invalido");
  assert.equal(lerQuantidade("21", 20).tipo, "invalido");
});
