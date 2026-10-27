// Textos da calculadora de multa de aluguel: avisos, retomada pelo proprietário, exceções
// e fundamentos. Todos citam a Lei 8.245/1991 (texto da Câmara) ou o Código Civil.
import type { ReactNode } from "react";
import type { Aviso, Desfecho, Perfil } from "@/lib/aluguel/multa.ts";

export const link = "text-accent underline underline-offset-2";

export const FONTES = {
  lei: {
    nome: "Lei 8.245/1991 (Lei do Inquilinato), artigos 4º, 6º, 8º, 9º, 22, 23, 38, 46, 47, 54-A, 56 e 57 (Câmara dos Deputados)",
    url: "https://www2.camara.leg.br/legin/fed/lei/1991/lei-8245-18-outubro-1991-322506-normaatualizada-pl.html",
  },
  cc: {
    nome: "Código Civil, artigo 413: redução da multa pelo juiz (Câmara dos Deputados)",
    url: "https://www2.camara.leg.br/legin/fed/lei/2002/lei-10406-10-janeiro-2002-432893-normaatualizada-pl.html",
  },
  stj2022: {
    nome: "STJ: multa compensatória proporcional ao período cumprido, REsp 1.906.869 (15/07/2022)",
    url: "https://www.stj.jus.br/sites/portalp/Paginas/Comunicacao/Noticias/15072022-Cabe-multa-compensatoria-por-devolucao-de-imovel-em-acao-de-despejo--confirma-Terceira-Turma.aspx",
  },
  stj2018: {
    nome: "STJ: redução da cláusula penal por equidade, não por proporção matemática (28/05/2018)",
    url: "https://www.stj.jus.br/sites/portalp/Paginas/Comunicacao/Noticias-antigas/2018/2018-05-28_06-59_Quarta-Turma-adota-equidade-para-fixar-clausula-penal-por-descumprimento-de-contrato-de-locacao-em-shopping.aspx",
  },
  juizados: { nome: "Lei 9.099/1995, Juizados Especiais (Planalto)", url: "https://www.planalto.gov.br/ccivil_03/leis/l9099.htm" },
} as const;

export const Fora = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className={link}>
    {children}
  </a>
);
const Lei = ({ children }: { children: ReactNode }) => <Fora href={FONTES.lei.url}>{children}</Fora>;

export const TITULO_DO_DESFECHO: Record<Desfecho, string> = {
  "multa-proporcional": "Simulação de multa por saída antecipada",
  "multa-sob-medida": "Multa na locação sob medida",
  "sem-multa-transferencia": "Transferência de trabalho: sem multa",
  "sem-multa-prazo-terminou": "O prazo do contrato já terminou: sem multa",
  "aviso-de-30-dias": "Contrato por prazo indeterminado: vale o aviso de 30 dias",
  acordo: "Saída por acordo",
  "sem-valor-no-contrato": "O contrato não prevê multa",
  "clausula-a-analisar": "A cláusula do contrato precisa de análise",
  "retomada-pelo-proprietario": "Pedido de desocupação pelo proprietário",
  descumprimento: "Fim da locação por falta de pagamento ou infração",
};

