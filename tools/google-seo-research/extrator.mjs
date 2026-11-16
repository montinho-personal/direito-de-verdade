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

// `doc` existe para o painel ler uma página salva (DOMParser); no coletor vale a página aberta.
export function extrairDaPagina(doc) {
  const document = doc || globalThis.document;
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
  // Em parte das páginas o Google troca o endereço do resultado por um redirecionamento
  // próprio (google.com/goto?url=...), que não revela o destino
  const ehRedirecionamento = (a) => /^https?:\/\/[^/]*google\.[a-z.]+\/(goto|url)\?/.test(a.href || "");
  // O HTML salvo é lido sem executar scripts; o texto deles não pode entrar na leitura
  document.querySelectorAll("script, noscript, template").forEach((el) => el.remove());

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
    // [data-q] também marca a caixa do Modo IA: só vale o que tem o botão de abrir a resposta
    let pares = [...document.querySelectorAll("[data-q]")].filter((el) => el.querySelector("[aria-expanded]"));
    let recipiente = null;
    const titulo = titulos(["As pessoas também perguntam", "Outras perguntas", "As pessoas também perguntaram"])[0];
    if (titulo) {
      recipiente = subirAte(titulo, (el) => el.querySelectorAll("[data-q] [aria-expanded], [aria-expanded]").length >= 2, 6);
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
    const rotulos = ["Visão geral criada por IA", "Visão geral de IA", "Visão geral da IA", "AI Overview"];
    const titulo = titulos(rotulos)[0];
    // A resposta fica em [data-subtree="aimc"]; o título mora num bloco vizinho, junto de um
    // aviso escondido de "não está disponível", que não pode ser lido como resposta
    const indisponivel = /nao esta disponivel para essa pesquisa|nao e possivel gerar a visao geral/;
    let bloco = document.querySelector('[data-subtree="aimc"]');
    if (!bloco && titulo) {
      bloco = subirAte(titulo, (el) => textoDe(el).length >= 250 && !indisponivel.test(simples(textoDe(el)).slice(0, 400)), 6);
    }
    const texto = bloco
      ? [...rotulos, "O Modo IA respondeu:"].reduce((t, r) => t.replace(r, ""), textoDe(bloco)).trim().slice(0, 6000)
      : "";
    if (bloco && texto.length >= 80) {
      marcar(bloco, "visaoDeIA");
      const vistos = new Set();
      const fontes = [];
      for (const a of bloco.querySelectorAll("a[href]")) {
        if (!linkExterno(a) && !ehRedirecionamento(a)) continue;
        const nome = (textoDe(a) || a.getAttribute("aria-label") || "").slice(0, 150);
        // Com redirecionamento do Google, a mesma fonte se repete: vale o destino, sem os parâmetros de sessão
        const chave = ehRedirecionamento(a) ? a.href.split("&")[0] : a.href;
        if (!nome || vistos.has(chave)) continue;
        vistos.add(chave);
        fontes.push({ titulo: nome, url: a.href });
      }
      resultado.visaoDeIA = { status: "coletado", itens: [{ texto, fontes }] };
    } else {
      resultado.visaoDeIA = {
        status: "nao_encontrado",
        itens: [],
        observacao: titulo
          ? "O título do bloco apareceu, mas sem resposta (o Google pode ter informado que ela não está disponível)."
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
      if (!a || !(linkExterno(a) || ehRedirecionamento(a))) continue;
      // Links dentro das perguntas, da visão de IA e das pesquisas relacionadas não são orgânicos
      if (h3.closest("[data-seolab], [data-q]")) continue;
      const titulo = textoDe(h3);
      if (!titulo) continue;
      const bloco =
        a.closest("[data-snc], [data-rpos]") ||
        subirAte(a, (el) => el.querySelector("[data-sncf]"), 8) ||
        subirAte(a, (el) => textoDe(el).length > textoDe(a).length + 60, 6);
      // Endereço que o Google mostra embaixo do título: "https://site.com.br › pasta › página"
      const exibido = textoDe((bloco || a).querySelector("cite"));
      let url = linkExterno(a) ? a.href.replace(/#:~:text=.*$/, "") : "";
      if (!url) {
        // Sem o destino no link: vale o site do endereço exibido (ou o do vídeo), sem a página exata
        const doVideo = a.closest("[data-curl]");
        const candidato = (doVideo && doVideo.getAttribute("data-curl")) || exibido.split(" ")[0];
        if (!/^https?:\/\//.test(candidato) || ehDoGoogle(candidato)) continue;
        url = candidato;
      }
      const chave = `${titulo}|${url}`;
      if (vistos.has(chave)) continue;
      vistos.add(chave);
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
        enderecoExibido: exibido.slice(0, 200) || undefined,
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
    /\/sorry\//.test((document.location && document.location.pathname) || "") ||
    Boolean(document.querySelector("#captcha-form, iframe[src*='recaptcha']")) ||
    corpo.includes("trafego incomum") ||
    corpo.includes("unusual traffic");
  return resultado;
}
