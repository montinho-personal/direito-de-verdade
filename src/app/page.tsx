const pilares = [
  {
    titulo: "Informação clara",
    texto: "Leis e direitos explicados em linguagem simples, sem juridiquês.",
  },
  {
    titulo: "Ferramentas práticas",
    texto: "Recursos para entender a sua situação e saber o que fazer.",
  },
  {
    titulo: "Situações da vida real",
    texto: "Orientações para os problemas que acontecem no dia a dia.",
  },
];

function Balanca({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="M7 21h10" />
      <path d="M12 3v18" />
      <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="flex flex-1 flex-col font-sans">
      <section className="bg-navy text-white">
        <div className="mx-auto w-full max-w-5xl px-6">
          <header className="flex items-center gap-4 border-b border-navy-line py-6">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gold text-navy">
              <Balanca className="size-7" />
            </div>
            <div>
              <p className="text-lg font-bold leading-tight sm:text-xl">
                Direito de Verdade
              </p>
              <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-gold">
                Seus direitos. Sem complicação.
              </p>
            </div>
          </header>

          <div className="py-20 sm:py-28">
            <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
              A lei pode ser complicada. Entender seus direitos não precisa ser.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-navy-muted">
              Informação jurídica clara, ferramentas práticas e orientações para
              situações da vida real.
            </p>
            <p className="mt-10 inline-flex rounded-full bg-gold/15 px-4 py-2 text-sm font-medium text-gold">
              Site em construção. Em breve, novidades.
            </p>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-20">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-accent">
          O que você vai encontrar
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {pilares.map((pilar) => (
            <div
              key={pilar.titulo}
              className="rounded-2xl border border-border bg-surface p-6"
            >
              <div className="h-1 w-10 rounded-full bg-gold" />
              <h3 className="mt-5 text-lg font-bold">{pilar.titulo}</h3>
              <p className="mt-2 leading-7 text-muted">{pilar.texto}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto w-full max-w-5xl space-y-2 px-6 py-8 text-sm text-muted">
          <p>
            O conteúdo deste site é informativo e não substitui a orientação de
            um advogado.
          </p>
          <p>© 2026 Direito de Verdade.</p>
        </div>
      </footer>
    </div>
  );
}
