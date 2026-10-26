// Testes do motor do simulador de direitos em compras online
// (src/lib/compras-online). Conferem as perguntas que aparecem em cada fluxo, os prazos
// (7 dias do arrependimento, 30 e 90 dias do art. 26, 80 dias do MED), as exceções e as
// combinações de respostas. As regras e as fontes estão em src/lib/compras-online/regras.ts.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  diagnosticar,
  fontesDoDiagnostico,
  perguntasDoFluxo,
  perguntasVisiveis,
  PROBLEMAS,
  validarResposta,
} from "../src/lib/compras-online/diagnostico.ts";
import { FONTES } from "../src/lib/compras-online/regras.ts";

const HOJE = "2026-10-26";
const ids = (problema, r) => perguntasVisiveis(problema, r, HOJE).map((p) => p.id);
const d = (problema, r) => {
  const res = diagnosticar(problema, r, HOJE);
  assert.equal(res.ok, true, JSON.stringify(res.erros));
  return res.diagnostico;
};
const temId = (lista, id) => lista.some((i) => i.id === id);
const prazo = (diag, id) => diag.prazos.find((p) => p.id === id);

test("todo problema tem fluxo, e toda opção é única", () => {
  for (const p of PROBLEMAS) {
    const perguntas = perguntasDoFluxo(p);
    assert.equal(new Set(perguntas.map((q) => q.id)).size, perguntas.length, p);
    for (const q of perguntas) if (q.tipo === "opcoes") assert.ok(q.opcoes.length >= 2, `${p}/${q.id}`);
  }
});

test("não chegou: só pergunta o necessário", () => {
  assert.deepEqual(ids("nao-chegou", { pagou: "nao", prometida: "2026-10-01" }), ["pagou", "prometida", "contato", "marketplace"]);
  assert.deepEqual(ids("nao-chegou", { pagou: "sim", prometida: "2026-11-10" }), ["pagou", "meio", "prometida", "rastreio", "contato", "marketplace"]);
  assert.deepEqual(ids("nao-chegou", { pagou: "sim", prometida: "2026-10-20" }), ["pagou", "meio", "prometida", "novoPrazo", "rastreio", "contato", "marketplace"]);
  assert.deepEqual(ids("nao-chegou", { pagou: "sim", prometida: "nao-sei", prazoPassou: "nao" }), [
    "pagou", "meio", "prometida", "prazoPassou", "rastreio", "contato", "marketplace",
  ]);
});

const naoChegou = { pagou: "sim", meio: "cartao", prometida: "2026-10-20", novoPrazo: "nao", rastreio: "nao", contato: "sim", marketplace: "nao" };

test("não chegou e o prazo passou: as três opções do art. 35", () => {
  const diag = d("nao-chegou", naoChegou);
  assert.equal(diag.situacao, "atrasado");
  assert.deepEqual(diag.alternativas.map((a) => a.id), ["exigir-cumprimento", "aceitar-equivalente", "cancelar-com-reembolso"]);
  assert.ok(temId(diag.canais, "cartao"));
  assert.ok(diag.links.some((l) => l.href === "/artigos/estorno-cartao-de-credito"));
  assert.deepEqual(diag.integracoesFuturas, ["gerador-de-reclamacao"]);
});

test("não chegou: dia da entrega prometida ainda está no prazo; dia seguinte já atrasou", () => {
  const { novoPrazo, ...semNovo } = naoChegou;
  assert.equal(d("nao-chegou", { ...semNovo, prometida: HOJE }).situacao, "no-prazo");
  assert.equal(d("nao-chegou", { ...naoChegou, prometida: "2026-10-25" }).situacao, "atrasado");
});

