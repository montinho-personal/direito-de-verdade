// Testes do motor das férias (src/lib/trabalhista/ferias.ts). Os valores esperados vêm
// de uma conta de referência escrita à parte, em Python, direto da CLT e das regras da
// Receita (tests/referencia/ferias.py). `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { calcularFerias, compararVenda, diasPelasFaltas } from "../src/lib/trabalhista/ferias.ts";
import { paraTexto } from "../src/lib/trabalhista/datas.ts";

const casos = JSON.parse(fs.readFileSync(new URL("./referencia/ferias.json", import.meta.url), "utf8"));

for (const { nome, entrada, esperado } of casos) {
  test(`férias: ${nome}`, () => {
    const r = calcularFerias(entrada);
    assert.equal(r.ok, true, JSON.stringify(r.erros));
    assert.equal(r.diasDeDireito, esperado.direito, "dias de direito");
    assert.equal(r.ferias, esperado.ferias, "férias");
    assert.equal(r.tercoDasFerias, esperado.terco, "1/3");
    assert.equal(r.abono + r.tercoDoAbono, esperado.abono, "abono");
    assert.equal(r.inss.total, esperado.inss, "INSS");
    assert.equal(r.irrf.imposto, esperado.ir, "IR");
    assert.equal(r.liquido, esperado.liquido, "líquido");
    if (esperado.pagamentoAte) {
      assert.equal(paraTexto(r.datas.pagamentoAte), esperado.pagamentoAte, "pagamento");
      assert.equal(paraTexto(r.datas.volta), esperado.volta, "volta");
      assert.equal(r.inicioAntesDoDomingo, esperado.sextaOuSabado, "sexta ou sábado");
    }
    if (esperado.periodo) {
      assert.equal(paraTexto(r.periodo.fim), esperado.periodo.fim, "fim do período aquisitivo");
      assert.equal(paraTexto(r.periodo.concederAte), esperado.periodo.concederAte, "prazo de concessão");
      assert.equal(paraTexto(r.periodo.pedirAbonoAte), esperado.periodo.pedirAbonoAte, "pedido do abono");
      assert.equal(r.diasForaDoPrazo, esperado.diasForaDoPrazo, "dias fora do prazo");
      assert.equal(r.dobra, esperado.dobra, "dobra");
    } else {
      assert.equal(r.dobra, 0);
    }
  });
}

test("férias: valores conferidos à mão", () => {
  // R$ 3.000, 30 dias: 3.000 + 1.000; INSS 368,60; sem IR (4.000 está na faixa da redução total)
  const a = calcularFerias({ salario: 300000 });
  assert.deepEqual([a.ferias, a.tercoDasFerias, a.inss.total, a.irrf.imposto, a.liquido], [300000, 100000, 36860, 0, 363140]);
  // Vendendo 10 dias: 20 dias = 2.000 + 666,67; abono 1.000 + 333,33, sem INSS nem IR
  const b = calcularFerias({ salario: 300000, diasVendidos: 10 });
  assert.deepEqual([b.ferias, b.abono, b.tercoDoAbono, b.ganhoDaVenda], [200000, 100000, 33333, 133333]);
  assert.equal(b.diasDeDescanso, 20);
  // 1/3 de R$ 1.600 = 533,33 (pergunta do Google)
  assert.equal(calcularFerias({ salario: 160000 }).tercoDasFerias, 53333);
});

test("férias: dias pelas faltas (CLT, art. 130)", () => {
  assert.deepEqual([0, 5, 6, 14, 15, 23, 24, 32, 33].map(diasPelasFaltas), [30, 30, 24, 24, 18, 18, 12, 12, 0]);
});

test("férias: soma do recibo fecha ao centavo", () => {
  for (const salario of [162101, 253789, 375001, 551325, 735001, 999999]) {
    const r = calcularFerias({ salario, diasVendidos: 10, adiantar13: true });
    assert.equal(r.bruto, r.ferias + r.tercoDasFerias + r.abono + r.tercoDoAbono + r.adiantamento13);
    assert.equal(r.liquido, r.bruto - r.inss.total - r.irrf.imposto - r.pensao);
  }
});

