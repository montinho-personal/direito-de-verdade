// Análise de oportunidades de SEO a partir das coletas e do que o site já publicou.
// São regras simples e transparentes (contagem de palavras em comum), não um veredito:
// cada item mostra de onde veio e com qual trecho do site foi comparado, para uma pessoa
// decidir. Nada aqui cria ou altera artigos.
import type { ChaveDaCategoria, Coleta } from "./tipos.ts";
import type { PaginaDoSite } from "./indice-do-site.ts";
import { chave, cobertura, dominioDe, ehPergunta, palavras, semAcento } from "./texto.ts";

export type TipoDeIntencao = "ferramenta" | "modelo" | "local" | "informacional";

export type Intencao = { palavra: string; tipo: TipoDeIntencao; nome: string; sinais: string[] };

export type Situacao = "coberta" | "parcial" | "lacuna";

export type ItemAnalisado = {
  texto: string;
  origens: ChaveDaCategoria[];
  // Palavras-chave em cuja coleta o item apareceu
  palavras: string[];
  vezes: number;
  ehPergunta: boolean;
  situacao: Situacao;
  // Página do site que mais se aproxima e o trecho comparado
  pagina?: { caminho: string; tipo: PaginaDoSite["tipo"]; trecho: string; nota: number; notaDaPagina: number };
};

export type Canibalizacao = {
  palavra: string;
  paginas: { caminho: string; titulo: string; nota: number }[];
  // Endereços do site que apareceram nos resultados orgânicos dessa busca
  noGoogle: { url: string; posicao: number }[];
  alerta: boolean;
  motivo: string;
};

export type VisibilidadeEmIA = {
  palavra: string;
  coletaId: string;
  exibida: boolean;
  citaOSite: boolean;
  dominiosCitados: string[];
  recomendacao: string;
};

export type Analise = {
  coletasAnalisadas: number;
  intencoes: Intencao[];
  perguntasFrequentes: ItemAnalisado[];
  lacunas: ItemAnalisado[];
  novosArtigos: ItemAnalisado[];
  melhoriasEmArtigos: ItemAnalisado[];
  melhoriasEmCalculadoras: ItemAnalisado[];
  canibalizacao: Canibalizacao[];
  visibilidadeEmIA: VisibilidadeEmIA[];
};

const NOMES: Record<TipoDeIntencao, string> = {
  ferramenta: "Ferramenta (quer fazer a conta)",
  modelo: "Modelo ou documento pronto",
  local: "Serviço ou atendimento local",
  informacional: "Informação (quer entender a regra)",
};

export function classificarIntencao(coleta: Pick<Coleta, "palavra" | "organicos" | "perguntas">): Intencao {
  const termo = semAcento(coleta.palavra);
  const sinais: string[] = [];
  let tipo: TipoDeIntencao = "informacional";

  const titulos = coleta.organicos.itens.slice(0, 10).map((r) => semAcento(r.titulo));
  const comFerramenta = titulos.filter((t) => /calculadora|simulador|simulacao|calcule/.test(t)).length;

  if (/calculadora|simulador|simular|calcular|calculo/.test(termo)) {
    tipo = "ferramenta";
    sinais.push("a busca pede cálculo ou calculadora");
  } else if (/\b(modelo|pdf|planilha|carta|formulario|exemplo de)\b/.test(termo)) {
    tipo = "modelo";
    sinais.push("a busca pede modelo ou documento");
  } else if (/\b(perto de mim|endereco|telefone|advogado|escritorio|cartorio)\b/.test(termo)) {
    tipo = "local";
    sinais.push("a busca pede serviço ou lugar");
  } else if (titulos.length >= 5 && comFerramenta / titulos.length >= 0.5) {
    tipo = "ferramenta";
  } else if (ehPergunta(coleta.palavra)) {
    sinais.push("a busca é uma pergunta");
  }

  if (titulos.length) {
    sinais.push(`${comFerramenta} de ${titulos.length} primeiros resultados são calculadoras ou simuladores`);
  }
  if (coleta.perguntas.itens.length) {
    sinais.push(`${coleta.perguntas.itens.length} perguntas em "As pessoas também perguntam"`);
  }
  return { palavra: coleta.palavra, tipo, nome: NOMES[tipo], sinais };
}

// Compara um texto do Google com cada página do site: primeiro com cada intertítulo e
// pergunta frequente (o trecho que responderia), depois com a página inteira (o assunto).
export function avaliarCobertura(texto: string, paginas: PaginaDoSite[]) {
  let melhor: ItemAnalisado["pagina"];
  for (const pagina of paginas) {
    const trechos = [pagina.titulo, ...pagina.intertitulos, ...pagina.perguntas];
    let nota = 0;
    let trecho = pagina.titulo;
    for (const t of trechos) {
      const n = cobertura(texto, t);
      if (n > nota) [nota, trecho] = [n, t];
    }
    const notaDaPagina = cobertura(
      texto,
      [pagina.titulo, pagina.tituloSeo, pagina.descricao, ...pagina.intertitulos, ...pagina.perguntas].join(" "),
    );
    if (
      !melhor ||
      nota > melhor.nota ||
      (nota === melhor.nota && notaDaPagina > melhor.notaDaPagina)
    ) {
      melhor = { caminho: pagina.caminho, tipo: pagina.tipo, trecho, nota, notaDaPagina };
    }
  }
  const situacao: Situacao =
    melhor && melhor.nota >= 0.8
      ? "coberta"
      : melhor && (melhor.nota >= 0.5 || melhor.notaDaPagina >= 0.8)
        ? "parcial"
        : "lacuna";
  return { situacao, pagina: melhor };
}