export const TEXTO_DO_AVISO: Record<Aviso, ReactNode> = {
  "transferencia-incompleta": (
    <>
      A dispensa da multa por transferência exige três coisas: transferência <strong>determinada pelo empregador</strong>,
      privado ou público, para <strong>outra localidade</strong>, e <strong>aviso por escrito</strong> ao proprietário com
      pelo menos 30 dias (<Lei>artigo 4º, parágrafo único</Lei>). Mudar de emprego ou de cidade por conta própria não entra
      na regra. Como uma delas falta ou não foi confirmada, a conta mostra a multa proporcional.
    </>
  ),
  "clausula-sem-proporcao": (
    <>
      A lei manda a multa ser <strong>proporcional ao período cumprido</strong> (<Lei>artigo 4º</Lei>), e o juiz deve reduzir
      a multa quando o contrato foi cumprido em parte (<Fora href={FONTES.cc.url}>Código Civil, artigo 413</Fora>). Uma
      cláusula que cobre a multa inteira em qualquer caso merece análise.
    </>
  ),
  "multa-alta": (
    <>
      A multa prevista passa de 3 aluguéis. Três aluguéis é um valor comum nos contratos, não uma regra da lei, que não fixa
      limite; mas o juiz pode reduzir a multa manifestamente excessiva (
      <Fora href={FONTES.cc.url}>Código Civil, artigo 413</Fora>).
    </>
  ),
  "contrato-prorrogado": (
    <>
      Se o inquilino continuou no imóvel por mais de 30 dias depois do fim do prazo, sem oposição do proprietário, a locação
      passou a valer por prazo indeterminado (<Lei>artigos 46, 47 e 56</Lei>). Aí não há multa por sair: basta o aviso por
      escrito com 30 dias de antecedência (<Lei>artigo 6º</Lei>).
    </>
  ),
  "sem-aviso-um-aluguel": (
    <>
      Sem o aviso escrito de 30 dias, o proprietário pode exigir o equivalente a <strong>um mês de aluguel e encargos</strong>{" "}
      vigentes na saída (<Lei>artigo 6º, parágrafo único</Lei>).
    </>
  ),
  "artigo-46": (
    <>
      Contrato escrito de 30 meses ou mais: depois da prorrogação, o proprietário pode pedir o imóvel a qualquer tempo, dando
      30 dias para a desocupação (<Lei>artigo 46, § 2º</Lei>).
    </>
  ),
  "artigo-47": (
    <>
      Contrato de menos de 30 meses (ou verbal): depois do prazo, o proprietário só pode retomar o imóvel nos casos do{" "}
      <Lei>artigo 47</Lei>, como uso próprio ou da família, obras aprovadas, fim do emprego ligado ao imóvel, locação com mais
      de 5 anos seguidos ou os casos do artigo 9º.
    </>
  ),
  "locacao-nao-residencial": (
    <>
      Locação não residencial (comércio, escritório): a multa por saída antecipada segue o mesmo artigo 4º, mas o fim do
      prazo e a retomada têm regras próprias (<Lei>artigos 56 e 57</Lei>). Na locação sob medida (built to suit), vale a
      multa do contrato, limitada aos aluguéis que faltam (<Lei>artigo 54-A, § 2º</Lei>).
    </>
  ),
  caucao: (
    <>
      A caução não é desconto automático: ela garante as dívidas do contrato e, em dinheiro, não pode passar de 3 aluguéis
      e fica na poupança, com os rendimentos para o inquilino (<Lei>artigo 38, § 2º</Lei>). O acerto deve ser feito com
      recibo discriminado.
    </>
  ),
  "acordo-maior-que-a-multa": (
    <>O valor combinado é maior que a multa proporcional calculada. Acordo é livre, mas vale conferir antes de assinar.</>
  ),
};

export function TextoDaRetomada({ perfil, terminou }: { perfil: Perfil; terminou: boolean }) {
  return (
    <div className="space-y-2 text-sm leading-6">
      {!terminou ? (
        <p>
          <strong>Durante o prazo do contrato, o proprietário não pode reaver o imóvel</strong> (<Lei>artigo 4º</Lei>). As
          exceções são: <strong>acordo</strong>, <strong>infração</strong> legal ou contratual, <strong>falta de
          pagamento</strong> do aluguel e encargos, e <strong>reparos urgentes</strong> determinados pelo poder público (
          <Lei>artigo 9º</Lei>). Fora do acordo, a retomada é feita por ação de despejo.{" "}
          {perfil === "inquilino"
            ? "Você não é obrigado a sair antes do fim do prazo; se aceitar sair, combine tudo por escrito, inclusive que não haverá multa."
            : "Se o inquilino aceitar sair, registre o acordo por escrito, com a data da entrega das chaves e a dispensa de multa."}
        </p>
      ) : (
        <p>
          Terminado o prazo, as regras dependem do contrato: <strong>30 meses ou mais</strong>, por escrito, o proprietário
          pode pedir o imóvel com 30 dias para a desocupação depois da prorrogação (<Lei>artigo 46</Lei>);{" "}
          <strong>menos de 30 meses</strong>, só nos casos do <Lei>artigo 47</Lei>; locação{" "}
          <strong>não residencial</strong>, com 30 dias (<Lei>artigos 56 e 57</Lei>).
        </p>
      )}
      <p>
        Se o imóvel for <strong>vendido</strong> durante a locação, o comprador pode pedir a desocupação com 90 dias de prazo,
        salvo se o contrato for por prazo determinado, tiver cláusula de vigência em caso de venda e estiver averbado na
        matrícula (<Lei>artigo 8º</Lei>).
      </p>
    </div>
  );
}

export function Fundamentos() {
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm leading-6">
      <li>
        <Lei>Lei 8.245, artigo 4º</Lei>: o inquilino pode devolver o imóvel antes do prazo “pagando a multa pactuada,
        proporcional ao período de cumprimento do contrato, ou, na sua falta, a que for judicialmente estipulada”; dispensa
        na transferência pelo empregador.
      </li>
      <li>
        <Lei>Artigo 6º</Lei>: no prazo indeterminado, aviso por escrito de 30 dias.
      </li>
      <li>
        <Fora href={FONTES.cc.url}>Código Civil, artigo 413</Fora>: redução da multa excessiva ou de contrato cumprido em
        parte.
      </li>
      <li>
        STJ: abatimento proporcional ao período cumprido (<Fora href={FONTES.stj2022.url}>REsp 1.906.869</Fora>); em outro
        caso, redução por equidade, que “não se confunde com a imposição de proporcionalidade matemática” (
        <Fora href={FONTES.stj2018.url}>2018</Fora>). A conta é o ponto de partida; o juiz pode chegar a outro valor.
      </li>
    </ul>
  );
}
