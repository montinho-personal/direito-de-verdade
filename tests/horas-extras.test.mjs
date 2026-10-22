// Testes do motor das horas extras (src/lib/trabalhista/horas-extras.ts). Os valores
// esperados vêm de uma conta de referência escrita à parte, em Python, com frações exatas
// (tests/referencia/horas_extras.py). `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  calcularHorasExtras,
  conferirHolerite,
  diasDoMesParaODsr,
  divisorEhOficial,
  divisorSugerido,
  formatarHoras,
  lerHoras,
  simularSalarioComHorasExtras,
} from "../src/lib/trabalhista/horas-extras.ts";

const casos = JSON.parse(fs.readFileSync(new URL("./referencia/horas_extras.json", import.meta.url), "utf8"));

for (const { nome, entrada, esperado } of casos) {
  test(`horas extras: ${nome}`, () => {
    const r = calcularHorasExtras(entrada);
    assert.equal(r.ok, true, JSON.stringify(r.erros));
    assert.equal(r.horaNormal, esperado.horaNormal, "hora normal");
    assert.deepEqual(r.linhas.map((l) => l.valor), esperado.linhas, "linhas");
    assert.equal(r.horasExtras, esperado.horasExtras, "horas extras");
    assert.equal(r.dsr, esperado.dsr, "DSR");
    assert.equal(r.total, esperado.total, "total");
    assert.equal(r.reflexos.decimoTerceiro, esperado.decimoTerceiro, "13º");
    assert.equal(r.reflexos.feriasComUmTerco, esperado.ferias, "férias + 1/3");
    assert.equal(r.reflexos.fgts, esperado.fgts, "FGTS");
    if (esperado.simulacao) {
      const s = simularSalarioComHorasExtras(r.base, r.total, esperado.simulacao.dependentes);
      assert.equal(s.aumentoBruto, esperado.simulacao.aumentoBruto, "aumento bruto");
      assert.equal(s.diferencaInss, esperado.simulacao.diferencaInss, "INSS a mais");
      assert.equal(s.diferencaIrrf, esperado.simulacao.diferencaIrrf, "IR a mais");
      assert.equal(s.aumentoLiquido, esperado.simulacao.aumentoLiquido, "aumento líquido");
    }
  });
}

test("exemplos do texto: salário mínimo (R$ 7,37 a hora) e R$ 2.200 (R$ 10)", () => {
  const minimo = calcularHorasExtras({ salario: 162100, divisor: 220, lancamentos: [{ minutos: 60, adicionalPorMil: 500 }] });
  assert.deepEqual([minimo.horaNormal, minimo.linhas[0].valorDaHora, minimo.horasExtras], [737, 1105, 1105]);
  const meia = calcularHorasExtras({ salario: 220000, divisor: 220, lancamentos: [{ minutos: 30, adicionalPorMil: 500 }] });
  assert.equal(meia.horasExtras, 750); // 30 minutos = meia hora de R$ 15
});

test("hora extra noturna: R$ 2.200, 1h de relógio = 1h08min34s de hora noturna", () => {
  const r = calcularHorasExtras({ salario: 220000, divisor: 220, lancamentos: [{ minutos: 60, adicionalPorMil: 500, noturna: true }] });
  // 10 × 1,2 × 1,5 × 60/52,5 = 20,5714...
  assert.deepEqual([r.linhas[0].valorDaHora, r.linhas[0].valor, r.linhas[0].minutosConsiderados], [1800, 2057, 69]);
});

test("ler horas com minutos", () => {
  const casos = { "1h30": 90, "1:30": 90, "1h": 60, "90min": 90, "45 min": 45, "2": 120, "1,5": 90, "0,25": 15, "0,78": 47, "10": 600, "1h30min": 90, "4:47": 287 };
  for (const [texto, minutos] of Object.entries(casos)) assert.equal(lerHoras(texto), minutos, texto);
  for (const texto of ["", "abc", "1:75", "-1", "1h-30"]) assert.equal(lerHoras(texto), null, texto);
  assert.deepEqual([formatarHoras(90), formatarHoras(45), formatarHoras(120)], ["1h30", "45 min", "2h"]);
});

