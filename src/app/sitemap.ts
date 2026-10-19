import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

// Páginas do site e a data da última alteração de cada uma.
// Ao criar ou editar uma página, inclua-a aqui ou atualize a data.
const paginas = [
  { caminho: "", alteradaEm: "2026-10-19" },
  { caminho: "/sobre", alteradaEm: "2026-10-19" },
  ...(site.emailContato
    ? [{ caminho: "/contato", alteradaEm: "2026-10-19" }]
    : []),
  { caminho: "/politica-de-privacidade", alteradaEm: "2026-10-19" },
  { caminho: "/termos-de-uso", alteradaEm: "2026-10-19" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return paginas.map((pagina) => ({
    url: `${site.url}${pagina.caminho}`,
    lastModified: pagina.alteradaEm,
  }));
}
