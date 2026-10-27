// Testes do simulador de direitos do passageiro aéreo (src/lib/voo). Conferem os marcos de
// assistência da Resolução ANAC 400 (com a Resolução 813, em vigor desde 26/10/2026, e a
// 819, que adiou a informação para 25/11/2026), as alternativas, a preterição, a
// bagagem, os limites territoriais e as categorias de direito, que não se misturam.
import { test } from "node:test";
import assert from "node:assert/strict";
import { diagnosticar, esperaEmMinutos, perguntasVisiveis, PROBLEMAS, perguntasDoFluxo, somarDespesas, validarResposta } from "../src/lib/voo/diagnostico.ts";
import { FONTES } from "../src/lib/voo/regras.ts";

const HOJE = "2026-10-27";
const d = (p, r) => {
  const res = diagnosticar(p, r, HOJE);
  assert.equal(res.ok, true, JSON.stringify(res.erros));
  return res.diagnostico;
};
const ids = (diag) => diag.direitos.map((x) => x.id);
const avisos = (diag) => diag.avisos.map((x) => x.id);
const atraso = (min, extra = {}) => {
  const h = String(10 + Math.floor(min / 60)).padStart(2, "0");
  const m = String(min % 60).padStart(2, "0");
  return { rota: "nacional", previsto: "2026-10-27T10:00", saiu: "sim", efetivo: `2026-10-27T${h}:${m}`, embarcou: "nao", motivo: "tecnico", assistencia: "nada", pernoite: "sim", reside: "nao", pnae: "nao", conexao: "nao", despesas: "nao", ...extra };
};

test("todos os fluxos têm perguntas únicas e opções", () => {
  for (const p of PROBLEMAS) {
    const qs = perguntasDoFluxo(p);
    assert.equal(new Set(qs.map((q) => q.id)).size, qs.length, p);
  }
});

test("atraso até 1 hora: só informação; sem assistência", () => {
  const diag = d("atraso", atraso(60));
  assert.equal(diag.situacao, "ate-1h");
  assert.deepEqual(ids(diag), ["informacao", "indenizacao"]);
  assert.ok(!perguntasVisiveis("atraso", atraso(60)).some((q) => q.id === "assistencia"));
});

test("marcos de 1, 2 e 4 horas: 'superior a', no regime novo sem comunicação", () => {
  assert.deepEqual(ids(d("atraso", atraso(61))), ["informacao", "indenizacao"]);
  assert.deepEqual(ids(d("atraso", atraso(120))), ["informacao", "indenizacao"]);
  assert.deepEqual(ids(d("atraso", atraso(121))), ["informacao", "alimentacao", "indenizacao"]);
  assert.deepEqual(ids(d("atraso", atraso(240))), ["informacao", "alimentacao", "indenizacao"]);
  assert.deepEqual(ids(d("atraso", atraso(241))), ["informacao", "alimentacao", "hospedagem", "alternativas", "reembolso", "indenizacao"]);
});

test("regime anterior (voo até 25/10/2026): comunicação depois de 1 hora", () => {
  const antigo = atraso(61, { previsto: "2026-10-20T10:00", efetivo: "2026-10-20T11:01" });
  const diag = d("atraso", antigo);
  assert.equal(diag.regime, "original");
  assert.ok(ids(diag).includes("comunicacao"));
  assert.ok(avisos(diag).includes("regra-antiga"));
  assert.equal(d("atraso", atraso(61)).regime, "r813");
});

test("hospedagem: pernoite, morador da cidade e passageiro com deficiência", () => {
  assert.ok(ids(d("atraso", atraso(300, { pernoite: "nao" }))).includes("sem-pernoite"));
  const mora = d("atraso", atraso(300, { reside: "sim" }));
  assert.ok(ids(mora).includes("transporte-casa") && !ids(mora).includes("hospedagem"));
  assert.ok(ids(d("atraso", atraso(300, { pernoite: "nao", pnae: "sim" }))).includes("hospedagem"));
});

