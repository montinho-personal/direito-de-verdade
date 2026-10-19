import { notFound } from "next/navigation";
import { metadadosDoArtigo, PaginaDoArtigo } from "@/components/pagina-do-artigo";
import { calculadoraPorSlug, todasAsCalculadoras } from "@/lib/artigos";

// A página inteira é gerada antes de responder; assim, um endereço que não existe
// recebe o código 404 de verdade (importante para o Google)
export const ensureStatic = "navigation";

export function generateStaticParams() {
  const parametros = todasAsCalculadoras().map((calculadora) => ({ slug: calculadora.slug }));
  // A lista não pode ficar vazia; sem calculadoras, o endereço provisório leva ao erro 404
  return parametros.length ? parametros : [{ slug: "sem-calculadoras" }];
}

export async function generateMetadata({ params }: PageProps<"/calculadoras/[slug]">) {
  const { slug } = await params;
  const calculadora = calculadoraPorSlug(slug);
  return calculadora ? metadadosDoArtigo(calculadora) : {};
}

export default async function Calculadora({ params }: PageProps<"/calculadoras/[slug]">) {
  const { slug } = await params;
  const calculadora = calculadoraPorSlug(slug);
  if (!calculadora) notFound();
  return <PaginaDoArtigo artigo={calculadora} />;
}
