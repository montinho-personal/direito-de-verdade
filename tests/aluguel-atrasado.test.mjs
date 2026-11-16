// Testes da calculadora de aluguel atrasado (src/lib/aluguel/atraso.ts). Os valores
// esperados foram conferidos à parte, com Decimal em Python, sobre as séries oficiais
// (IGP-M: SGS 189 do Banco Central; IPCA: número-índice do IBGE).
import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularAtraso, dataValida } from "../src/lib/aluguel/atraso.ts";

const base = { valorEmCentavos: 200_000, multaPorMil: 100, jurosAoMesPorCemMil: 1000, indice: "nenhum" };

test("15 dias de atraso, sem correção: multa de 10% e juros de 1% ao mês pro rata", () => {
  const r = calcularAtraso({ ...base, vencimento: "2026-08-10", pagamento: "2026-08-25" });
  assert.equal(r.diasDeAtraso, 15);
  assert.equal(r.multaEmCentavos, 20_000);
  assert.equal(r.jurosEmCentavos, 1_000);
  assert.equal(r.correcaoEmCentavos, 0);
  assert.equal(r.totalEmCentavos, 221_000);
  assert.deepEqual(r.avisos, []);
});

test("IGP-M: 3 meses completos (jul a set/2026), juros sobre o valor corrigido", () => {
  const r = calcularAtraso({ ...base, indice: "igpm", vencimento: "2026-07-10", pagamento: "2026-10-15" });
  assert.equal(r.diasDeAtraso, 97);
  assert.equal(r.mesesCompletos, 3);
  assert.equal(r.mesesCorrigidos, 3);
  assert.equal(r.correcaoEmCentavos, 342);
  assert.equal(r.jurosEmCentavos, 6_478);
  assert.equal(r.multaEmCentavos, 20_000);
  assert.equal(r.totalEmCentavos, 226_820);
});

test("IPCA com mês ainda não divulgado: corrige o que existe e avisa", () => {
  const r = calcularAtraso({
    ...base,
    valorEmCentavos: 150_000,
    indice: "ipca",
    vencimento: "2026-09-05",
    pagamento: "2026-12-20",
  });
  assert.equal(r.mesesCompletos, 3);
  assert.equal(r.mesesCorrigidos, 1);
  assert.equal(r.correcaoEmCentavos, 1_230);
  assert.ok(r.avisos.includes("indice-incompleto"));
});

test("deflação não reduz a dívida: correção zero, com aviso", () => {
  const r = calcularAtraso({ ...base, indice: "igpm", vencimento: "2026-06-01", pagamento: "2026-08-01" });
  assert.equal(r.mesesCorrigidos, 2);
  assert.equal(r.correcaoEmCentavos, 0);
  assert.ok(r.avisos.includes("correcao-negativa"));
});

test("contrato sem taxa de juros: não calcula juros e aponta a taxa legal", () => {
  const r = calcularAtraso({ ...base, jurosAoMesPorCemMil: null, vencimento: "2026-08-10", pagamento: "2026-09-10" });
  assert.equal(r.jurosEmCentavos, null);
  assert.equal(r.totalEmCentavos, 220_000);
  assert.ok(r.avisos.includes("juros-pela-taxa-legal"));
});

test("pago no vencimento ou antes: sem acréscimos", () => {
  const r = calcularAtraso({ ...base, vencimento: "2026-08-10", pagamento: "2026-08-10" });
  assert.equal(r.totalEmCentavos, 200_000);
  assert.deepEqual(r.avisos, ["sem-atraso"]);
});

test("vencimento no dia 31: o mês completo fecha no último dia do mês curto", () => {
  const r = calcularAtraso({ ...base, vencimento: "2026-01-31", pagamento: "2026-02-28" });
  assert.equal(r.mesesCompletos, 1);
  assert.equal(r.diasDeAtraso, 28);
});

test("avisos de multa acima de 10% e de juros acima de 1% ao mês", () => {
  const r = calcularAtraso({
    ...base,
    multaPorMil: 200,
    jurosAoMesPorCemMil: 2000,
    vencimento: "2026-08-10",
    pagamento: "2026-08-20",
  });
  assert.equal(r.multaEmCentavos, 40_000);
  assert.ok(r.avisos.includes("multa-alta"));
  assert.ok(r.avisos.includes("juros-altos"));
});

test("datas e valores inválidos", () => {
  assert.equal(calcularAtraso({ ...base, vencimento: "2026-02-30", pagamento: "2026-03-10" }), null);
  assert.equal(calcularAtraso({ ...base, valorEmCentavos: 0, vencimento: "2026-02-10", pagamento: "2026-03-10" }), null);
  assert.equal(dataValida("2026-13-01"), false);
  assert.equal(dataValida("2026-12-01"), true);
});
