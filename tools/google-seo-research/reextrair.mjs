// Relê o HTML salvo de coletas antigas com a versão atual do extrator, SEM pesquisar de novo
// no Google. Use depois de ajustar extrator.mjs.
//
//   npm run seo:reextrair                 todas as coletas com HTML salvo
//   npm run seo:reextrair -- <id>         uma coleta
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extrairDaPagina } from "./extrator.mjs";

process.env.SEO_LAB_DADOS ??= path.join(path.dirname(fileURLToPath(import.meta.url)), "dados");
const { gravarColeta, lerColeta, listarColetas, pastaDaColeta } = await import("./lib/armazenamento.ts");
const { chromium } = createRequire(import.meta.url)("playwright");

const ids = process.argv.slice(2);
const coletas = ids.length ? ids.map(lerColeta).filter(Boolean) : listarColetas();
const navegador = await chromium.launch();
// Sem JavaScript e sem rede: só o HTML que foi salvo
const contexto = await navegador.newContext({ javaScriptEnabled: false, offline: true });
const pagina = await contexto.newPage();

for (const coleta of coletas) {
  const arquivo = coleta.html && path.join(pastaDaColeta(coleta.id), coleta.html);
  if (!arquivo || !fs.existsSync(arquivo)) continue;
  await pagina.setContent(fs.readFileSync(arquivo, "utf8"), { waitUntil: "domcontentloaded" });
  const lido = await pagina.evaluate(extrairDaPagina);
  for (const bloco of ["perguntas", "visaoDeIA", "outrasPesquisas", "organicos"]) {
    coleta[bloco] = { ...lido[bloco], captura: coleta[bloco]?.captura };
  }
  gravarColeta(coleta);
  console.log(
    `${coleta.id}: perguntas ${coleta.perguntas.itens.length}, visão de IA ${coleta.visaoDeIA.itens.length}, ` +
      `outras pesquisas ${coleta.outrasPesquisas.itens.length}, orgânicos ${coleta.organicos.itens.length}`,
  );
}
await navegador.close();
