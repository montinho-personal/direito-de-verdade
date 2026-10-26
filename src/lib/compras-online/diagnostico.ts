// Motor do simulador de direitos em compras online: as perguntas de cada problema (só as
// necessárias, conforme as respostas) e o diagnóstico informativo. Nada aqui depende da
// tela, e nenhuma resposta é dado pessoal: só escolhas e datas. Regras e fontes em
// ./regras.ts.
import { compararDatas, type Data, formatarData, lerData, numeroDoDia, somarDias } from "../trabalhista/datas.ts";
import { type IdDaFonte, REGRAS_DAS_COMPRAS as R } from "./regras.ts";

export const PROBLEMAS = [
  "nao-chegou",
  "defeito",
  "diferente",
  "desistir",
  "cancelei-sem-reembolso",
  "loja-nao-troca",
  "loja-sumiu",
  "golpe",
  "outro",
] as const;

export type Problema = (typeof PROBLEMAS)[number];

export const NOME_DO_PROBLEMA: Record<Problema, string> = {
  "nao-chegou": "Meu produto não chegou",
  defeito: "Recebi um produto com defeito",
  diferente: "Recebi um produto diferente do anunciado",
  desistir: "Quero desistir da compra",
  "cancelei-sem-reembolso": "Cancelei a compra e não recebi o dinheiro",
  "loja-nao-troca": "A loja não quer trocar o produto",
  "loja-sumiu": "A loja desapareceu ou não responde",
  golpe: "Fui vítima de possível golpe",
  outro: "Outro problema",
};

export type Respostas = Partial<Record<string, string>>;

export type Opcao = { valor: string; nome: string; dica?: string };

export type Pergunta = {
  id: string;
  texto: string;
  ajuda?: string;
  tipo: "opcoes" | "data";
  opcoes?: Opcao[];
  // Só em datas: botão que grava "nao-sei" no lugar da data
  naoSei?: string;
  visivel?: (r: Respostas, hoje: Data) => boolean;
};

const SIM_NAO: Opcao[] = [
  { valor: "sim", nome: "Sim" },
  { valor: "nao", nome: "Não" },
];
const SIM_NAO_NAO_SEI: Opcao[] = [...SIM_NAO, { valor: "nao-sei", nome: "Não sei" }];

const MEIO: Pergunta = {
  id: "meio",
  texto: "Como você pagou?",
  tipo: "opcoes",
  opcoes: [
    { valor: "cartao", nome: "Cartão de crédito" },
    { valor: "pix", nome: "Pix" },
    { valor: "boleto", nome: "Boleto" },
    { valor: "outro", nome: "Outro meio" },
  ],
};
const CONTATO: Pergunta = {
  id: "contato",
  texto: "Você já reclamou com a loja por escrito?",
  ajuda: "Pelo chat, e-mail, área de pedidos ou aplicativo.",
  tipo: "opcoes",
  opcoes: SIM_NAO,
};
const MARKETPLACE: Pergunta = {
  id: "marketplace",
  texto: "A compra foi feita em um marketplace?",
  ajuda: "Site ou aplicativo que vende produtos de outras lojas, como Mercado Livre, Shopee, Amazon ou Magalu.",
  tipo: "opcoes",
  opcoes: SIM_NAO_NAO_SEI,
};
const DURABILIDADE: Pergunta = {
  id: "durabilidade",
  texto: "Que tipo de produto é?",
  tipo: "opcoes",
  opcoes: [
    { valor: "duravel", nome: "Durável", dica: "Feito para durar: eletrônico, eletrodoméstico, móvel." },
    { valor: "nao-duravel", nome: "Não durável", dica: "Acaba com o uso: alimento, cosmético, produto de limpeza." },
    { valor: "nao-sei", nome: "Não sei" },
  ],
};
const recebimento = (texto = "Em que dia o produto chegou?"): Pergunta => ({ id: "recebimento", texto, tipo: "data" });

