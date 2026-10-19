// Testes do motor da rescisão (src/lib/trabalhista). Os valores esperados vêm de uma
// conta de referência escrita à parte, em Python, direto das regras da lei
// (tests/referencia/rescisao.py → rescisao.json). Rodar com `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { calcularRescisao } from "../src/lib/trabalhista/rescisao.ts";
import { anosCompletos, lerData, paraTexto, somarMeses } from "../src/lib/trabalhista/datas.ts";

const casos = JSON.parse(fs.readFileSync(new URL("./referencia/rescisao.json", import.meta.url), "utf8"));

for (const { nome, entrada, esperado } of casos) {
  test(`rescisão: ${nome}`, () => {
    const r = calcularRescisao(entrada);
    assert.equal(r.ok, true, JSON.stringify(r.erros));
    assert.deepEqual(Object.fromEntries(r.verbas.map((v) => [v.id, v.valor])), esperado.verbas, "verbas");
    assert.equal(r.bruto, esperado.bruto, "bruto");
    assert.deepEqual(Object.fromEntries(r.descontos.map((d) => [d.id, d.valor])), esperado.descontos, "descontos");
    assert.equal(r.liquido, esperado.liquido, "líquido");
    assert.equal(r.fgts.depositosDaRescisao, esperado.fgts.depositos, "depósitos do FGTS");
    assert.equal(r.fgts.multa, esperado.fgts.multa, "multa do FGTS");
    assert.equal(r.datas.diasDeAviso, esperado.diasDeAviso, "dias de aviso");
    assert.equal(r.datas.fimProjetado ? paraTexto(r.datas.fimProjetado) : null, esperado.fimProjetado, "fim projetado");
    assert.equal(paraTexto(r.datas.prazoDePagamento), esperado.prazo, "prazo de pagamento");
  });
}

test("valores conferidos à mão", () => {
  // R$ 3.000, admissão 01/02/2023, saída 20/10/2026: 3 anos completos → 39 dias de aviso
  // (30 + 3 × 3), projeção até 28/11/2026 (Súmula 380: exclui o dia do começo)
  const r = calcularRescisao({ motivo: "sem-justa-causa", salario: 300000, admissao: "2023-02-01", saida: "2026-10-20", fgtsParaFinsRescisorios: 900000 });
  const v = Object.fromEntries(r.verbas.map((x) => [x.id, x.valor]));
  assert.equal(v.saldo, 200000); // 20/30 de R$ 3.000
  assert.equal(v.aviso, 390000); // 39/30 de R$ 3.000
  assert.equal(v["decimo-proporcional"] + v["decimo-aviso"], 275000); // 11/12 (jan a nov)
  assert.equal(v["ferias-proporcionais"] + v["ferias-aviso"], 250000); // 10/12 (01/02 a 28/11)
  assert.equal(paraTexto(r.datas.fimProjetado), "2026-11-28");
  assert.equal(r.fgts.multa, 387680); // 40% de (9.000 + 8% de 7.650)
});

test("férias em dobro: prazo de concessão vencido antes da saída", () => {
  // Período 10/03/2024–09/03/2025: prazo até 09/03/2026 → em dobro na saída em 20/10/2026
  const r = calcularRescisao({ motivo: "justa-causa", feriasVencidas: 2, salario: 300000, admissao: "2020-03-10", saida: "2026-10-20" });
  const vencidas = r.verbas.find((x) => x.id === "ferias-vencidas");
  assert.deepEqual(vencidas.periodos.map((p) => p.emDobro), [true, false]);
  assert.equal(vencidas.valor, 900000); // 2 × 3.000 (dobro) + 3.000
});

