// Coletor supervisionado: abre um navegador VISÍVEL, faz uma busca por vez no Google Brasil
// e registra o que a página mostrou, com capturas de tela e o HTML como evidência.
//
// Uma pessoa acompanha cada busca: é ela quem abre as perguntas, rola a página e manda
// capturar. Se o Google pedir verificação (CAPTCHA), o coletor NÃO tenta contornar: avisa,
// registra a coleta como "bloqueado" e para. Para pesquisar em escala, veja lib/provedores.ts.
//
// Uso (na raiz do projeto):
//   npm run seo:coletar                           busca as palavras cadastradas ainda sem coleta
//   npm run seo:coletar -- "multa proporcional aluguel"
//   npm run seo:coletar -- --todas                refaz a busca de todas as cadastradas
//   npm run seo:coletar -- --dispositivo celular  simula um celular (o padrão é computador)
//   npm run seo:coletar -- --navegador chromium   usa o Chromium do Playwright, e não o Chrome
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { extrairAutocompletar, extrairDaPagina } from "./extrator.mjs";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
process.env.SEO_LAB_DADOS ??= path.join(AQUI, "dados");

const { adicionarPalavra, gravarColeta, idDaColeta, listarColetas, listarPalavras, pastaDaColeta, pastaDeDados } =
  await import("./lib/armazenamento.ts");

let playwright;
try {
  playwright = createRequire(import.meta.url)("playwright");
} catch {
  console.error(
    "\nO Playwright não está instalado. Rode uma vez:\n\n  cd tools/google-seo-research\n  npm install\n  npx playwright install chromium\n",
  );
  process.exit(1);
}

// ---- Opções ----

const args = process.argv.slice(2);
const opcao = (nome, padrao) => {
  const i = args.indexOf(`--${nome}`);
  if (i === -1) return padrao;
  const valor = args[i + 1];
  args.splice(i, 2);
  return valor;
};
const dispositivo = opcao("dispositivo", "computador");
const navegador = opcao("navegador", "chrome");
const todas = args.includes("--todas");
const termos = args.filter((a) => !a.startsWith("--"));

if (!["computador", "celular"].includes(dispositivo)) {
  console.error('Use --dispositivo computador ou --dispositivo celular.');
  process.exit(1);
}

const URL_BASE = process.env.SEO_LAB_URL || "https://www.google.com.br/";
const ehGoogle = /(^|\.)google\.[a-z.]+$/.test(new URL(URL_BASE).hostname);
// Modo sem pausa e sem janela: só existe para o teste automático contra a página de exemplo
// local (testes/). Contra o Google, o coletor é sempre visível e supervisionado.
const emTeste = !ehGoogle && process.env.SEO_LAB_TESTE === "1";

for (const termo of termos) adicionarPalavra(termo);
const jaColetadas = new Set(listarColetas().map((c) => c.palavra));
const fila = (
  termos.length
    ? termos.map((t) => t.replace(/\s+/g, " ").trim().toLowerCase())
    : listarPalavras()
        .map((p) => p.termo)
        .filter((t) => todas || !jaColetadas.has(t))
).filter(Boolean);

if (fila.length === 0) {
  console.log(
    'Nenhuma palavra-chave na fila. Cadastre no painel (npm run seo:lab) ou rode:\n  npm run seo:coletar -- "sua busca"',
  );
  process.exit(0);
}

const terminal = readline.createInterface({ input: process.stdin, output: process.stdout });
const perguntar = async (texto) => (emTeste ? "" : (await terminal.question(`\n${texto}\n> `)).trim().toLowerCase());

// ---- Navegador ----

const perfil = path.join(pastaDeDados(), ".perfil-do-navegador");
const configuracao = {
  headless: emTeste,
  locale: "pt-BR",
  timezoneId: "America/Sao_Paulo",
  ...(dispositivo === "celular" ? playwright.devices["Pixel 7"] : { viewport: { width: 1366, height: 900 } }),
};