function juntarItens(coletas: Coleta[], paginas: PaginaDoSite[]): ItemAnalisado[] {
  const porChave = new Map<string, ItemAnalisado>();
  const incluir = (texto: string, origem: ChaveDaCategoria, palavra: string) => {
    const limpo = texto.replace(/\s+/g, " ").trim();
    const k = chave(limpo);
    if (!k || k === chave(palavra)) return;
    const item = porChave.get(k);
    if (item) {
      item.vezes += 1;
      if (!item.origens.includes(origem)) item.origens.push(origem);
      if (!item.palavras.includes(palavra)) item.palavras.push(palavra);
      return;
    }
    porChave.set(k, {
      texto: limpo,
      origens: [origem],
      palavras: [palavra],
      vezes: 1,
      ehPergunta: origem === "perguntas" || ehPergunta(limpo),
      ...avaliarCobertura(limpo, paginas),
    });
  };
  for (const coleta of coletas) {
    for (const p of coleta.perguntas.itens) incluir(p.pergunta, "perguntas", coleta.palavra);
    for (const s of coleta.outrasPesquisas.itens) incluir(s.texto, "outrasPesquisas", coleta.palavra);
    for (const s of coleta.autocompletar.itens) incluir(s.texto, "autocompletar", coleta.palavra);
  }
  return [...porChave.values()].sort(
    (a, b) => b.vezes - a.vezes || Number(b.ehPergunta) - Number(a.ehPergunta) || a.texto.localeCompare(b.texto),
  );
}

export function detectarCanibalizacao(coleta: Coleta, paginas: PaginaDoSite[], dominioDoSite: string): Canibalizacao {
  const termos = new Set(palavras(coleta.palavra));
  const candidatas =
    termos.size < 2
      ? []
      : paginas
          .map((p) => ({
            caminho: p.caminho,
            titulo: p.titulo,
            nota: cobertura(coleta.palavra, `${p.titulo} ${p.tituloSeo}`),
          }))
          .filter((p) => p.nota >= 0.8)
          .sort((a, b) => b.nota - a.nota);
  const noGoogle = coleta.organicos.itens
    .filter((r) => dominioDoSite && r.dominio.endsWith(dominioDoSite))
    .map((r) => ({ url: r.url, posicao: r.posicao }));
  const alerta = candidatas.length >= 2 || noGoogle.length >= 2;
  const motivo =
    noGoogle.length >= 2
      ? `O Google mostrou ${noGoogle.length} páginas do site para a mesma busca.`
      : candidatas.length >= 2
        ? `${candidatas.length} páginas do site têm a busca no título.`
        : candidatas.length === 1
          ? "Uma página do site mira essa busca."
          : "Nenhuma página do site tem essa busca no título.";
  return { palavra: coleta.palavra, paginas: candidatas, noGoogle, alerta, motivo };
}

function visibilidadeEmIA(coleta: Coleta, dominioDoSite: string): VisibilidadeEmIA {
  const visao = coleta.visaoDeIA.itens[0];
  const dominios = [...new Set((visao?.fontes ?? []).map((f) => dominioDe(f.url)).filter(Boolean))];
  const citaOSite = Boolean(dominioDoSite) && dominios.some((d) => d.endsWith(dominioDoSite));
  const recomendacao = !visao
    ? "A visão de IA não foi capturada nessa busca (não apareceu ou não foi reconhecida; confira a captura de tela)."
    : citaOSite
      ? "O site já é citado na visão de IA. Mantenha a resposta direta e as fontes oficiais atualizadas."
      : `A visão de IA apareceu e não cita o site. Fontes citadas: ${dominios.join(", ") || "nenhuma identificada"}. Vale responder a busca de forma direta no primeiro parágrafo e cobrir as perguntas listadas como lacuna.`;
  return {
    palavra: coleta.palavra,
    coletaId: coleta.id,
    exibida: Boolean(visao),
    citaOSite,
    dominiosCitados: dominios,
    recomendacao,
  };
}

export function analisar(coletas: Coleta[], paginas: PaginaDoSite[], dominioDoSite: string): Analise {
  const itens = juntarItens(coletas, paginas);
  const abertos = itens.filter((i) => i.situacao !== "coberta");
  // Sem página próxima do assunto: candidato a artigo novo. Com página próxima: melhoria nela.
  const semPagina = (i: ItemAnalisado) => !i.pagina || i.pagina.notaDaPagina < 0.6;
  return {
    coletasAnalisadas: coletas.length,
    intencoes: coletas.map(classificarIntencao),
    perguntasFrequentes: itens.filter((i) => i.ehPergunta),
    lacunas: abertos,
    novosArtigos: abertos.filter(semPagina),
    melhoriasEmArtigos: abertos.filter((i) => !semPagina(i) && i.pagina?.tipo === "artigo"),
    melhoriasEmCalculadoras: abertos.filter((i) => !semPagina(i) && i.pagina?.tipo === "calculadora"),
    canibalizacao: coletas.map((c) => detectarCanibalizacao(c, paginas, dominioDoSite)),
    visibilidadeEmIA: coletas.map((c) => visibilidadeEmIA(c, dominioDoSite)),
  };
}
