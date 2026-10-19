import Link from "next/link";
import { notFound } from "next/navigation";
import { Calculadora13Salario } from "@/components/calculadora-13-salario";
import { CartaoArtigo } from "@/components/cartao-artigo";
import { Migalhas } from "@/components/migalhas";
import { VideoDoYoutube } from "@/components/video-do-youtube";
import {
  artigoPorSlug,
  artigosRelacionados,
  dataDeAlteracao,
  formatarData,
  todosOsArtigos,
} from "@/lib/artigos";
import type { IdDaFerramenta } from "@/lib/ferramentas";
import { metadadosDaPagina } from "@/lib/metadados";
import { site } from "@/lib/site";

type PropsDaFerramenta = { nivelDoTitulo?: 2 | 3 };

const COMPONENTES_DAS_FERRAMENTAS: Record<
  IdDaFerramenta,
  (props: PropsDaFerramenta) => React.ReactNode
> = {
  "calculadora-13-salario": Calculadora13Salario,
};

function Ferramenta({ id, ...props }: PropsDaFerramenta & { id: IdDaFerramenta }) {
  const Componente = COMPONENTES_DAS_FERRAMENTAS[id];
  return <Componente {...props} />;
}

// A página inteira é gerada antes de responder; assim, um endereço que não existe
// recebe o código 404 de verdade (importante para o Google)
export const ensureStatic = "navigation";

export function generateStaticParams() {
  const parametros = todosOsArtigos().map((artigo) => ({ slug: artigo.slug }));
  // A lista não pode ficar vazia; sem artigos, o endereço provisório leva ao erro 404
  return parametros.length ? parametros : [{ slug: "sem-artigos" }];
}

export async function generateMetadata({
  params,
}: PageProps<"/artigos/[slug]">) {
  const { slug } = await params;
  const artigo = artigoPorSlug(slug);
  if (!artigo) return {};
  return metadadosDaPagina({
    titulo: artigo.titulo,
    tituloCompleto: artigo.tituloSeo,
    descricao: artigo.descricao,
    caminho: `/artigos/${artigo.slug}`,
    artigo: {
      publicadoEm: artigo.publicadoEm,
      atualizadoEm: artigo.atualizadoEm,
      secao: artigo.categoria.nome,
      autor: artigo.autor,
    },
  });
}