const FLUXOS: Record<Problema, Pergunta[]> = {
  "nao-chegou": [
    { id: "pagou", texto: "Você já pagou a compra?", tipo: "opcoes", opcoes: SIM_NAO },
    { ...MEIO, visivel: (r) => r.pagou === "sim" },
    {
      id: "prometida",
      texto: "Qual era a data prometida para a entrega?",
      ajuda: "Está no anúncio, no e-mail de confirmação ou no aplicativo.",
      tipo: "data",
      naoSei: "Não sei ou a loja não informou",
    },
    {
      id: "prazoPassou",
      texto: "O prazo de entrega já terminou?",
      tipo: "opcoes",
      opcoes: [
        { valor: "sim", nome: "Sim, já passou" },
        { valor: "nao", nome: "Ainda não" },
        { valor: "sem-prazo", nome: "A loja não informou prazo" },
      ],
      visivel: (r) => r.prometida === "nao-sei",
    },
    {
      id: "novoPrazo",
      texto: "A loja informou um novo prazo?",
      tipo: "opcoes",
      opcoes: SIM_NAO,
      visivel: (r, hoje) => r.pagou !== "nao" && atrasou(r, hoje),
    },
    {
      id: "rastreio",
      texto: "O rastreio mostra o pedido como entregue?",
      tipo: "opcoes",
      opcoes: [
        { valor: "sim", nome: "Sim, mas não recebi" },
        { valor: "nao", nome: "Não" },
        { valor: "sem-rastreio", nome: "Não tenho código de rastreio" },
      ],
      visivel: (r) => r.pagou !== "nao",
    },
    CONTATO,
    MARKETPLACE,
  ],
  defeito: [
    DURABILIDADE,
    recebimento(),
    {
      id: "quando",
      texto: "Quando o defeito apareceu?",
      tipo: "opcoes",
      opcoes: [
        { valor: "logo", nome: "Logo que chegou", dica: "Ou era fácil de ver." },
        { valor: "depois", nome: "Depois de um tempo de uso", dica: "Defeito que só aparece com o uso (vício oculto)." },
      ],
    },
    {
      id: "dataDefeito",
      texto: "Em que dia o defeito apareceu?",
      tipo: "data",
      naoSei: "Não lembro",
      visivel: (r) => r.quando === "depois",
    },
    {
      id: "tentativa",
      texto: "A loja ou o fabricante já tentou resolver?",
      tipo: "opcoes",
      opcoes: [
        { valor: "nao-reclamei", nome: "Ainda não reclamei" },
        { valor: "aguardando", nome: "Reclamei e estou esperando resposta" },
        { valor: "conserto", nome: "Está no conserto há menos de 30 dias" },
        { valor: "passou-30", nome: "Está no conserto há mais de 30 dias, ou voltou sem solução" },
        { valor: "recusou", nome: "A empresa se recusou a resolver" },
      ],
    },
    {
      id: "essencial",
      texto: "O produto é essencial no seu dia a dia?",
      ajuda: "O CDC não lista quais produtos são essenciais: depende do caso.",
      tipo: "opcoes",
      opcoes: SIM_NAO_NAO_SEI,
    },
    MARKETPLACE,
  ],
  diferente: [
    {
      id: "oQue",
      texto: "O que veio diferente?",
      tipo: "opcoes",
      opcoes: [
        { valor: "modelo", nome: "Modelo, cor ou tamanho diferente do pedido" },
        { valor: "caracteristicas", nome: "Qualidade ou características diferentes do anúncio" },
        { valor: "falsificado", nome: "Parece falsificado" },
        { valor: "quantidade", nome: "Veio faltando peças ou quantidade" },
        { valor: "outro-produto", nome: "Veio outro produto" },
      ],
    },
    recebimento(),
    CONTATO,
    MARKETPLACE,
  ],
  desistir: [
    {
      id: "onde",
      texto: "Onde a compra foi feita?",
      tipo: "opcoes",
      opcoes: [
        { valor: "internet", nome: "Pela internet", dica: "Site, aplicativo, marketplace ou rede social." },
        { valor: "telefone", nome: "Por telefone ou mensagem" },
        { valor: "domicilio", nome: "Com vendedor na minha casa ou no trabalho" },
        { valor: "loja", nome: "Dentro da loja física" },
      ],
    },
    {
      id: "tipo",
      texto: "Você comprou um produto ou contratou um serviço?",
      tipo: "opcoes",
      opcoes: [
        { valor: "produto", nome: "Um produto" },
        { valor: "servico", nome: "Um serviço" },
      ],
      visivel: (r) => r.onde !== "loja",
    },
    {
      id: "chegou",
      texto: "O produto já chegou?",
      tipo: "opcoes",
      opcoes: SIM_NAO,
      visivel: (r) => r.onde !== "loja" && r.tipo === "produto",
    },
    { ...recebimento(), visivel: (r) => r.onde !== "loja" && r.tipo === "produto" && r.chegou === "sim" },
    {
      id: "contratacao",
      texto: "Em que dia você contratou o serviço?",
      tipo: "data",
      visivel: (r) => r.onde !== "loja" && r.tipo === "servico",
    },
    {
      id: "especial",
      texto: "O produto é personalizado, feito sob encomenda ou perecível?",
      ajuda: "Por exemplo, com o seu nome gravado, sob medida ou um alimento.",
      tipo: "opcoes",
      opcoes: SIM_NAO,
      visivel: (r) => r.onde !== "loja" && r.tipo === "produto",
    },
    {
      id: "pedido",
      texto: "Você já pediu o cancelamento?",
      tipo: "opcoes",
      opcoes: [
        { valor: "nao", nome: "Ainda não" },
        { valor: "sem-resposta", nome: "Pedi e a loja não respondeu" },
        { valor: "recusado", nome: "Pedi e a loja recusou" },
      ],
      visivel: (r) => r.onde !== "loja",
    },
  ],
  "cancelei-sem-reembolso": [
    {
      id: "motivo",
      texto: "Por que a compra foi cancelada?",
      tipo: "opcoes",
      opcoes: [
        { valor: "arrependimento", nome: "Desisti dentro dos 7 dias" },
        { valor: "loja-cancelou", nome: "A loja cancelou o pedido" },
        { valor: "atraso", nome: "Cancelei porque o produto não chegou" },
        { valor: "defeito", nome: "Cancelei por causa de defeito" },
        { valor: "outro", nome: "Outro motivo" },
      ],
    },
    { id: "dataCancelamento", texto: "Em que dia a compra foi cancelada?", tipo: "data" },
    MEIO,
    {
      id: "naFatura",
      texto: "A compra ainda aparece na fatura do cartão?",
      tipo: "opcoes",
      opcoes: SIM_NAO,
      visivel: (r) => r.meio === "cartao",
    },
    { ...CONTATO, texto: "Você já cobrou a devolução da loja por escrito?" },
  ],
  "loja-nao-troca": [
    {
      id: "motivo",
      texto: "Por que você quer trocar?",
      tipo: "opcoes",
      opcoes: [
        { valor: "defeito", nome: "O produto tem defeito" },
        { valor: "gosto", nome: "Não serviu ou não gostei", dica: "Sem defeito." },
        { valor: "diferente", nome: "Veio diferente do anúncio" },
      ],
    },
    {
      id: "onde",
      texto: "Onde a compra foi feita?",
      tipo: "opcoes",
      opcoes: [
        { valor: "internet", nome: "Pela internet, telefone ou rede social" },
        { valor: "loja", nome: "Dentro da loja física" },
      ],
      visivel: (r) => r.motivo === "gosto",
    },
    {
      id: "anunciou",
      texto: "A loja anunciou que aceitava troca?",
      ajuda: "Na etiqueta, na nota, num cartaz ou no site.",
      tipo: "opcoes",
      opcoes: SIM_NAO_NAO_SEI,
      visivel: (r) => r.motivo === "gosto",
    },
    { ...DURABILIDADE, visivel: (r) => r.motivo === "defeito" },
    recebimento(),
  ],
  "loja-sumiu": [
    MEIO,
    { id: "pagamento", texto: "Em que dia você pagou?", tipo: "data" },
    {
      id: "dados",
      texto: "O site mostrava CNPJ e endereço da loja?",
      tipo: "opcoes",
      opcoes: SIM_NAO_NAO_SEI,
    },
    MARKETPLACE,
  ],
  golpe: [
    MEIO,
    { id: "pagamento", texto: "Em que dia você pagou?", tipo: "data" },
    { id: "avisouBanco", texto: "Você já avisou o seu banco?", tipo: "opcoes", opcoes: SIM_NAO },
  ],
  outro: [],
};

export function perguntasDoFluxo(problema: Problema) {
  return FLUXOS[problema];
}

// Perguntas que fazem sentido com as respostas já dadas, na ordem do fluxo
export function perguntasVisiveis(problema: Problema, respostas: Respostas, hoje: string) {
  const dataDeHoje = lerData(hoje)!;
  return FLUXOS[problema].filter((p) => !p.visivel || p.visivel(respostas, dataDeHoje));
}

// Entrega atrasada: a data prometida já passou, ou a pessoa disse que o prazo terminou
function atrasou(r: Respostas, hoje: Data) {
  const prometida = r.prometida && r.prometida !== "nao-sei" ? lerData(r.prometida) : null;
  return prometida ? compararDatas(hoje, prometida) > 0 : r.prazoPassou === "sim";
}

// Erro da resposta, ou null se vale
export function validarResposta(pergunta: Pergunta, valor: string | undefined, hoje: string): string | null {
  if (!valor) return pergunta.tipo === "data" ? "Informe a data." : "Escolha uma opção.";
  if (pergunta.tipo === "opcoes") return pergunta.opcoes?.some((o) => o.valor === valor) ? null : "Escolha uma opção.";
  if (valor === "nao-sei") return pergunta.naoSei ? null : "Informe a data.";
  const data = lerData(valor);
  const dataDeHoje = lerData(hoje)!;
  if (!data) return "Data inválida.";
  if (data.ano < 2000) return "Confira o ano.";
  // A data prometida pode estar no futuro; as outras, não
  if (pergunta.id !== "prometida" && compararDatas(data, dataDeHoje) > 0) return "A data não pode ser depois de hoje.";
  if (pergunta.id === "prometida" && data.ano > dataDeHoje.ano + 2) return "Confira o ano.";
  return null;
}

// ---------- diagnóstico ----------

export type Item = { id: string; titulo?: string; texto: string; fontes: IdDaFonte[] };
export type Prazo = Item & { ate?: string; passou?: boolean };
export type Link = { id: string; href: string; texto: string };

export type Diagnostico = {
  problema: Problema;
  // Situação em uma palavra, para o Analytics e os testes
  situacao: string;
  titulo: string;
  resumo: string;
  alternativas: Item[];
  prazos: Prazo[];
  documentos: string[];
  plano: string[];
  canais: Item[];
  avisos: Item[];
  links: Link[];
  // Ferramentas ainda não publicadas que caberiam aqui (registro, sem link)
  integracoesFuturas: string[];
};

const dataBr = (d: Data) => formatarData(d);
const ateEm = (inicio: Data, dias: number) => somarDias(inicio, dias);

