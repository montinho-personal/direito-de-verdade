// Testes do motor da calculadora de cobrança indevida (src/lib/cobranca-indevida). Os
// valores esperados vêm de uma conta de referência escrita à parte, em Python
// (tests/referencia/cobranca_indevida.py), com o número-índice do IPCA do IBGE. `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { calcularCobrancaIndevida, corrigirPeloIpca } from "../src/lib/cobranca-indevida/calculo.ts";
import { IPCA_NUMERO_INDICE_X100, PRIMEIRO_MES_DO_IPCA, ULTIMO_MES_DO_IPCA } from "../src/lib/cobranca-indevida/ipca.ts";
import { paraTexto } from "../src/lib/trabalhista/datas.ts";

const ler = (nome) => JSON.parse(fs.readFileSync(new URL(`./referencia/${nome}`, import.meta.url), "utf8"));
const ref = ler("cobranca_indevida.json");
const ipca = ler("ipca_x100.json");
const HOJE = "2026-10-26";
const linha = (data, cobrado, devido, pago = 0, repeticoes = 1) => ({ data, cobrado, devido, pago, repeticoes });
const entrada = (linhas, extra = {}) => ({
  tipo: "outro",
  pagamento: "integral",
  linhas,
  devolvido: 0,
  dataDaDevolucao: "",
  hoje: HOJE,
  ...extra,
});

test("tabela do IPCA igual à do IBGE usada na referência, mês a mês", () => {
  assert.equal(`${PRIMEIRO_MES_DO_IPCA.ano}${String(PRIMEIRO_MES_DO_IPCA.mes).padStart(2, "0")}`, ipca.primeiro);
  assert.deepEqual([...IPCA_NUMERO_INDICE_X100], ipca.valores);
  const meses = (ULTIMO_MES_DO_IPCA.ano - PRIMEIRO_MES_DO_IPCA.ano) * 12 + ULTIMO_MES_DO_IPCA.mes - PRIMEIRO_MES_DO_IPCA.mes + 1;
  assert.equal(IPCA_NUMERO_INDICE_X100.length, meses);
  // Pontos conferidos à mão no Sidra (tabela 1737): dez/2009 = 3017,59; set/2026 = 7695,82
  assert.equal(IPCA_NUMERO_INDICE_X100[0], 301759);
  assert.equal(IPCA_NUMERO_INDICE_X100.at(-1), 769582);
});

for (const { nome, entrada: e, esperado } of ref) {
  test(`referência: ${nome}`, () => {
    const r = calcularCobrancaIndevida(e);
    assert.equal(r.ok, true, JSON.stringify(r.erros));
    assert.equal(r.situacao, esperado.situacao);
    assert.deepEqual([r.cobrado, r.devido, r.pago, r.contestavel, r.excesso, r.devolvido], esperado.totais);
    assert.deepEqual(
      r.parcelas.map((p) => [paraTexto(p.data), p.excesso, p.corrigidoSimples, p.corrigidoDobro]),
      esperado.parcelas,
    );
    assert.deepEqual([r.simples.principal, r.simples.correcao, r.simples.total], esperado.simples);
    assert.deepEqual([r.dobro.principal, r.dobro.correcao, r.dobro.total], esperado.dobro);
    assert.deepEqual(r.avisos, esperado.avisos);
  });
}

test("não paga: nada a restituir, só o valor a contestar", () => {
  const r = calcularCobrancaIndevida(entrada([linha("2026-05-10", 4990, 0)], { pagamento: "nao", devolvido: 500, dataDaDevolucao: "x" }));
  assert.equal(r.situacao, "sem-pagamento");
  assert.equal(r.contestavel, 4990);
  assert.deepEqual([r.simples.total, r.dobro.total, r.devolvido], [0, 0, 0]);
  assert.ok(r.memoria.some((l) => l.includes("o caminho é contestar")));
});

test("simples e dobro: o dobro é o dobro do pago a mais, e os dois nunca se somam", () => {
  const r = calcularCobrancaIndevida(entrada([linha("2026-10-01", 15000, 0)]));
  assert.deepEqual([r.simples.principal, r.simples.total], [15000, 15000]);
  assert.deepEqual([r.dobro.principal, r.dobro.total], [30000, 30000]);
  assert.ok(r.memoria.includes("Os dois cenários são alternativos: não se somam."));
});

test("correção: IPCA de um ano bate com o número-índice (set/2025 → set/2026)", () => {
  // 10.000,00 × 7695,82 ÷ 7359,06 = 10.457,61
  assert.equal(corrigirPeloIpca(1_000_000, { ano: 2025, mes: 9, dia: 15 }), 1_045_761);
  assert.equal(corrigirPeloIpca(1_000_000, { ano: 2026, mes: 9, dia: 15 }), 1_000_000);
  assert.equal(corrigirPeloIpca(0, { ano: 2015, mes: 1, dia: 1 }), 0);
});