test("assistência oferecida e não oferecida", () => {
  const ok = d("atraso", atraso(300, { assistencia: "alimentacao,hospedagem" }));
  assert.equal(ok.direitos.find((x) => x.id === "alimentacao").oferecido, true);
  assert.ok(!avisos(ok).includes("assistencia-nao-oferecida"));
  assert.ok(avisos(d("atraso", atraso(300))).includes("assistencia-nao-oferecida"));
  assert.match(d("atraso", atraso(300)).resumo, /atraso de 5 h e você declarou não ter recebido assistência material/);
});

test("ainda esperando: espera até agora; virada de dia; fuso não muda a conta", () => {
  const r = { rota: "nacional", previsto: "2026-10-26T22:30", saiu: "esperando", agora: "2026-10-27T03:15" };
  assert.equal(esperaEmMinutos(r), 285);
  // Horas locais do mesmo aeroporto: a mesma diferença em Manaus ou em Brasília
  assert.equal(esperaEmMinutos({ ...r, previsto: "2026-10-26T21:30", agora: "2026-10-27T02:15" }), 285);
  // Saiu antes do horário: zero
  assert.equal(esperaEmMinutos({ rota: "nacional", previsto: "2026-10-27T10:00", saiu: "sim", efetivo: "2026-10-27T09:50" }), 0);
});

test("conexão perdida: mesma reserva por culpa da companhia; reservas separadas; motivo do passageiro", () => {
  const base = { rota: "nacional", dataVoo: "2026-10-27", mesmaReserva: "sim", causa: "transportador", espera: "mais-4h", assistencia: "nada", pernoite: "sim", reside: "nao", despesas: "sim" };
  const diag = d("conexao", base);
  assert.equal(diag.situacao, "conexao-por-culpa-da-companhia");
  assert.ok(ids(diag).includes("alternativas") && ids(diag).includes("ressarcimento"));
  const sep = d("conexao", { ...base, mesmaReserva: "nao" });
  assert.ok(!ids(sep).includes("alternativas") && avisos(sep).includes("reservas-separadas"));
  const meu = d("conexao", { rota: "nacional", dataVoo: "2026-10-27", mesmaReserva: "sim", causa: "passageiro", despesas: "nao" });
  assert.equal(meu.situacao, "conexao-por-motivo-do-passageiro");
  assert.ok(avisos(meu).includes("motivo-do-passageiro"));
  // Atraso com conexão perdida também abre as alternativas
  assert.ok(ids(d("atraso", atraso(90, { conexao: "sim" }))).includes("alternativas"));
});

test("cancelamento: com antecedência é alteração programada; no aeroporto, alternativas e assistência", () => {
  const cedo = d("cancelamento", { rota: "nacional", dataVoo: "2026-11-20", aviso: "mais-72h", ofereceu: "sim", aceitou: "nenhuma", finalidade: "nao", conexao: "nao", compra: "direto", despesas: "nao" });
  assert.equal(cedo.situacao, "cancelamento-com-antecedencia");
  assert.ok(ids(cedo).includes("alteracao-programada") && !ids(cedo).includes("alimentacao"));
  const noDia = d("cancelamento", { rota: "nacional", dataVoo: "2026-10-27", aviso: "no-dia", ofereceu: "nao", espera: "mais-4h", assistencia: "alimentacao", pernoite: "sim", reside: "nao", finalidade: "sim", conexao: "nao", compra: "intermediario", despesas: "sim" });
  assert.equal(noDia.situacao, "cancelamento-no-dia");
  for (const id of ["informacao", "alimentacao", "hospedagem", "alternativas", "reembolso", "ressarcimento", "indenizacao"]) assert.ok(ids(noDia).includes(id), id);
  for (const id of ["intermediario", "finalidade"]) assert.ok(avisos(noDia).includes(id), id);
  // Uma escolha entre as alternativas, não todas
  assert.match(noDia.direitos.find((x) => x.id === "alternativas").texto, /Você escolhe uma delas, não todas juntas/);
});