function prazoAte(id: string, texto: (ate: string) => string, inicio: Data, dias: number, hoje: Data, fontes: IdDaFonte[]): Prazo {
  const ate = ateEm(inicio, dias);
  return {
    id,
    texto: texto(dataBr(ate)),
    ate: `${ate.ano}-${String(ate.mes).padStart(2, "0")}-${String(ate.dia).padStart(2, "0")}`,
    passou: compararDatas(hoje, ate) > 0,
    fontes,
  };
}

const ALT = {
  cumprimento: {
    id: "exigir-cumprimento",
    titulo: "Exigir o cumprimento da oferta",
    texto: "Pedir o que foi anunciado: a entrega do produto, nas condições do anúncio.",
    fontes: ["cdc"],
  },
  equivalente: {
    id: "aceitar-equivalente",
    titulo: "Aceitar outro produto equivalente",
    texto: "Se você quiser, pode aceitar outro produto ou serviço equivalente. É escolha sua, não da loja.",
    fontes: ["cdc"],
  },
  rescindir: {
    id: "cancelar-com-reembolso",
    titulo: "Cancelar e receber o dinheiro de volta",
    texto:
      "Cancelar a compra com a devolução do que você pagou, inclusive o frete, com correção, e direito a perdas e danos (CDC, artigo 35, III).",
    fontes: ["cdc"],
  },
  arrependimento: {
    id: "arrependimento",
    titulo: "Desistir em até 7 dias",
    texto:
      "Na compra feita fora da loja, dá para desistir em até 7 dias do recebimento, sem dar motivo, com a devolução imediata de tudo o que pagou, inclusive os fretes (CDC, artigo 49).",
    fontes: ["cdc", "proconSpGuia"],
  },
  conserto: {
    id: "conserto-30-dias",
    titulo: "Pedir o conserto em até 30 dias",
    texto: "A loja e o fabricante respondem juntos e têm até 30 dias para consertar (CDC, artigo 18, § 1º).",
    fontes: ["cdc"],
  },
  escolhaDoArt18: {
    id: "troca-reembolso-abatimento",
    titulo: "Escolher troca, dinheiro de volta ou abatimento",
    texto:
      "Sem conserto em 30 dias, você escolhe: troca por outro igual em perfeito estado, devolução do dinheiro com correção ou abatimento proporcional do preço (CDC, artigo 18, § 1º).",
    fontes: ["cdc"],
  },
} satisfies Record<string, Item>;

const DOCUMENTOS_DA_COMPRA = [
  "comprovante de pagamento (extrato, fatura ou comprovante do Pix);",
  "confirmação do pedido e nota fiscal, se houver;",
  "print do anúncio, com preço, prazo e características;",
  "conversas e protocolos com a loja.",
];

function canais(r: Respostas, extra: Item[] = []): Item[] {
  const lista: Item[] = [
    {
      id: "loja",
      titulo: "A loja",
      texto: `Pelo canal de atendimento do site ou do app. No comércio eletrônico, a loja deve confirmar o recebimento do pedido e responder em até ${R.respostaDaLojaDias} dias (Decreto 7.962/2013, artigo 4º).`,
      fontes: ["decreto7962"],
    },
  ];
  if (r.marketplace === "sim")
    lista.push({
      id: "plataforma",
      titulo: "A plataforma",
      texto:
        "Abra a reclamação pelo próprio aplicativo, dentro do prazo de proteção da plataforma. Para o Procon-SP, as plataformas fazem parte da cadeia de fornecimento e respondem junto com o vendedor.",
      fontes: ["proconSpMarketplace"],
    });
  lista.push(...extra);
  lista.push(
    {
      id: "consumidor-gov",
      titulo: "Consumidor.gov.br",
      texto: `Serviço público e gratuito do governo federal; a empresa cadastrada tem até ${R.consumidorGovRespostaDias} dias para responder.`,
      fontes: ["consumidorGov"],
    },
    { id: "procon", titulo: "Procon", texto: "O Procon do seu estado ou da sua cidade, também gratuito.", fontes: [] },
    {
      id: "juizado",
      titulo: "Juizado Especial Cível",
      texto: "Causas de até 20 salários mínimos podem ser levadas sem advogado (Lei 9.099/1995). A Defensoria Pública ajuda quem não pode pagar advogado.",
      fontes: ["juizados"],
    },
  );
  return lista;
}

const CANAL_CARTAO: Item = {
  id: "cartao",
  titulo: "O banco do cartão",
  texto: "Se pagou no cartão e a loja não resolve, conteste a compra no banco, com os protocolos da reclamação.",
  fontes: [],
};

function plano(r: Respostas, especificos: string[]) {
  return [
    "Reúna os comprovantes da compra e prints do anúncio.",
    ...especificos,
    r.contato === "sim"
      ? "Você já reclamou: guarde os protocolos e, sem solução no prazo, passe ao próximo canal."
      : "Reclame com a loja por escrito, dizendo o que você quer, e guarde o protocolo.",
    "Sem solução, use os canais oficiais abaixo, na ordem.",
  ];
}

const AVISO_MARKETPLACE: Item = {
  id: "marketplace",
  texto:
    "Na compra em marketplace, reclame também pela plataforma: para o Procon-SP, ela responde junto com o vendedor por falhas na venda.",
  fontes: ["proconSpMarketplace"],
};

function dataDa(r: Respostas, id: string) {
  const valor = r[id];
  return valor && valor !== "nao-sei" ? lerData(valor) : null;
}

function prazoDoArrependimento(inicio: Data, hoje: Data) {
  return prazoAte(
    "arrependimento",
    (ate) => `Desistência sem motivo: até ${ate} (7 dias corridos a partir do dia seguinte).`,
    inicio,
    R.arrependimentoDias,
    hoje,
    ["cdc", "proconSpGuia"],
  );
}

function prazoDeReclamacao(durabilidade: string | undefined, inicio: Data, hoje: Data, oculto: boolean) {
  const dias = durabilidade === "duravel" ? R.reclamacaoDuravelDias : R.reclamacaoNaoDuravelDias;
  const tipo =
    durabilidade === "duravel"
      ? "produto durável"
      : durabilidade === "nao-duravel"
        ? "produto não durável"
        : "na dúvida, contamos o prazo menor, de produto não durável";
  return prazoAte(
    "reclamacao",
    (ate) =>
      `Reclamar do defeito: até ${ate} (${dias} dias, ${tipo}, contados ${oculto ? "de quando o defeito apareceu" : "da entrega"}). A reclamação comprovada à loja suspende esse prazo até a resposta negativa.`,
    inicio,
    dias,
    hoje,
    ["cdc"],
  );
}