test("não chegou: sem pagamento, sem prazo, novo prazo, consta entregue, marketplace, Pix", () => {
  assert.equal(d("nao-chegou", { pagou: "nao", prometida: "2026-10-01", contato: "nao", marketplace: "nao" }).situacao, "sem-pagamento");
  const semPrazo = d("nao-chegou", { ...naoChegou, prometida: "nao-sei", prazoPassou: "sem-prazo" });
  assert.equal(semPrazo.situacao, "sem-prazo");
  const comNovo = d("nao-chegou", { ...naoChegou, novoPrazo: "sim", rastreio: "sim", marketplace: "sim", meio: "pix" });
  for (const id of ["novo-prazo", "consta-entregue", "marketplace", "suspeita-golpe"]) assert.ok(temId(comNovo.avisos, id), id);
  assert.ok(temId(comNovo.canais, "plataforma"));
  assert.ok(!temId(comNovo.canais, "cartao"));
});

const defeito = { durabilidade: "duravel", recebimento: "2026-10-01", quando: "logo", tentativa: "nao-reclamei", essencial: "nao", marketplace: "nao" };

test("defeito: 90 dias para durável, 30 para não durável, contados da entrega", () => {
  const dur = prazo(d("defeito", defeito), "reclamacao");
  assert.equal(dur.ate, "2026-12-30");
  assert.equal(dur.passou, false);
  assert.equal(prazo(d("defeito", { ...defeito, durabilidade: "nao-duravel" }), "reclamacao").ate, "2026-10-31");
  // Na dúvida, o prazo menor
  assert.equal(prazo(d("defeito", { ...defeito, durabilidade: "nao-sei" }), "reclamacao").ate, "2026-10-31");
});

test("defeito oculto: o prazo conta de quando apareceu; sem a data, avisa", () => {
  const r = { ...defeito, recebimento: "2026-01-10", quando: "depois", dataDefeito: "2026-10-01" };
  assert.equal(prazo(d("defeito", r), "reclamacao").ate, "2026-12-30");
  const semData = d("defeito", { ...r, dataDefeito: "nao-sei" });
  assert.equal(prazo(semData, "reclamacao"), undefined);
  assert.ok(temId(semData.avisos, "data-do-defeito"));
  assert.equal(diagnosticar("defeito", { ...r, dataDefeito: "2026-01-09" }, HOJE).erros[0].pergunta, "dataDefeito");
});

test("defeito: 7 dias de arrependimento, conserto de 30 dias, escolha imediata e prazo vencido", () => {
  const recente = d("defeito", { ...defeito, recebimento: "2026-10-20" });
  assert.equal(recente.situacao, "dentro-dos-7-dias");
  assert.equal(prazo(recente, "arrependimento").ate, "2026-10-27");
  assert.deepEqual(recente.alternativas.map((a) => a.id), ["arrependimento", "conserto-30-dias", "troca-reembolso-abatimento"]);
  const conserto = d("defeito", defeito);
  assert.equal(conserto.situacao, "conserto");
  assert.ok(!temId(conserto.alternativas, "arrependimento"));
  assert.equal(d("defeito", { ...defeito, tentativa: "passou-30" }).situacao, "pode-escolher");
  const essencial = d("defeito", { ...defeito, essencial: "sim" });
  assert.equal(essencial.situacao, "pode-escolher");
  assert.ok(temId(essencial.avisos, "essencial"));
  const antigo = d("defeito", { ...defeito, recebimento: "2026-01-02" });
  assert.equal(antigo.situacao, "prazo-a-verificar");
  assert.ok(temId(antigo.avisos, "prazo-passou"));
  // Quem reclamou a tempo não recebe o aviso: a reclamação obsta o prazo
  assert.ok(!temId(d("defeito", { ...defeito, recebimento: "2026-01-02", tentativa: "aguardando" }).avisos, "prazo-passou"));
});

test("diferente do anunciado: oferta, falsificado e quantidade", () => {
  const r = { oQue: "falsificado", recebimento: "2026-10-01", contato: "nao", marketplace: "sim" };
  const diag = d("diferente", r);
  assert.equal(diag.situacao, "oferta");
  assert.ok(temId(diag.avisos, "falsificado") && temId(diag.avisos, "marketplace"));
  assert.ok(temId(diag.alternativas, "cancelar-com-reembolso"));
  assert.ok(temId(d("diferente", { ...r, oQue: "quantidade" }).avisos, "quantidade"));
  assert.equal(d("diferente", { ...r, recebimento: "2026-10-24" }).situacao, "dentro-dos-7-dias");
});

