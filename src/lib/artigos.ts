import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { Marked, Renderer, type Tokens } from "marked";
import { categoriaPorSlug, categorias, type Categoria } from "@/lib/categorias";

// Cada artigo é um arquivo .md nesta pasta. Arquivos que começam com "_" são ignorados.
const PASTA = path.join(process.cwd(), "content", "artigos");

// Limite do título na aba do navegador e no Google (o Google corta perto de 60)
const LIMITE_TITULO_SEO = 70;

export type Secao = { id: string; titulo: string };

// Pergunta frequente: a resposta vem em HTML (para a página) e em texto (para o Google)
export type Pergunta = { pergunta: string; respostaHtml: string; respostaTexto: string };

export type Fonte = { nome: string; url: string };

export type Artigo = {
  slug: string;
  titulo: string;
  tituloSeo?: string;
  descricao: string;
  categoria: Categoria;
  publicadoEm: string;
  atualizadoEm?: string;
  autor?: string;
  // Primeiro parágrafo do texto: a resposta direta, exibida em destaque logo abaixo do título
  lead?: string;
  // O resto do texto
  html: string;
  secoes: Secao[];
  faq: Pergunta[];
  fontes: Fonte[];
  minutosDeLeitura: number;
};

// "Férias & 13º salário" → "ferias-13o-salario"
export function criarSlug(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/º/g, "o")
    .replace(/ª/g, "a")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function textoSemHtml(html: string) {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

// Links para outros sites abrem em nova aba
function link(this: Renderer, token: Tokens.Link) {
  const html = Renderer.prototype.link.call(this, token);
  const externo =
    /^https?:\/\//.test(token.href) &&
    !token.href.includes("direitodeverdade.com.br");
  return externo
    ? html.replace(/^<a /, '<a target="_blank" rel="noopener noreferrer" ')
    : html;
}

// Para textos curtos (respostas do FAQ): só negrito, itálico e links
const conversorDeTrechos = new Marked({ gfm: true, renderer: { link } });

// Ids das seções "Perguntas frequentes" e "Fontes"; um título do texto com o mesmo
// nome ganha um sufixo para não repetir o id
const IDS_RESERVADOS = ["perguntas-frequentes", "fontes"];

function converterMarkdown(markdown: string) {
  const secoes: Secao[] = [];
  const idsUsados = new Map<string, number>(IDS_RESERVADOS.map((id) => [id, 1]));

  const conversor = new Marked({
    gfm: true,
    renderer: {
      // Títulos ganham um id para o sumário. O título do artigo já é o h1 da página,
      // então "#" no texto vira h2.
      heading({ tokens, depth }: Tokens.Heading) {
        const html = this.parser.parseInline(tokens);
        const titulo = textoSemHtml(html);
        const base = criarSlug(titulo) || "secao";
        const repeticoes = idsUsados.get(base) ?? 0;
        idsUsados.set(base, repeticoes + 1);
        const id = repeticoes ? `${base}-${repeticoes + 1}` : base;
        const nivel = Math.max(depth, 2);
        if (nivel === 2) secoes.push({ id, titulo });
        return `<h${nivel} id="${id}">${html}</h${nivel}>\n`;
      },
      link,
    },
  });

  const completo = conversor.parse(markdown, { async: false });

  // O primeiro parágrafo vira o lead, exibido em destaque abaixo do título
  const primeiro = completo.match(/^\s*<p>([\s\S]*?)<\/p>\n?/);
  return {
    lead: primeiro?.[1],
    html: primeiro ? completo.slice(primeiro[0].length) : completo,
    secoes,
  };
}

function lerData(valor: unknown, campo: string, arquivo: string) {
  // Datas sem aspas no cabeçalho chegam como Date
  if (valor instanceof Date) return valor.toISOString().slice(0, 10);
  if (typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor;
  throw new Error(
    `${arquivo}: o campo "${campo}" precisa ser uma data no formato AAAA-MM-DD`,
  );
}

function lerTexto(valor: unknown, campo: string, arquivo: string) {
  if (typeof valor === "string" && valor.trim()) return valor.trim();
  throw new Error(`${arquivo}: o campo "${campo}" é obrigatório`);
}

function lerTituloSeo(valor: unknown, arquivo: string) {
  if (valor === undefined) return undefined;
  const titulo = lerTexto(valor, "tituloSeo", arquivo);
  if (titulo.length > LIMITE_TITULO_SEO) {
    throw new Error(
      `${arquivo}: o "tituloSeo" tem ${titulo.length} caracteres; o máximo é ${LIMITE_TITULO_SEO} (o ideal é até 60)`,
    );
  }
  return titulo;
}

function lerFaq(valor: unknown, arquivo: string): Pergunta[] {
  if (valor === undefined) return [];
  if (!Array.isArray(valor)) {
    throw new Error(`${arquivo}: "faq" precisa ser uma lista de itens com "pergunta" e "resposta"`);
  }
  return valor.map((item, indice) => {
    const campo = `faq, item ${indice + 1}`;
    if (typeof item !== "object" || item === null) {
      throw new Error(`${arquivo}: ${campo} precisa ter "pergunta" e "resposta"`);
    }
    const { pergunta, resposta } = item as Record<string, unknown>;
    const respostaHtml = conversorDeTrechos.parseInline(
      lerTexto(resposta, `${campo}: resposta`, arquivo),
      { async: false },
    );
    return {
      pergunta: lerTexto(pergunta, `${campo}: pergunta`, arquivo),
      respostaHtml,
      respostaTexto: textoSemHtml(respostaHtml),
    };
  });
}

function lerFontes(valor: unknown, arquivo: string): Fonte[] {
  if (valor === undefined) return [];
  if (!Array.isArray(valor)) {
    throw new Error(`${arquivo}: "fontes" precisa ser uma lista de itens com "nome" e "url"`);
  }
  return valor.map((item, indice) => {
    const campo = `fontes, item ${indice + 1}`;
    if (typeof item !== "object" || item === null) {
      throw new Error(`${arquivo}: ${campo} precisa ter "nome" e "url"`);
    }
    const { nome, url } = item as Record<string, unknown>;
    const endereco = lerTexto(url, `${campo}: url`, arquivo);
    if (!endereco.startsWith("https://")) {
      throw new Error(`${arquivo}: ${campo}: a url precisa começar com https://`);
    }
    return { nome: lerTexto(nome, `${campo}: nome`, arquivo), url: endereco };
  });
}

function lerArtigo(arquivo: string): Artigo | null {
  const slug = arquivo.replace(/\.md$/, "");
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(
      `${arquivo}: o nome do arquivo deve ter só letras minúsculas sem acento, números e hífens`,
    );
  }

  const { data: dados, content: conteudo } = matter(
    fs.readFileSync(path.join(PASTA, arquivo), "utf8"),
  );

  // Rascunhos só aparecem rodando o site no computador (npm run dev)
  if (dados.rascunho === true && process.env.NODE_ENV !== "development") {
    return null;
  }

  const slugDaCategoria = lerTexto(dados.categoria, "categoria", arquivo);
  const categoria = categoriaPorSlug(slugDaCategoria);
  if (!categoria) {
    throw new Error(
      `${arquivo}: a categoria "${slugDaCategoria}" não existe. Use uma destas: ${categorias.map((c) => c.slug).join(", ")}`,
    );
  }

  const { lead, html, secoes } = converterMarkdown(conteudo);
  const faq = lerFaq(dados.faq, arquivo);
  const textoDoFaq = faq.map((item) => `${item.pergunta} ${item.respostaTexto}`).join(" ");
  const palavras = `${conteudo} ${textoDoFaq}`.split(/\s+/).filter(Boolean).length;

  return {
    slug,
    titulo: lerTexto(dados.titulo, "titulo", arquivo),
    tituloSeo: lerTituloSeo(dados.tituloSeo, arquivo),
    descricao: lerTexto(dados.descricao, "descricao", arquivo),
    categoria,
    publicadoEm: lerData(dados.publicadoEm, "publicadoEm", arquivo),
    atualizadoEm:
      dados.atualizadoEm === undefined
        ? undefined
        : lerData(dados.atualizadoEm, "atualizadoEm", arquivo),
    autor: dados.autor === undefined ? undefined : lerTexto(dados.autor, "autor", arquivo),
    lead,
    html,
    secoes,
    faq,
    fontes: lerFontes(dados.fontes, arquivo),
    minutosDeLeitura: Math.max(1, Math.round(palavras / 200)),
  };
}

function carregarArtigos() {
  if (!fs.existsSync(PASTA)) return [];
  return fs
    .readdirSync(PASTA)
    .filter((arquivo) => arquivo.endsWith(".md") && !arquivo.startsWith("_"))
    .map(lerArtigo)
    .filter((artigo) => artigo !== null)
    .sort(
      (a, b) =>
        b.publicadoEm.localeCompare(a.publicadoEm) ||
        a.titulo.localeCompare(b.titulo, "pt-BR"),
    );
}

let artigosCarregados: Artigo[] | undefined;

// Do mais recente para o mais antigo
export function todosOsArtigos() {
  // Em desenvolvimento, relê os arquivos a cada página para mostrar as edições na hora
  if (process.env.NODE_ENV === "development") return carregarArtigos();
  artigosCarregados ??= carregarArtigos();
  return artigosCarregados;
}

export function artigoPorSlug(slug: string) {
  return todosOsArtigos().find((artigo) => artigo.slug === slug);
}

export function artigosDaCategoria(slug: string) {
  return todosOsArtigos().filter((artigo) => artigo.categoria.slug === slug);
}

export function categoriasComArtigos() {
  const usadas = new Set(todosOsArtigos().map((artigo) => artigo.categoria.slug));
  return categorias.filter((categoria) => usadas.has(categoria.slug));
}

// Primeiro os da mesma categoria, depois os mais recentes
export function artigosRelacionados(artigo: Artigo, quantidade = 3) {
  const outros = todosOsArtigos().filter((a) => a.slug !== artigo.slug);
  const mesmaCategoria = outros.filter((a) => a.categoria.slug === artigo.categoria.slug);
  const demais = outros.filter((a) => a.categoria.slug !== artigo.categoria.slug);
  return [...mesmaCategoria, ...demais].slice(0, quantidade);
}

export function dataDeAlteracao(artigo: Artigo) {
  return artigo.atualizadoEm ?? artigo.publicadoEm;
}

const formatoDeData = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

// "2026-10-19" → "19 de outubro de 2026"
export function formatarData(data: string) {
  return formatoDeData.format(new Date(`${data}T00:00:00Z`));
}
