import Link from "next/link";
import { CartaoArtigo } from "@/components/cartao-artigo";
import { Migalhas } from "@/components/migalhas";
import { categoriasComArtigos, type Artigo } from "@/lib/artigos";

// Página de listagem: todos os artigos, os de uma categoria ou as calculadoras
export function ListaDeArtigos({
  titulo,
  descricao,
  artigos,
  migalhas,
  categoriaAtual,
  comFiltros = true,
}: {
  titulo: string;
  descricao: string;
  artigos: Artigo[];
  migalhas: { nome: string; caminho: string }[];
  categoriaAtual?: string;
  // Botões das categorias de artigos (as calculadoras não usam)
  comFiltros?: boolean;
}) {
  const filtros = [
    { nome: "Todos", caminho: "/artigos", ativo: !categoriaAtual },
    ...categoriasComArtigos().map((categoria) => ({
      nome: categoria.nome,
      caminho: `/categoria/${categoria.slug}`,
      ativo: categoria.slug === categoriaAtual,
    })),
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-16">
      <Migalhas itens={migalhas} />
      <h1 className="mt-6 font-serif text-4xl leading-tight sm:text-5xl">
        {titulo}
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">{descricao}</p>

      {comFiltros && filtros.length > 2 && (
        <nav aria-label="Categorias" className="mt-8">
          <ul className="flex flex-wrap gap-2">
            {filtros.map((filtro) => (
              <li key={filtro.caminho}>
                <Link
                  href={filtro.caminho}
                  aria-current={filtro.ativo ? "page" : undefined}
                  className={
                    filtro.ativo
                      ? "inline-flex rounded-full bg-navy px-4 py-2 text-sm font-medium text-white"
                      : "inline-flex rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium hover:border-accent hover:text-accent"
                  }
                >
                  {filtro.nome}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {artigos.map((artigo) => (
          <CartaoArtigo key={artigo.slug} artigo={artigo} />
        ))}
      </div>
    </div>
  );
}
