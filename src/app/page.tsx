const pilares = [
  {
    titulo: "Linguagem clara",
    texto: "Conteúdo jurídico explicado sem juridiquês, para qualquer pessoa entender.",
  },
  {
    titulo: "Informação confiável",
    texto: "Explicações baseadas na lei e na jurisprudência, com as fontes indicadas.",
  },
  {
    titulo: "Direto ao ponto",
    texto: "Respostas objetivas para as dúvidas do dia a dia.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col font-sans">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
          <span className="font-serif text-xl font-semibold tracking-tight">
            Direito de Verdade
          </span>
          <span className="rounded-full border border-border px-3 py-1 text-sm text-muted">
            Em construção
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6">
        <section className="py-24 sm:py-32">
          <p className="text-sm font-medium uppercase tracking-widest text-accent">
            Direito de Verdade
          </p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
            Seus direitos, explicados de verdade.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
            Estamos preparando um espaço para tornar o Direito acessível, com
            conteúdo claro, confiável e direto ao ponto. Em breve, novidades.
          </p>
        </section>

        <section className="grid gap-6 pb-24 sm:grid-cols-3">
          {pilares.map((pilar) => (
            <div
              key={pilar.titulo}
              className="rounded-2xl border border-border bg-surface p-6"
            >
              <h2 className="font-serif text-xl font-semibold">{pilar.titulo}</h2>
              <p className="mt-3 leading-7 text-muted">{pilar.texto}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto w-full max-w-5xl px-6 py-8 text-sm text-muted">
          © 2026 Direito de Verdade. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