test("FGTS: estimativa sem a base, saque-aniversário e saque por modalidade", () => {
  const base = { salario: 300000, admissao: "2023-02-01", saida: "2026-10-20" };
  const est = calcularRescisao({ ...base, motivo: "sem-justa-causa" });
  assert.equal(est.fgts.origemDaBase, "estimado");
  // 8% de R$ 3.000 por mês de contrato (1.358 dias ÷ 30,436875), com 13º e terço (× 40/36)
  const estimada = Math.round(24000 * (1358 / 30.436875) * (40 / 36));
  assert.equal(est.fgts.base, estimada + est.fgts.depositosDaRescisao);
  assert.equal(est.fgts.multa, Math.round(est.fgts.base * 0.4));
  const aniv = calcularRescisao({ ...base, motivo: "sem-justa-causa", saqueAniversario: true, fgtsParaFinsRescisorios: 900000 });
  assert.equal(aniv.fgts.saque, "so-multa");
  assert.equal(aniv.fgts.saqueEstimado, aniv.fgts.multa);
  const tudo = calcularRescisao({ ...base, motivo: "sem-justa-causa", fgtsParaFinsRescisorios: 900000, saldoAtualDoFgts: 850000 });
  assert.equal(tudo.fgts.saqueEstimado, 850000 + tudo.fgts.depositosDaRescisao + tudo.fgts.multa);
  assert.equal(calcularRescisao({ ...base, motivo: "acordo" }).fgts.saque, "ate-80");
  assert.equal(calcularRescisao({ ...base, motivo: "pedido" }).fgts.saque, "nao");
  assert.equal(calcularRescisao({ ...base, motivo: "justa-causa" }).fgts.multa, 0);
  assert.equal(calcularRescisao({ ...base, motivo: "pedido" }).podeTerSeguroDesemprego, false);
});

test("desconto do aviso maior que as verbas não deixa o líquido negativo", () => {
  const r = calcularRescisao({ motivo: "pedido", aviso: "nao-cumprido", salario: 300000, admissao: "2026-10-15", saida: "2026-10-20" });
  assert.equal(r.liquido, 0);
  assert.equal(r.descontoQueSobrou, r.totalDeDescontos - r.bruto);
});

test("entradas inválidas", () => {
  const ok = { motivo: "sem-justa-causa", salario: 300000, admissao: "2023-02-01", saida: "2026-10-20" };
  const campos = (e) => calcularRescisao(e).erros?.map((x) => x.campo) ?? [];
  assert.deepEqual(campos({ ...ok, salario: 0 }), ["salario"]);
  assert.deepEqual(campos({ ...ok, salario: -100 }), ["salario"]);
  assert.deepEqual(campos({ ...ok, saida: "2026-02-30" }), ["saida"]);
  assert.deepEqual(campos({ ...ok, admissao: "" }), ["admissao"]);
  assert.deepEqual(campos({ ...ok, saida: "2022-01-01" }), ["saida"]);
  assert.deepEqual(campos({ ...ok, feriasVencidas: 2, admissao: "2025-06-01" }), ["feriasVencidas"]);
  assert.deepEqual(campos({ ...ok, motivo: "pedido", aviso: "parcial", diasDeAvisoCumpridos: 30 }), ["diasDeAvisoCumpridos"]);
});

test("datas: anos bissextos e virada de mês", () => {
  assert.equal(lerData("2024-02-29") !== null, true);
  assert.equal(lerData("2025-02-29"), null);
  assert.deepEqual(somarMeses({ ano: 2024, mes: 2, dia: 29 }, 12), { ano: 2025, mes: 2, dia: 28 });
  assert.deepEqual(somarMeses({ ano: 2026, mes: 1, dia: 31 }, 1), { ano: 2026, mes: 2, dia: 28 });
  assert.equal(anosCompletos(lerData("2024-02-29"), lerData("2025-02-27")), 0);
  assert.equal(anosCompletos(lerData("2024-02-29"), lerData("2025-02-28")), 1);
  assert.equal(anosCompletos(lerData("2023-10-20"), lerData("2026-10-19")), 2);
  assert.equal(anosCompletos(lerData("2023-10-20"), lerData("2026-10-20")), 3);
});