function diagnosticoNaoChegou(r: Respostas, hoje: Data): Diagnostico {
  const prometida = dataDa(r, "prometida");
  const naoPagou = r.pagou === "nao";
  const venceu = prometida ? compararDatas(hoje, prometida) > 0 : r.prazoPassou === "sim";
  const semPrazo = !prometida && r.prazoPassou === "sem-prazo";
  const prazos: Prazo[] = [];
  const avisos: Item[] = [];
  let situacao: string;
  let titulo: string;
  let resumo: string;
  let alternativas: Item[];

  if (naoPagou) {
    situacao = "sem-pagamento";
    titulo = "Você ainda não pagou: dá para cancelar sem custo";
    resumo =
      "Sem pagamento, não há valor a devolver. Se a loja não confirma a entrega, você pode cancelar o pedido e não pagar. Se o boleto ou o Pix ainda estiverem em aberto, confira se a loja é confiável antes de pagar.";
    alternativas = [ALT.cumprimento, { ...ALT.rescindir, texto: "Cancelar o pedido. Como você não pagou, não há o que devolver." }];
  } else if (prometida && !venceu) {
    situacao = "no-prazo";
    titulo = "A entrega ainda está no prazo";
    resumo = `A loja prometeu entregar até ${dataBr(prometida)}. O prazo anunciado faz parte do contrato e obriga a loja (CDC, artigo 30). Até lá, acompanhe o rastreio; se passar do dia sem entrega, você pode exigir a entrega, aceitar outro produto ou cancelar com o dinheiro de volta.`;
    alternativas = [ALT.cumprimento];
    prazos.push({ id: "entrega", texto: `Entrega prometida: ${dataBr(prometida)}.`, ate: r.prometida, passou: false, fontes: ["cdc", "decreto7962"] });
  } else if (!prometida && r.prazoPassou === "nao") {
    situacao = "no-prazo";
    titulo = "A entrega ainda está no prazo";
    resumo =
      "O prazo anunciado faz parte do contrato e obriga a loja (CDC, artigo 30). Até ele terminar, acompanhe o rastreio. Depois, sem entrega, você pode exigir a entrega, aceitar outro produto ou cancelar com o dinheiro de volta.";
    alternativas = [ALT.cumprimento];
  } else if (semPrazo) {
    situacao = "sem-prazo";
    titulo = "A loja não informou o prazo de entrega";
    resumo =
      "A loja tem de informar o prazo de entrega antes da compra (Decreto 7.962/2013, artigo 2º), e deixar de fixar prazo é prática abusiva (CDC, artigo 39, XII). Peça por escrito a data de entrega. Se ela não cumprir a oferta, valem as três opções do artigo 35 do CDC.";
    alternativas = [ALT.cumprimento, ALT.equivalente, ALT.rescindir];
  } else {
    situacao = "atrasado";
    titulo = "Seu produto não chegou no prazo combinado";
    resumo =
      "Com base nas suas respostas, pode haver descumprimento da oferta. Nesse caso, o CDC deixa você escolher entre três caminhos (artigo 35). O Procon-SP considera a não entrega descumprimento de oferta e diz que o cancelamento, nesse caso, é imediato à solicitação.";
    alternativas = [ALT.cumprimento, ALT.equivalente, ALT.rescindir];
    if (r.novoPrazo === "sim")
      avisos.push({
        id: "novo-prazo",
        texto: "A loja informou um novo prazo: aceitar é uma escolha sua. Se aceitar, peça a nova data por escrito; se não, você pode cancelar com o dinheiro de volta.",
        fontes: ["cdc", "proconSpInternet"],
      });
  }
  if (!naoPagou && r.rastreio === "sim")
    avisos.push({
      id: "consta-entregue",
      texto:
        "O rastreio diz entregue, mas você não recebeu: procure na portaria e com vizinhos, confira o endereço e reclame com a loja no mesmo dia, pedindo a prova da entrega (quem recebeu, assinatura ou foto). A loja responde pela entrega, mesmo feita pelos Correios ou por transportadora (CDC, artigos 7º e 25).",
      fontes: ["cdc"],
    });
  if (!naoPagou && r.rastreio === "sem-rastreio")
    avisos.push({ id: "sem-rastreio", texto: "Peça o código de rastreio à loja, por escrito.", fontes: [] });
  if (r.marketplace === "sim") avisos.push(AVISO_MARKETPLACE);

  const extra = r.meio === "cartao" ? [CANAL_CARTAO] : [];
  if (r.meio === "pix" || r.meio === "boleto")
    avisos.push({
      id: "suspeita-golpe",
      texto:
        "Se a loja sumiu ou parece falsa, trate como possível golpe: avise o banco na hora e registre boletim de ocorrência. No Pix, a contestação no app do banco aciona o MED.",
      fontes: ["guiaMed"],
    });

  return {
    problema: "nao-chegou",
    situacao,
    titulo,
    resumo,
    alternativas,
    prazos: [
      ...prazos,
      {
        id: "resposta-loja",
        texto: `A loja deve responder à reclamação em até ${R.respostaDaLojaDias} dias (Decreto 7.962/2013, artigo 4º).`,
        fontes: ["decreto7962"],
      },
    ],
    documentos: [...DOCUMENTOS_DA_COMPRA, "a previsão de entrega e o rastreio."],
    plano: plano(r, ["Guarde a previsão de entrega e prints do rastreio."]),
    canais: canais(r, extra),
    avisos,
    links: [
      { id: "artigo-nao-chegou", href: "/artigos/compra-nao-chegou", texto: "Comprei e não chegou: o que fazer" },
      ...(r.meio === "cartao"
        ? [{ id: "artigo-estorno", href: "/artigos/estorno-cartao-de-credito", texto: "Como contestar a compra no cartão" }]
        : []),
    ],
    integracoesFuturas: ["gerador-de-reclamacao"],
  };
}

function diagnosticoDefeito(r: Respostas, hoje: Data): Diagnostico {
  const chegou = dataDa(r, "recebimento")!;
  const oculto = r.quando === "depois";
  const dataDoDefeito = oculto ? dataDa(r, "dataDefeito") : null;
  const inicio = oculto ? dataDoDefeito : chegou;
  const avisos: Item[] = [];
  const prazos: Prazo[] = [];

  const arrependimento = prazoDoArrependimento(chegou, hoje);
  if (!arrependimento.passou) prazos.push(arrependimento);

  let reclamacaoPassou = false;
  if (inicio) {
    const p = prazoDeReclamacao(r.durabilidade, inicio, hoje, oculto);
    reclamacaoPassou = !!p.passou && r.tentativa === "nao-reclamei";
    prazos.push(p);
  } else
    avisos.push({
      id: "data-do-defeito",
      texto:
        "Sem a data em que o defeito apareceu, não dá para calcular o prazo. No defeito que só aparece com o uso, os 30 ou 90 dias contam de quando ele aparece (CDC, artigo 26, § 3º): reclame logo.",
      fontes: ["cdc"],
    });

  const alternativas: Item[] = [];
  if (!arrependimento.passou) alternativas.push(ALT.arrependimento);
  const imediato = r.essencial === "sim";
  const venceu30 = r.tentativa === "passou-30" || r.tentativa === "recusou";
  if (venceu30 || imediato) alternativas.push(ALT.escolhaDoArt18);
  else alternativas.push(ALT.conserto, ALT.escolhaDoArt18);
  if (imediato)
    avisos.push({
      id: "essencial",
      texto:
        "Em produto essencial, ou quando trocar a peça puder comprometer o produto ou diminuir seu valor, você pode pedir a troca, o dinheiro de volta ou o abatimento sem esperar os 30 dias (CDC, artigo 18, § 3º). O CDC não lista os produtos essenciais: se a loja discordar, procure o Procon.",
      fontes: ["cdc"],
    });
  if (reclamacaoPassou)
    avisos.push({
      id: "prazo-passou",
      texto:
        "Pelo que você informou, o prazo para reclamar pode ter passado. Ainda assim, o STJ entende que o fornecedor pode responder por defeito oculto dentro da vida útil do produto, sem prova de mau uso. Não conclua sozinho: procure o Procon ou a Defensoria Pública.",
      fontes: ["stjVicioOculto"],
    });
  if (r.marketplace === "sim") avisos.push(AVISO_MARKETPLACE);

  const situacao = !arrependimento.passou ? "dentro-dos-7-dias" : venceu30 || imediato ? "pode-escolher" : reclamacaoPassou ? "prazo-a-verificar" : "conserto";
  const titulo =
    situacao === "dentro-dos-7-dias"
      ? "Produto com defeito: você ainda está nos 7 dias"
      : situacao === "pode-escolher"
        ? "Produto com defeito: você pode escolher a solução"
        : situacao === "prazo-a-verificar"
          ? "Produto com defeito: confira o prazo"
          : "Produto com defeito: a empresa tem 30 dias para consertar";
  const resumo =
    situacao === "dentro-dos-7-dias"
      ? "Como a compra foi pela internet e o produto chegou há menos de 7 dias, você pode simplesmente desistir e receber tudo de volta. Se preferir ficar com o produto, vale a garantia contra defeitos: a loja e o fabricante têm 30 dias para consertar."
      : situacao === "pode-escolher"
        ? "Com base nas suas respostas, você não precisa mais esperar o conserto: pode escolher entre a troca, o dinheiro de volta ou o abatimento no preço (CDC, artigo 18)."
        : "A loja e o fabricante respondem juntos pelo defeito. Primeiro, eles têm até 30 dias para consertar; sem solução nesse prazo, você escolhe entre troca, dinheiro de volta ou abatimento (CDC, artigo 18).";

  return {
    problema: "defeito",
    situacao,
    titulo,
    resumo,
    alternativas,
    prazos,
    documentos: [...DOCUMENTOS_DA_COMPRA, "fotos ou vídeo do defeito;", "a ordem de serviço, com a data de entrada no conserto."],
    plano: plano(r, ["Fotografe ou filme o defeito.", "Se mandar para o conserto, peça a ordem de serviço com a data."]),
    canais: canais(r),
    avisos,
    links: [
      { id: "artigo-defeito", href: "/artigos/produto-com-defeito", texto: "Produto com defeito: prazos e garantia" },
      ...(!arrependimento.passou
        ? [{ id: "artigo-arrependimento", href: "/artigos/direito-de-arrependimento", texto: "Direito de arrependimento: como desistir" }]
        : []),
    ],
    integracoesFuturas: ["gerador-de-reclamacao"],
  };
}

