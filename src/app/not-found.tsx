import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Página não encontrada",
};

export default function PaginaNaoEncontrada() {
  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-accent">
        Erro 404
      </p>
      <h1 className="mt-4 font-serif text-4xl sm:text-5xl">
        Página não encontrada
      </h1>
      <p className="mt-4 text-lg text-muted">
        O endereço pode estar errado ou a página pode ter mudado de lugar.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex rounded-full bg-navy px-6 py-3 font-medium text-white hover:opacity-90"
      >
        Voltar para o início
      </Link>
    </section>
  );
}
