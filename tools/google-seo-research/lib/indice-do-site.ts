// Índice do que o site já publicou (content/artigos e content/calculadoras), para a análise
// saber o que cada página cobre: título, descrição, intertítulos e perguntas frequentes.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export type PaginaDoSite = {
  caminho: string;
  tipo: "artigo" | "calculadora";
  titulo: string;
  tituloSeo: string;
  descricao: string;
  intertitulos: string[];
  perguntas: string[];
};

export function lerIndiceDoSite(raiz: string = process.cwd()): PaginaDoSite[] {
  const paginas: PaginaDoSite[] = [];
  for (const [pasta, tipo] of [
    ["artigos", "artigo"],
    ["calculadoras", "calculadora"],
  ] as const) {
    const dir = path.join(raiz, "content", pasta);
    let arquivos: string[] = [];
    try {
      arquivos = fs.readdirSync(dir);
    } catch {
      continue;
    }
    for (const arquivo of arquivos) {
      if (!arquivo.endsWith(".md") || arquivo.startsWith("_")) continue;
      const { data, content } = matter(fs.readFileSync(path.join(dir, arquivo), "utf8"));
      paginas.push({
        caminho: `/${pasta}/${arquivo.replace(/\.md$/, "")}`,
        tipo,
        titulo: String(data.titulo ?? ""),
        tituloSeo: String(data.tituloSeo ?? data.titulo ?? ""),
        descricao: String(data.descricao ?? ""),
        intertitulos: [...content.matchAll(/^#{2,3}\s+(.+)$/gm)].map((m) => m[1].trim()),
        perguntas: Array.isArray(data.faq)
          ? data.faq.map((f: { pergunta?: unknown }) => String(f?.pergunta ?? "")).filter(Boolean)
          : [],
      });
    }
  }
  return paginas;
}