function diagnosticoDiferente(r: Respostas, hoje: Data): Diagnostico {
  const chegou = dataDa(r, "recebimento")!;
  const arrependimento = prazoDoArrependimento(chegou, hoje);
  const avisos: Item[] = [];
  if (r.oQue === "falsificado")
    avisos.push({
      id: "falsificado",
      texto: "Produto falsificado é impróprio para o consumo pelo CDC (artigo 18, § 6º, II). Guarde o produto e as fotos; se houver indício de crime, registre boletim de ocorrência.",
      fontes: ["cdc"],
    });
  if (r.oQue === "quantidade")
    avisos.push({
      id: "quantidade",
      texto: "Faltando quantidade ou peças, você pode pedir a complementação, o abatimento, a troca ou o dinheiro de volta (CDC, artigo 19).",
      fontes: ["cdc"],
    });
  if (r.marketplace === "sim") avisos.push(AVISO_MARKETPLACE);
  const prazos: Prazo[] = [];
  if (!arrependimento.passou) prazos.push(arrependimento);
  prazos.push(
    prazoAte(
      "reclamacao",
      (ate) =>
        `Reclamar da diferença: a partir da entrega, 30 dias para produto não durável e 90 para durável (CDC, artigo 26). Pelo prazo menor, até ${ate}.`,
      chegou,
      R.reclamacaoNaoDuravelDias,
      hoje,
      ["cdc"],
    ),
  );
  return {
    problema: "diferente",
    situacao: arrependimento.passou ? "oferta" : "dentro-dos-7-dias",
    titulo: "O produto veio diferente do anunciado",
    resumo:
      "O anúncio obriga a loja e faz parte do contrato (CDC, artigo 30). Produto diferente do que foi anunciado ou pedido é descumprimento da oferta, e a diferença em relação à embalagem ou à publicidade também é vício do produto (artigo 18). Você pode exigir o produto certo, aceitar outro equivalente ou cancelar com o dinheiro de volta.",
    alternativas: [
      ...(!arrependimento.passou ? [ALT.arrependimento] : []),
      { ...ALT.cumprimento, texto: "Pedir o produto que você comprou, nas condições do anúncio, sem custo de troca." },
      ALT.equivalente,
      ALT.rescindir,
    ],
    prazos,
    documentos: [...DOCUMENTOS_DA_COMPRA, "fotos do que chegou, ao lado da embalagem e da etiqueta."],
    plano: plano(r, ["Fotografe o produto recebido e compare com o anúncio.", "Não descarte a embalagem até resolver."]),
    canais: canais(r),
    avisos,
    links: [
      { id: "artigo-propaganda", href: "/artigos/propaganda-enganosa", texto: "Propaganda enganosa: o que fazer" },
      { id: "artigo-arrependimento", href: "/artigos/direito-de-arrependimento", texto: "Direito de arrependimento" },
    ],
    integracoesFuturas: ["gerador-de-reclamacao"],
  };
}