test("férias: entradas inválidas", () => {
  const campos = (e) => calcularFerias(e).erros?.map((x) => x.campo) ?? [];
  assert.deepEqual(campos({ salario: 0 }), ["salario"]);
  assert.deepEqual(campos({ salario: 300000, faltas: 33 }), ["faltas"]);
  assert.deepEqual(campos({ salario: 300000, diasVendidos: 11 }), ["diasVendidos"]);
  assert.deepEqual(campos({ salario: 300000, faltas: 8, diasVendidos: 9 }), ["diasVendidos"]);
  assert.deepEqual(campos({ salario: 300000, diasDeDescanso: 4 }), ["diasDeDescanso"]);
  assert.deepEqual(campos({ salario: 300000, diasDeDescanso: 27 }), ["diasDeDescanso"]); // sobram 3
  assert.deepEqual(campos({ salario: 300000, diasDeDescanso: 10, diasVendidos: 10 }), ["diasDeDescanso"]); // 10 + 10, nenhum com 14
  assert.deepEqual(campos({ salario: 300000, diasDeDescanso: 21, diasVendidos: 10 }), ["diasDeDescanso"]);
  assert.deepEqual(campos({ salario: 300000, inicio: "2026-02-30" }), ["inicio"]);
  assert.deepEqual(campos({ salario: 300000, diasDeDescanso: 16 }), []); // 16 + 14
});

test("férias: períodos e prazo das férias", () => {
  const campos = (e) => calcularFerias(e).erros?.map((x) => x.campo) ?? [];
  // Antes de 12 meses de empresa, só férias coletivas
  assert.deepEqual(campos({ salario: 300000, admissao: "2026-03-01", inicio: "2027-02-28" }), ["inicio"]);
  assert.deepEqual(campos({ salario: 300000, admissao: "2026-03-01", inicio: "2027-03-01" }), []);
  // Período que ainda não estava completo
  assert.deepEqual(campos({ salario: 300000, admissao: "2024-03-01", inicio: "2026-01-10", periodo: 2 }), ["periodo"]);
  assert.deepEqual(campos({ salario: 300000, admissao: "2024-02-30" }), ["admissao"]);
  // Sem data de início, não há dobra nem aviso de sexta-feira
  const r = calcularFerias({ salario: 300000, admissao: "2020-01-10", periodo: 1 });
  assert.equal(r.ok, true);
  assert.equal(r.dobra, 0);
  assert.equal(r.inicioAntesDoDomingo, false);
});

test("férias: comparação entre tirar 30 dias e vender 10", () => {
  // R$ 3.000: 3.000 + 1.000 contra 2.000 + 666,67 + 1.000 + 333,33 + 1.000 de salário
  const c = compararVenda({ salario: 300000 });
  assert.equal(c.integral.diasDeDescanso, 30);
  assert.equal(c.vendendo.diasDeDescanso, 20);
  assert.equal(c.salarioDosDiasTrabalhados, 100000);
  assert.equal(c.brutoIntegral, 400000);
  assert.equal(c.brutoVendendo, 200000 + 66667 + 133333 + 100000);
  assert.equal(c.diferencaBruta, 100000);
  // Com 8 faltas: 24 dias de direito, vende 8
  const f = compararVenda({ salario: 300000, faltas: 8 });
  assert.equal(f.vendendo.diasVendidos, 8);
  assert.equal(f.vendendo.diasDeDescanso, 16);
  // Ignora uma divisão de dias escolhida antes
  assert.equal(compararVenda({ salario: 300000, diasDeDescanso: 15 }).integral.diasDeDescanso, 30);
  // Sem salário, sem comparação
  assert.equal(compararVenda({ salario: 0 }), null);
});

test("férias: valores extremos", () => {
  for (const salario of [1, 99, 162100, 100000000, 999999999]) {
    const r = calcularFerias({ salario, diasVendidos: 10 });
    assert.equal(r.ok, true);
    assert.ok(r.liquido >= 0 && r.liquido <= r.bruto);
    assert.ok(Number.isInteger(r.liquido));
  }
  assert.equal(calcularFerias({ salario: -100 }).ok, false);
  assert.equal(calcularFerias({ salario: Number.NaN }).ok, false);
});
