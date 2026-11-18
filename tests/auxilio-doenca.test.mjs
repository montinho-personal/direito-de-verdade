// Calculadora do auxílio-doença: 91% do salário de benefício, limite da média dos 12 últimos
// salários de contribuição, piso do salário mínimo e teto do INSS de 2026.
import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularAuxilioDoenca, tetoDoInss } from "../src/lib/auxilio-doenca/valor.ts";

test("teto do INSS de 2026", () => {
  assert.equal(tetoDoInss(), 847555);
});

test("exemplo do artigo: média 3.200, últimos 12 em 3.000 → 2.912", () => {
  const r = calcularAuxilioDoenca({ mediaGeral: 320000, mediaDos12: 300000 });
  assert.equal(r.noventaEUmPorCento, 291200);
  assert.equal(r.valor, 291200);
  assert.deepEqual(r.avisos, []);
});

test("exemplo do artigo: últimos 12 em 2.500 limitam o valor", () => {
  const r = calcularAuxilioDoenca({ mediaGeral: 320000, mediaDos12: 250000 });
  assert.equal(r.valor, 250000);
  assert.deepEqual(r.avisos, ["limite-12"]);
});

test("sem a média dos 12 últimos, vale 91%", () => {
  assert.equal(calcularAuxilioDoenca({ mediaGeral: 200000 }).valor, 182000);
});

test("piso: 91% abaixo do mínimo sobe para R$ 1.621", () => {
  const r = calcularAuxilioDoenca({ mediaGeral: 170000 });
  assert.equal(r.noventaEUmPorCento, 154700);
  assert.equal(r.valor, 162100);
  assert.deepEqual(r.avisos, ["piso"]);
});

test("média abaixo do mínimo: salário de benefício sobe ao mínimo e o valor fica no piso", () => {
  const r = calcularAuxilioDoenca({ mediaGeral: 100000 });
  assert.equal(r.salarioDeBeneficio, 162100);
  assert.equal(r.valor, 162100);
});

test("teto: média acima do teto dá no máximo R$ 7.712,75", () => {
  const r = calcularAuxilioDoenca({ mediaGeral: 1000000 });
  assert.equal(r.salarioDeBeneficio, 847555);
  assert.equal(r.valor, 771275);
  assert.deepEqual(r.avisos, ["teto"]);
});

test("limite dos 12 abaixo do mínimo: o piso prevalece", () => {
  const r = calcularAuxilioDoenca({ mediaGeral: 300000, mediaDos12: 150000 });
  assert.equal(r.valor, 162100);
  assert.deepEqual(r.avisos, ["limite-12", "piso"]);
});
