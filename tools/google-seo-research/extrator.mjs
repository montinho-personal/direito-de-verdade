// Leitura da página de resultados. Estas funções rodam DENTRO da página (page.evaluate),
// por isso não usam nada de fora delas mesmas.
//
// O Google muda os nomes das classes o tempo todo; a leitura se apoia no que é mais estável:
// os títulos visíveis dos blocos ("As pessoas também perguntam"), atributos de acessibilidade
// (role, aria-expanded) e a estrutura (um link com um h3 dentro é um resultado). Quando um
// bloco não é reconhecido, o status fica "nao_encontrado" e a captura de tela é a evidência.
// Se o Google mudar a página, ajuste aqui e rode `npm run seo:reextrair` para reler o HTML
// salvo das coletas antigas, sem pesquisar de novo.

export function extrairAutocompletar() {
  const limpar = (t) => (t || "").replace(/\s+/g, " ").trim();
  const opcoes = document.querySelectorAll('[role="listbox"] [role="option"], ul[role="listbox"] li');
  const vistos = new Set();
  const itens = [];
  for (const opcao of opcoes) {
    const alvo = opcao.querySelector('[role="option"]') ? null : opcao;
    if (!alvo) continue;
    // A primeira linha é a sugestão; as seguintes, quando existem, são legendas
    const texto = limpar((alvo.innerText || alvo.textContent || "").split("\n")[0]);
    if (texto.length < 2 || texto.length > 150 || vistos.has(texto.toLowerCase())) continue;
    vistos.add(texto.toLowerCase());
    itens.push({ texto });
  }
  return itens;
}