test("juros: nunca entram no total; a memória explica por quê", () => {
  const r = calcularCobrancaIndevida(entrada([linha("2026-10-01", 10000, 0)]));
  assert.equal(r.simples.total, r.simples.principal + r.simples.correcao);
  assert.ok(r.memoria.some((l) => l.startsWith("Juros: não incluídos")));
});

test("regras no tempo: corte de 30/03/2021 só em contrato privado; IPCA legal desde 30/08/2024", () => {
  const avisos = (tipo, data) => calcularCobrancaIndevida(entrada([linha(data, 10000, 0)], { tipo })).avisos;
  assert.ok(avisos("tarifa-bancaria", "2021-03-30").includes("modulacao"));
  assert.ok(!avisos("tarifa-bancaria", "2021-03-31").includes("modulacao"));
  assert.ok(!avisos("energia-agua", "2019-01-01").includes("modulacao"));
  assert.ok(avisos("outro", "2024-08-29").includes("indice-antes-da-lei-14905"));
  assert.ok(!avisos("outro", "2024-08-30").includes("indice-antes-da-lei-14905"));
});

test("valores zerados e inválidos viram erro, não conta", () => {
  const erros = (e) => {
    const r = calcularCobrancaIndevida(e);
    assert.equal(r.ok, false);
    return r.erros.map((x) => `${x.linha}:${x.campo}`);
  };
  assert.deepEqual(erros(entrada([])), ["null:linhas"]);
  assert.deepEqual(erros(entrada([linha("2026-01-10", 0, 0)])), ["0:cobrado"]);
  assert.deepEqual(erros(entrada([linha("2026-01-10", 1000, 2000)])), ["0:devido"]);
  assert.deepEqual(erros(entrada([linha("2026-01-10", 1000, 0, 3000)], { pagamento: "parcial" })), ["0:pago"]);
  assert.deepEqual(erros(entrada([linha("2026-01-10", 1000, 0, -1)], { pagamento: "parcial" })), ["0:pago"]);
  assert.deepEqual(erros(entrada([linha("2026-01-10", 1000, 0, 0, 0)])), ["0:repeticoes"]);
  assert.deepEqual(erros(entrada([linha("2026-01-10", 10.5, 0)])), ["0:cobrado"]);
});

test("datas inválidas: impossível, futura, antiga demais, repetição no futuro, devolução antes do pagamento", () => {
  const erros = (e) => calcularCobrancaIndevida(e).erros.map((x) => `${x.campo}: ${x.mensagem}`);
  assert.deepEqual(erros(entrada([linha("2026-02-30", 1000, 0)])), ["data: Data inválida."]);
  assert.deepEqual(erros(entrada([linha("", 1000, 0)])), ["data: Informe a data."]);
  assert.deepEqual(erros(entrada([linha("2026-10-27", 1000, 0)])), ["data: A data não pode ser depois de hoje."]);
  assert.match(erros(entrada([linha("2009-12-31", 1000, 0)]))[0], /^data: Use uma data a partir de 01\/01\/2010/);
  assert.deepEqual(erros(entrada([linha("2026-08-26", 1000, 0, 0, 4)])), [
    "repeticoes: A última repetição cairia em 26/11/2026, depois de hoje.",
  ]);
  assert.deepEqual(erros(entrada([linha("2026-05-10", 1000, 0)], { devolvido: 500, dataDaDevolucao: "2026-05-09" })), [
    "dataDaDevolucao: A devolução não pode ser antes do primeiro pagamento.",
  ]);
  assert.deepEqual(erros(entrada([linha("2026-05-10", 1000, 0)], { devolvido: 500, dataDaDevolucao: "" })), [
    "dataDaDevolucao: Informe a data.",
  ]);
});

test("nenhum valor negativo, mesmo com devolução maior que o pago a mais", () => {
  const r = calcularCobrancaIndevida(entrada([linha("2025-06-20", 30000, 15000)], { devolvido: 99999, dataDaDevolucao: "2025-07-01" }));
  for (const c of [r.simples, r.dobro]) for (const v of Object.values(c)) assert.ok(v >= 0);
  assert.ok(r.avisos.includes("devolvido-maior-que-excesso"));
});

test("limites: no máximo 24 linhas e 240 cobranças", () => {
  const muitas = Array.from({ length: 25 }, () => linha("2026-01-10", 1000, 0));
  assert.equal(calcularCobrancaIndevida(entrada(muitas)).erros[0].campo, "linhas");
  const longas = Array.from({ length: 3 }, () => linha("2016-01-10", 1000, 0, 0, 120));
  assert.equal(calcularCobrancaIndevida(entrada(longas)).erros[0].mensagem, "Use no máximo 240 cobranças no total.");
});
