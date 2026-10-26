// Regras jurídicas usadas pela calculadora de cobrança indevida. Só mudar depois de
// conferir de novo com as fontes, nunca automaticamente. Trechos e links em
// docs/calculadoras/cobranca-indevida.md.
//
// - Devolução: "o consumidor cobrado em quantia indevida tem direito à repetição do
//   indébito, por valor igual ao dobro do que pagou em excesso, acrescido de correção
//   monetária e juros legais, salvo hipótese de engano justificável" (CDC, art. 42,
//   parágrafo único). Sem pagamento não há repetição: o caminho é contestar.
// - Dobro sem prova de má-fé: basta a cobrança contrariar a boa-fé objetiva (STJ, Corte
//   Especial, EAREsp 676.608/RS, DJe 30/03/2021). Modulação: em contratos de consumo que
//   não envolvam serviço público prestado pelo Estado ou por concessionária, o
//   entendimento só alcança as cobranças "pagas após a data da publicação" do acórdão.
//   O STJ julgou o Tema repetitivo 929 em 15/09/2026; tese ainda não publicada.
// - Correção: IPCA (Código Civil, art. 389, parágrafo único, Lei 14.905/2024, em vigor
//   desde 30/08/2024). Antes disso, o índice dependia do contrato e do tribunal.
// - Juros: a taxa legal é a Selic menos o IPCA (CC, art. 406, § 1º), e nas obrigações
//   contratuais os juros de mora contam da citação (CC, art. 405), salvo mora anterior.
//   Como a data depende do caso, a calculadora não soma juros: só explica.
// - Telefonia, internet e TV: devolução em dobro com correção e juros de 1% ao mês, pelo
//   índice da operadora ou da Anatel (Regulamento Geral de Direitos do Consumidor de
//   Serviços de Telecomunicações, art. 64, segundo a Anatel). Energia: dobro corrigido
//   pelo IPCA (Resolução Aneel 1.000/2021, segundo a Aneel).
// - Prazo: 10 anos (CC, art. 205) para tarifas de água e esgoto (Súmula 412) e serviços
//   de telefonia (EAREsp 676.608). Nos demais casos, varia: a calculadora só avisa.

export const REGRAS_DA_COBRANCA = {
  revisadoEm: "2026-10-26",
  // Publicação do EAREsp 676.608 no DJe; a regra nova vale para o que foi pago depois
  publicacaoDoEaresp676608: "2021-03-30",
  // Início da vigência da Lei 14.905/2024 (60 dias depois de 01/07/2024)
  vigenciaDaLei14905: "2024-08-30",
  // Primeiro pagamento aceito: antes disso, passa de qualquer prazo de 10 anos
  primeiroPagamentoAceito: "2010-01-01",
  // Prazos que geram aviso, em anos
  prazoGeral: 10,
  prazoDeAtencao: 5,
  // Limite de linhas e de repetições mensais em uma linha (para não travar o navegador)
  maximoDeLinhas: 24,
  maximoDeRepeticoes: 120,
} as const;

export const TIPOS_DE_PROBLEMA = [
  "duplicada",
  "nao-contratado",
  "assinatura-cancelada",
  "tarifa-bancaria",
  "compra-cancelada",
  "telecom",
  "energia-agua",
  "outro",
] as const;

export type TipoDeProblema = (typeof TIPOS_DE_PROBLEMA)[number];

export const NOME_DO_PROBLEMA: Record<TipoDeProblema, string> = {
  duplicada: "Cobrança duplicada",
  "nao-contratado": "Serviço ou produto que não contratei",
  "assinatura-cancelada": "Assinatura cancelada que continua cobrando",
  "tarifa-bancaria": "Tarifa bancária ou do cartão",
  "compra-cancelada": "Compra cancelada sem reembolso",
  telecom: "Internet, telefone ou TV",
  "energia-agua": "Conta de luz ou de água",
  outro: "Outro tipo de cobrança",
};

// Luz e água: serviço público prestado pelo Estado ou por concessionária, fora da modulação
// do EAREsp 676.608. Internet e TV por assinatura são, em regra, autorizações (regime
// privado), e só a telefonia fixa tem concessionárias: por isso "telecom" fica dentro da
// modulação, com um aviso de que, na telefonia fixa, o corte de data pode não valer.
export function ehServicoPublico(tipo: TipoDeProblema) {
  return tipo === "energia-agua";
}
