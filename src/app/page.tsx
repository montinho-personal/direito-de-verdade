import Link from "next/link";
import { CartaoArtigo } from "@/components/cartao-artigo";
import { todasAsCalculadoras, todosOsArtigos } from "@/lib/artigos";
import { metadadosDaPagina } from "@/lib/metadados";
import { site } from "@/lib/site";

export const metadata = metadadosDaPagina({
  descricao: site.descricao,
  caminho: "/",
});

// Dados estruturados: ajudam o Google a identificar o site e a marca
const dadosEstruturados = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${site.url}/#organizacao`,
      name: site.nome,
      url: site.url,
      logo: `${site.url}/icon.png`,
      slogan: "Seus direitos. Sem complicação.",
    },
    {
      "@type": "WebSite",
      "@id": `${site.url}/#site`,
      name: site.nome,
      url: site.url,
      description: site.descricao,
      inLanguage: "pt-BR",
      publisher: { "@id": `${site.url}/#organizacao` },
    },
  ],
};

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
  const recentes = todosOsArtigos().slice(0, 3);
  const calculadoras = todasAsCalculadoras().slice(0, 3);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(dadosEstruturados).replace(/</g, "\\u003c"),
        }}
      />

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
          {recentes.length ? (
            <Link
              href="/artigos"
              className="mt-10 inline-flex rounded-full bg-gold px-6 py-3 font-semibold text-navy hover:opacity-90"
            >
              Ler os artigos
            </Link>
          ) : (
            <p className="mt-10 inline-flex rounded-full border border-navy-line px-4 py-2 text-sm font-medium text-gold">
              Site em construção. Em breve, novidades.
            </p>
          )}
        </div>
      </section>

      {recentes.length > 0 && (
        <section className="mx-auto w-full max-w-5xl px-6 pt-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-serif text-3xl sm:text-4xl">Artigos recentes</h2>
            <Link
              href="/artigos"
              className="font-medium text-accent underline underline-offset-4 hover:no-underline"
            >
              Ver todos os artigos
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recentes.map((artigo) => (
              <CartaoArtigo key={artigo.slug} artigo={artigo} tituloComo="h3" />
            ))}
          </div>
        </section>
      )}

      {calculadoras.length > 0 && (
        <section className="mx-auto w-full max-w-5xl px-6 pt-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-serif text-3xl sm:text-4xl">Calculadoras</h2>
            <Link
              href="/calculadoras"
              className="font-medium text-accent underline underline-offset-4 hover:no-underline"
            >
              Ver todas as calculadoras
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {calculadoras.map((calculadora) => (
              <CartaoArtigo
                key={calculadora.slug}
                artigo={calculadora}
                tituloComo="h3"
              />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto w-full max-w-5xl px-6 py-20">
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
      </section>
    </>
  );
}
