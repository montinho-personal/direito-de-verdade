import type { ReactNode } from "react";

export function PaginaDeTexto({
  titulo,
  atualizadaEm,
  children,
}: {
  titulo: string;
  atualizadaEm?: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-20">
      <h1 className="font-serif text-4xl leading-tight sm:text-5xl">{titulo}</h1>
      {atualizadaEm && (
        <p className="mt-4 text-sm text-muted">
          Última atualização: {atualizadaEm}
        </p>
      )}
      <div className="texto mt-10">{children}</div>
    </article>
  );
}
