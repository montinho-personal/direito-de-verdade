// Testes do motor do 13º (src/lib/trabalhista/decimo-terceiro.ts). Os valores
// esperados vêm de uma conta de referência escrita à parte, em Python, direto das
// regras do Decreto 10.854/2021 (tests/referencia/decimo_terceiro.py). `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { calcular13 } from "../src/lib/trabalhista/decimo-terceiro.ts";

const casos = JSON.parse(fs.readFileSync(new URL("./referencia/decimo_terceiro.json", import.meta.url), "utf8"));

for (const { nome, entrada, esperado } of casos) {
  test(`13º: ${nome}`, () => {
    const r = calcular13(entrada);
    assert.equal(r.ok, true, JSON.stringify(r.erros));
    assert.equal(r.avos, esperado.avos, "avos");
    assert.equal(r.bruto, esperado.bruto, "bruto");
    assert.equal(r.primeira.valor, esperado.primeira, "1ª parcela");
    assert.equal(r.inss.total, esperado.inss, "INSS");
    assert.equal(r.irrf.imposto, esperado.ir, "IR");
    assert.equal(r.segunda, esperado.segunda, "2ª parcela");
    assert.equal(r.totalLiquido, esperado.liquido, "líquido");
    assert.equal(r.ajusteDeJaneiro, esperado.ajuste, "ajuste de janeiro");
  });
}

test("13º: valores conferidos à mão", () => {
  // R$ 3.000 o ano todo: 1ª = 1.500; INSS 248,60; 2ª = 1.251,40 (texto da página)
  const a = calcular13({ salario: 300000 });
  assert.deepEqual([a.primeira.valor, a.inss.total, a.irrf.imposto, a.segunda], [150000, 24860, 0, 125140]);
  // R$ 6.000: IR 385,10 (564,85 pela tabela − redução 179,75)
  const b = calcular13({ salario: 600000 });
  assert.deepEqual([b.irrf.impostoPelaTabela, b.irrf.reducao, b.irrf.imposto], [56485, 17975, 38510]);
  // Admitido em julho, R$ 3.000: 6/12 = 1.500; 1ª = metade de 1/12 × 5 meses até novembro = 625
  const c = calcular13({ salario: 300000, meses: 6 });
  assert.deepEqual([c.bruto, c.primeira.valor, c.primeira.regra], [150000, 62500, "proporcional"]);
  assert.equal(b.primeira.regra, "metade-do-salario");
});

test("13º: variáveis sem dezembro avisam do ajuste de janeiro", () => {
  const r = calcular13({ salario: 350000, mediaVariaveis: 40000 });
  assert.equal(r.temVariavelSemAjuste, true);
  assert.equal(calcular13({ salario: 350000 }).temVariavelSemAjuste, false);
});

test("13º: adiantamento maior que o 13º não deixa a 2ª parcela negativa", () => {
  const r = calcular13({ salario: 300000, meses: 3, adiantamentoRecebido: 150000 });
  assert.equal(r.segunda, 0);
  assert.ok(r.faltouDescontar > 0);
});

test("13º: afastamento pelo INSS tira os meses e mostra quanto valeriam", () => {
  // R$ 3.000, 3 meses de auxílio: 9/12 = 2.250 da empresa; os 3 meses valem 750
  const r = calcular13({ salario: 300000, mesesAfastadoPeloInss: 3, motivoDoAfastamento: "acidente" });
  assert.equal(r.bruto, 225000);
  assert.deepEqual(r.afastamento, { motivo: "acidente", valorDosMeses: 75000 });
  assert.equal(r.primeira.regra, "proporcional");
  assert.equal(calcular13({ salario: 300000, mesesAfastadoPeloInss: 2 }).afastamento.motivo, "doenca");
  assert.equal(calcular13({ salario: 300000 }).afastamento, null);
});

test("13º: centavos e limites das faixas sem erro de ponto flutuante", () => {
  for (const salario of [162101, 253789, 500001, 735001, 847555, 847556, 999999]) {
    const r = calcular13({ salario });
    assert.ok(Number.isInteger(r.bruto + r.inss.total + r.irrf.imposto + r.segunda + r.primeira.valor));
    assert.equal(r.primeira.valor + r.inss.total + r.irrf.imposto + r.segunda, r.bruto);
  }
});

test("13º: entradas inválidas", () => {
  const campos = (e) => calcular13(e).erros?.map((x) => x.campo) ?? [];
  assert.deepEqual(campos({ salario: 0 }), ["salario"]);
  assert.deepEqual(campos({ salario: -5 }), ["salario"]);
  assert.deepEqual(campos({ salario: 300000, meses: 13 }), ["meses"]);
  assert.deepEqual(campos({ salario: 300000, admissao: "2026-02-30" }), ["admissao"]);
  assert.deepEqual(campos({ salario: 300000, admissao: "2026-05-01", saida: "2026-04-01" }), ["saida"]);
  assert.deepEqual(campos({ salario: 300000, admissao: "2027-01-05" }), ["admissao"]);
  assert.deepEqual(campos({ salario: 300000, admissao: "2026-12-20" }), ["admissao"]);
  assert.deepEqual(campos({ salario: 300000, meses: 2, mesesComFaltas: 2 }), ["mesesComFaltas"]);
  assert.deepEqual(campos({ salario: 300000, mesDoAdiantamento: 12 }), ["mesDoAdiantamento"]);
  assert.deepEqual(campos({ salario: 300000, reajuste: { salario: 0, mes: 5 } }), ["reajuste"]);
});