function diagnosticoDesistir(r: Respostas, hoje: Data): Diagnostico {
  const links: Link[] = [{ id: "artigo-arrependimento", href: "/artigos/direito-de-arrependimento", texto: "Direito de arrependimento: passo a passo" }];
  if (r.onde === "loja")
    return {
      problema: "desistir",
      situacao: "loja-fisica",
      titulo: "Na loja física, a lei não garante a desistência",
      resumo:
        "O prazo de 7 dias do CDC vale só para compras feitas fora da loja, como pela internet, por telefone ou em casa (artigo 49). Na compra feita dentro da loja, desistir depende da política da loja, que passa a valer se foi anunciada. Se o produto tiver defeito, a garantia vale sempre.",
      alternativas: [
        {
          id: "politica-da-loja",
          titulo: "Pedir a troca ou devolução pela política da loja",
          texto: "Se a loja anunciou que aceita troca ou devolução, a promessa obriga (CDC, artigo 30).",
          fontes: ["cdc"],
        },
      ],
      prazos: [],
      documentos: ["nota fiscal ou comprovante;", "etiqueta e embalagem, se ainda tiver."],
      plano: ["Pergunte à loja a política de troca e devolução.", "Se houver defeito, reclame pela garantia (30 ou 90 dias)."],
      canais: canais(r).filter((c) => c.id !== "loja"),
      avisos: [],
      links: [...links, { id: "artigo-troca", href: "/artigos/loja-e-obrigada-a-trocar-produto", texto: "A loja é obrigada a trocar?" }],
      integracoesFuturas: [],
    };

  const naoChegou = r.tipo === "produto" && r.chegou === "nao";
  const inicio = r.tipo === "servico" ? dataDa(r, "contratacao") : naoChegou ? null : dataDa(r, "recebimento");
  const prazo = inicio ? prazoDoArrependimento(inicio, hoje) : null;
  const avisos: Item[] = [];
  if (r.especial === "sim")
    avisos.push({
      id: "especial",
      texto:
        "Produto personalizado, sob encomenda ou perecível: o Procon-SC entende que, nesses casos, o arrependimento pode não se aplicar. Isso não está escrito na lei e pode ser discutido caso a caso; não tome como resposta definitiva.",
      fontes: ["proconScArrependimento"],
    });
  if (r.pedido === "recusado" || r.pedido === "sem-resposta")
    avisos.push({
      id: "recusa",
      texto: "Peça a recusa por escrito. Dentro dos 7 dias, numa compra feita fora da loja, a loja não pode recusar nem exigir a embalagem lacrada.",
      fontes: ["proconSpGuia"],
    });

  const dentro = naoChegou || (prazo && !prazo.passou);
  return {
    problema: "desistir",
    situacao: naoChegou ? "antes-de-chegar" : dentro ? "dentro-dos-7-dias" : "fora-dos-7-dias",
    titulo: dentro ? "Você pode desistir da compra" : "O prazo de 7 dias para desistir já passou",
    resumo: naoChegou
      ? "O prazo de 7 dias conta do recebimento, então você ainda pode desistir. Peça o cancelamento por escrito agora; se o produto chegar, recuse ou devolva sem custo."
      : dentro
        ? `Na compra feita fora da loja, você pode desistir em até 7 dias ${r.tipo === "servico" ? "da contratação" : "do recebimento"}, sem dar motivo e sem pagar nada, com a devolução imediata do que pagou, corrigido (CDC, artigo 49).`
        : "Pelo artigo 49 do CDC, a desistência sem motivo vale por 7 dias. Depois disso, a devolução depende da política da loja, salvo se houver defeito ou se o produto for diferente do anunciado: aí valem a garantia e a oferta.",
    alternativas: dentro
      ? [
          ALT.arrependimento,
          {
            id: "estorno-cartao",
            titulo: "No cartão, a compra deve ser estornada",
            texto: "A loja deve avisar a administradora do cartão para não lançar a compra ou estornar o valor (Decreto 7.962/2013, artigo 5º, § 3º). A desistência também cancela garantia estendida ou seguro contratados junto, sem custo.",
            fontes: ["decreto7962"],
          },
        ]
      : [
          {
            id: "politica-da-loja",
            titulo: "Pedir a devolução pela política da loja",
            texto: "Se a loja anunciou prazo maior para devolução, a promessa obriga (CDC, artigo 30).",
            fontes: ["cdc"],
          },
          {
            id: "defeito-ou-oferta",
            titulo: "Se houver defeito ou diferença do anúncio",
            texto: "Aí valem a garantia de 30 ou 90 dias e as regras da oferta, que não dependem dos 7 dias.",
            fontes: ["cdc"],
          },
        ],
    prazos: prazo ? [prazo] : [],
    documentos: [...DOCUMENTOS_DA_COMPRA, "o pedido de cancelamento, com data e protocolo."],
    plano: [
      "Reúna os comprovantes da compra.",
      dentro
        ? "Peça o cancelamento pelo mesmo canal em que comprou, dentro do prazo, e guarde a confirmação (a loja deve confirmar na hora)."
        : "Pergunte à loja a política de devolução, por escrito.",
      "Devolva o produto como recebeu; o frete da devolução por arrependimento é da loja.",
      "Confira o estorno nas próximas faturas ou no extrato.",
      "Sem solução, use os canais oficiais abaixo.",
    ],
    canais: canais(r),
    avisos,
    links,
    integracoesFuturas: ["gerador-de-reclamacao"],
  };
}

function diagnosticoCancelei(r: Respostas, hoje: Data): Diagnostico {
  const cancelamento = dataDa(r, "dataCancelamento")!;
  const dias = numeroDoDia(hoje) - numeroDoDia(cancelamento);
  const fundamento: Item =
    r.motivo === "arrependimento"
      ? {
          id: "devolucao-imediata",
          titulo: "Devolução imediata",
          texto: "Na desistência em 7 dias, o que você pagou deve ser devolvido de imediato, com correção (CDC, artigo 49, parágrafo único). A lei federal não fixa um número de dias.",
          fontes: ["cdc"],
        }
      : r.motivo === "defeito"
        ? {
            id: "devolucao-defeito",
            titulo: "Restituição imediata",
            texto: "Quando você escolhe o dinheiro de volta por defeito não consertado, a restituição é imediata e corrigida (CDC, artigo 18, § 1º, II).",
            fontes: ["cdc"],
          }
        : {
            id: "devolucao-oferta",
            titulo: "Restituição do que foi pago",
            texto: "Se a loja não cumpriu a oferta, o cancelamento dá direito à devolução do que foi pago, com correção, e a perdas e danos (CDC, artigo 35, III).",
            fontes: ["cdc"],
          };
  const alternativas: Item[] = [fundamento];
  const extra: Item[] = [];
  if (r.meio === "cartao") {
    alternativas.push({
      id: "estorno-cartao",
      titulo: "Estorno no cartão",
      texto: "Na desistência, a loja deve pedir à administradora que a compra não seja lançada ou seja estornada (Decreto 7.962/2013, artigo 5º, § 3º). Se a compra continua na fatura, conteste no banco com o protocolo do cancelamento.",
      fontes: ["decreto7962"],
    });
    extra.push(CANAL_CARTAO);
  }
  const avisos: Item[] = [];
  if (r.naFatura === "sim")
    avisos.push({
      id: "cobranca-depois-do-cancelamento",
      texto: "Se você pagou uma fatura com a compra já cancelada, isso pode ser cobrança indevida, com direito à devolução, que em alguns casos é em dobro.",
      fontes: ["cdc"],
    });
  if (r.meio === "pix" || r.meio === "boleto")
    avisos.push({
      id: "pix-boleto",
      texto: "No Pix e no boleto, a devolução depende da loja: peça por escrito, com os dados da conta. O MED do Pix é só para golpe ou fraude, não para cancelamento comum.",
      fontes: ["guiaMed"],
    });
  return {
    problema: "cancelei-sem-reembolso",
    situacao: dias > R.respostaDaLojaDias ? "atrasado" : "recente",
    titulo: "Compra cancelada: o dinheiro tem de voltar",
    resumo: `A compra foi cancelada há ${dias} ${dias === 1 ? "dia" : "dias"}. Cancelada a compra, o que você pagou deve ser devolvido, com correção. Cobre a loja por escrito; ela deve responder em até ${R.respostaDaLojaDias} dias no comércio eletrônico.`,
    alternativas,
    prazos: [
      {
        id: "resposta-loja",
        texto: `A loja deve responder à reclamação em até ${R.respostaDaLojaDias} dias (Decreto 7.962/2013, artigo 4º).`,
        fontes: ["decreto7962"],
      },
    ],
    documentos: [...DOCUMENTOS_DA_COMPRA, "o comprovante do cancelamento;", "faturas ou extratos depois do cancelamento."],
    plano: plano(r, ["Guarde o comprovante do cancelamento e confira as próximas faturas."]),
    canais: canais(r, extra),
    avisos,
    links: [
      ...(r.naFatura === "sim" || r.meio === "cartao"
        ? [{ id: "calculadora-cobranca", href: "/calculadoras/cobranca-indevida", texto: "Calculadora de cobrança indevida" }]
        : []),
      ...(r.meio === "cartao" ? [{ id: "artigo-estorno", href: "/artigos/estorno-cartao-de-credito", texto: "Estorno no cartão de crédito" }] : []),
      ...(r.motivo === "loja-cancelou"
        ? [{ id: "artigo-loja-cancelou", href: "/artigos/loja-cancelou-pedido", texto: "A loja cancelou o pedido: o que fazer" }]
        : []),
    ],
    integracoesFuturas: ["gerador-de-reclamacao"],
  };
}