test("preterição: compensação de 250 DES (nacional) ou 500 DES (internacional); voluntário e documentação não são preterição", () => {
  const base = { rota: "nacional", dataVoo: "2026-10-27", motivo: "overbooking", apresentou: "sim", compensacao: "nao", espera: "2-4h", assistencia: "nada", despesas: "nao" };
  const nac = d("pretericao", base);
  assert.equal(nac.situacao, "pretericao");
  assert.match(nac.direitos.find((x) => x.id === "compensacao").titulo, /250 DES/);
  assert.match(d("pretericao", { ...base, rota: "saida-brasil" }).direitos.find((x) => x.id === "compensacao").titulo, /500 DES/);
  // Compensação regulatória separada da indenização judicial
  const cats = nac.direitos.map((x) => x.categoria);
  assert.ok(cats.includes("compensacao") && cats.includes("indenizacao"));
  assert.equal(d("pretericao", { rota: "nacional", dataVoo: "2026-10-27", motivo: "voluntario", despesas: "nao" }).situacao, "voluntario");
  const doc = d("pretericao", { rota: "nacional", dataVoo: "2026-10-27", motivo: "documentacao", despesas: "nao" });
  assert.equal(doc.situacao, "motivo-do-passageiro");
  assert.ok(!ids(doc).includes("compensacao"));
  assert.equal(d("pretericao", { ...base, apresentou: "nao" }).situacao, "sem-apresentacao");
});

test("bagagem extraviada: 7 dias no nacional, 21 no internacional; despesas fora de casa", () => {
  const base = { rota: "nacional", desembarque: "2026-10-20", entregue: "nao", registro: "sim", foraDeCasa: "sim", comprou: "sim", notas: "sim" };
  assert.match(d("extravio", base).direitos[0].texto, /até 7 dias.*até 27\/10\/2026/);
  const intl = d("extravio", { ...base, rota: "chegada-brasil" });
  assert.match(intl.direitos[0].texto, /até 21 dias.*até 10\/11\/2026/);
  assert.ok(intl.direitos.find((x) => x.id === "indenizacao-bagagem").fontes.includes("stf210"));
  assert.match(d("extravio", { ...base, foraDeCasa: "nao" }).direitos[1].texto, /fora do seu domicílio/);
  assert.match(d("extravio", { ...base, registro: "nao" }).direitos[0].condicoes, /registrado de imediato/);
});

test("bagagem danificada: reclamar em 7 dias; item frágil", () => {
  const diag = d("avaria", { rota: "nacional", recebimento: "2026-10-25", tipoDano: "avaria", protesto: "nao", fragil: "sim" });
  assert.match(diag.direitos[0].texto, /até 01\/11\/2026/);
  assert.match(diag.direitos[0].excecoes, /frágil/);
});

test("alteração de horário: menos de 72 horas, mudança grande sem concordância, mudança pequena, sem aviso", () => {
  const base = { rota: "nacional", dataVoo: "2026-11-20", aviso: "mais-72h", diferenca: "30-60", concorda: "nao", despesas: "nao" };
  assert.equal(d("alteracao", base).situacao, "alteracao-grande");
  // No internacional, 30-60 minutos não passa de 1 hora
  assert.equal(d("alteracao", { ...base, rota: "saida-brasil" }).situacao, "alteracao-sem-direito-extra");
  assert.equal(d("alteracao", { ...base, aviso: "menos-72h", diferenca: "ate-30", concorda: "sim" }).situacao, "alteracao-menos-72h");
  assert.equal(d("alteracao", { ...base, concorda: "sim" }).situacao, "alteracao-sem-direito-extra");
  assert.ok(ids(d("alteracao", { rota: "nacional", dataVoo: "2026-10-27", aviso: "nao-avisou", despesas: "nao" })).includes("falha-de-informacao"));
});

