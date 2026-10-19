import type { Metadata } from "next";
import { site } from "@/lib/site";

// Título, descrição, endereço canônico e dados de compartilhamento de uma página.
// Sem título, a página usa o título padrão do site. O título ganha " | Direito de
// Verdade" no final, a não ser que venha como tituloCompleto (o tituloSeo dos artigos).
export function metadadosDaPagina({
  titulo,
  tituloCompleto,
  descricao,
  caminho,
  artigo,
}: {
  titulo?: string;
  tituloCompleto?: string;
  descricao: string;
  caminho: string;
  artigo?: {
    publicadoEm: string;
    atualizadoEm?: string;
    secao: string;
    autor?: string;
  };
}): Metadata {
  const tituloDaAba =
    tituloCompleto ?? (titulo ? `${titulo} | ${site.nome}` : site.tituloPadrao);
  const compartilhamento = {
    locale: "pt_BR",
    siteName: site.nome,
    url: caminho,
    title: tituloDaAba,
    description: descricao,
    images: [
      {
        url: "/imagem-compartilhamento.png",
        width: 1200,
        height: 630,
        alt: "Logo do Direito de Verdade: seus direitos, sem complicação.",
      },
    ],
  };

  return {
    ...(tituloCompleto
      ? { title: { absolute: tituloCompleto } }
      : titulo && { title: titulo }),
    description: descricao,
    alternates: { canonical: caminho },
    openGraph: artigo
      ? {
          ...compartilhamento,
          type: "article",
          publishedTime: artigo.publicadoEm,
          modifiedTime: artigo.atualizadoEm ?? artigo.publicadoEm,
          section: artigo.secao,
          ...(artigo.autor && { authors: [artigo.autor] }),
        }
      : { ...compartilhamento, type: "website" },
    twitter: { card: "summary_large_image" },
  };
}
