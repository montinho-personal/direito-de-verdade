// Testes do motor do FGTS (src/lib/fgts). Os valores esperados vêm de uma conta de
// referência escrita à parte, em Python, direto da lei (tests/referencia/fgts.py), e de
// exemplos oficiais (FAQ do FGTS Digital: competência 03/2024 vence em 19/04/2024 e
// 02/2024 em 07/03/2024; Anexo da Lei 8.036 para o saque-aniversário). `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { lerCompetencia, vencimentoDoDeposito } from "../src/lib/fgts/competencias.ts";
import { calcularDeposito } from "../src/lib/fgts/deposito.ts";
import { simularSaldo } from "../src/lib/fgts/saldo.ts";
import { conferirDepositos } from "../src/lib/fgts/conferencia.ts";
import { calcularMulta } from "../src/lib/fgts/multa.ts";
import { HIPOTESES, janelaDoSaqueAniversario, retornoAoSaqueRescisao, saqueAniversario } from "../src/lib/fgts/saque.ts";
import { paraTexto } from "../src/lib/trabalhista/datas.ts";

const ref = JSON.parse(fs.readFileSync(new URL("./referencia/fgts.json", import.meta.url), "utf8"));

test("vencimentos: dia 7 até a competência 02/2024; dia 20 depois, antecipado em fim de semana e feriado", () => {
  for (const { competencia, vencimento } of ref.vencimentos) {
    assert.equal(paraTexto(vencimentoDoDeposito(lerCompetencia(competencia)).data), vencimento, competencia);
  }
});

for (const { nome, entrada, esperado } of ref.saldos) {
  test(`saldo: ${nome}`, () => {
    const r = simularSaldo(entrada);
    assert.equal(r.ok, true, JSON.stringify(r.erros));
    for (const campo of ["depositos", "juros", "saques", "saldo", "baseDaMulta", "indenizacaoDomestico"]) {
      assert.equal(r[campo], esperado[campo], campo);
    }
    assert.deepEqual(
      r.meses.map((m) => [`${m.competencia.ano}-${String(m.competencia.mes).padStart(2, "0")}`, m.remuneracao, m.decimoTerceiro, m.tercoDeFerias, m.deposito, m.juros, m.saldo]),
      esperado.meses,
    );
  });
}

for (const { nome, entrada, esperado } of ref.multas) {
  test(`multa: ${nome}`, () => {
    const r = calcularMulta(entrada);
    assert.equal(r.ok, true);
    assert.deepEqual([r.base, r.multa, r.valorSacavel], [esperado.base, esperado.multa, esperado.valorSacavel]);
  });
}

test("saque-aniversário: tabela do Anexo (R$ 1.000 → R$ 400 + R$ 50)", () => {
  for (const { saldo, valor } of ref.saquesAniversario) assert.equal(saqueAniversario(saldo).valor, valor, String(saldo));
  assert.deepEqual(saqueAniversario(100000), { saldo: 100000, aliquotaPorMil: 400, adicional: 5000, valor: 45000 });
  assert.equal(saqueAniversario(0).valor, 0);
});

test("saque-aniversário: janela até o último dia útil do 2º mês seguinte", () => {
  for (const { ano, mes, fim } of ref.janelas) assert.equal(paraTexto(janelaDoSaqueAniversario(ano, mes).fim), fim);
});

test("volta ao saque-rescisão: 1º dia do 25º mês seguinte ao pedido", () => {
  assert.equal(paraTexto(retornoAoSaqueRescisao({ ano: 2026, mes: 1 })), "2028-02-01");
  assert.equal(paraTexto(retornoAoSaqueRescisao({ ano: 2026, mes: 10 })), "2028-11-01");
});

test("depósito do mês: CLT 8%, aprendiz 2%, doméstico 8% + 3,2% à parte", () => {
  const c = { ano: 2026, mes: 10 };
  const clt = calcularDeposito({ vinculo: "clt", competencia: c, salario: 250000 });
  assert.deepEqual([clt.base, clt.deposito, clt.indenizacaoDomestico], [250000, 20000, 0]);
  assert.equal(paraTexto(clt.vencimento.data), "2026-11-19"); // 20/11 é feriado nacional
  const aprendiz = calcularDeposito({ vinculo: "aprendiz", competencia: c, salario: 162100 });
  assert.equal(aprendiz.deposito, 3242);
  const domestico = calcularDeposito({ vinculo: "domestico", competencia: c, salario: 162100 });
  assert.deepEqual([domestico.deposito, domestico.indenizacaoDomestico], [12968, 5187]);
  const completo = calcularDeposito({ vinculo: "clt", competencia: c, salario: 300000, variaveis: 45000, decimoTerceiro: 150000, feriasGozadas: 400000, avisoPrevio: 0 });
  assert.deepEqual([completo.base, completo.deposito, completo.parcelas.length], [895000, 71600, 4]);
  assert.equal(calcularDeposito({ vinculo: "clt", competencia: c, salario: 0 }).ok, false);
});

