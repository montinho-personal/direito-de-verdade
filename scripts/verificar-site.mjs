// Verificação do site no navegador (regra do Renato, 26/11/2026).
//
// Uso: com o site rodando (npm run build && npx next start -p 3100):
//   node scripts/verificar-site.mjs                 -> todas as páginas do sitemap
//   node scripts/verificar-site.mjs /artigos/x ...  -> só as páginas indicadas
//   BASE=https://direitodeverdade.com.br node scripts/verificar-site.mjs /artigos/x
//
// Para cada página, em computador (1280 px) e celular (390 px):
//   - abre no Chromium e confere o status 200;
//   - erros de JavaScript e do console;
//   - rolagem lateral (conteúdo maior que a tela);
//   - acessibilidade (axe-core, só falhas graves e críticas);
//   - links internos (status 200 e âncora existente), no computador;
//   - ferramentas: preenche os campos, aperta os botões e confere que a página
//     reage sem erro e sem "NaN", "undefined" ou "Infinity" na tela.
// Termina com código 1 se houver qualquer problema.

import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const axeSrc = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

const BASE = process.env.BASE || 'http://localhost:3100';
const ignorar = /googletagmanager|google-analytics|gtag|pagead|adsbygoogle|Failed to load resource/i;

let paginas = process.argv.slice(2);
if (!paginas.length) {
  const sm = await (await fetch(BASE + '/sitemap.xml')).text();
  paginas = [...sm.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
}

const telas = [
  { nome: 'computador', viewport: { width: 1280, height: 900 } },
  { nome: 'celular', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
];

const navegador = await chromium.launch();
const linksConferidos = new Map();
const problemas = [];
let ok = 0;

async function statusDe(caminho) {
  if (!linksConferidos.has(caminho)) {
    const r = await fetch(BASE + caminho, { redirect: 'manual' });
    linksConferidos.set(caminho, { status: r.status, html: r.status === 200 ? await r.text() : '' });
  }
  return linksConferidos.get(caminho);
}

for (const tela of telas) {
  const ctx = await navegador.newContext({ viewport: tela.viewport, isMobile: tela.isMobile, hasTouch: tela.hasTouch });
  for (const caminho of paginas) {
    const erros = [];
    const pagina = await ctx.newPage();
    pagina.on('pageerror', (e) => erros.push('JS: ' + e.message));
    pagina.on('console', (m) => { if (m.type() === 'error' && !ignorar.test(m.text())) erros.push('console: ' + m.text()); });
    const achados = [];
    try {
      const resp = await pagina.goto(BASE + caminho, { waitUntil: 'networkidle', timeout: 60000 });
      if (!resp || resp.status() !== 200) achados.push(`status ${resp && resp.status()}`);

      if (await pagina.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) achados.push('rolagem lateral');

      await pagina.addScriptTag({ content: axeSrc });
      const axe = await pagina.evaluate(async () => {
        const r = await window.axe.run(document, { resultTypes: ['violations'] });
        return r.violations.filter((v) => ['critical', 'serious'].includes(v.impact)).map((v) => v.id);
      });
      if (axe.length) achados.push('acessibilidade: ' + axe.join(', '));

      // Links internos (uma vez, na tela de computador).
      if (tela.nome === 'computador') {
        const links = await pagina.$$eval('main a[href^="/"]', (as) => [...new Set(as.map((a) => a.getAttribute('href')))]);
        for (const href of links) {
          const [semHash, hash] = href.split('#');
          const { status, html } = await statusDe(semHash.split('?')[0] || '/');
          if (status !== 200) achados.push(`link ${href} -> ${status}`);
          else if (hash && !html.includes(`id="${decodeURIComponent(hash)}"`)) achados.push(`âncora quebrada ${href}`);
        }
      }

      // Ferramentas: campos e botões dentro do conteúdo. Os campos podem mudar
      // enquanto são preenchidos (aparecer ou sumir), por isso cada um é tratado
      // com tempo curto e o que sumiu é ignorado.
      const main = pagina.locator('main');
      const campos = await main.locator('input, select, textarea').elementHandles();
      const botoes = await main.locator('button').elementHandles();
      if (campos.length || botoes.length) {
        for (const c of campos) {
          try {
            if (!(await c.isVisible())) continue;
            const tag = await c.evaluate((e) => e.tagName.toLowerCase());
            const tipo = (await c.getAttribute('type')) || '';
            if (tag === 'select') {
              const n = await c.evaluate((e) => e.options.length);
              if (n > 1) await c.selectOption({ index: 1 }, { timeout: 2000 });
            } else if (tipo === 'checkbox' || tipo === 'radio') {
              await c.check({ timeout: 2000 });
            } else if (tipo === 'date') {
              await c.fill('2026-01-15', { timeout: 2000 });
            } else if (!['hidden', 'submit', 'button', 'file', 'search', 'reset'].includes(tipo)) {
              await c.fill('3000', { timeout: 2000 });
            }
          } catch { /* campo que sumiu, desabilitado ou somente leitura */ }
        }
        for (const b of botoes) {
          try {
            if (!(await b.isVisible())) continue;
            await b.click({ timeout: 2000 });
            await pagina.waitForTimeout(150);
          } catch { /* botão que sumiu, coberto ou desabilitado */ }
          if (!pagina.url().startsWith(BASE + caminho.split('#')[0])) { await pagina.goBack(); break; }
        }
        const texto = await main.innerText();
        const ruim = texto.match(/\bNaN\b|\bundefined\b|\bInfinity\b|R\$\s*NaN/);
        if (ruim) achados.push(`ferramenta mostrou "${ruim[0]}"`);
      }
    } catch (e) {
      achados.push('falha ao abrir: ' + e.message.split('\n')[0]);
    }
    achados.push(...erros);
    if (achados.length) problemas.push(`[${tela.nome}] ${caminho}: ${achados.join(' | ')}`);
    else ok++;
    await pagina.close();
  }
  await ctx.close();
}
await navegador.close();

for (const p of problemas) console.log(p);
console.log(`\n${ok} de ${paginas.length * telas.length} verificações sem problema (${paginas.length} páginas x ${telas.length} telas).`);
process.exit(problemas.length ? 1 : 0);