test("desistir: loja física não tem os 7 dias; pela internet, 7 dias corridos do recebimento", () => {
  assert.deepEqual(ids("desistir", { onde: "loja" }), ["onde"]);
  assert.equal(d("desistir", { onde: "loja" }).situacao, "loja-fisica");
  const base = { onde: "internet", tipo: "produto", chegou: "sim", recebimento: "2026-10-19", especial: "nao", pedido: "nao" };
  assert.deepEqual(ids("desistir", base), ["onde", "tipo", "chegou", "recebimento", "especial", "pedido"]);
  const ultimoDia = d("desistir", base);
  assert.equal(ultimoDia.situacao, "dentro-dos-7-dias");
  assert.equal(prazo(ultimoDia, "arrependimento").ate, HOJE);
  assert.equal(d("desistir", { ...base, recebimento: "2026-10-18" }).situacao, "fora-dos-7-dias");
});

test("desistir: antes de chegar, serviço conta da contratação, exceções e recusa", () => {
  assert.equal(d("desistir", { onde: "internet", tipo: "produto", chegou: "nao", especial: "nao", pedido: "nao" }).situacao, "antes-de-chegar");
  assert.deepEqual(ids("desistir", { onde: "telefone", tipo: "servico" }), ["onde", "tipo", "contratacao", "pedido"]);
  assert.equal(d("desistir", { onde: "telefone", tipo: "servico", contratacao: "2026-10-20", pedido: "nao" }).situacao, "dentro-dos-7-dias");
  const especial = d("desistir", { onde: "internet", tipo: "produto", chegou: "sim", recebimento: "2026-10-25", especial: "sim", pedido: "recusado" });
  assert.ok(temId(especial.avisos, "especial") && temId(especial.avisos, "recusa"));
  // A exceção é entendimento de Procon, não regra da lei: o resultado não nega o direito
  assert.equal(especial.situacao, "dentro-dos-7-dias");
});

test("cancelei e não recebi: fundamento conforme o motivo; cartão e cobrança indevida", () => {
  const base = { motivo: "arrependimento", dataCancelamento: "2026-10-10", meio: "cartao", naFatura: "sim", contato: "sim" };
  const diag = d("cancelei-sem-reembolso", base);
  assert.ok(temId(diag.alternativas, "devolucao-imediata") && temId(diag.alternativas, "estorno-cartao"));
  assert.ok(diag.links.some((l) => l.href === "/calculadoras/cobranca-indevida"));
  assert.ok(temId(diag.avisos, "cobranca-depois-do-cancelamento"));
  assert.match(diag.resumo, /há 16 dias/);
  assert.ok(temId(d("cancelei-sem-reembolso", { ...base, motivo: "loja-cancelou" }).alternativas, "devolucao-oferta"));
  const pix = d("cancelei-sem-reembolso", { motivo: "defeito", dataCancelamento: HOJE, meio: "pix", contato: "nao" });
  assert.ok(temId(pix.alternativas, "devolucao-defeito") && temId(pix.avisos, "pix-boleto"));
  assert.ok(!pix.links.some((l) => l.href === "/calculadoras/cobranca-indevida"));
  assert.match(pix.resumo, /há 0 dias/);
});

test("loja não troca: sem defeito na loja física não há obrigação, salvo se anunciou; com defeito, conserto primeiro", () => {
  assert.deepEqual(ids("loja-nao-troca", { motivo: "gosto" }), ["motivo", "onde", "anunciou", "recebimento"]);
  assert.deepEqual(ids("loja-nao-troca", { motivo: "defeito" }), ["motivo", "durabilidade", "recebimento"]);
  const fisica = { motivo: "gosto", onde: "loja", anunciou: "nao", recebimento: "2026-10-25" };
  assert.equal(d("loja-nao-troca", fisica).situacao, "sem-obrigacao");
  assert.equal(d("loja-nao-troca", { ...fisica, anunciou: "sim" }).situacao, "troca-anunciada");
  assert.equal(d("loja-nao-troca", { ...fisica, onde: "internet" }).situacao, "dentro-dos-7-dias");
  const comDefeito = d("loja-nao-troca", { motivo: "defeito", durabilidade: "duravel", recebimento: "2026-09-01" });
  assert.equal(comDefeito.situacao, "defeito-conserto");
  assert.equal(comDefeito.problema, "loja-nao-troca");
});

