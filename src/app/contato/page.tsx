import { notFound } from "next/navigation";
import { PaginaDeTexto } from "@/components/pagina-de-texto";
import { metadadosDaPagina } from "@/lib/metadados";
import { site } from "@/lib/site";

export const metadata = metadadosDaPagina({
  titulo: "Contato",
  descricao: "Fale com o Direito de Verdade: sugestões, correções e parcerias.",
  caminho: "/contato",
});

export default function Contato() {
  // A página só existe depois que o e-mail de contato é configurado em src/lib/site.ts
  if (!site.emailContato) notFound();

  return (
    <PaginaDeTexto titulo="Contato">
      <p>
        Para sugestões, correções ou parcerias, escreva para{" "}
        <a href={`mailto:${site.emailContato}`}>{site.emailContato}</a>.
      </p>
      <p>
        Não prestamos consultoria jurídica individual. Para analisar um caso
        específico, procure um advogado de sua confiança ou a Defensoria
        Pública do seu estado.
      </p>
    </PaginaDeTexto>
  );
}
