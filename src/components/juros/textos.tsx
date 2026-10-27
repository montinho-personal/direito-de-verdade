// Textos da calculadora de juros abusivos: o que cada ponto de verificação quer dizer,
// a explicação jurídica e as fontes. Nenhum texto conclui por ilegalidade: a taxa acima
// da média, sozinha, não comprova abusividade (STJ).
import type { ReactNode } from "react";
import type { Sinal } from "@/lib/juros/analise.ts";
import { percentual } from "@/lib/juros/financeiro.ts";
import { reais } from "@/lib/dinheiro";

export const link = "text-accent underline underline-offset-2";

export const FONTES = {
  jt48: {
    nome: "STJ: Jurisprudência em Teses nº 48, Bancário (teses 2, 4, 8, 9 e 12)",
    url: "https://www.stj.jus.br/internet_docs/jurisprudencia/jurisprudenciaemteses/Jurisprud%C3%AAncia%20em%20teses%2048%20-%20Banc%C3%A1rio.pdf",
  },
  resp1061530: {
    nome: "STJ: REsp 1.061.530/RS, recurso repetitivo sobre juros remuneratórios (DJe 10/03/2009)",
    url: "https://www.stj.jus.br/websecstj/cgi/revista/REJ.cgi/ITA?seq=826356&tipo=0&nreg=200801199924&SeqCgrmaSessao=&CodOrgaoJgdr=&dt=20090310&formato=HTML&salvar=false",
  },
  tema1474: {
    nome: "STJ: Tema repetitivo 1.474, taxa diária de juros em contrato bancário (notícia de 19/10/2026)",
    url: "https://www.stj.jus.br/sites/portalp/Paginas/Comunicacao/Noticias/2026/19102026-Repetitivo-vai-definir-exigencia-de-previsao-expressa-da-taxa-diaria-de-juros-em-contrato-bancario.aspx",
  },
  cet: {
    nome: "Resolução CMN 4.881/2020: cálculo e informação do Custo Efetivo Total (CET)",
    url: "https://www.bcb.gov.br/content/estabilidadefinanceira/especialnor/Resolu%C3%A7%C3%A3o4881.pdf",
  },
  chequeEspecial: {
    nome: "Resolução CMN 4.765/2019: cheque especial, juros de até 8% ao mês",
    url: "https://normativos.bcb.gov.br/Lists/Normativos/Attachments/50875/Res_4765_v2_P.pdf",
  },
  liquidacao: {
    nome: "Resolução CMN 3.516/2007: proibida tarifa por liquidação antecipada",
    url: "https://normativos.bcb.gov.br/Lists/Normativos/Attachments/48006/Res_3516_v3_L.pdf",
  },
  rotativo: {
    nome: "Secom/Presidência: teto de juros do rotativo do cartão vale desde 03/01/2024",
    url: "https://www.gov.br/secom/pt-br/acompanhe-a-secom/noticias/2024/01/novo-teto-de-juros-do-cartao-de-credito-passa-a-valer-a-partir-desta-quarta",
  },
  inss: {
    nome: "INSS: como conferir a taxa de juros do consignado no Meu INSS",
    url: "https://www.gov.br/inss/pt-br/noticias/veja-como-conferir-a-taxa-de-juros-do-consignado-no-meu-inss",
  },
  cdc: {
    nome: "Código de Defesa do Consumidor, artigos 6º, 39, 46, 51 e 52 (Câmara dos Deputados)",
    url: "https://www2.camara.leg.br/legin/fed/lei/1990/lei-8078-11-setembro-1990-365086-normaatualizada-pl.html",
  },
  scr: {
    nome: "gov.br: emitir o relatório de empréstimos e financiamentos (Registrato/SCR)",
    url: "https://www.gov.br/pt-br/servicos/obter-relatorio-do-sistema-de-informacoes-de-credito-scr",
  },
  reclamacaoBc: {
    nome: "gov.br: reclamar contra bancos e outras instituições no Banco Central",
    url: "https://www.gov.br/pt-br/servicos/registrar-reclamacao-contra-instituicao-supervisionada-pelo-banco-central",
  },
  consumidorGov: { nome: "Consumidor.gov.br", url: "https://www.consumidor.gov.br/pages/conteudo/publico/1" },
} as const;

export const Fora = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className={link}>
    {children}
  </a>
);

const pp = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });

