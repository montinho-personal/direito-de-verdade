import { PaginaDeTexto } from "@/components/pagina-de-texto";
import { metadadosDaPagina } from "@/lib/metadados";

export const metadata = metadadosDaPagina({
  titulo: "Termos de Uso",
  descricao:
    "Condições de uso do Direito de Verdade: natureza informativa do conteúdo, direitos autorais e responsabilidades.",
  caminho: "/termos-de-uso",
});

export default function TermosDeUso() {
  return (
    <PaginaDeTexto titulo="Termos de Uso" atualizadaEm="19 de outubro de 2026">
      <p>
        Ao usar o <strong>Direito de Verdade</strong>, você concorda com estes
        termos. Se não concordar, recomendamos não utilizar o site.
      </p>

      <h2>Conteúdo informativo</h2>
      <p>
        Todo o conteúdo do site tem caráter informativo e educativo. Ele não
        constitui consultoria ou parecer jurídico e não cria relação entre
        advogado e cliente. Cada caso tem particularidades, e as leis e o
        entendimento dos tribunais mudam com o tempo. Antes de tomar decisões,
        consulte um advogado ou a Defensoria Pública.
      </p>

      <h2>Uso do site</h2>
      <p>
        Você pode ler, compartilhar links e citar trechos do conteúdo, desde
        que indique o Direito de Verdade como fonte, com link para a página
        original. Não é permitido copiar textos inteiros, reproduzir o conteúdo
        para fins comerciais ou usar o site de forma que prejudique seu
        funcionamento.
      </p>

      <h2>Direitos autorais e marca</h2>
      <p>
        Os textos, a marca, o logo e o design do site são protegidos pela Lei
        de Direitos Autorais (Lei nº 9.610/1998) e pela legislação de
        propriedade industrial. O uso fora do permitido nestes termos depende
        de autorização prévia.
      </p>

      <h2>Links e anúncios de terceiros</h2>
      <p>
        O site pode conter links para outros sites e exibir anúncios de
        terceiros. Não controlamos esse conteúdo e não nos responsabilizamos
        por ele, nem pelos produtos e serviços anunciados.
      </p>

      <h2>Responsabilidade</h2>
      <p>
        Trabalhamos para manter as informações corretas e atualizadas, mas não
        garantimos que estejam livres de erros ou omissões. O Direito de
        Verdade não se responsabiliza por decisões tomadas apenas com base no
        conteúdo do site.
      </p>

      <h2>Alterações e legislação aplicável</h2>
      <p>
        Estes termos podem ser atualizados a qualquer momento, e a data da
        última atualização fica no topo da página. Eles são regidos pelas leis
        brasileiras.
      </p>
    </PaginaDeTexto>
  );
}
