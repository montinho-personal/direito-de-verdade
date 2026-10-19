import type { Metadata } from "next";
import { site } from "@/lib/site";

// Título, descrição, endereço canônico e dados de compartilhamento de uma página.
// Sem título, a página usa o título padrão do site.
export function metadadosDaPagina({
  titulo,
  descricao,
  caminho,
}: {
  titulo?: string;
  descricao: string;
  caminho: string;
}): Metadata {
  return {
    ...(titulo && { title: titulo }),
    description: descricao,
    alternates: { canonical: caminho },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: site.nome,
      url: caminho,
      title: titulo ? `${titulo} | ${site.nome}` : site.tituloPadrao,
      description: descricao,
      images: [
        {
          url: "/imagem-compartilhamento.png",
          width: 1200,
          height: 630,
          alt: "Logo do Direito de Verdade: seus direitos, sem complicação.",
        },
      ],
    },
    twitter: { card: "summary_large_image" },
  };
}