test("loja sumiu e golpe: prazo de 80 dias do MED só no Pix", () => {
  const sumiu = d("loja-sumiu", { meio: "pix", pagamento: "2026-10-01", dados: "nao", marketplace: "nao" });
  assert.equal(prazo(sumiu, "med").ate, "2026-12-20");
  assert.ok(temId(sumiu.alternativas, "med") && temId(sumiu.avisos, "sem-dados"));
  assert.deepEqual(sumiu.integracoesFuturas, ["gerador-de-reclamacao", "simulador-golpe-pix"]);
  assert.equal(prazo(d("loja-sumiu", { meio: "cartao", pagamento: "2026-10-01", dados: "sim", marketplace: "nao" }), "med"), undefined);
  const golpe = d("golpe", { meio: "pix", pagamento: "2026-10-26", avisouBanco: "nao" });
  assert.equal(golpe.situacao, "pix");
  assert.ok(temId(golpe.avisos, "avise-agora"));
  const antigo = d("golpe", { meio: "pix", pagamento: "2026-08-01", avisouBanco: "sim" });
  assert.equal(antigo.situacao, "pix-fora-do-med");
  assert.ok(temId(antigo.avisos, "med-passou"));
  assert.ok(temId(d("golpe", { meio: "boleto", pagamento: "2026-10-20", avisouBanco: "sim" }).alternativas, "avisar-banco"));
});

test("outro problema: sem perguntas, direitos básicos", () => {
  assert.deepEqual(ids("outro", {}), []);
  assert.equal(d("outro", {}).alternativas.length, 4);
});

test("validação: datas impossíveis, futuras e respostas fora da lista", () => {
  const recebimento = perguntasDoFluxo("defeito").find((p) => p.id === "recebimento");
  assert.equal(validarResposta(recebimento, "2026-02-30", HOJE), "Data inválida.");
  assert.equal(validarResposta(recebimento, "2026-10-27", HOJE), "A data não pode ser depois de hoje.");
  assert.equal(validarResposta(recebimento, "nao-sei", HOJE), "Informe a data.");
  assert.equal(validarResposta(recebimento, "", HOJE), "Informe a data.");
  const prometida = perguntasDoFluxo("nao-chegou").find((p) => p.id === "prometida");
  assert.equal(validarResposta(prometida, "2026-12-01", HOJE), null);
  assert.equal(validarResposta(prometida, "nao-sei", HOJE), null);
  const pagou = perguntasDoFluxo("nao-chegou")[0];
  assert.equal(validarResposta(pagou, "<script>", HOJE), "Escolha uma opção.");
  const r = diagnosticar("nao-chegou", { pagou: "talvez" }, HOJE);
  assert.equal(r.ok, false);
});

test("respostas de perguntas escondidas não mudam o diagnóstico", () => {
  const a = d("desistir", { onde: "loja" });
  const b = d("desistir", { onde: "loja", tipo: "produto", chegou: "nao", pedido: "recusado" });
  assert.deepEqual(a, b);
});

test("toda fonte citada existe e toda frase de prazo tem fonte", () => {
  const casos = [
    ["nao-chegou", naoChegou],
    ["defeito", defeito],
    ["golpe", { meio: "pix", pagamento: "2026-10-20", avisouBanco: "sim" }],
    ["cancelei-sem-reembolso", { motivo: "atraso", dataCancelamento: "2026-10-01", meio: "cartao", naFatura: "nao", contato: "nao" }],
  ];
  for (const [p, r] of casos) {
    const diag = d(p, r);
    for (const f of fontesDoDiagnostico(diag)) assert.ok(FONTES[f], f);
    for (const pr of diag.prazos) assert.ok(pr.fontes.length > 0, pr.id);
    for (const l of diag.links) assert.match(l.href, /^\/(artigos|calculadoras)\/[a-z0-9-]+$/);
  }
});