export function textoDoSinal(s: Sinal): ReactNode {
  switch (s.id) {
    case "acima-da-media":
      return (
        <>
          A taxa do seu contrato está acima da média de referência utilizada ({pp(s.diferencaPp)} ponto(s) percentual(is) ao
          mês). Isso não significa, por si só, que exista cobrança abusiva. A análise depende das características da operação e
          das circunstâncias contratuais.
        </>
      );
    case "abaixo-da-media":
      return <>A taxa do seu contrato está igual ou abaixo da média de referência do Banco Central para essa modalidade.</>;
    case "acima-do-teto-cheque-especial":
      return (
        <>
          A taxa informada passa de 8% ao mês, o limite dos juros do cheque especial para pessoas físicas e MEI desde
          06/01/2020 (<Fora href={FONTES.chequeEspecial.url}>Resolução CMN 4.765/2019</Fora>). Confira no extrato se a taxa é
          essa mesmo e, se for, peça explicação ao banco.
        </>
      );
    case "teto-do-rotativo":
      return s.vale ? (
        <>
          Para dívidas do rotativo e do parcelamento da fatura contraídas desde 03/01/2024, os juros e encargos não podem passar
          de 100% do valor original da dívida (<Fora href={FONTES.rotativo.url}>Lei 14.690/2023</Fora>). Vale conferir o total
          cobrado.
        </>
      ) : (
        <>O teto de 100% do valor original no rotativo e no parcelamento da fatura vale só para dívidas a partir de 03/01/2024.</>
      );
    case "teto-consignado-inss":
      return (
        <>
          O consignado do INSS tem teto de juros fixado pelo Conselho Nacional de Previdência Social, que muda de tempos em
          tempos. Confira o teto vigente na data do seu contrato e a taxa do seu empréstimo no{" "}
          <Fora href={FONTES.inss.url}>Meu INSS</Fora>.
        </>
      );
    case "indexador-imobiliario":
      return (
        <>
          Financiamento imobiliário costuma ter, além dos juros, um indexador (TR, IPCA ou poupança) que corrige o saldo. A
          simulação considera só os juros; o valor real das parcelas pode ser diferente.
        </>
      );
    case "taxas-informadas-nao-batem":
      return s.nominal ? (
        <>
          A taxa anual informada é 12 vezes a mensal: é a taxa nominal. Com juros compostos, a mensal equivale a{" "}
          {percentual(s.anualDaMensal)} ao ano. Taxa anual maior que 12 vezes a mensal indica capitalização mensal, que o STJ
          admite quando está prevista no contrato (Súmula 541).
        </>
      ) : (
        <>
          As taxas mensal e anual informadas não batem entre si: a mensal equivale a {percentual(s.anualDaMensal)} ao ano.
          Confira no contrato.
        </>
      );
    case "taxa-calculada-maior":
      return (
        <>
          Pelas parcelas, a taxa fica em {percentual(s.calculada)} ao mês, acima da taxa informada. A diferença costuma vir de
          tarifas, seguros e IOF incluídos nas parcelas: confira o CET e o demonstrativo do contrato.
        </>
      );
    case "encargos-financiados":
      return (
        <>
          O valor financiado é {reais(s.valor)} maior que o valor que você recebeu. Essa diferença costuma ser de tarifas,
          seguros ou IOF incluídos no empréstimo. Seguro só pode ser contratado se você quiser: condicionar o crédito a ele é
          venda casada (<Fora href={FONTES.cdc.url}>CDC, artigo 39, I</Fora>).
        </>
      );
    case "cet-maior-que-a-taxa":
      return (
        <>
          O CET ({percentual(s.cetMensal)} ao mês) é maior que a taxa de juros: a diferença são tarifas, seguros, IOF e outras
          despesas. O banco tem de informar o CET e o demonstrativo antes da contratação (
          <Fora href={FONTES.cet.url}>Resolução CMN 4.881/2020</Fora>).
        </>
      );
    case "referencia-defasada":
      return <>A média do mês do contrato ainda não foi divulgada: usamos a mais recente disponível.</>;
  }
}

export function ExplicacaoJuridica() {
  return (
    <div className="space-y-2 text-sm leading-6">
      <p>
        Bancos e financeiras não estão limitados aos 12% ao ano da Lei de Usura, e juros acima disso, sozinhos, não indicam
        abusividade (STJ, Súmula 382). Para o STJ, o simples fato de a taxa ser maior que a média de mercado também não
        configura abuso; a revisão é admitida em situações excepcionais, quando a abusividade, que coloca o consumidor em
        desvantagem exagerada, fica cabalmente demonstrada no caso concreto (
        <Fora href={FONTES.jt48.url}>Jurisprudência em Teses nº 48</Fora>;{" "}
        <Fora href={FONTES.resp1061530.url}>REsp 1.061.530</Fora>).
      </p>
      <p>
        A média do Banco Central é um referencial: quando não dá para provar a taxa contratada, é ela que se aplica, salvo se a
        cobrada for mais vantajosa (Súmula 530). Juros remuneratórios (o preço do empréstimo) são diferentes de juros de mora e
        multa (cobrados no atraso), do CET (que soma juros, tarifas, seguros e IOF) e da capitalização (juros sobre juros,
        admitida quando prevista no contrato, Súmulas 539 e 541). O STJ vai decidir ainda se a taxa diária precisa estar
        escrita no contrato com capitalização diária (<Fora href={FONTES.tema1474.url}>Tema 1.474</Fora>).
      </p>
      <p>
        Quem quita antes tem direito à redução proporcional dos juros (
        <Fora href={FONTES.cdc.url}>CDC, artigo 52, § 2º</Fora>), e o banco não pode cobrar tarifa por isso (
        <Fora href={FONTES.liquidacao.url}>Resolução CMN 3.516/2007</Fora>).
      </p>
    </div>
  );
}
