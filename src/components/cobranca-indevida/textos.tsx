// Textos do resultado da calculadora de cobrança indevida: avisos, fundamentos, documentos
// e próximos passos. Cada regra cita a fonte oficial; as fontes estão também no fim da
// página e em docs/calculadoras/cobranca-indevida.md.
import type { ReactNode } from "react";
import { type Aviso, nomeDoMes } from "@/lib/cobranca-indevida/calculo.ts";
import { ULTIMO_MES_DO_IPCA } from "@/lib/cobranca-indevida/ipca.ts";
import type { TipoDeProblema } from "@/lib/cobranca-indevida/regras.ts";

export const link = "text-accent underline underline-offset-2";

export const FONTES = {
  cdc: "https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm",
  cc: "https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm",
  earesp: "https://processo.stj.jus.br/SCON/GetInteiroTeorDoAcordao?num_registro=201500497769&dt_publicacao=30/03/2021",
  tema929:
    "https://processo.stj.jus.br/repetitivos/temas_repetitivos/pesquisa.jsp?novaConsulta=true&tipo_pesquisa=T&cod_tema_inicial=929&cod_tema_final=929",
  sumula412:
    "https://processo.stj.jus.br/SCON/sumstj/doc.jsp?livre=%22412%22.num.&b=SUMU&p=false&l=10&i=1&operador=E&ordenacao=-%40NUM",
  ipca: "https://sidra.ibge.gov.br/tabela/1737",
  taxaLegal: "https://www.bcb.gov.br/content/estabilidadefinanceira/especialnor/Resolu%C3%A7%C3%A3o5171.pdf",
  calculadoraDoCidadao: "https://www3.bcb.gov.br/CALCIDADAO/publico/exibirFormCorrecaoValores.do?method=exibirFormCorrecaoValores",
  sac: "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2022/decreto/D11034.htm",
  anatel: "https://www.gov.br/anatel/pt-br/consumidor/conheca-seus-direitos/cobranca",
  aneel: "https://www.gov.br/aneel/pt-br/consumidores/como-resolver",
  consumidorGov: "https://www.consumidor.gov.br/pages/conteudo/sobre-servico",
  juizados: "https://www.planalto.gov.br/ccivil_03/leis/l9099.htm",
};

const Fora = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className={link}>
    {children}
  </a>
);

export const TEXTO_DO_AVISO: Record<Aviso, ReactNode> = {
  "tema-929": (
    <>
      O STJ julgou em 15/09/2026 um recurso repetitivo sobre quando cabe a devolução em dobro (
      <Fora href={FONTES.tema929}>Tema 929</Fora>). A tese ainda não foi publicada e pode mudar o que vale para o
      seu caso.
    </>
  ),
  modulacao: (
    <>
      Há pagamento até 30/03/2021. Em contratos privados, o STJ só aplica a regra atual do dobro (basta contrariar a
      boa-fé, sem provar má-fé) ao que foi pago depois dessa data (
      <Fora href={FONTES.earesp}>EAREsp 676.608</Fora>). Para os pagamentos anteriores, o dobro pode depender de provar
      má-fé da empresa.
    </>
  ),
  "modulacao-telefonia-fixa": (
    <>
      Na telefonia fixa, prestada por concessionária, esse corte de data pode não valer. Internet e TV por assinatura,
      em regra, são contratos privados.
    </>
  ),
  "indice-antes-da-lei-14905": (
    <>
      O IPCA é o índice do Código Civil desde 30/08/2024 (
      <Fora href={FONTES.cc}>artigo 389, parágrafo único</Fora>). Para períodos anteriores, o índice pode ser outro,
      conforme o contrato ou o tribunal: a correção aqui é uma estimativa.
    </>
  ),
  "mais-de-5-anos": (
    <>
      Há pagamento com mais de 5 anos. O prazo para pedir a devolução não é igual para todo caso: o STJ aplica 10 anos
      para água, esgoto e telefonia (<Fora href={FONTES.sumula412}>Súmula 412</Fora>), mas em outros contratos o prazo
      pode ser discutido. Não deixe para depois.
    </>
  ),
  "mais-de-10-anos": (
    <>
      Há pagamento com mais de 10 anos. Esse valor pode já ter passado do prazo para cobrar (Código Civil, artigo 205).
      Confirme com um advogado ou com a Defensoria Pública antes de contar com ele.
    </>
  ),
  "devolvido-maior-que-excesso": (
    <>
      A empresa já devolveu mais do que você pagou a mais: no cenário simples, não sobra nada a receber. No dobro, o
      devolvido é abatido.
    </>
  ),
  "pagamento-incerto": (
    <>
      Você não tem certeza do pagamento: confira no extrato do banco ou na fatura do cartão. Só existe restituição do
      que foi efetivamente pago.
    </>
  ),
  "sem-ipca-ainda": (
    <>
      Os pagamentos feitos a partir de {nomeDoMes(ULTIMO_MES_DO_IPCA)} ainda não têm correção: o IBGE ainda não
      divulgou a inflação do mês seguinte.
    </>
  ),
};

// Base legal mostrada no resultado
export function Fundamentos() {
  return (
    <ul className="list-disc space-y-1 pl-5">
      <li>
        <Fora href={FONTES.cdc}>CDC, artigo 42, parágrafo único</Fora>: devolução do dobro do que foi pago em excesso,
        com correção e juros, salvo engano justificável.
      </li>
      <li>
        <Fora href={FONTES.earesp}>STJ, EAREsp 676.608</Fora>: o dobro não exige provar má-fé; basta a cobrança contrariar
        a boa-fé objetiva. Cabe à empresa provar o engano justificável.
      </li>
      <li>
        <Fora href={FONTES.cc}>Código Civil, artigos 389, 405 e 406</Fora>: correção pelo IPCA; juros de mora desde a
        citação nas obrigações contratuais; taxa legal = Selic menos IPCA, calculada pelo Banco Central (
        <Fora href={FONTES.taxaLegal}>Resolução CMN 5.171/2024</Fora>).
      </li>
      <li>
        <Fora href={FONTES.ipca}>IBGE, IPCA (número-índice)</Fora>: índice usado na correção, até{" "}
        {nomeDoMes(ULTIMO_MES_DO_IPCA)}.
      </li>
    </ul>
  );
}

export const DOCUMENTOS: Record<TipoDeProblema | "geral", string[]> = {
  geral: [
    "faturas, boletos ou extratos com a cobrança;",
    "comprovantes de pagamento (extrato do banco ou fatura do cartão);",
    "contrato, oferta ou print do plano contratado, para mostrar o valor correto;",
    "protocolos, e-mails e prints das conversas com a empresa.",
  ],
  duplicada: ["a fatura em que a mesma compra aparece duas vezes;"],
  "nao-contratado": ["qualquer prova de que você não pediu o serviço (por exemplo, a falta de contrato assinado);"],
  "assinatura-cancelada": ["o comprovante ou protocolo do cancelamento, com a data;"],
  "tarifa-bancaria": ["o extrato com a tarifa e o pacote de serviços contratado;"],
  "compra-cancelada": ["o comprovante do cancelamento ou da devolução do produto;"],
  telecom: ["as contas com o valor do plano e o protocolo da contestação na operadora;"],
  "energia-agua": ["as contas anteriores, para comparar o consumo, e a leitura do medidor;"],
  outro: [],
};
