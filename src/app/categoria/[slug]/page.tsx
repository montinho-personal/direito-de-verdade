import { notFound } from "next/navigation";
import { ListaDeArtigos } from "@/components/lista-de-artigos";
import { artigosDaCategoria, categoriasComArtigos } from "@/lib/artigos";
import { categoriaPorSlug } from "@/lib/categorias";
import { metadadosDaPagina } from "@/lib/metadados";

// A página inteira é gerada antes de responder; assim, um endereço que não existe
// recebe o código 404 de verdade (importante para o Google)
export const ensureStatic = "navigation";

export function generateStaticParams() {
  const parametros = categoriasComArtigos().map((categoria) => ({
    slug: categoria.slug,
  }));
  // A lista não pode ficar vazia; sem artigos, o endereço provisório leva ao erro 404
  return parametros.length ? parametros : [{ slug: "sem-artigos" }];
}

export async function generateMetadata({
  params,
}: PageProps<"/categoria/[slug]">) {
  const { slug } = await params;
  const categoria = categoriaPorSlug(slug);
  if (!categoria) return {};
  return metadadosDaPagina({
    titulo: `${categoria.nome}: seus direitos explicados`,
    descricao: categoria.descricao,
    caminho: `/categoria/${categoria.slug}`,
  });
}

export default async function PaginaDaCategoria({
  params,
}: PageProps<"/categoria/[slug]">) {
  const { slug } = await params;
  const categoria = categoriaPorSlug(slug);
  const artigos = artigosDaCategoria(slug);
  if (!categoria || artigos.length === 0) notFound();

  return (
    <ListaDeArtigos
      titulo={categoria.nome}
      descricao={categoria.descricao}
      artigos={artigos}
      categoriaAtual={categoria.slug}
      migalhas={[
        { nome: "Início", caminho: "/" },
        { nome: "Artigos", caminho: "/artigos" },
        { nome: categoria.nome, caminho: `/categoria/${categoria.slug}` },
      ]}
    />
  );
}
