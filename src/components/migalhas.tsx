import Link from "next/link";
import { site } from "@/lib/site";

type Item = { nome: string; caminho: string };

// Trilha de navegação (Início › Artigos › ...). O último item é a página atual.
// Também informa a trilha ao Google por dados estruturados.
export function Migalhas({ itens }: { itens: Item[] }) {
  const dadosEstruturados = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: itens.map((item, indice) => ({
      "@type": "ListItem",
      position: indice + 1,
      name: item.nome,
      item: `${site.url}${item.caminho === "/" ? "" : item.caminho}`,
    })),
  };

  return (
    <nav aria-label="Você está em" className="text-sm text-muted">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(dadosEstruturados).replace(/</g, "\\u003c"),
        }}
      />
      <ol className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        {itens.map((item, indice) => {
          const atual = indice === itens.length - 1;
          return (
            <li key={item.caminho} className="flex min-w-0 items-center gap-x-2">
              {indice > 0 && <span aria-hidden="true">›</span>}
              {atual ? (
                <span aria-current="page" className="truncate">
                  {item.nome}
                </span>
              ) : (
                <Link href={item.caminho} className="hover:text-accent">
                  {item.nome}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
