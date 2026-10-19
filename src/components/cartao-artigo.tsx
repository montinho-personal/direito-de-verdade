import Link from "next/link";
import { dataDeAlteracao, formatarData, type Artigo } from "@/lib/artigos";

// Cartão de um artigo ou de uma calculadora nas listas
export function CartaoArtigo({
  artigo,
  tituloComo: Titulo = "h2",
}: {
  artigo: Artigo;
  tituloComo?: "h2" | "h3";
}) {
  const calculadora = artigo.colecao === "calculadoras";
  const estiloDoRotulo =
    "self-start text-xs font-semibold uppercase tracking-wider text-accent";

  return (
    <article className="flex flex-col rounded-2xl border border-border bg-surface p-6">
      {calculadora ? (
        <p className={estiloDoRotulo}>Calculadora</p>
      ) : (
        <Link
          href={`/categoria/${artigo.categoria.slug}`}
          className={`${estiloDoRotulo} hover:underline`}
        >
          {artigo.categoria.nome}
        </Link>
      )}
      <Titulo className="mt-3 font-serif text-2xl leading-snug">
        <Link href={artigo.caminho} className="hover:text-accent">
          {artigo.titulo}
        </Link>
      </Titulo>
      <p className="mt-2 flex-1 leading-7 text-muted">{artigo.descricao}</p>
      <p className="mt-4 text-sm text-muted">
        {calculadora ? (
          <>Atualizada em {formatarData(dataDeAlteracao(artigo))}</>
        ) : (
          <>
            {formatarData(artigo.publicadoEm)} · {artigo.minutosDeLeitura} min de
            leitura
          </>
        )}
      </p>
    </article>
  );
}