function diagnosticoNaoTroca(r: Respostas, hoje: Data): Diagnostico {
  if (r.motivo === "defeito") {
    const d = diagnosticoDefeito({ ...r, quando: "logo", tentativa: "aguardando" }, hoje);
    return {
      ...d,
      problema: "loja-nao-troca",
      situacao: `defeito-${d.situacao}`,
      titulo: "Defeito: a loja pode consertar antes de trocar",
      resumo:
        "Com defeito, a loja e o fabricante respondem juntos, mas a lei permite que eles consertem primeiro, em até 30 dias. A troca na hora só é obrigatória em produto essencial ou quando trocar a peça puder comprometer o produto. Sem conserto em 30 dias, ou se a empresa se recusar a resolver, você escolhe a troca, o dinheiro de volta ou o abatimento (CDC, artigo 18).",
    };
  }
  if (r.motivo === "diferente") return { ...diagnosticoDiferente(r, hoje), problema: "loja-nao-troca" };

  const chegou = dataDa(r, "recebimento")!;
  const online = r.onde === "internet";
  const prazo = online ? prazoDoArrependimento(chegou, hoje) : null;
  const dentro = !!prazo && !prazo.passou;
  const anunciou = r.anunciou === "sim";
  return {
    problema: "loja-nao-troca",
    situacao: dentro ? "dentro-dos-7-dias" : anunciou ? "troca-anunciada" : "sem-obrigacao",
    titulo: dentro
      ? "Você pode devolver a compra em até 7 dias"
      : anunciou
        ? "A loja prometeu a troca: a promessa obriga"
        : "Sem defeito, a troca depende da loja",
    resumo: dentro
      ? "Na compra pela internet, você pode desistir em até 7 dias do recebimento, sem motivo, e receber o dinheiro de volta (CDC, artigo 49). A lei garante a devolução, não a troca por outro tamanho ou cor; se a loja oferecer a troca, é opção sua."
      : anunciou
        ? "Sem defeito, a lei não obriga a troca. Mas, se a loja anunciou que aceita troca, a oferta obriga e integra o contrato (CDC, artigo 30), nas condições que ela anunciou."
        : "Sem defeito, a lei não obriga a loja a trocar um produto que não serviu ou não agradou, fora do prazo de 7 dias das compras a distância. A troca vira obrigação quando a loja a anuncia.",
    alternativas: dentro
      ? [ALT.arrependimento]
      : [
          {
            id: "politica-da-loja",
            titulo: anunciou ? "Cobrar a troca prometida" : "Negociar com a loja",
            texto: anunciou
              ? "Mostre onde a loja anunciou a troca (etiqueta, nota, site) e peça por escrito."
              : "Pergunte se a loja tem política de troca; muitas aceitam como cortesia, nas condições delas.",
            fontes: ["cdc"],
          },
        ],
    prazos: prazo ? [prazo] : [],
    documentos: ["nota fiscal ou comprovante;", "etiqueta e embalagem;", "print ou foto da política de troca anunciada, se houver."],
    plano: plano(r, ["Leve ou guarde o produto como recebeu, com a etiqueta."]),
    canais: canais(r),
    avisos: [],
    links: [{ id: "artigo-troca", href: "/artigos/loja-e-obrigada-a-trocar-produto", texto: "A loja é obrigada a trocar o produto?" }],
    integracoesFuturas: [],
  };
}

function prazoDoMed(pagamento: Data, hoje: Data) {
  return prazoAte(
    "med",
    (ate) => `Contestar o Pix no banco (MED): até ${ate} (80 dias do Pix). Não espere: quanto antes, mais chance de o dinheiro ainda estar na conta.`,
    pagamento,
    R.medDias,
    hoje,
    ["guiaMed"],
  );
}

function diagnosticoLojaSumiu(r: Respostas, hoje: Data): Diagnostico {
  const pagamento = dataDa(r, "pagamento")!;
  const prazos: Prazo[] = [];
  const avisos: Item[] = [];
  const extra: Item[] = [];
  if (r.meio === "pix") prazos.push(prazoDoMed(pagamento, hoje));
  if (r.meio === "cartao") extra.push(CANAL_CARTAO);
  if (r.dados === "nao")
    avisos.push({
      id: "sem-dados",
      texto: "O site é obrigado a mostrar, em destaque, o nome empresarial, o CNPJ (ou CPF) e o endereço (Decreto 7.962/2013, artigo 2º). Sem esses dados, há risco de golpe.",
      fontes: ["decreto7962"],
    });
  if (r.marketplace === "sim") avisos.push(AVISO_MARKETPLACE);
  return {
    problema: "loja-sumiu",
    situacao: r.marketplace === "sim" ? "marketplace" : r.meio ?? "outro",
    titulo: "A loja sumiu ou não responde",
    resumo:
      "Pode ser só falha de atendimento ou pode ter sido golpe. A loja deve responder em até 5 dias no comércio eletrônico. Se ela não responder, o caminho depende de como você pagou: no cartão, conteste no banco; no Pix, se houver indício de golpe, peça o MED; e registre boletim de ocorrência quando houver indício de crime.",
    alternativas: [
      ALT.cumprimento,
      ALT.rescindir,
      ...(r.meio === "pix"
        ? [
            {
              id: "med",
              titulo: "Pedir a devolução pelo MED do Pix",
              texto: "Se foi golpe, conteste a transação no app do banco: o MED bloqueia o valor na conta de quem recebeu, e os bancos analisam em até 7 dias.",
              fontes: ["guiaMed"] as IdDaFonte[],
            },
          ]
        : []),
    ],
    prazos: [
      ...prazos,
      { id: "resposta-loja", texto: `A loja deve responder em até ${R.respostaDaLojaDias} dias (Decreto 7.962/2013, artigo 4º).`, fontes: ["decreto7962"] },
    ],
    documentos: [...DOCUMENTOS_DA_COMPRA, "prints do site ou do perfil da loja, com o endereço da página."],
    plano: [
      "Reúna os comprovantes e faça prints do site ou do perfil, antes que saiam do ar.",
      "Tente contato por escrito em todos os canais da loja e guarde as tentativas.",
      r.meio === "pix" ? "Se suspeitar de golpe, conteste o Pix no app do banco agora." : r.meio === "cartao" ? "Conteste a compra no banco do cartão." : "Avise o seu banco.",
      "Registre boletim de ocorrência se houver indício de golpe.",
      "Reclame no Consumidor.gov.br ou no Procon e consulte a lista Evite esses sites do Procon-SP.",
    ],
    canais: canais(r, extra),
    avisos,
    links: [
      { id: "artigo-nao-chegou", href: "/artigos/compra-nao-chegou", texto: "Comprei e não chegou: a loja sumiu" },
      ...(r.meio === "pix" ? [{ id: "artigo-golpe-pix", href: "/artigos/golpe-pix-como-recuperar-dinheiro", texto: "Caí no golpe do Pix: como recuperar" }] : []),
      ...(r.meio === "cartao" ? [{ id: "artigo-estorno", href: "/artigos/estorno-cartao-de-credito", texto: "Como contestar a compra no cartão" }] : []),
    ],
    integracoesFuturas: ["gerador-de-reclamacao", ...(r.meio === "pix" ? ["simulador-golpe-pix"] : [])],
  };
}

