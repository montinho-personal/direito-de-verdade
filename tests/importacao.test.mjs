// Testes do cálculo de impostos de compra internacional (src/lib/importacao.ts). Os
// valores esperados são os exemplos publicados pela Receita Federal na página "Novas
// Regras" e em "Quanto vou pagar de impostos?" (Portal Compras Internacionais,
// atualizados em setembro de 2026), todos com dólar fictício de R$ 5,00. `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularImportacao } from "../src/lib/importacao.ts";

const DOLAR = 50000; // R$ 5,00
const conta = (valor, remessaConforme, icms = 1700) =>
  calcularImportacao({ valor, cotacao: DOLAR, remessaConforme, icmsPorDezMil: icms });

test("Receita, exemplo 1.1: R$ 100 no Remessa Conforme", () => {
  const r = conta(10000, true);
  assert.deepEqual([r.faixa, r.impostoDeImportacao, r.icms, r.impostos], ["ate-50", 0, 2048, 2048]);
});

test("Receita, exemplo 1.2: R$ 330 no Remessa Conforme (60% menos US$ 30)", () => {
  const r = conta(33000, true);
  assert.deepEqual([r.faixa, r.impostoDeImportacaoBruto, r.desconto, r.impostoDeImportacao, r.icms, r.impostos], ["acima-de-50", 19800, 15000, 4800, 7742, 12542]);
});

test("Receita, exemplo 2.1: R$ 100 fora do programa", () => {
  const r = conta(10000, false);
  assert.deepEqual([r.faixa, r.impostoDeImportacao, r.icms, r.impostos], ["fora-do-programa", 6000, 3277, 9277]);
});

test("Receita, exemplo 2.2: R$ 330 fora do programa", () => {
  const r = conta(33000, false);
  assert.deepEqual([r.impostoDeImportacao, r.icms, r.impostos], [19800, 10814, 30614]);
});

test("Receita, exemplo de ICMS: R$ 57 fora do programa (base de R$ 109,88)", () => {
  const r = conta(5700, false);
  assert.deepEqual([r.impostoDeImportacao, r.baseDoIcms, r.icms], [3420, 10988, 1868]);
});

test("Receita, exemplos 1 e 2 do II: R$ 48 e R$ 510 no Remessa Conforme", () => {
  assert.equal(conta(4800, true).impostoDeImportacao, 0);
  assert.equal(conta(51000, true).impostoDeImportacao, 15600);
});

test("limite de US$ 50: exatamente US$ 50 ainda é zero; 1 centavo acima, 60% menos US$ 30", () => {
  assert.equal(conta(25000, true).faixa, "ate-50");
  const r = conta(25001, true);
  assert.equal(r.faixa, "acima-de-50");
  assert.equal(r.impostoDeImportacao, 1); // 150,006 − 150 = 0,01
});

test("ICMS de 20% e cotação com 4 casas", () => {
  const r = calcularImportacao({ valor: 50000, cotacao: 54321, remessaConforme: true, icmsPorDezMil: 2000 });
  // US$ 92,05; II = 300 − 30 × 5,4321 (162,96) = 137,04; ICMS = 637,04 × 20/80 = 159,26
  assert.deepEqual([r.valorEmCentavosDeDolar, r.impostoDeImportacao, r.icms], [9205, 13704, 15926]);
  assert.equal(r.total, 50000 + 13704 + 15926);
});

test("entradas inválidas", () => {
  const campos = (e) => calcularImportacao({ valor: 10000, cotacao: DOLAR, remessaConforme: true, icmsPorDezMil: 1700, ...e }).erros?.map((x) => x.campo) ?? [];
  assert.deepEqual(campos({ valor: 0 }), ["valor"]);
  assert.deepEqual(campos({ cotacao: 0 }), ["cotacao"]);
  assert.deepEqual(campos({ icmsPorDezMil: 1200 }), ["icms"]);
  assert.deepEqual(campos({ valor: 1500001 }), ["valor"]); // acima de US$ 3 mil
});
