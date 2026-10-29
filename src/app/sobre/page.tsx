import { PaginaDeTexto } from "@/components/pagina-de-texto";
import { metadadosDaPagina } from "@/lib/metadados";

export const metadata = metadadosDaPagina({
  titulo: "Sobre",
  descricao:
    "Conheça o Direito de Verdade: informação jurídica clara, independente e em linguagem simples, para você entender seus direitos.",
  caminho: "/sobre",
});

export default function Sobre() {
  return (
    <PaginaDeTexto titulo="Sobre o Direito de Verdade">
      <p>
        O <strong>Direito de Verdade</strong> nasceu para ajudar qualquer pessoa
        a entender seus direitos sem complicação. A lei pode ser complicada,
        mas entender o que ela diz sobre a sua vida não precisa ser.
      </p>

      <h2>O que você encontra aqui</h2>
      <ul>
        <li>
          <strong>Informação clara:</strong> leis e direitos explicados em
          linguagem simples, sem juridiquês.
        </li>
        <li>
          <strong>Ferramentas práticas:</strong> recursos para entender a sua
          situação e saber o que fazer.
        </li>
        <li>
          <strong>Situações da vida real:</strong> orientações para os
          problemas que acontecem no dia a dia.
        </li>
      </ul>

      <h2>Nossos compromissos</h2>
      <ul>
        <li>Explicar com clareza, sem simplificar a ponto de distorcer.</li>
        <li>Basear o conteúdo na legislação em vigor e indicar as fontes.</li>
        <li>Manter a independência editorial em relação a anunciantes.</li>
        <li>Revisar e atualizar os textos quando a lei mudar.</li>
      </ul>

      <h2>Como produzimos o conteúdo</h2>
      <ul>
        <li>
          <strong>Só fontes oficiais:</strong> cada informação vem da lei no
          site do Planalto ou da Câmara, de órgãos públicos (gov.br, Receita
          Federal, INSS, Procons, Banco Central) e de tribunais, ou de dois
          veículos de imprensa independentes dizendo a mesma coisa. As fontes
          ficam listadas no fim de cada página.
        </li>
        <li>
          <strong>Nada inventado:</strong> não publicamos prazo, valor, número
          de lei ou decisão de tribunal sem fonte. Quando a regra muda de lugar
          para lugar ou não está definida, o texto diz isso e indica onde
          conferir.
        </li>
        <li>
          <strong>Perguntas reais:</strong> os temas e as perguntas de cada
          artigo partem do que as pessoas procuram no Google sobre o assunto.
        </li>
        <li>
          <strong>Calculadoras conferidas:</strong> as contas são testadas com
          exemplos calculados à parte e, quando existem, com os exemplos
          oficiais, como os da Receita Federal. Tudo é calculado no seu
          navegador: nada do que você digita é enviado.
        </li>
        <li>
          <strong>Data de atualização e correções:</strong> cada página mostra
          quando foi atualizada pela última vez. Valores que mudam todo ano,
          como o salário mínimo e as tabelas do INSS e do imposto de renda,
          são revisados a cada ano. Quando encontramos um erro ou a lei muda,
          corrigimos o texto e atualizamos a data.
        </li>
      </ul>

      <h2>O que não somos</h2>
      <p>
        O Direito de Verdade não é um escritório de advocacia nem um órgão
        público. O conteúdo do site é informativo e não substitui a orientação
        de um advogado. Para analisar um caso específico, procure um advogado
        de sua confiança ou a Defensoria Pública do seu estado, que atende
        gratuitamente quem não pode pagar.
      </p>
    </PaginaDeTexto>
  );
}
