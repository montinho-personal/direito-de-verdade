// Teste do coletor de ponta a ponta, contra a página de exemplo local (sem tocar no Google).
// Precisa do Playwright instalado nesta pasta:  npm run seo:testar-coletor
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { iniciarServidorDeExemplo } from "./servidor-de-exemplo.mjs";

const pasta = path.dirname(fileURLToPath(import.meta.url));

test("coleta os cinco elementos, grava evidências e relê o HTML salvo", async () => {
  const servidor = await iniciarServidorDeExemplo();
  const dados = fs.mkdtempSync(path.join(os.tmpdir(), "seo-lab-"));
  const env = {
    ...process.env,
    SEO_LAB_DADOS: dados,
    SEO_LAB_URL: `http://127.0.0.1:${servidor.address().port}/`,
    SEO_LAB_TESTE: "1",
  };
  try {
    // O servidor de exemplo vive neste processo: o coletor roda em outro, sem bloquear este
    const rodar = (arquivo, args = []) =>
      new Promise((resolver) => {
        const filho = spawn(process.execPath, ["--experimental-strip-types", "--no-warnings", path.join(pasta, "..", arquivo), ...args], { env });
        let saida = "";
        filho.stdout.on("data", (d) => (saida += d));
        filho.stderr.on("data", (d) => (saida += d));
        filho.on("exit", (codigo) => resolver({ codigo, saida }));
      });

    const coletor = await rodar("coletor.mjs", ["Multa Proporcional  Aluguel"]);
    assert.equal(coletor.codigo, 0, coletor.saida);

    const [id] = fs.readdirSync(path.join(dados, "coletas"));
    const arquivo = path.join(dados, "coletas", id, "coleta.json");
    const coleta = JSON.parse(fs.readFileSync(arquivo, "utf8"));

    assert.equal(coleta.palavra, "multa proporcional aluguel");
    assert.equal(coleta.status, "coletado");
    assert.equal(coleta.provedor, "navegador-supervisionado");
    assert.deepEqual(
      coleta.autocompletar.itens.map((s) => s.texto),
      ["multa proporcional aluguel", "multa proporcional aluguel cálculo", "multa proporcional aluguel 12 meses"],
    );
    assert.equal(coleta.perguntas.itens.length, 3);
    assert.equal(coleta.perguntas.itens[0].resposta, "Divida o valor da multa pelo número de meses do contrato e multiplique pelos meses que faltam.");
    assert.equal(coleta.perguntas.itens[0].fonteTitulo, "Como calcular a multa");
    assert.equal(coleta.perguntas.itens[0].fonteUrl, "https://exemplo-dois.com.br/como-calcular");
    assert.equal(coleta.perguntas.itens[1].resposta, undefined);
    assert.match(coleta.visaoDeIA.itens[0].texto, /proporcional ao tempo que falta/);
    assert.equal(coleta.visaoDeIA.itens[0].fontes.length, 2);
    assert.deepEqual(
      coleta.outrasPesquisas.itens.map((s) => s.texto),
      ["multa aluguel 30 meses", "isenção multa aluguel transferência de emprego", "modelo de carta de rescisão de aluguel"],
    );
    // Só os três resultados: os links da visão de IA e das perguntas não entram
    assert.deepEqual(
      coleta.organicos.itens.map((r) => [r.posicao, r.dominio]),
      [[1, "exemplo-um.com.br"], [2, "direitodeverdade.com.br"], [3, "exemplo-tres.com.br"]],
    );
    assert.match(coleta.organicos.itens[0].trecho, /^Calcule a multa proporcional/);

    for (const nome of ["pagina.html", "pagina.png", "autocompletar.png", "perguntas.png"]) {
      assert.ok(fs.statSync(path.join(dados, "coletas", id, nome)).size > 0, nome);
    }

    // Reextração: apaga o que foi lido e relê do HTML salvo
    fs.writeFileSync(arquivo, JSON.stringify({ ...coleta, perguntas: { status: "erro", itens: [] } }));
    const relido = await rodar("reextrair.mjs");
    assert.equal(relido.codigo, 0, relido.saida);
    assert.equal(JSON.parse(fs.readFileSync(arquivo, "utf8")).perguntas.itens.length, 3);
  } finally {
    servidor.close();
    fs.rmSync(dados, { recursive: true, force: true });
  }
});
