// Testes da calculadora de multa por quebra de contrato de aluguel (src/lib/aluguel). A
// proporção é conferida com uma conta de referência feita à parte, em Python com frações
// exatas (tests/referencia/multa_aluguel.py), e com os exemplos do artigo e do prompt:
// R$ 2.000, multa de 3 aluguéis, 30 meses, 20 cumpridos → R$ 2.000; R$ 1.500, 3 aluguéis,
// saída com 12 de 30 meses → R$ 2.700 (Lei 8.245/1991, art. 4º).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { calcularMultaDoAluguel, periodoEntre } from "../src/lib/aluguel/multa.ts";
import { lerData } from "../src/lib/trabalhista/datas.ts";

const ref = JSON.parse(fs.readFileSync(new URL("./referencia/multa_aluguel.json", import.meta.url), "utf8"));
const base = {
  perfil: "inquilino",
  situacao: "sair-antes",
  tipo: "residencial",
  aluguel: 200_000,
  inicio: "2024-01-10",
  termino: "2026-07-10",
  prazoMeses: 0,
  devolucao: "2025-09-10",
  forma: "alugueis",
  alugueisDeMultaDecimos: 30,
  multaFixa: 0,
  clausulaSemProporcao: false,
  transferenciaPeloEmpregador: "",
  outraLocalidade: "",
  avisoEscrito30Dias: "",
  acordo: "",
  valorDoAcordo: 0,
  encargosMensais: 0,
  encargos: null,
  hoje: "2026-10-27",
};
const calc = (e) => calcularMultaDoAluguel({ ...base, ...e });

test("referência: meses e fração de mês, e a multa proporcional", () => {
  for (const c of ref) {
    const pt = periodoEntre(lerData(c.inicio), lerData(c.termino));
    const rs = periodoEntre(lerData(c.devolucao), lerData(c.termino));
    assert.deepEqual([pt.meses, pt.dias, pt.diasDoMes], c.prazo, c.nome);
    assert.deepEqual([rs.meses, rs.dias, rs.diasDoMes], c.restante, c.nome);
    const r = calc({ aluguel: c.aluguel, forma: "fixa", multaFixa: c.multa, inicio: c.inicio, termino: c.termino, devolucao: c.devolucao });
    assert.equal(r.ok, true, JSON.stringify(r.erros));
    // Último dia: o prazo terminou, sem multa
    assert.equal(r.multaEstimada, c.proporcional, c.nome);
  }
});

test("exemplo do prompt: multa em aluguéis, 20 de 30 meses cumpridos", () => {
  const r = calc({});
  assert.equal(r.desfecho, "multa-proporcional");
  assert.deepEqual([r.multaIntegral, r.multaEstimada], [600_000, 200_000]);
  assert.deepEqual([r.prazoTotal.meses, r.cumprido.meses, r.restante.meses], [30, 20, 10]);
  assert.ok(r.memoria.some((l) => /^Multa integral do contrato: 3 × R\$\s2\.000,00 = R\$\s6\.000,00/.test(l)));
});

test("multa em valor fixo e em fração de aluguel (2,5 aluguéis)", () => {
  assert.equal(calc({ forma: "fixa", multaFixa: 450_000 }).multaEstimada, 150_000);
  assert.equal(calc({ alugueisDeMultaDecimos: 25 }).multaIntegral, 500_000);
  assert.equal(calc({ aluguel: 133_333, alugueisDeMultaDecimos: 25 }).multaIntegral, 333_333); // 3.333,325 → 3.333,33
});

test("prazo integral, parcialmente cumprido, saída no fim e prazo em meses", () => {
  assert.equal(calc({ devolucao: "2024-01-10" }).multaEstimada, 600_000);
  assert.equal(calc({ devolucao: "2026-07-10" }).desfecho, "sem-multa-prazo-terminou");
  assert.equal(calc({ devolucao: "2026-07-10" }).multaEstimada, 0);
  // Sem término: início + prazo em meses
  const r = calc({ termino: "", prazoMeses: 30 });
  assert.equal(r.termino.ano * 100 + r.termino.mes, 202607);
  assert.equal(r.multaEstimada, 200_000);
});

test("contrato encerrado e prorrogado: sem multa; sem aviso de 30 dias, até um aluguel e encargos", () => {
  const r = calc({ situacao: "contrato-terminou", devolucao: "2026-10-27", avisoEscrito30Dias: "nao", encargosMensais: 45_000 });
  assert.equal(r.desfecho, "aviso-de-30-dias");
  assert.equal(r.multaEstimada, 0);
  assert.equal(r.valorSemAviso, 245_000);
  assert.ok(r.avisos.includes("contrato-prorrogado") && r.avisos.includes("sem-aviso-um-aluguel"));
  const comAviso = calc({ situacao: "contrato-terminou", devolucao: "2026-10-27", avisoEscrito30Dias: "sim" });
  assert.equal(comAviso.valorSemAviso, null);
});

test("transferência de trabalho: dispensa só com empregador, outra localidade e aviso escrito de 30 dias", () => {
  const t = { situacao: "transferencia", transferenciaPeloEmpregador: "sim", outraLocalidade: "sim", avisoEscrito30Dias: "sim" };
  assert.deepEqual([calc(t).desfecho, calc(t).multaEstimada], ["sem-multa-transferencia", 0]);
  for (const falta of [{ transferenciaPeloEmpregador: "nao" }, { outraLocalidade: "nao" }, { avisoEscrito30Dias: "nao" }, { avisoEscrito30Dias: "nao-sei" }]) {
    const r = calc({ ...t, ...falta });
    assert.equal(r.desfecho, "multa-proporcional", JSON.stringify(falta));
    assert.equal(r.multaEstimada, 200_000);
    assert.ok(r.avisos.includes("transferencia-incompleta"));
  }
});

