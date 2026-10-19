import Link from "next/link";
import { formatarData, type Artigo } from "@/lib/artigos";

export function CartaoArtigo({
  artigo,
  tituloComo: Titulo = "h2",
}: {
  artigo: Artigo;
  tituloComo?: "h2" | "h3";
}) {
  return (
    <article className="flex flex-col rounded-2xl border border-border bg-surface p-6">
      <Link
        href={`/categoria/${artigo.categoria.slug}`}
        className="self-start text-xs font-semibold uppercase tracking-wider text-accent hover:underline"
      >
        {artigo.categoria.nome}
      </Link>
      <Titulo className="mt-3 font-serif text-2xl leading-snug">
        <Link href={`/artigos/${artigo.slug}`} className="hover:text-accent">
          {artigo.titulo}
        </Link>
      </Titulo>
      <p className="mt-2 flex-1 leading-7 text-muted">{artigo.descricao}</p>
      <p className="mt-4 text-sm text-muted">
        {formatarData(artigo.publicadoEm)} · {artigo.minutosDeLeitura} min de
        leitura
      </p>
    </article>
  );
}
