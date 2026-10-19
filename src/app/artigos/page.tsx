import { notFound } from "next/navigation";
import { ListaDeArtigos } from "@/components/lista-de-artigos";
import { todosOsArtigos } from "@/lib/artigos";
import { metadadosDaPagina } from "@/lib/metadados";

export const metadata = metadadosDaPagina({
  titulo: "Artigos",
  descricao:
    "Artigos sobre os seus direitos explicados em linguagem simples: trabalho, consumidor, família, INSS, moradia e mais.",
  caminho: "/artigos",
});

export default function Artigos() {
  const artigos = todosOsArtigos();
  // A página só existe depois do primeiro artigo publicado
  if (artigos.length === 0) notFound();

  return (
    <ListaDeArtigos
      titulo="Artigos"
      descricao="Seus direitos explicados em linguagem simples, com base na lei e direto ao ponto."
      artigos={artigos}
      migalhas={[
        { nome: "Início", caminho: "/" },
        { nome: "Artigos", caminho: "/artigos" },
      ]}
    />
  );
}