test("conferência: vazio não é zero; sem depósito, não vencido e tolerância de R$ 1", () => {
  const hoje = { ano: 2026, mes: 10, dia: 21 };
  const linhas = [
    { competencia: { ano: 2026, mes: 6 }, remuneracao: 200000, situacao: "valor", informado: 16000 },
    { competencia: { ano: 2026, mes: 7 }, remuneracao: 200000, situacao: "valor", informado: 16050 },
    { competencia: { ano: 2026, mes: 8 }, remuneracao: 200000, situacao: "sem-deposito" },
    { competencia: { ano: 2026, mes: 9 }, remuneracao: 220000, situacao: "valor", informado: 16000 },
    { competencia: { ano: 2026, mes: 5 }, remuneracao: 200000, situacao: "nao-sei" },
    { competencia: { ano: 2026, mes: 10 }, remuneracao: 200000, situacao: "nao-sei" },
    { competencia: { ano: 2026, mes: 4 }, remuneracao: 200000, situacao: "valor", informado: 20000 },
  ];
  const r = conferirDepositos("clt", linhas, hoje);
  assert.deepEqual(r.linhas.map((l) => l.status), ["confere", "confere", "sem-deposito", "abaixo", "nao-informado", "nao-venceu", "acima"]);
  assert.deepEqual([r.conferidas, r.divergentes, r.pendentes, r.naoVencidas], [5, 3, 1, 1]);
  assert.equal(r.esperadoConferido, 16000 * 4 + 17600);
  assert.equal(r.informadoConferido, 16000 + 16050 + 0 + 16000 + 20000);
  assert.equal(r.diferenca, r.informadoConferido - r.esperadoConferido);
  // Competência 09/2026 vence em 20/10/2026: em 20/10 ainda não venceu
  const antes = conferirDepositos("clt", [{ competencia: { ano: 2026, mes: 9 }, remuneracao: 200000, situacao: "sem-deposito" }], { ano: 2026, mes: 10, dia: 20 });
  assert.equal(antes.linhas[0].status, "nao-venceu");
});

test("multa do doméstico: sem 40%; os 3,2% vão ao empregado ou voltam ao empregador", () => {
  const dispensa = calcularMulta({ vinculo: "domestico", motivo: "sem-justa-causa", base: 0, indenizacaoDomestico: 153792 });
  assert.deepEqual([dispensa.multa, dispensa.indenizacaoDomestico.paraOEmpregado], [0, 153792]);
  const pedido = calcularMulta({ vinculo: "domestico", motivo: "pedido", base: 0, indenizacaoDomestico: 153792 });
  assert.deepEqual([pedido.indenizacaoDomestico.paraOEmpregado, pedido.indenizacaoDomestico.paraOEmpregador], [0, 153792]);
  const culpa = calcularMulta({ vinculo: "domestico", motivo: "culpa-reciproca", base: 0, indenizacaoDomestico: 153793 });
  assert.equal(culpa.indenizacaoDomestico.paraOEmpregado, 76897);
});

test("hipóteses de saque: o saque-aniversário só bloqueia as da saída do emprego", () => {
  const bloqueadas = HIPOTESES.filter((h) => h.liberaNoAniversario !== "sim").map((h) => h.situacao);
  assert.deepEqual(bloqueadas, ["sem-justa-causa", "acordo", "termo-normal", "pedido", "justa-causa"]);
});

test("entradas inválidas e históricos incompletos", () => {
  const campos = (e) => simularSaldo({ vinculo: "clt", admissao: "2025-01-01", fim: "2025-12-31", salario: 200000, ...e }).erros?.map((x) => x.campo) ?? [];
  assert.deepEqual(campos({ admissao: "2025-02-30" }), ["admissao"]);
  assert.deepEqual(campos({ fim: "2024-12-31" }), ["fim"]);
  assert.deepEqual(campos({ salario: 0 }), ["salario"]);
  assert.deepEqual(campos({ reajustes: [{ aPartirDe: "2025-13", salario: 1 }] }), ["reajustes"]);
  assert.deepEqual(campos({ afastamentos: [{ inicio: "2025-05", fim: "2025-03" }] }), ["afastamentos"]);
  assert.deepEqual(campos({ saques: [{ competencia: "2025-05", valor: 0 }] }), ["saques"]);
  // Remuneração conhecida de uma competência substitui a estimada
  const r = simularSaldo({ vinculo: "clt", admissao: "2025-01-01", fim: "2025-03-31", salario: 200000, incluir13: false, remuneracoes: { "2025-02": 250000 } });
  assert.deepEqual(r.meses.map((m) => m.deposito), [16000, 20000, 16000]);
  assert.equal(r.saqueMaiorQueOSaldo, false);
  assert.equal(simularSaldo({ vinculo: "clt", admissao: "2026-01-01", fim: "2026-04-30", salario: 200000, saques: [{ competencia: "2026-02", valor: 999999 }] }).saqueMaiorQueOSaldo, true);
});