function diagnosticoGolpe(r: Respostas, hoje: Data): Diagnostico {
  const pagamento = dataDa(r, "pagamento")!;
  const prazos: Prazo[] = [];
  const alternativas: Item[] = [];
  if (r.meio === "pix") {
    prazos.push(prazoDoMed(pagamento, hoje));
    alternativas.push({
      id: "med",
      titulo: "Contestar o Pix e pedir o MED",
      texto:
        "No app do banco, conteste a transação (\"contestar\", \"relatar golpe\" ou \"MED\"). O banco de quem recebeu bloqueia o valor; os bancos analisam em até 7 dias e, confirmada a fraude, devolvem o que houver na conta. O banco não pode exigir boletim de ocorrência antes de abrir o pedido.",
      fontes: ["guiaMed"],
    });
  } else if (r.meio === "cartao")
    alternativas.push({
      id: "contestar-cartao",
      titulo: "Contestar a compra no cartão",
      texto: "Avise o banco, peça o bloqueio do cartão se os dados foram expostos e conteste a compra, com os prints do golpe.",
      fontes: [],
    });
  else
    alternativas.push({
      id: "avisar-banco",
      titulo: "Avisar o banco agora",
      texto: "No boleto e em outros meios não há o MED do Pix. Avise o banco assim mesmo, com os comprovantes, e registre boletim de ocorrência.",
      fontes: [],
    });
  alternativas.push({
    id: "boletim",
    titulo: "Registrar boletim de ocorrência",
    texto: "Em vários estados, dá para fazer pela internet, na delegacia virtual. Ele formaliza a denúncia e serve de prova.",
    fontes: [],
  });
  const avisos: Item[] =
    r.avisouBanco === "nao"
      ? [{ id: "avise-agora", texto: "Avise o banco agora: o golpista costuma passar o dinheiro adiante em minutos.", fontes: ["guiaMed"] }]
      : [];
  const med = prazos[0];
  if (med?.passou)
    avisos.push({
      id: "med-passou",
      texto: "Pela data informada, o prazo de 80 dias do MED já passou. Ainda assim, avise o banco, registre boletim de ocorrência e reclame no Banco Central se o banco não resolver.",
      fontes: ["guiaMed"],
    });
  return {
    problema: "golpe",
    situacao: r.meio === "pix" ? (med?.passou ? "pix-fora-do-med" : "pix") : r.meio ?? "outro",
    titulo: "Possível golpe: aja rápido",
    resumo:
      "Em golpe, o tempo conta mais que tudo. O primeiro passo é avisar o banco pelo qual você pagou; depois, registrar boletim de ocorrência e guardar todas as provas.",
    alternativas,
    prazos,
    documentos: ["comprovante do pagamento;", "prints da conversa, do anúncio ou do site, com o endereço da página;", "protocolo do banco."],
    plano: [
      "Avise o banco agora e anote o protocolo.",
      "Registre boletim de ocorrência.",
      "Guarde prints da conversa, do anúncio e do site.",
      "Se o banco não resolver, reclame na ouvidoria do banco e no Banco Central.",
    ],
    canais: [
      { id: "banco", titulo: "O seu banco", texto: "App ou central de atendimento; depois, a ouvidoria.", fontes: [] },
      {
        id: "banco-central",
        titulo: "Banco Central",
        texto: "Pelo telefone 145 ou pelo Fale Conosco. O BC não resolve casos individuais, mas fiscaliza o banco.",
        fontes: [],
      },
      { id: "policia", titulo: "Polícia Civil", texto: "Boletim de ocorrência, presencial ou pela delegacia virtual do estado.", fontes: [] },
    ],
    avisos,
    links: [
      { id: "artigo-golpe-pix", href: "/artigos/golpe-pix-como-recuperar-dinheiro", texto: "Caí no golpe do Pix: como recuperar o dinheiro" },
      { id: "artigo-golpes", href: "/artigos/golpes-de-fim-de-ano", texto: "Golpes de compra mais comuns" },
    ],
    integracoesFuturas: ["simulador-golpe-pix"],
  };
}

function diagnosticoOutro(r: Respostas): Diagnostico {
  return {
    problema: "outro",
    situacao: "geral",
    titulo: "Seus direitos básicos nas compras pela internet",
    resumo:
      "Toda compra pela internet tem quatro garantias básicas: informação clara antes de comprar, a oferta cumprida como anunciada, 7 dias para desistir e a garantia contra defeitos. Veja qual se encaixa no seu caso.",
    alternativas: [
      {
        id: "informacao",
        titulo: "Informação clara",
        texto: "O site tem de mostrar CNPJ, endereço, preço com todas as despesas, prazo de entrega e restrições da oferta (Decreto 7.962/2013, artigo 2º).",
        fontes: ["decreto7962"],
      },
      { id: "oferta", titulo: "Oferta cumprida", texto: "O anúncio obriga a loja (CDC, artigos 30 e 35).", fontes: ["cdc"] },
      { ...ALT.arrependimento },
      { id: "garantia", titulo: "Garantia contra defeitos", texto: "30 dias para produto não durável e 90 para durável (CDC, artigo 26).", fontes: ["cdc"] },
    ],
    prazos: [],
    documentos: DOCUMENTOS_DA_COMPRA,
    plano: plano(r, []),
    canais: canais(r),
    avisos: [],
    links: [
      { id: "artigo-procon", href: "/artigos/como-reclamar-procon", texto: "Como reclamar no Procon e no Consumidor.gov.br" },
      { id: "artigo-black-friday", href: "/artigos/black-friday-direitos-do-consumidor", texto: "Seus direitos na Black Friday" },
    ],
    integracoesFuturas: [],
  };
}

export type ResultadoDoDiagnostico = { ok: true; diagnostico: Diagnostico } | { ok: false; erros: { pergunta: string; mensagem: string }[] };

export function diagnosticar(problema: Problema, respostas: Respostas, hoje: string): ResultadoDoDiagnostico {
  const dataDeHoje = lerData(hoje);
  if (!dataDeHoje) return { ok: false, erros: [{ pergunta: "hoje", mensagem: "Data de hoje inválida." }] };
  const erros = perguntasVisiveis(problema, respostas, hoje)
    .map((p) => ({ pergunta: p.id, mensagem: validarResposta(p, respostas[p.id], hoje) }))
    .filter((e): e is { pergunta: string; mensagem: string } => e.mensagem !== null);
  const recebido = respostas.recebimento ? lerData(respostas.recebimento) : null;
  const defeito = respostas.dataDefeito ? lerData(respostas.dataDefeito) : null;
  if (problema === "defeito" && recebido && defeito && compararDatas(defeito, recebido) < 0)
    erros.push({ pergunta: "dataDefeito", mensagem: "O defeito não pode ter aparecido antes de o produto chegar." });
  if (erros.length > 0) return { ok: false, erros };
  // Só as respostas das perguntas visíveis contam
  const visiveis = new Set(perguntasVisiveis(problema, respostas, hoje).map((p) => p.id));
  const r: Respostas = Object.fromEntries(Object.entries(respostas).filter(([id]) => visiveis.has(id)));
  const diagnostico =
    problema === "nao-chegou"
      ? diagnosticoNaoChegou(r, dataDeHoje)
      : problema === "defeito"
        ? diagnosticoDefeito(r, dataDeHoje)
        : problema === "diferente"
          ? diagnosticoDiferente(r, dataDeHoje)
          : problema === "desistir"
            ? diagnosticoDesistir(r, dataDeHoje)
            : problema === "cancelei-sem-reembolso"
              ? diagnosticoCancelei(r, dataDeHoje)
              : problema === "loja-nao-troca"
                ? diagnosticoNaoTroca(r, dataDeHoje)
                : problema === "loja-sumiu"
                  ? diagnosticoLojaSumiu(r, dataDeHoje)
                  : problema === "golpe"
                    ? diagnosticoGolpe(r, dataDeHoje)
                    : diagnosticoOutro(r);
  return { ok: true, diagnostico };
}

// Todas as fontes citadas no diagnóstico, sem repetir
export function fontesDoDiagnostico(d: Diagnostico): IdDaFonte[] {
  const ids = [...d.alternativas, ...d.prazos, ...d.canais, ...d.avisos].flatMap((i) => i.fontes);
  return [...new Set(ids)];
}
