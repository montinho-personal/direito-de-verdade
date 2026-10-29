import type { Metadata } from "next";
import Link from "next/link";
import { categoriasComArtigos, todasAsCalculadoras } from "@/lib/artigos";

export const metadata: Metadata = {
  title: "Página não encontrada",
};

// Quem cai num link quebrado ganha caminhos para continuar no site, e não só
// o botão de voltar ao início
export default function PaginaNaoEncontrada() {
  const calculadoras = todasAsCalculadoras();
  const categorias = categoriasComArtigos();

  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-20">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-accent">
          Erro 404
        </p>
        <h1 className="mt-4 font-serif text-4xl sm:text-5xl">
          Página não encontrada
        </h1>
        <p className="mt-4 text-lg text-muted">
          O endereço pode estar errado ou a página pode ter mudado de lugar.
          Veja abaixo os assuntos e as calculadoras do site.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex rounded-full bg-navy px-6 py-3 font-medium text-white hover:opacity-90"
          >
            Voltar para o início
          </Link>
          <Link
            href="/artigos"
            className="inline-flex rounded-full border border-navy px-6 py-3 font-medium text-navy hover:bg-navy hover:text-white"
          >
            Ver todos os artigos
          </Link>
        </div>
      </div>

      {categorias.length > 0 && (
        <div className="mt-14">
          <h2 className="font-serif text-2xl">Assuntos</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {categorias.map((categoria) => (
              <li key={categoria.slug}>
                <Link
                  href={`/categoria/${categoria.slug}`}
                  className="inline-flex rounded-full border border-border px-4 py-2 text-sm hover:border-navy"
                >
                  {categoria.nome}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {calculadoras.length > 0 && (
        <div className="mt-12">
          <h2 className="font-serif text-2xl">Calculadoras</h2>
          <ul className="mt-4 space-y-3">
            {calculadoras.map((calculadora) => (
              <li key={calculadora.slug}>
                <Link
                  href={`/calculadoras/${calculadora.slug}`}
                  className="underline decoration-border underline-offset-4 hover:decoration-navy"
                >
                  {calculadora.titulo}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