test("prazo indeterminado: devolução depois do fim do prazo não tem multa proporcional", () => {
  const r = calc({ devolucao: "2026-09-01", avisoEscrito30Dias: "sim" });
  assert.equal(r.multaEstimada, 0);
  assert.equal(r.desfecho, "aviso-de-30-dias");
});

test("proprietário que pede o imóvel: nunca a fórmula da multa do inquilino", () => {
  const durante = calc({ perfil: "proprietario", situacao: "proprietario-pediu" });
  assert.equal(durante.desfecho, "retomada-pelo-proprietario");
  assert.equal(durante.multaEstimada, null);
  const depoisLongo = calc({ perfil: "proprietario", situacao: "proprietario-pediu", devolucao: "2026-10-01" });
  assert.ok(depoisLongo.avisos.includes("artigo-46"));
  const depoisCurto = calc({ perfil: "proprietario", situacao: "proprietario-pediu", termino: "2025-01-10", devolucao: "2026-10-01" });
  assert.ok(depoisCurto.avisos.includes("artigo-47"));
});

test("acordo, cláusula sem proporção, contrato sem multa, outra cláusula e sob medida", () => {
  const acordo = calc({ acordo: "sim", valorDoAcordo: 300_000 });
  assert.deepEqual([acordo.desfecho, acordo.multaEstimada], ["acordo", 300_000]);
  assert.ok(acordo.avisos.includes("acordo-maior-que-a-multa"));
  assert.ok(calc({ clausulaSemProporcao: true }).avisos.includes("clausula-sem-proporcao"));
  assert.deepEqual([calc({ forma: "sem-multa" }).desfecho, calc({ forma: "sem-multa" }).multaEstimada], ["sem-valor-no-contrato", null]);
  assert.equal(calc({ forma: "outra" }).desfecho, "clausula-a-analisar");
  // Sob medida: multa do contrato, limitada aos aluguéis que faltam (10 × 2.000)
  assert.equal(calc({ tipo: "sob-medida", alugueisDeMultaDecimos: 240 }).multaEstimada, 2_000_000);
  assert.equal(calc({ tipo: "sob-medida", alugueisDeMultaDecimos: 60 }).multaEstimada, 1_200_000);
});

test("descumprimento: referência proporcional, com ressalva de decisão judicial", () => {
  const r = calc({ situacao: "descumprimento" });
  assert.equal(r.desfecho, "descumprimento");
  assert.equal(r.multaEstimada, 200_000);
  assert.ok(r.memoria.some((l) => l.includes("decisão judicial")));
});

test("multa zerada e multa alta", () => {
  assert.equal(calc({ alugueisDeMultaDecimos: 0 }).multaEstimada, 0);
  assert.ok(calc({ alugueisDeMultaDecimos: 60 }).avisos.includes("multa-alta"));
  assert.ok(!calc({}).avisos.includes("multa-alta"));
});

test("encargos adicionais separados da multa; pagamentos abatidos; nunca total negativo", () => {
  const encargos = { alugueisPendentes: 200_000, condominio: 50_000, iptu: 12_000, contas: 8_000, outros: 0, jaPagos: 20_000 };
  const r = calc({ encargos });
  assert.equal(r.encargos.soma, 270_000);
  assert.equal(r.encargos.total, 200_000 + 270_000 - 20_000);
  assert.deepEqual(r.encargos.itens.map((i) => i.nome).length, 4);
  const credito = calc({ encargos: { ...encargos, jaPagos: 1_000_000 } });
  assert.ok(credito.encargos.total < 0);
  assert.ok(credito.memoria.at(-1).includes("os pagamentos superam"));
  assert.ok(calc({}).avisos.includes("caucao"));
});

test("datas inválidas e valores fora do limite", () => {
  const erro = (e) => calc(e).erros?.map((x) => x.campo);
  assert.deepEqual(erro({ inicio: "" }), ["inicio"]);
  assert.deepEqual(erro({ inicio: "2026-02-30" }), ["inicio"]);
  assert.deepEqual(erro({ termino: "2023-01-01" }), ["termino"]);
  assert.deepEqual(erro({ devolucao: "2023-12-31" }), ["devolucao"]);
  assert.deepEqual(erro({ termino: "", prazoMeses: 0 }), ["prazoMeses"]);
  assert.deepEqual(erro({ aluguel: 0 }), ["aluguel"]);
  assert.deepEqual(erro({ alugueisDeMultaDecimos: 250 }), ["alugueisDeMulta"]);
  assert.deepEqual(erro({ forma: "fixa", multaFixa: -1 }), ["multaFixa"]);
  assert.deepEqual(erro({ encargos: { alugueisPendentes: -5, condominio: 0, iptu: 0, contas: 0, outros: 0, jaPagos: 0 } }), ["encargos"]);
});

test("meses incompletos: fração de dias do mês, sem multa negativa", () => {
  const r = calc({ devolucao: "2025-09-25" });
  assert.deepEqual([r.restante.meses, r.restante.dias], [9, 15]);
  assert.ok(r.multaEstimada > 0 && r.multaEstimada < 200_000);
  assert.ok(r.memoria.some((l) => l.startsWith("Meses incompletos entram como fração")));
  assert.ok(calc({ devolucao: "2026-12-01" }).multaEstimada === 0);
});
