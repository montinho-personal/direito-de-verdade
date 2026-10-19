import type { MetadataRoute } from "next";
import {
  artigosDaCategoria,
  categoriasComArtigos,
  dataDeAlteracao,
  todasAsCalculadoras,
  todosOsArtigos,
  type Artigo,
} from "@/lib/artigos";
import { site } from "@/lib/site";

// Páginas fixas do site e a data da última alteração de cada uma.
// Ao criar ou editar uma delas, inclua-a aqui ou atualize a data.
// Artigos, calculadoras e categorias entram sozinhos.
const paginas = [
  { caminho: "", alteradaEm: "2026-10-19" },
  { caminho: "/sobre", alteradaEm: "2026-10-19" },
  ...(site.emailContato
    ? [{ caminho: "/contato", alteradaEm: "2026-10-19" }]
    : []),
  { caminho: "/politica-de-privacidade", alteradaEm: "2026-10-19" },
  { caminho: "/termos-de-uso", alteradaEm: "2026-10-19" },
];

function maisRecente(artigos: Artigo[]) {
  return artigos.map(dataDeAlteracao).sort().at(-1);
}

export default function sitemap(): MetadataRoute.Sitemap {
  const artigos = todosOsArtigos();
  const calculadoras = todasAsCalculadoras();

  return [
    ...paginas.map((pagina) => ({
      url: `${site.url}${pagina.caminho}`,
      lastModified: pagina.alteradaEm,
    })),
    ...(artigos.length
      ? [{ url: `${site.url}/artigos`, lastModified: maisRecente(artigos) }]
      : []),
    ...categoriasComArtigos().map((categoria) => ({
      url: `${site.url}/categoria/${categoria.slug}`,
      lastModified: maisRecente(artigosDaCategoria(categoria.slug)),
    })),
    ...(calculadoras.length
      ? [{ url: `${site.url}/calculadoras`, lastModified: maisRecente(calculadoras) }]
      : []),
    ...[...artigos, ...calculadoras].map((artigo) => ({
      url: `${site.url}${artigo.caminho}`,
      lastModified: dataDeAlteracao(artigo),
    })),
  ];
}
