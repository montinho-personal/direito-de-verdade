// Testes da calculadora de juros abusivos (src/lib/juros). A matemática é conferida com
// uma conta de referência feita à parte, em Python com Decimal (tests/referencia/juros.py),
// e com exemplos de livro: R$ 10.000 a 2% a.m. em 12x = R$ 945,60 (Price); R$ 12.000 a 1%
// a.m. em 12x pelo SAC = R$ 780 de juros; 8% a.m. = 151,8% a.a. (o BC cita "151% a.a." para o
// teto do cheque especial). As médias do BC vêm das séries do SGS embutidas no projeto.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  anualParaMensal,
  liquidacaoAntecipada,
  mensalParaAnual,
  prestacaoPrice,
  tabelaPrice,
  tabelaSac,
  taxaDoSac,
  taxaImplicita,
  valorPresente,
} from "../src/lib/juros/financeiro.ts";
import { MODALIDADES, referencia, serieDa, SUBTIPOS } from "../src/lib/juros/modalidades.ts";
import { INICIO_DAS_SERIES, SERIES_BCB } from "../src/lib/juros/series-bcb.ts";
import { analisarJuros } from "../src/lib/juros/analise.ts";

const ref = JSON.parse(fs.readFileSync(new URL("./referencia/juros.json", import.meta.url), "utf8"));
const linhas = (t) => t.map((l) => [l.numero, l.parcela, l.juros, l.amortizacao, l.saldo]);
const perto = (a, b, tol = 1e-9, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg ?? ""} ${a} != ${b}`);

test("Price: prestação e tabela iguais à referência, inclusive taxa zero e 360 meses", () => {
  for (const c of ref.price) {
    assert.equal(prestacaoPrice(c.pv, Number(c.i), c.n), c.pmt, `${c.pv} ${c.i} ${c.n}`);
    assert.deepEqual(linhas(tabelaPrice(c.pv, Number(c.i), c.n)), c.tabela);
  }
  assert.equal(prestacaoPrice(1_000_000, 0.02, 12), 94_560); // exemplo de livro
  assert.equal(prestacaoPrice(5_000_000, 0, 10), 500_000);
});

test("SAC: amortização constante e juros decrescentes iguais à referência", () => {
  for (const c of ref.sac) assert.deepEqual(linhas(tabelaSac(c.pv, Number(c.i), c.n)), c.tabela);
  const t = tabelaSac(1_200_000, 0.01, 12);
  assert.equal(t.reduce((s, l) => s + l.juros, 0), 78_000);
  assert.deepEqual([t[0].parcela, t.at(-1).parcela], [112_000, 101_000]);
});

test("toda tabela fecha o saldo em zero e soma o principal", () => {
  for (const [pv, i, n] of [[123_457, 0.0333, 7], [99, 0.5, 5], [1_000_000_000, 0.012, 420], [100, 0, 3]]) {
    for (const t of [tabelaPrice(pv, i, n), tabelaSac(pv, i, n)]) {
      assert.equal(t.at(-1).saldo, 0);
      assert.equal(t.reduce((s, l) => s + l.amortizacao, 0), pv);
      for (const l of t) assert.ok(l.amortizacao >= 0 && l.juros >= 0);
    }
  }
});

test("taxa implícita: parcelas iguais e variáveis, conferida com Newton-Raphson", () => {
  for (const c of ref.implicita) {
    const r = taxaImplicita(c.pv, c.parcelas);
    assert.equal(r.ok, true);
    perto(r.taxa, c.taxa, 1e-9, JSON.stringify(c.parcelas.slice(0, 2)));
  }
  assert.deepEqual(taxaImplicita(1_000, [500, 400]), { ok: false, motivo: "parcelas-menores-que-o-valor" });
  assert.deepEqual(taxaImplicita(1_000, [500, 500]), { ok: true, taxa: 0 });
  assert.deepEqual(taxaImplicita(1_000, [100_000]), { ok: false, motivo: "taxa-alta-demais" });
  assert.deepEqual(taxaImplicita(0, [100]), { ok: false, motivo: "dados-invalidos" });
  perto(taxaDoSac(1_200_000, 112_000, 12).taxa, 0.01);
});

test("conversão de taxas: efetiva, não 12 vezes a mensal", () => {
  for (const c of ref.anual) perto(mensalParaAnual(Number(c.i)), c.anual, 1e-12, c.i);
  perto(mensalParaAnual(0.01), 0.126825, 1e-6);
  perto(anualParaMensal(mensalParaAnual(0.0237)), 0.0237, 1e-12);
  perto(anualParaMensal(0.12), 0.0094888, 1e-7);
  assert.ok(mensalParaAnual(0.02) > 0.24);
});

test("liquidação antecipada: valor presente das restantes à taxa do contrato = saldo da tabela", () => {
  const t = tabelaPrice(1_000_000, 0.02, 12);
  const l = liquidacaoAntecipada(t.map((x) => x.parcela), 4, 0.02);
  assert.equal(l.parcelasRestantes, 8);
  assert.ok(Math.abs(l.valorParaQuitar - t[3].saldo) <= 2, `${l.valorParaQuitar} ${t[3].saldo}`);
  assert.equal(l.reducaoDeJuros, l.somaDasRestantes - l.valorParaQuitar);
  assert.equal(liquidacaoAntecipada(t.map((x) => x.parcela), 12, 0.02).valorParaQuitar, 0);
  perto(valorPresente([110], 0.1), 100);
});

test("séries do BC: sem buracos, a partir de mar/2011, pontos conferidos na API", () => {
  for (const [codigo, s] of Object.entries(SERIES_BCB)) {
    const meses = (s.fim.ano - INICIO_DAS_SERIES.ano) * 12 + s.fim.mes - INICIO_DAS_SERIES.mes + 1;
    assert.equal(s.valores.length, meses, codigo);
    for (const v of s.valores) assert.ok(Number.isInteger(v) && v > 0 && v < 100_00, `${codigo} ${v}`);
  }
  // api.bcb.gov.br em 27/10/2026: 25471 ago/2026 = 1,97; 25464 mar/2011 = 4,72 e ago/2026 = 6,39
  assert.equal(SERIES_BCB[25471].valores.at(-1), 197);
  assert.equal(SERIES_BCB[25464].valores[0], 472);
  assert.equal(SERIES_BCB[25464].valores.at(-1), 639);
  assert.equal(SERIES_BCB[25477].valores.at(-1), 1518);
});

test("referência: mesma modalidade e mês; sem série, antes de 2011 ou longe demais, não compara", () => {
  const r = referencia("veiculo", undefined, { ano: 2026, mes: 8 });
  assert.equal(r.ok, true);
  assert.deepEqual([r.serie, r.taxaMensal, r.defasada], [25471, 0.0197, false]);
  const marco = referencia("pessoal", undefined, { ano: 2011, mes: 3 });
  assert.equal(marco.taxaMensal, 0.0472);
  // Mês ainda sem média: usa a última, com aviso, até 3 meses
  const out = referencia("veiculo", undefined, { ano: 2026, mes: 10 });
  assert.deepEqual([out.ok, out.defasada, out.mes.mes], [true, true, 8]);
  assert.equal(referencia("veiculo", undefined, { ano: 2026, mes: 12 }).motivo, "ainda-nao-divulgada");
  assert.equal(referencia("veiculo", undefined, { ano: 2011, mes: 2 }).motivo, "antes-da-serie");
  assert.equal(referencia("outro", undefined, { ano: 2025, mes: 1 }).motivo, "sem-serie");
  assert.equal(referencia("imobiliario", "nao-sei", { ano: 2025, mes: 1 }).motivo, "sem-serie");
  // Nunca troca de modalidade: cada uma tem a sua série
  assert.equal(serieDa("imobiliario", "reguladas"), 25498);
  assert.equal(serieDa("imobiliario", "mercado"), 25497);
  assert.equal(serieDa("consignado", "inss"), 25468);
  assert.equal(serieDa("consignado", "nao-sei"), 25469);
  assert.equal(new Set(MODALIDADES.filter((m) => !SUBTIPOS[m]).map((m) => serieDa(m)).filter(Boolean)).size, 5);
});

const base = {
  modalidade: "veiculo",
  data: "2026-08-15",
  hoje: "2026-10-27",
  valorRecebido: 0,
  valorFinanciado: 0,
  parcela: 0,
  parcelas: 0,
  sistema: "price",
  taxaMensal: null,
  taxaAnual: null,
  cetAnual: null,
  encargosAParte: 0,
  parcelasPagas: 0,
  saldo: 0,
};
const analisar = (e) => analisarJuros({ ...base, ...e });

test("modo básico: valor, parcelas, parcela e data dão a taxa, a comparação e os dois cenários", () => {
  const parcela = prestacaoPrice(5_000_000, 0.025, 48);
  const r = analisar({ valorRecebido: 5_000_000, parcelas: 48, parcela });
  assert.equal(r.ok, true);
  assert.equal(r.taxa.origem, "calculada-recebido");
  perto(r.taxa.mensal, 0.025, 1e-5);
  assert.equal(r.referencia.serie, 25471);
  perto(r.comparacao.diferencaPp, 0.53, 1e-3);
  assert.equal(r.sinais[0].id, "acima-da-media");
  assert.equal(r.cenarioA.total, parcela * 48);
  assert.equal(r.cenarioB.parcela, prestacaoPrice(5_000_000, 0.0197, 48));
  assert.equal(r.cenarioB.diferencaTotal, r.cenarioA.total - r.cenarioB.total);
  assert.ok(r.cenarioB.diferencaMensal > 0);
  assert.ok(r.memoria.some((l) => l.includes("comparação matemática, não um valor devido")));
});

test("taxa abaixo da média: nada de sinal de acima", () => {
  const r = analisar({ valorFinanciado: 5_000_000, parcelas: 48, taxaMensal: 0.015 });
  assert.equal(r.sinais[0].id, "abaixo-da-media");
  assert.ok(r.cenarioB.diferencaTotal < 0);
});

test("CET x taxa contratual: tarifas financiadas aparecem como diferença, sem mudar a taxa do contrato", () => {
  const parcela = prestacaoPrice(5_300_000, 0.02, 48);
  const r = analisar({ valorRecebido: 5_000_000, valorFinanciado: 5_300_000, parcelas: 48, parcela, taxaMensal: 0.02, cetAnual: 0.35 });
  assert.equal(r.taxa.origem, "mensal-informada");
  perto(r.taxaSobreORecebido.mensal, 0.0228, 3e-4);
  const ids = r.sinais.map((s) => s.id);
  for (const id of ["encargos-financiados", "cet-maior-que-a-taxa"]) assert.ok(ids.includes(id), id);
  // A taxa das parcelas sobre o valor financiado é a do contrato: não há sinal de diferença
  assert.ok(!ids.includes("taxa-calculada-maior"));
  // Só com o valor recebido, a taxa das parcelas fica acima da informada
  const soRecebido = analisar({ valorRecebido: 5_000_000, parcelas: 48, parcela, taxaMensal: 0.02 });
  assert.ok(soRecebido.sinais.some((s) => s.id === "taxa-calculada-maior"));
  assert.equal(r.sinais.find((s) => s.id === "encargos-financiados").valor, 300_000);
  assert.equal(r.custo.custoTotal, parcela * 48 - 5_000_000);
  // Tarifas pagas à parte entram no custo total
  const comTarifa = analisar({ valorRecebido: 5_000_000, parcelas: 48, parcela, encargosAParte: 80_000 });
  assert.equal(comTarifa.custo.custoTotal, parcela * 48 + 80_000 - 5_000_000);
});

test("taxas informadas que não batem: anual nominal (12 × mensal) é apontada", () => {
  const r = analisar({ valorFinanciado: 1_000_000, parcelas: 12, taxaMensal: 0.02, taxaAnual: 0.24 });
  const s = r.sinais.find((x) => x.id === "taxas-informadas-nao-batem");
  assert.ok(s && s.nominal);
  const ok = analisar({ valorFinanciado: 1_000_000, parcelas: 12, taxaMensal: 0.02, taxaAnual: mensalParaAnual(0.02) });
  assert.ok(!ok.sinais.some((x) => x.id === "taxas-informadas-nao-batem"));
});

test("SAC: taxa pela primeira parcela e cenário B também em SAC", () => {
  const r = analisar({ modalidade: "imobiliario", subtipo: "mercado", valorFinanciado: 30_000_000, parcelas: 360, parcela: tabelaSac(30_000_000, 0.0095, 360)[0].parcela, sistema: "sac" });
  perto(r.taxa.mensal, 0.0095, 1e-6);
  assert.equal(r.referencia.serie, 25497);
  assert.ok(r.cenarioA.parcela > r.cenarioA.ultimaParcela);
  assert.ok(r.cenarioB.parcela > r.cenarioB.ultimaParcela);
  assert.ok(r.sinais.some((s) => s.id === "indexador-imobiliario"));
});

test("dados incompletos: diz o que falta e compara só a taxa quando é o que há", () => {
  const vazio = analisar({});
  assert.equal(vazio.ok, true);
  assert.equal(vazio.taxa, null);
  assert.deepEqual(vazio.faltando, ["o número de parcelas", "o valor recebido ou o valor financiado", "o valor da parcela ou a taxa de juros do contrato"]);
  const soTaxa = analisar({ taxaMensal: 0.03 });
  assert.equal(soTaxa.cenarioA, null);
  assert.ok(soTaxa.comparacao);
  assert.ok(soTaxa.faltando.includes("o número de parcelas"));
  const semData = analisarJuros({ ...base, data: "" });
  assert.equal(semData.ok, false);
});

test("validação: valores extremos, datas e parcelas que somam menos que o valor", () => {
  const erro = (e) => analisar(e).erros?.map((x) => x.campo);
  assert.deepEqual(erro({ data: "2026-10-28" }), ["data"]);
  assert.deepEqual(erro({ data: "1999-12-31" }), ["data"]);
  assert.deepEqual(erro({ parcelas: 601 }), ["parcelas"]);
  assert.deepEqual(erro({ taxaMensal: 0 }), ["taxaMensal"]);
  assert.deepEqual(erro({ taxaMensal: 1.5 }), ["taxaMensal"]);
  assert.deepEqual(erro({ taxaAnual: 200 }), ["taxaAnual"]);
  assert.deepEqual(erro({ valorRecebido: 600, valorFinanciado: 500 }), ["valorRecebido"]);
  assert.deepEqual(erro({ parcelas: 12, parcelasPagas: 13 }), ["parcelasPagas"]);
  assert.deepEqual(erro({ valorRecebido: 1_000_000, parcelas: 10, parcela: 90_000 }), ["parcela"]);
  assert.deepEqual(erro({ modalidade: "consignado" }), ["subtipo"]);
  // Valores grandes não perdem precisão
  const grande = analisar({ valorFinanciado: 1_000_000_000, parcelas: 420, taxaMensal: 0.012 });
  assert.equal(grande.cenarioA.tabela.at(-1).saldo, 0);
});

test("parcelas já pagas: saldo devedor e valor estimado para quitar", () => {
  const r = analisar({ valorFinanciado: 1_000_000, parcelas: 12, taxaMensal: 0.02, parcelasPagas: 4 });
  // Saldo = valor presente das 8 restantes; bate com a tabela (diferença de centavos do arredondamento)
  assert.ok(Math.abs(r.andamento.saldo - tabelaPrice(1_000_000, 0.02, 12)[3].saldo) <= 2);
  assert.equal(r.andamento.liquidacao.parcelasRestantes, 8);
  assert.ok(r.andamento.liquidacao.reducaoDeJuros > 0);
});

test("regras por modalidade: cheque especial acima de 8% a.m., teto do rotativo, consignado INSS", () => {
  const cheque = analisar({ modalidade: "cheque-especial", taxaMensal: 0.09, saldo: 100_000 });
  assert.ok(cheque.sinais.some((s) => s.id === "acima-do-teto-cheque-especial"));
  assert.equal(cheque.rotativo_.jurosDoMes, 9_000);
  assert.equal(cheque.rotativo_.jurosDoMesNaMedia, Math.round(100_000 * 0.0743));
  // Antes de 06/01/2020 não havia teto
  assert.ok(!analisar({ modalidade: "cheque-especial", data: "2019-12-20", taxaMensal: 0.12 }).sinais.some((s) => s.id === "acima-do-teto-cheque-especial"));
  assert.ok(!analisar({ modalidade: "cheque-especial", taxaMensal: 0.08 }).sinais.some((s) => s.id === "acima-do-teto-cheque-especial"));
  const rot = analisar({ modalidade: "rotativo", taxaMensal: 0.15 });
  assert.deepEqual(rot.sinais.find((s) => s.id === "teto-do-rotativo"), { id: "teto-do-rotativo", vale: true });
  assert.equal(analisar({ modalidade: "rotativo", data: "2023-12-20", taxaMensal: 0.15 }).sinais.find((s) => s.id === "teto-do-rotativo").vale, false);
  assert.equal(analisar({ modalidade: "rotativo" }).ok, false);
  const inss = analisar({ modalidade: "consignado", subtipo: "inss", valorFinanciado: 1_000_000, parcelas: 84, taxaMensal: 0.0185 });
  assert.ok(inss.sinais.some((s) => s.id === "teto-consignado-inss"));
  assert.equal(inss.referencia.serie, 25468);
  const outro = analisar({ modalidade: "outro", valorFinanciado: 1_000_000, parcelas: 12, taxaMensal: 0.03 });
  assert.equal(outro.referencia.ok, false);
  assert.equal(outro.cenarioB, null);
  assert.ok(outro.cenarioA);
});

test("nenhum texto da análise afirma ilegalidade ou dinheiro a receber", () => {
  const r = analisar({ valorRecebido: 5_000_000, parcelas: 48, parcela: prestacaoPrice(5_000_000, 0.05, 48) });
  const texto = [...r.memoria, ...r.hipoteses].join(" ").toLowerCase();
  for (const proibido of ["ilegal", "abusivo", "abusiva", "devolver", "tem direito"]) assert.ok(!texto.includes(proibido), proibido);
});
