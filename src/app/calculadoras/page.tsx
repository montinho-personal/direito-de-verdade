import { notFound } from "next/navigation";
import { ListaDeArtigos } from "@/components/lista-de-artigos";
import { todasAsCalculadoras } from "@/lib/artigos";
import { metadadosDaPagina } from "@/lib/metadados";

export const metadata = metadadosDaPagina({
  titulo: "Calculadoras de direitos",
  descricao:
    "Calculadoras gratuitas para fazer a conta dos seus direitos, como o 13º salário, com as regras e as tabelas oficiais de 2026.",
  caminho: "/calculadoras",
});

export default function Calculadoras() {
  const calculadoras = todasAsCalculadoras();
  // A página só existe depois da primeira calculadora publicada
  if (calculadoras.length === 0) notFound();

  return (
    <ListaDeArtigos
      titulo="Calculadoras"
      descricao="Faça a conta dos seus direitos com as regras e as tabelas oficiais de 2026. Grátis e sem cadastro."
      artigos={calculadoras}
      comFiltros={false}
      migalhas={[
        { nome: "Início", caminho: "/" },
        { nome: "Calculadoras", caminho: "/calculadoras" },
      ]}
    />
  );
}