async function abrirNavegador() {
  if (navegador === "chrome" && !emTeste) {
    try {
      return await playwright.chromium.launchPersistentContext(perfil, { ...configuracao, channel: "chrome" });
    } catch {
      console.log("Chrome não encontrado; usando o Chromium do Playwright.");
    }
  }
  return playwright.chromium.launchPersistentContext(emTeste ? "" : perfil, configuracao);
}

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function paginaBloqueada(pagina) {
  if (/\/sorry\//.test(pagina.url())) return true;
  return pagina
    .evaluate(() => Boolean(document.querySelector("#captcha-form")) || /tráfego incomum|unusual traffic/i.test(document.body?.innerText || ""))
    .catch(() => false);
}

async function capturar(pagina, pasta, nome, descricao, capturas, opcoes = {}) {
  try {
    await pagina.screenshot({ path: path.join(pasta, nome), ...opcoes });
    capturas.push({ nome, descricao });
  } catch (erro) {
    console.log(`  (captura ${nome} falhou: ${erro.message})`);
  }
}

const vazio = (status, observacao) => ({ status, itens: [], observacao });

async function coletar(pagina, palavra) {
  const quando = new Date();
  const id = idDaColeta(palavra, quando);
  const pasta = pastaDaColeta(id);
  fs.mkdirSync(pasta, { recursive: true });
  const capturas = [];
  const coleta = {
    id,
    palavra,
    coletadaEm: quando.toISOString(),
    provedor: "navegador-supervisionado",
    dispositivo,
    idioma: "pt-BR",
    pais: "BR",
    status: "coletado",
    autocompletar: vazio("nao_encontrado"),
    outrasPesquisas: vazio("nao_encontrado"),
    perguntas: vazio("nao_encontrado"),
    visaoDeIA: vazio("nao_encontrado"),
    organicos: vazio("nao_encontrado"),
    capturas,
  };
  const encerrar = (status, observacao) => {
    Object.assign(coleta, { status, observacao, coletadaEm: new Date().toISOString() });
    if (status === "bloqueado") {
      for (const bloco of ["outrasPesquisas", "perguntas", "visaoDeIA", "organicos"]) {
        coleta[bloco] = vazio("bloqueado", observacao);
      }
    }
    gravarColeta(coleta);
    return coleta;
  };

  console.log(`\n━━ ${palavra} ━━`);
  const inicio = new URL(URL_BASE);
  if (ehGoogle) {
    inicio.searchParams.set("hl", "pt-BR");
    inicio.searchParams.set("gl", "BR");
  }
  await pagina.goto(inicio.href, { waitUntil: "domcontentloaded" });

  // 1. Autocompletar: digita devagar, como uma pessoa, e lê as sugestões
  const campo = pagina.locator('textarea[name="q"], input[name="q"]').first();
  try {
    await campo.waitFor({ state: "visible", timeout: 15000 });
  } catch {
    if (await paginaBloqueada(pagina)) {
      await capturar(pagina, pasta, "bloqueio.png", "Página de verificação do Google", capturas);
      return encerrar("bloqueado", "O Google pediu verificação antes da busca.");
    }
    await perguntar("Não achei o campo de busca. Se há um aviso na janela (cookies, por exemplo), responda a ele e aperte Enter.");
    await campo.waitFor({ state: "visible", timeout: 15000 });
  }
  await campo.click();
  await campo.pressSequentially(palavra, { delay: emTeste ? 5 : 110 });
  await esperar(emTeste ? 300 : 1800);
  try {
    const itens = await pagina.evaluate(extrairAutocompletar);
    coleta.autocompletar = itens.length
      ? { status: "coletado", itens, captura: "autocompletar.png" }
      : vazio("nao_encontrado", "Nenhuma sugestão exibida ou reconhecida. Confira a captura de tela.");
  } catch (erro) {
    coleta.autocompletar = vazio("erro", String(erro));
  }
  await capturar(pagina, pasta, "autocompletar.png", "Autocompletar, com a busca digitada", capturas);
  console.log(`  autocompletar: ${coleta.autocompletar.itens.length} sugestões`);

  // 2. Resultados
  await campo.press("Enter");
  await pagina.waitForLoadState("domcontentloaded").catch(() => {});
  await esperar(emTeste ? 300 : 2500);

  if (await paginaBloqueada(pagina)) {
    await capturar(pagina, pasta, "bloqueio.png", "Página de verificação do Google", capturas);
    console.log("\n  O Google pediu uma verificação nesta busca. O coletor não contorna esse bloqueio.");
    const resposta = await perguntar(
      "Se você quiser, responda à verificação na janela do navegador e aperte Enter para continuar.\nPara registrar a busca como bloqueada e parar, digite p e aperte Enter.",
    );
    if (resposta === "p" || emTeste || (await paginaBloqueada(pagina))) {
      return encerrar("bloqueado", "O Google pediu verificação (CAPTCHA) e a coleta parou.");
    }
  }

  // 3. A pessoa prepara a página: é ela quem decide o que abrir
  const resposta = await perguntar(
    `Na janela do navegador, prepare a página de "${palavra}":\n` +
      '  1. abra 2 ou 3 perguntas de "As pessoas também perguntam";\n' +
      '  2. se houver visão geral de IA, clique em "Mostrar mais";\n' +
      "  3. role até o fim da página e volte.\n" +
      "Aperte Enter para capturar (ou digite p e Enter para pular esta busca).",
  );
  if (resposta === "p") return encerrar("erro", "Busca pulada por quem acompanhava a coleta.");

  coleta.urlDaBusca = pagina.url();
  try {
    const lido = await pagina.evaluate(extrairDaPagina);
    for (const bloco of ["perguntas", "visaoDeIA", "outrasPesquisas", "organicos"]) coleta[bloco] = lido[bloco];
    if (lido.bloqueio) {
      await capturar(pagina, pasta, "bloqueio.png", "Página de verificação do Google", capturas);
      return encerrar("bloqueado", "O Google pediu verificação (CAPTCHA) e a coleta parou.");
    }
  } catch (erro) {
    await capturar(pagina, pasta, "pagina.png", "Página no momento do erro", capturas);
    return encerrar("erro", `Falha ao ler a página: ${erro.message}`);
  }

  // 4. Evidências: HTML, página inteira e cada bloco reconhecido
  fs.writeFileSync(path.join(pasta, "pagina.html"), await pagina.content());
  coleta.html = "pagina.html";
  const nomes = {
    perguntas: "As pessoas também perguntam",
    visaoDeIA: "Visão geral criada por IA",
    outrasPesquisas: "Outras pessoas pesquisaram",
  };
  for (const [bloco, descricao] of Object.entries(nomes)) {
    const alvo = pagina.locator(`[data-seolab="${bloco}"]`).first();
    if ((await alvo.count()) === 0) continue;
    try {
      await alvo.screenshot({ path: path.join(pasta, `${bloco.toLowerCase()}.png`), timeout: 8000 });
      capturas.push({ nome: `${bloco.toLowerCase()}.png`, descricao });
      coleta[bloco].captura = `${bloco.toLowerCase()}.png`;
    } catch {
      // Sem captura do bloco: a da página inteira continua valendo como evidência
    }
  }
  await capturar(pagina, pasta, "pagina.png", "Página de resultados inteira", capturas, { fullPage: true });
  coleta.organicos.captura = "pagina.png";

  const lidos = ["perguntas", "visaoDeIA", "outrasPesquisas", "organicos"].filter((b) => coleta[b].status === "coletado");
  console.log(
    `  perguntas: ${coleta.perguntas.itens.length} · visão de IA: ${coleta.visaoDeIA.itens.length ? "sim" : "não"} · ` +
      `outras pesquisas: ${coleta.outrasPesquisas.itens.length} · orgânicos: ${coleta.organicos.itens.length}`,
  );
  return encerrar(
    lidos.length ? "coletado" : "nao_encontrado",
    lidos.length ? undefined : "Nenhum bloco reconhecido na página. Confira as capturas e o HTML salvo.",
  );
}

// ---- Execução ----

console.log(`Google SEO Research Lab · ${fila.length} busca(s) · ${dispositivo}`);
console.log(`Dados em: ${pastaDeDados()}`);
const contexto = await abrirNavegador();
const pagina = contexto.pages()[0] ?? (await contexto.newPage());
let codigo = 0;
try {
  for (const [i, palavra] of fila.entries()) {
    const coleta = await coletar(pagina, palavra);
    console.log(`  status: ${coleta.status}${coleta.observacao ? ` (${coleta.observacao})` : ""}`);
    if (coleta.status === "bloqueado") {
      console.log("\nColeta interrompida. Espere algumas horas antes de pesquisar de novo.");
      codigo = 2;
      break;
    }
    if (i < fila.length - 1) {
      const resposta = await perguntar("Enter para a próxima busca, ou s e Enter para sair.");
      if (resposta === "s") break;
    }
  }
} finally {
  await contexto.close().catch(() => {});
  terminal.close();
}
console.log("\nPronto. Veja os resultados no painel: npm run seo:lab");
process.exit(codigo);
