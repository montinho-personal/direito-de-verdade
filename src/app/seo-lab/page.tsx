import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PainelDoSeoLab } from "@/components/seo-lab/painel";
import { labAtivo } from "@/lib/seo-lab";

export const metadata: Metadata = {
  title: "Google SEO Research Lab",
  robots: { index: false, follow: false },
};

// Ferramenta interna, só local: fora do `npm run seo:lab` esta página não existe (404).
// Não entra no sitemap nem tem link no site.
export default function PaginaDoSeoLab() {
  if (!labAtivo()) notFound();
  return <PainelDoSeoLab />;
}
