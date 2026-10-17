import Image from "next/image";
import logo from "@/assets/logo.png";

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

export default function Home() {
  return (
    <div className="flex flex-1 flex-col font-sans">
      <header className="border-b border-border">
        <div className="mx-auto w-full max-w-5xl px-6 py-4">
          <Image
            src={logo}
            alt="Direito de Verdade"
            loading="eager"
            className="h-12 w-auto sm:h-16"
          />
        </div>
      </header>

      <section className="bg-navy text-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-20 sm:py-28">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold sm:text-sm">
            Seus direitos. Sem complicação.
          </p>
          <h1 className="mt-5 max-w-3xl font-serif text-4xl leading-tight sm:text-6xl">
            A lei pode ser complicada. Entender seus direitos não precisa ser.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-navy-muted">
            Informação jurídica clara, ferramentas práticas e orientações para
            situações da vida real.
          </p>
          <p className="mt-10 inline-flex rounded-full border border-navy-line px-4 py-2 text-sm font-medium text-gold">
            Site em construção. Em breve, novidades.
          </p>
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
              <h3 className="mt-5 font-serif text-2xl">{pilar.titulo}</h3>
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