test("limites territoriais: partida do exterior sem a assistência da ANAC; voo só no exterior fora do alcance", () => {
  const ext = d("atraso", atraso(300, { rota: "chegada-brasil" }));
  assert.ok(!ids(ext).includes("alimentacao"));
  assert.ok(avisos(ext).includes("territorio"));
  const fora = d("atraso", atraso(300, { rota: "exterior" }));
  assert.ok(!ids(fora).includes("informacao"));
  assert.match(fora.avisos.find((a) => a.id === "territorio").texto, /não cobre/);
  // Partida do Brasil para o exterior: assistência vale
  assert.ok(ids(d("atraso", atraso(300, { rota: "saida-brasil" }))).includes("alimentacao"));
});

test("força maior afasta a indenização, não a assistência; motivo técnico não é força maior", () => {
  const tempo = d("atraso", atraso(300, { motivo: "mau-tempo" }));
  assert.ok(avisos(tempo).includes("forca-maior") && ids(tempo).includes("alimentacao"));
  assert.ok(avisos(d("atraso", atraso(300))).includes("risco-da-atividade"));
});

test("informação: regra antiga até 24/11/2026, nova (Resolução 813) a partir de 25/11/2026", () => {
  assert.match(d("atraso", atraso(30)).direitos[0].texto, /a cada 30 minutos/);
  const novo = d("cancelamento", { rota: "nacional", dataVoo: "2026-11-25", aviso: "menos-72h", ofereceu: "nao", finalidade: "nao", conexao: "nao", compra: "direto", despesas: "nao" });
  assert.match(novo.direitos[0].texto, /data e a hora da última atualização/);
});

test("validação: datas e horas inválidas, saída muito antes, opções fora da lista", () => {
  const q = (p, id) => perguntasDoFluxo(p).find((x) => x.id === id);
  assert.equal(validarResposta(q("atraso", "previsto"), "2026-10-27T25:00", {}, HOJE), "Informe a data e a hora.");
  assert.equal(validarResposta(q("atraso", "previsto"), "2026-02-30T10:00", {}, HOJE), "Informe a data e a hora.");
  assert.match(validarResposta(q("atraso", "efetivo"), "2026-10-25T10:00", { previsto: "2026-10-27T10:00" }, HOJE), /antes/);
  assert.equal(validarResposta(q("extravio", "desembarque"), "2026-10-28", {}, HOJE), "A data não pode ser depois de hoje.");
  assert.equal(validarResposta(q("atraso", "assistencia"), "nada,alimentacao", {}, HOJE), "Marque “Nada” sozinho, ou desmarque.");
  assert.equal(validarResposta(q("atraso", "rota"), "lua", {}, HOJE), "Escolha uma opção.");
  assert.equal(diagnosticar("atraso", { rota: "nacional" }, HOJE).ok, false);
});

test("despesas: soma por categoria, ignora valores inválidos", () => {
  const s = somarDespesas([
    { categoria: "alimentacao", descricao: "jantar", data: "2026-10-27", valor: 8_950 },
    { categoria: "alimentacao", descricao: "café", data: "2026-10-28", valor: 2_500 },
    { categoria: "hospedagem", descricao: "hotel", data: "2026-10-27", valor: 42_000 },
    { categoria: "outros", descricao: "", data: "", valor: 0 },
  ]);
  assert.equal(s.total, 53_450);
  assert.equal(s.quantidade, 3);
  assert.deepEqual(s.porCategoria.map((c) => [c.categoria, c.total]), [["alimentacao", 11_450], ["hospedagem", 42_000]]);
});

test("toda fonte citada existe; nenhum texto promete indenização", () => {
  const casos = [["atraso", atraso(300)], ["pretericao", { rota: "saida-brasil", dataVoo: "2026-10-27", motivo: "overbooking", apresentou: "sim", compensacao: "nao", espera: "mais-4h", assistencia: "nada", pernoite: "sim", reside: "nao", despesas: "sim" }]];
  for (const [p, r] of casos) {
    const diag = d(p, r);
    for (const x of [...diag.direitos, ...diag.avisos]) for (const f of x.fontes) assert.ok(FONTES[f], f);
    const texto = JSON.stringify(diag).toLowerCase();
    for (const proibido of ["você tem direito à indenização", "indenização garantida", "receberá r$"]) assert.ok(!texto.includes(proibido), proibido);
  }
});