test("divisor pela jornada: 44 → 220, 40 → 200, 36 → 180, 42 → 210 (sem texto oficial)", () => {
  assert.deepEqual([44, 40, 36, 42, 30].map(divisorSugerido), [220, 200, 180, 210, 150]);
  assert.equal(divisorEhOficial(44, 220), true);
  assert.equal(divisorEhOficial(42, 210), false);
});

test("dias úteis e repousos: novembro de 2026 com 2 feriados em dia útil", () => {
  assert.deepEqual(diasDoMesParaODsr(2026, 11, 2), { dias: 30, domingos: 5, diasUteis: 23, repousos: 7 });
  assert.deepEqual(diasDoMesParaODsr(2026, 2), { dias: 28, domingos: 4, diasUteis: 24, repousos: 4 });
});

test("OJ 394: março de 2023 fica na transição", () => {
  const r = calcularHorasExtras({ salario: 250000, divisor: 220, lancamentos: [{ minutos: 600, adicionalPorMil: 500 }], referencia: { ano: 2023, mes: 3 } });
  assert.equal(r.reflexos.regra, "transicao");
  assert.equal(r.reflexos.baseMensal, r.horasExtras);
});

test("conferir holerite: confere, abaixo, acima e divisor que explica o valor", () => {
  const r = calcularHorasExtras({ salario: 220000, divisor: 220, lancamentos: [{ minutos: 600, adicionalPorMil: 500 }], dsr: diasDoMesParaODsr(2026, 11, 2) });
  assert.equal(conferirHolerite(r, { pagoHorasExtras: 15000 }).situacao, "confere");
  assert.equal(conferirHolerite(r, { pagoHorasExtras: 15080 }).situacao, "confere");
  const menor = conferirHolerite(r, { pagoHorasExtras: 13750, minutosPagos: 600 });
  assert.deepEqual([menor.situacao, menor.diferenca, menor.divisorDoHolerite], ["abaixo", -1250, 240]);
  const comDsr = conferirHolerite(r, { pagoHorasExtras: 15000, pagoDsr: 3000 });
  assert.deepEqual([comDsr.situacao, comDsr.dsrConferido, comDsr.calculado], ["abaixo", true, 19565]);
  assert.equal(conferirHolerite(r, { pagoHorasExtras: 20000 }).situacao, "acima");
  assert.equal(conferirHolerite(r, { pagoHorasExtras: 15000, minutosPagos: 540 }).horasDiferentes, true);
});

test("entradas inválidas", () => {
  const campos = (e) =>
    calcularHorasExtras({ salario: 200000, divisor: 220, lancamentos: [{ minutos: 60, adicionalPorMil: 500 }], ...e }).erros?.map((x) => x.campo) ?? [];
  assert.deepEqual(campos({ salario: 0 }), ["salario"]);
  assert.deepEqual(campos({ divisor: 0 }), ["divisor"]);
  assert.deepEqual(campos({ lancamentos: [] }), ["horas"]);
  assert.deepEqual(campos({ lancamentos: [{ minutos: 60, adicionalPorMil: 250 }] }), ["adicional"]);
  assert.deepEqual(campos({ dsr: { diasUteis: 0, repousos: 4 } }), ["dsr"]);
});

test("valores extremos não quebram a conta", () => {
  const r = calcularHorasExtras({ salario: 999999999, divisor: 60, lancamentos: [{ minutos: 12000, adicionalPorMil: 3000, noturna: true }], adicionalNoturnoPorMil: 1000 });
  assert.equal(r.ok, true);
  assert.ok(Number.isSafeInteger(r.total));
});
