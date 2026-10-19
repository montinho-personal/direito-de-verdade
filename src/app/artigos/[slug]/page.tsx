import { notFound } from "next/navigation";
import { metadadosDoArtigo, PaginaDoArtigo } from "@/components/pagina-do-artigo";
import { artigoPorSlug, todosOsArtigos } from "@/lib/artigos";

// A página inteira é gerada antes de responder; assim, um endereço que não existe
// recebe o código 404 de verdade (importante para o Google)
export const ensureStatic = "navigation";

export function generateStaticParams() {
  const parametros = todosOsArtigos().map((artigo) => ({ slug: artigo.slug }));
  // A lista não pode ficar vazia; sem artigos, o endereço provisório leva ao erro 404
  return parametros.length ? parametros : [{ slug: "sem-artigos" }];
}

export async function generateMetadata({ params }: PageProps<"/artigos/[slug]">) {
  const { slug } = await params;
  const artigo = artigoPorSlug(slug);
  return artigo ? metadadosDoArtigo(artigo) : {};
}

export default async function Artigo({ params }: PageProps<"/artigos/[slug]">) {
  const { slug } = await params;
  const artigo = artigoPorSlug(slug);
  if (!artigo) notFound();
  return <PaginaDoArtigo artigo={artigo} />;
}