export default async function PaginaDoArtigo({
  params,
}: PageProps<"/artigos/[slug]">) {
  const { slug } = await params;
  const artigo = artigoPorSlug(slug);
  if (!artigo) notFound();

  const relacionados = artigosRelacionados(artigo);
  const organizacao = {
    "@type": "Organization",
    name: site.nome,
    url: site.url,
    logo: { "@type": "ImageObject", url: `${site.url}/icon.png` },
  };
  const dadosEstruturados = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: artigo.titulo,
        description: artigo.descricao,
        datePublished: artigo.publicadoEm,
        dateModified: dataDeAlteracao(artigo),
        inLanguage: "pt-BR",
        articleSection: artigo.categoria.nome,
        mainEntityOfPage: `${site.url}/artigos/${artigo.slug}`,
        image: `${site.url}/imagem-compartilhamento.png`,
        author: artigo.autor ? { "@type": "Person", name: artigo.autor } : organizacao,
        publisher: organizacao,
      },
      ...(artigo.faq.length
        ? [
            {
              "@type": "FAQPage",
              inLanguage: "pt-BR",
              mainEntity: artigo.faq.map((item) => ({
                "@type": "Question",
                name: item.pergunta,
                acceptedAnswer: { "@type": "Answer", text: item.respostaTexto },
              })),
            },
          ]
        : []),
    ],
  };

  // Ferramenta logo depois do lead (página de calculadora): vem antes do sumário,
  // para aparecer na primeira tela
  const [primeiraParte, ...demaisPartes] = artigo.partes;
  const ferramentaNoTopo = primeiraParte?.tipo === "ferramenta" ? primeiraParte : null;
  const partes = ferramentaNoTopo ? demaisPartes : artigo.partes;

  const sumario = [
    ...artigo.secoes,
    ...(artigo.faq.length
      ? [{ id: "perguntas-frequentes", titulo: "Perguntas frequentes" }]
      : []),
    ...(artigo.video ? [{ id: "video", titulo: "Assista em vídeo" }] : []),
  ];

  return (
    <>
      <article>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(dadosEstruturados).replace(/</g, "\\u003c"),
          }}
        />

        <header className="border-b border-border">
          <div className="mx-auto w-full max-w-3xl px-6 py-10 sm:py-14">
            <Migalhas
              itens={[
                { nome: "Início", caminho: "/" },
                { nome: "Artigos", caminho: "/artigos" },
                {
                  nome: artigo.categoria.nome,
                  caminho: `/categoria/${artigo.categoria.slug}`,
                },
                { nome: artigo.titulo, caminho: `/artigos/${artigo.slug}` },
              ]}
            />
            <Link
              href={`/categoria/${artigo.categoria.slug}`}
              className="mt-8 inline-block text-sm font-semibold uppercase tracking-wider text-accent hover:underline"
            >
              {artigo.categoria.nome}
            </Link>
            <h1 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">
              {artigo.titulo}
            </h1>
            <p className="mt-5 text-sm text-muted">
              {artigo.autor && <>Por {artigo.autor} · </>}
              Publicado em{" "}
              <time dateTime={artigo.publicadoEm}>
                {formatarData(artigo.publicadoEm)}
              </time>
              {artigo.atualizadoEm && (
                <>
                  {" "}
                  · Atualizado em{" "}
                  <time dateTime={artigo.atualizadoEm}>
                    {formatarData(artigo.atualizadoEm)}
                  </time>
                </>
              )}{" "}
              · {artigo.minutosDeLeitura} min de leitura
            </p>
            {artigo.lead && (
              <p
                className="lead mt-6"
                dangerouslySetInnerHTML={{ __html: artigo.lead }}
              />
            )}
          </div>
        </header>

        <div className="mx-auto w-full max-w-3xl px-6 py-12">
          {ferramentaNoTopo && (
            <div className="-mt-2 mb-10 [&>section]:my-0">
              <Ferramenta id={ferramentaNoTopo.id} nivelDoTitulo={2} />
            </div>
          )}

          {sumario.length >= 3 && (
            <nav
              aria-label="Sumário"
              className="mb-10 rounded-2xl border border-border bg-surface p-6"
            >
              <p className="font-semibold">Neste artigo</p>
              <ol className="mt-3 list-decimal space-y-2 pl-5 marker:text-gold">
                {sumario.map((secao) => (
                  <li key={secao.id}>
                    <a
                      href={`#${secao.id}`}
                      className="text-accent underline underline-offset-4 hover:no-underline"
                    >
                      {secao.titulo}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          {partes.map((parte, indice) =>
            parte.tipo === "texto" ? (
              <div
                key={indice}
                className="texto"
                dangerouslySetInnerHTML={{ __html: parte.html }}
              />
            ) : (
              <Ferramenta key={indice} id={parte.id} />
            ),
          )}

          {artigo.faq.length > 0 && (
            <section aria-labelledby="perguntas-frequentes" className="mt-12">
              <h2
                id="perguntas-frequentes"
                className="scroll-mt-6 font-serif text-[1.625rem] leading-snug"
              >
                Perguntas frequentes
              </h2>
              {/* Cada resposta abre e fecha ao tocar na pergunta; fechada, continua na
                  página (o Google lê) */}
              <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-surface">
                {artigo.faq.map((item) => (
                  <details key={item.pergunta} className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold [&::-webkit-details-marker]:hidden">
                      <h3 className="text-[1.0625rem] font-semibold leading-snug">
                        {item.pergunta}
                      </h3>
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5 shrink-0 text-accent transition-transform group-open:rotate-180"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </summary>
                    <div className="texto px-5 pb-5">
                      <p dangerouslySetInnerHTML={{ __html: item.respostaHtml }} />
                    </div>
                  </details>
                ))}
              </div>
            </section>
          )}

          {artigo.video && (
            <section aria-labelledby="video" className="mt-12">
              <h2 id="video" className="scroll-mt-6 font-serif text-[1.625rem] leading-snug">
                Assista em vídeo
              </h2>
              <VideoDoYoutube id={artigo.video.id} titulo={artigo.video.titulo} />
            </section>
          )}

          {artigo.fontes.length > 0 && (
            <section aria-labelledby="fontes" className="mt-12 border-t border-border pt-8">
              <h2 id="fontes" className="font-serif text-2xl">
                Fontes
              </h2>
              <ul className="mt-4 space-y-2 text-sm leading-6">
                {artigo.fontes.map((fonte) => (
                  <li key={fonte.url}>
                    <a
                      href={fonte.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent underline underline-offset-4 [overflow-wrap:anywhere] hover:no-underline"
                    >
                      {fonte.nome}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <aside className="mt-12 rounded-2xl border-l-4 border-gold bg-surface p-6 text-sm leading-6 text-muted">
            <strong className="text-foreground">Importante:</strong> este artigo
            é informativo e não substitui a orientação de um advogado. Para
            analisar o seu caso, procure um advogado de confiança ou a
            Defensoria Pública do seu estado, que atende gratuitamente quem não
            pode pagar.
          </aside>
        </div>
      </article>

      {relacionados.length > 0 && (
        <section className="border-t border-border">
          <div className="mx-auto w-full max-w-5xl px-6 py-16">
            <h2 className="font-serif text-3xl">Leia também</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relacionados.map((relacionado) => (
                <CartaoArtigo
                  key={relacionado.slug}
                  artigo={relacionado}
                  tituloComo="h3"
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