export function extrairDaPagina() {
  const limpar = (t) => (t || "").replace(/\s+/g, " ").trim();
  const simples = (t) =>
    limpar(t)
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase();
  const textoDe = (el) => limpar(el ? el.innerText || el.textContent : "");
  const ehDoGoogle = (url) => {
    try {
      const host = new URL(url).hostname;
      return /(^|\.)google\.[a-z.]+$/.test(host) || /(^|\.)(gstatic|googleusercontent)\.com$/.test(host);
    } catch {
      return true;
    }
  };
  const linkExterno = (a) => /^https?:/.test(a.href || "") && !ehDoGoogle(a.href);

  // Elementos cujo texto é exatamente um dos rótulos (o título visível de um bloco)
  function titulos(rotulos) {
    const alvos = rotulos.map(simples);
    const achados = [];
    for (const el of document.querySelectorAll('h1, h2, h3, [role="heading"], span, div')) {
      const bruto = el.textContent || "";
      if (bruto.length > 80 || bruto.length < 5) continue;
      if (!alvos.includes(simples(bruto))) continue;
      // Fica só com o elemento mais interno que tem o rótulo
      if ([...el.children].some((f) => alvos.includes(simples(f.textContent || "")))) continue;
      achados.push(el);
    }
    return achados;
  }

  // Sobe a partir do título até o primeiro ancestral que satisfaz a condição
  function subirAte(el, condicao, limite = 10) {
    let atual = el;
    for (let i = 0; i < limite && atual && atual !== document.body; i++) {
      if (condicao(atual)) return atual;
      atual = atual.parentElement;
    }
    return null;
  }

  const marcar = (el, nome) => el && el.setAttribute("data-seolab", nome);
  const resultado = {};

  // ---- As pessoas também perguntam ----
  try {
    const itens = [];
    const vistos = new Set();
    let pares = [...document.querySelectorAll("[data-q]")];
    let recipiente = null;
    const titulo = titulos(["As pessoas também perguntam", "Outras perguntas", "As pessoas também perguntaram"])[0];
    if (titulo) {
      recipiente = subirAte(titulo, (el) => el.querySelectorAll("[data-q], [aria-expanded]").length >= 2);
    }
    if (pares.length === 0 && recipiente) {
      pares = [...recipiente.querySelectorAll("[aria-expanded]")];
    }
    for (const par of pares) {
      const botao = par.matches("[aria-expanded]") ? par : par.querySelector("[aria-expanded]");
      const pergunta = limpar(par.getAttribute("data-q")) || textoDe(botao).split("\n")[0];
      if (!pergunta || pergunta.length > 200 || vistos.has(pergunta.toLowerCase())) continue;
      vistos.add(pergunta.toLowerCase());
      const item = { pergunta };
      const aberta = botao && botao.getAttribute("aria-expanded") === "true";
      if (aberta) {
        // O bloco da pergunta aberta: o par, ou o ancestral do botão que já inclui a resposta
        const bloco = par.matches("[data-q]") ? par : subirAte(botao, (el) => textoDe(el).length > pergunta.length + 40, 5);
        const fonte = bloco && [...bloco.querySelectorAll("a[href]")].find(linkExterno);
        let resposta = textoDe(bloco).replace(pergunta, "").trim();
        if (fonte) {
          item.fonteUrl = fonte.href;
          item.fonteTitulo = textoDe(fonte.querySelector("h3")) || textoDe(fonte).slice(0, 150);
          // O título da fonte vem colado no fim da resposta: fica só no campo próprio
          if (textoDe(fonte)) resposta = resposta.replace(textoDe(fonte), "").trim();
        }
        if (resposta) item.resposta = resposta.slice(0, 1500);
      }
      itens.push(item);
    }
    if (!recipiente && pares[0]) {
      recipiente = subirAte(pares[0], (el) => pares.every((p) => el.contains(p)), 8);
    }
    marcar(recipiente, "perguntas");
    resultado.perguntas = itens.length
      ? { status: "coletado", itens }
      : { status: "nao_encontrado", itens, observacao: "Bloco não exibido ou não reconhecido. Confira a captura de tela." };
  } catch (erro) {
    resultado.perguntas = { status: "erro", itens: [], observacao: String(erro) };
  }

  // ---- Visão geral criada por IA ----
  try {
    const titulo = titulos(["Visão geral criada por IA", "Visão geral de IA", "Visão geral da IA", "AI Overview"])[0];
    const bloco = titulo && subirAte(titulo, (el) => textoDe(el).length >= 250, 12);
    if (bloco) {
      marcar(bloco, "visaoDeIA");
      const vistos = new Set();
      const fontes = [];
      for (const a of bloco.querySelectorAll("a[href]")) {
        if (!linkExterno(a) || vistos.has(a.href)) continue;
        vistos.add(a.href);
        fontes.push({ titulo: (textoDe(a) || a.getAttribute("aria-label") || a.href).slice(0, 150), url: a.href });
      }
      const texto = textoDe(bloco).replace(textoDe(titulo), "").trim().slice(0, 6000);
      resultado.visaoDeIA = { status: "coletado", itens: [{ texto, fontes }] };
    } else {
      resultado.visaoDeIA = {
        status: "nao_encontrado",
        itens: [],
        observacao: titulo
          ? "O título do bloco apareceu, mas o texto não tinha carregado."
          : "Bloco não exibido ou não reconhecido. Confira a captura de tela.",
      };
    }
  } catch (erro) {
    resultado.visaoDeIA = { status: "erro", itens: [], observacao: String(erro) };
  }

  // ---- Outras pessoas pesquisaram ----
  try {
    const itens = [];
    const vistos = new Set();
    const rotulos = ["Outras pessoas pesquisaram", "As pessoas também pesquisam", "As pessoas também pesquisaram", "Pesquisas relacionadas", "Outras pessoas também pesquisaram"];
    const ehBusca = (a) => /\/search\?/.test(a.getAttribute("href") || "");
    for (const titulo of titulos(rotulos)) {
      const recipiente = subirAte(titulo, (el) => [...el.querySelectorAll("a[href]")].filter(ehBusca).length >= 2);
      if (!recipiente || recipiente.closest('[data-seolab="perguntas"]')) continue;
      if (!document.querySelector('[data-seolab="outrasPesquisas"]')) marcar(recipiente, "outrasPesquisas");
      for (const a of recipiente.querySelectorAll("a[href]")) {
        if (!ehBusca(a)) continue;
        const texto = textoDe(a);
        if (texto.length < 2 || texto.length > 150 || vistos.has(texto.toLowerCase())) continue;
        vistos.add(texto.toLowerCase());
        itens.push({ texto });
      }
    }
    resultado.outrasPesquisas = itens.length
      ? { status: "coletado", itens }
      : { status: "nao_encontrado", itens, observacao: "Bloco não exibido ou não reconhecido. Role até o fim da página antes de capturar e confira a captura de tela." };
  } catch (erro) {
    resultado.outrasPesquisas = { status: "erro", itens: [], observacao: String(erro) };
  }

  // ---- Resultados orgânicos ----
  try {
    const itens = [];
    const vistos = new Set();
    const area = document.querySelector("#rso") || document.querySelector("#search") || document.querySelector("#main") || document.body;
    for (const h3 of area.querySelectorAll("h3")) {
      const a = h3.closest("a[href]") || (h3.parentElement && h3.parentElement.querySelector("a[href]"));
      if (!a || !linkExterno(a)) continue;
      // Links dentro das perguntas, da visão de IA e das pesquisas relacionadas não são orgânicos
      if (h3.closest("[data-seolab], [data-q]")) continue;
      const titulo = textoDe(h3);
      const url = a.href.replace(/#:~:text=.*$/, "");
      if (!titulo || vistos.has(url)) continue;
      vistos.add(url);
      const bloco = subirAte(a, (el) => textoDe(el).length > titulo.length + 60, 6);
      let trecho = "";
      if (bloco) {
        const alvo = bloco.querySelector('[data-sncf], [style*="-webkit-line-clamp"]');
        trecho = alvo ? textoDe(alvo) : textoDe(bloco).replace(textoDe(a), "").trim();
      }
      itens.push({
        posicao: itens.length + 1,
        titulo,
        url,
        dominio: new URL(url).hostname.replace(/^www\./, ""),
        trecho: trecho.slice(0, 400) || undefined,
      });
    }
    resultado.organicos = itens.length
      ? { status: "coletado", itens }
      : { status: "nao_encontrado", itens, observacao: "Nenhum resultado reconhecido. Confira a captura de tela." };
  } catch (erro) {
    resultado.organicos = { status: "erro", itens: [], observacao: String(erro) };
  }

  const corpo = simples(document.body ? document.body.innerText : "");
  resultado.bloqueio =
    /\/sorry\//.test(location.pathname) ||
    Boolean(document.querySelector("#captcha-form, iframe[src*='recaptcha']")) ||
    corpo.includes("trafego incomum") ||
    corpo.includes("unusual traffic");
  return resultado;
}
