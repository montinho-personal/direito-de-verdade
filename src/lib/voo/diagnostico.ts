// Motor do simulador de direitos do passageiro aéreo: perguntas de cada problema (só as
// necessárias), cálculo do tempo de espera e o diagnóstico, separado por categoria de
// direito. Nada aqui depende da tela; nenhuma resposta é dado pessoal (sem nome, reserva
// ou rota exata). Regras, vigências e fontes em ./regras.ts.
import { compararDatas, type Data, deNumero, formatarData, lerData, numeroDoDia } from "../trabalhista/datas.ts";
import { type IdDaFonte, REGRAS_DO_VOO as R } from "./regras.ts";

export const PROBLEMAS = ["atraso", "cancelamento", "conexao", "pretericao", "extravio", "avaria", "alteracao", "outro"] as const;
export type Problema = (typeof PROBLEMAS)[number];

export const NOME_DO_PROBLEMA: Record<Problema, string> = {
  atraso: "Meu voo atrasou",
  cancelamento: "Meu voo foi cancelado",
  conexao: "Perdi uma conexão por problema no voo anterior",
  "pretericao": "Fui impedido de embarcar",
  extravio: "Minha bagagem foi extraviada",
  avaria: "Minha bagagem chegou danificada",
  alteracao: "A companhia alterou meu voo",
  outro: "Tive outro problema",
};

export type Respostas = Partial<Record<string, string>>;
export type Opcao = { valor: string; nome: string; dica?: string };
export type Pergunta = {
  id: string;
  texto: string;
  ajuda?: string;
  // opcoes: uma escolha; multipla: várias (valores separados por vírgula); data: AAAA-MM-DD;
  // datahora: AAAA-MM-DDTHH:MM, hora local do aeroporto de partida
  tipo: "opcoes" | "multipla" | "data" | "datahora";
  opcoes?: Opcao[];
  visivel?: (r: Respostas) => boolean;
};

const SIM_NAO: Opcao[] = [
  { valor: "sim", nome: "Sim" },
  { valor: "nao", nome: "Não" },
];
const ROTA: Pergunta = {
  id: "rota",
  texto: "De onde saía o voo e para onde ia?",
  tipo: "opcoes",
  opcoes: [
    { valor: "nacional", nome: "Voo nacional", dica: "Partida e chegada no Brasil." },
    { valor: "saida-brasil", nome: "Do Brasil para o exterior" },
    { valor: "chegada-brasil", nome: "Do exterior para o Brasil" },
    { valor: "exterior", nome: "Entre outros países, sem passar pelo Brasil" },
  ],
};
const DATA_DO_VOO: Pergunta = { id: "dataVoo", texto: "Qual era a data prevista do voo?", tipo: "data" };
const ESPERA: Pergunta = {
  id: "espera",
  texto: "Quanto tempo você esperou, contando do horário original do voo?",
  ajuda: "Até embarcar no novo voo, ou até agora, se ainda está esperando.",
  tipo: "opcoes",
  opcoes: [
    { valor: "ate-1h", nome: "Até 1 hora" },
    { valor: "1-2h", nome: "Mais de 1 e até 2 horas" },
    { valor: "2-4h", nome: "Mais de 2 e até 4 horas" },
    { valor: "mais-4h", nome: "Mais de 4 horas" },
  ],
};
const ASSISTENCIA: Pergunta = {
  id: "assistencia",
  texto: "O que a companhia ofereceu durante a espera?",
  ajuda: "Marque tudo o que recebeu.",
  tipo: "multipla",
  opcoes: [
    { valor: "alimentacao", nome: "Alimentação ou voucher" },
    { valor: "hospedagem", nome: "Hotel" },
    { valor: "transporte", nome: "Transporte (ao hotel ou para casa)" },
    { valor: "comunicacao", nome: "Internet ou telefone" },
    { valor: "nada", nome: "Nada" },
  ],
};
const PERNOITE: Pergunta = {
  id: "pernoite",
  texto: "A espera atravessou a noite (você precisaria dormir fora)?",
  tipo: "opcoes",
  opcoes: SIM_NAO,
};
const RESIDE: Pergunta = {
  id: "reside",
  texto: "Você mora na cidade do aeroporto de partida?",
  tipo: "opcoes",
  opcoes: SIM_NAO,
};
const PNAE: Pergunta = {
  id: "pnae",
  texto: "Alguém do grupo tem deficiência ou mobilidade reduzida?",
  ajuda: "Para essas pessoas e acompanhantes, a hospedagem não depende de pernoite.",
  tipo: "opcoes",
  opcoes: SIM_NAO,
};
const DESPESAS: Pergunta = {
  id: "despesas",
  texto: "Você teve gastos por causa do problema?",
  ajuda: "Comida, hotel, transporte, nova passagem, itens de primeira necessidade.",
  tipo: "opcoes",
  opcoes: SIM_NAO,
};

// Espera em faixas: minutos de referência (o limite inferior de cada faixa + 1)
const MINUTOS_DA_FAIXA: Record<string, number> = { "ate-1h": 0, "1-2h": 61, "2-4h": 121, "mais-4h": 241 };

const mais4h = (r: Respostas) => esperaEmMinutos(r) !== null && esperaEmMinutos(r)! > R.minutosHospedagem;
const noDia = (r: Respostas) => r.aviso === "no-dia";

const FLUXOS: Record<Problema, Pergunta[]> = {
  atraso: [
    ROTA,
    { id: "previsto", texto: "Qual era o horário previsto de saída?", ajuda: "Na hora local do aeroporto de partida.", tipo: "datahora" },
    {
      id: "saiu",
      texto: "O voo já saiu?",
      tipo: "opcoes",
      opcoes: [
        { valor: "sim", nome: "Sim, já saiu" },
        { valor: "esperando", nome: "Não, ainda estou esperando" },
        { valor: "cancelado", nome: "Acabou cancelado" },
      ],
    },
    { id: "efetivo", texto: "Que horas o voo saiu?", ajuda: "Na hora local do aeroporto de partida.", tipo: "datahora", visivel: (r) => r.saiu === "sim" },
    { id: "agora", texto: "Que horas são agora no aeroporto?", ajuda: "Use a hora local do aeroporto, que pode ser diferente da do seu celular.", tipo: "datahora", visivel: (r) => r.saiu === "esperando" },
    { id: "embarcou", texto: "Você já está ou esteve dentro do avião esperando?", tipo: "opcoes", opcoes: SIM_NAO, visivel: (r) => r.saiu !== "cancelado" },
    { ...ESPERA, visivel: (r) => r.saiu === "cancelado" },
    {
      id: "motivo",
      texto: "A companhia informou o motivo?",
      tipo: "opcoes",
      opcoes: [
        { valor: "mau-tempo", nome: "Mau tempo" },
        { valor: "tecnico", nome: "Problema técnico no avião" },
        { valor: "tripulacao", nome: "Falta de tripulação" },
        { valor: "aeroporto", nome: "Problema no aeroporto ou ordem de autoridade" },
        { valor: "outro", nome: "Outro motivo" },
        { valor: "nao-informou", nome: "Não informou" },
      ],
    },
    { ...ASSISTENCIA, visivel: (r) => (esperaEmMinutos(r) ?? 0) > R.minutosComunicacao },
    { ...PERNOITE, visivel: mais4h },
    { ...RESIDE, visivel: (r) => mais4h(r) && r.pernoite === "sim" },
    { ...PNAE, visivel: mais4h },
    { id: "conexao", texto: "Você perdeu uma conexão por causa do atraso?", tipo: "opcoes", opcoes: SIM_NAO },
    DESPESAS,
  ],
  cancelamento: [
    ROTA,
    DATA_DO_VOO,
    {
      id: "aviso",
      texto: "Quando a companhia avisou do cancelamento?",
      tipo: "opcoes",
      opcoes: [
        { valor: "mais-72h", nome: "Com mais de 72 horas de antecedência" },
        { valor: "menos-72h", nome: "Com menos de 72 horas, antes do dia do voo" },
        { valor: "no-dia", nome: "No dia do voo ou no aeroporto" },
      ],
    },
    { id: "ofereceu", texto: "A companhia ofereceu alternativas (outro voo, reembolso)?", tipo: "opcoes", opcoes: SIM_NAO },
    {
      id: "aceitou",
      texto: "Você aceitou alguma alternativa?",
      tipo: "opcoes",
      opcoes: [
        { valor: "reacomodacao", nome: "Sim, outro voo" },
        { valor: "reembolso", nome: "Sim, o reembolso" },
        { valor: "credito", nome: "Sim, crédito para outra passagem" },
        { valor: "nenhuma", nome: "Ainda não" },
      ],
      visivel: (r) => r.ofereceu === "sim",
    },
    { ...ESPERA, visivel: noDia },
    { ...ASSISTENCIA, visivel: (r) => noDia(r) && r.espera !== "ate-1h" },
    { ...PERNOITE, visivel: (r) => noDia(r) && r.espera === "mais-4h" },
    { ...RESIDE, visivel: (r) => noDia(r) && r.espera === "mais-4h" && r.pernoite === "sim" },
    { id: "finalidade", texto: "A viagem perdeu a finalidade?", ajuda: "Por exemplo, o compromisso já terá passado.", tipo: "opcoes", opcoes: SIM_NAO },
    { id: "conexao", texto: "O voo fazia parte de uma viagem com conexão?", tipo: "opcoes", opcoes: SIM_NAO },
    {
      id: "compra",
      texto: "Onde a passagem foi comprada?",
      tipo: "opcoes",
      opcoes: [
        { valor: "direto", nome: "Direto com a companhia" },
        { valor: "intermediario", nome: "Agência ou site de viagens" },
      ],
    },
    DESPESAS,
  ],
  conexao: [
    ROTA,
    DATA_DO_VOO,
    {
      id: "mesmaReserva",
      texto: "Os dois voos estavam na mesma reserva?",
      ajuda: "Comprados juntos, no mesmo bilhete.",
      tipo: "opcoes",
      opcoes: [...SIM_NAO, { valor: "nao-sei", nome: "Não sei" }],
    },
    {
      id: "causa",
      texto: "Por que você perdeu a conexão?",
      tipo: "opcoes",
      opcoes: [
        { valor: "transportador", nome: "O primeiro voo atrasou ou foi cancelado" },
        { valor: "troca", nome: "A companhia mudou o portão ou o aeroporto" },
        { valor: "passageiro", nome: "Por motivo meu", dica: "Por exemplo, demora na imigração ou cheguei tarde ao portão." },
      ],
    },
    { ...ESPERA, visivel: (r) => r.causa !== "passageiro" },
    { ...ASSISTENCIA, visivel: (r) => r.causa !== "passageiro" && !!r.espera && r.espera !== "ate-1h" },
    { ...PERNOITE, visivel: (r) => r.causa !== "passageiro" && r.espera === "mais-4h" },
    { ...RESIDE, visivel: (r) => r.causa !== "passageiro" && r.espera === "mais-4h" && r.pernoite === "sim" },
    DESPESAS,
  ],
  "pretericao": [
    ROTA,
    DATA_DO_VOO,
    {
      id: "motivo",
      texto: "O que aconteceu?",
      tipo: "opcoes",
      opcoes: [
        { valor: "overbooking", nome: "O voo estava lotado (overbooking)" },
        { valor: "operacional", nome: "Troca de avião ou falta de assento" },
        { valor: "voluntario", nome: "Aceitei sair do voo em troca de uma compensação" },
        { valor: "documentacao", nome: "Problema com documento, visto ou vacina" },
        { valor: "atrasado", nome: "Cheguei depois do horário de embarque" },
        { valor: "outro", nome: "Outro motivo" },
      ],
    },
    {
      id: "apresentou",
      texto: "Você se apresentou no horário, com os documentos exigidos?",
      tipo: "opcoes",
      opcoes: SIM_NAO,
      visivel: (r) => r.motivo === "overbooking" || r.motivo === "operacional" || r.motivo === "outro",
    },
    {
      id: "compensacao",
      texto: "A companhia pagou uma compensação na hora?",
      tipo: "opcoes",
      opcoes: SIM_NAO,
      visivel: (r) => (r.motivo === "overbooking" || r.motivo === "operacional" || r.motivo === "outro") && r.apresentou === "sim",
    },
    { ...ESPERA, visivel: (r) => preterido(r) },
    { ...ASSISTENCIA, visivel: (r) => preterido(r) && !!r.espera && r.espera !== "ate-1h" },
    { ...PERNOITE, visivel: (r) => preterido(r) && r.espera === "mais-4h" },
    { ...RESIDE, visivel: (r) => preterido(r) && r.espera === "mais-4h" && r.pernoite === "sim" },
    DESPESAS,
  ],
  extravio: [
    ROTA,
    { id: "desembarque", texto: "Em que dia você desembarcou?", tipo: "data" },
    {
      id: "entregue",
      texto: "A bagagem já foi entregue?",
      tipo: "opcoes",
      opcoes: [
        { valor: "sim", nome: "Sim, chegou depois" },
        { valor: "nao", nome: "Ainda não" },
      ],
    },
    { id: "registro", texto: "Você registrou o extravio na companhia?", ajuda: "No balcão do aeroporto, normalmente no formulário de irregularidade de bagagem.", tipo: "opcoes", opcoes: SIM_NAO },
    { id: "foraDeCasa", texto: "Você estava fora da cidade onde mora?", tipo: "opcoes", opcoes: SIM_NAO },
    { id: "comprou", texto: "Precisou comprar itens essenciais (roupa, higiene)?", tipo: "opcoes", opcoes: SIM_NAO },
    { id: "notas", texto: "Você tem os comprovantes dessas compras?", tipo: "opcoes", opcoes: SIM_NAO, visivel: (r) => r.comprou === "sim" },
  ],
  avaria: [
    ROTA,
    { id: "recebimento", texto: "Em que dia você recebeu a bagagem?", tipo: "data" },
    {
      id: "tipoDano",
      texto: "O que aconteceu com a bagagem?",
      tipo: "opcoes",
      opcoes: [
        { valor: "avaria", nome: "Mala quebrada ou danificada" },
        { valor: "violacao", nome: "Mala aberta ou com itens faltando" },
      ],
    },
    { id: "protesto", texto: "Você já reclamou com a companhia?", tipo: "opcoes", opcoes: SIM_NAO },
    { id: "fragil", texto: "O item danificado era frágil e foi despachado?", tipo: "opcoes", opcoes: SIM_NAO },
  ],
  alteracao: [
    ROTA,
    DATA_DO_VOO,
    {
      id: "aviso",
      texto: "Com quanta antecedência a companhia avisou da mudança?",
      tipo: "opcoes",
      opcoes: [
        { valor: "mais-72h", nome: "Mais de 72 horas antes do voo" },
        { valor: "menos-72h", nome: "Menos de 72 horas antes" },
        { valor: "nao-avisou", nome: "Não avisou: descobri no aeroporto" },
      ],
    },
    {
      id: "diferenca",
      texto: "Quanto o horário mudou?",
      tipo: "opcoes",
      opcoes: [
        { valor: "ate-30", nome: "Até 30 minutos" },
        { valor: "30-60", nome: "Mais de 30 minutos e até 1 hora" },
        { valor: "mais-60", nome: "Mais de 1 hora" },
      ],
      visivel: (r) => r.aviso !== "nao-avisou",
    },
    { id: "concorda", texto: "O novo horário serve para você?", tipo: "opcoes", opcoes: SIM_NAO, visivel: (r) => r.aviso !== "nao-avisou" },
    DESPESAS,
  ],
  outro: [ROTA],
};

function preterido(r: Respostas) {
  return (r.motivo === "overbooking" || r.motivo === "operacional" || r.motivo === "outro") && r.apresentou === "sim";
}

export function perguntasDoFluxo(p: Problema) {
  return FLUXOS[p];
}

export function perguntasVisiveis(p: Problema, r: Respostas) {
  return FLUXOS[p].filter((q) => !q.visivel || q.visivel(r));
}

// ---------- datas e horas ----------

export type DataHora = Data & { hora: number; minuto: number };

export function lerDataHora(texto: string | undefined): DataHora | null {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/.exec(texto ?? "");
  if (!m) return null;
  const data = lerData(m[1]);
  const hora = Number(m[2]);
  const minuto = Number(m[3]);
  if (!data || hora > 23 || minuto > 59) return null;
  return { ...data, hora, minuto };
}

const minutosDesde1970 = (d: DataHora) => numeroDoDia(d) * 1440 + d.hora * 60 + d.minuto;

// Espera em minutos: as duas horas são locais do mesmo aeroporto, então a diferença não
// depende do fuso do aparelho. Saída antes do previsto conta zero.
export function esperaEmMinutos(r: Respostas): number | null {
  if (r.espera) return MINUTOS_DA_FAIXA[r.espera] ?? null;
  const previsto = lerDataHora(r.previsto);
  const fim = lerDataHora(r.saiu === "sim" ? r.efetivo : r.saiu === "esperando" ? r.agora : undefined);
  if (!previsto || !fim) return null;
  return Math.max(0, minutosDesde1970(fim) - minutosDesde1970(previsto));
}

export const horasEmTexto = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h === 0 ? `${m} min` : `${h} h${m ? ` ${m} min` : ""}`;
};

export function validarResposta(q: Pergunta, valor: string | undefined, r: Respostas, hoje: string): string | null {
  if (!valor) return q.tipo === "opcoes" || q.tipo === "multipla" ? "Escolha uma opção." : "Informe a data.";
  if (q.tipo === "opcoes") return q.opcoes?.some((o) => o.valor === valor) ? null : "Escolha uma opção.";
  if (q.tipo === "multipla") {
    const vs = valor.split(",");
    if (!vs.every((v) => q.opcoes?.some((o) => o.valor === v))) return "Escolha uma opção.";
    if (vs.includes("nada") && vs.length > 1) return "Marque “Nada” sozinho, ou desmarque.";
    return null;
  }
  const dataDeHoje = lerData(hoje)!;
  if (q.tipo === "data") {
    const d = lerData(valor);
    if (!d) return "Data inválida.";
    if (d.ano < 2015) return "Confira o ano.";
    if (q.id !== "dataVoo" && compararDatas(d, dataDeHoje) > 0) return "A data não pode ser depois de hoje.";
    if (q.id === "dataVoo" && d.ano > dataDeHoje.ano + 1) return "Confira o ano.";
    return null;
  }
  const dh = lerDataHora(valor);
  if (!dh) return "Informe a data e a hora.";
  if (dh.ano < 2015 || compararDatas(dh, deNumero(numeroDoDia(dataDeHoje) + 2)) > 0) return "Confira a data.";
  if (q.id === "efetivo" || q.id === "agora") {
    const previsto = lerDataHora(r.previsto);
    if (previsto && minutosDesde1970(dh) - minutosDesde1970(previsto) < -24 * 60) return "Confira: é bem antes do horário previsto.";
    if (previsto && minutosDesde1970(dh) - minutosDesde1970(previsto) > 7 * 24 * 60) return "Confira: mais de 7 dias depois do previsto.";
  }
  return null;
}

// ---------- diagnóstico ----------

export type Categoria = "informacao" | "assistencia" | "alternativas" | "reembolso" | "ressarcimento" | "compensacao" | "indenizacao";

export const NOME_DA_CATEGORIA: Record<Categoria, string> = {
  informacao: "Informação",
  assistencia: "Assistência material (direito regulatório)",
  alternativas: "Outro voo, reembolso ou outro transporte (direito regulatório)",
  reembolso: "Reembolso da passagem",
  ressarcimento: "Ressarcimento de despesas comprovadas",
  compensacao: "Compensação prevista na regulamentação",
  indenizacao: "Possível pedido de indenização na Justiça",
};

export type Direito = {
  id: string;
  categoria: Categoria;
  titulo: string;
  texto: string;
  condicoes?: string;
  excecoes?: string;
  // Já cumprido pela companhia, segundo as respostas
  oferecido?: boolean;
  fontes: IdDaFonte[];
};
export type Aviso = { id: string; texto: string; fontes: IdDaFonte[] };

export type Diagnostico = {
  problema: Problema;
  situacao: string;
  resumo: string;
  esperaMinutos: number | null;
  regime: "original" | "r813";
  direitos: Direito[];
  avisos: Aviso[];
  plano: string[];
  checklist: string[];
  links: { id: string; href: string; texto: string }[];
};

const nacionalOuDoBrasil = (r: Respostas) => r.rota === "nacional" || r.rota === "saida-brasil";
const internacional = (r: Respostas) => r.rota !== "nacional";
const ofereceu = (r: Respostas, item: string) => (r.assistencia ?? "").split(",").includes(item);

function regimeDa(data: Data | null): "original" | "r813" {
  if (!data) return "r813";
  return compararDatas(data, lerData(R.vigenciaDoNovoArt27)!) >= 0 ? "r813" : "original";
}

function dataDoCaso(r: Respostas): Data | null {
  const dh = lerDataHora(r.previsto);
  if (dh) return dh;
  return lerData(r.dataVoo ?? "") ?? lerData(r.desembarque ?? "") ?? lerData(r.recebimento ?? "");
}

function assistencia(r: Respostas, minutos: number, regime: "original" | "r813"): Direito[] {
  const d: Direito[] = [];
  const fontes: IdDaFonte[] = regime === "r813" ? ["r813"] : ["r400"];
  if (regime === "original" && minutos > R.minutosComunicacao)
    d.push({
      id: "comunicacao",
      categoria: "assistencia",
      titulo: "Facilidades de comunicação",
      texto: "Para voos até 25/10/2026, a companhia devia oferecer internet ou telefone depois de 1 hora de espera.",
      oferecido: ofereceu(r, "comunicacao"),
      fontes: ["r400"],
    });
  if (minutos > R.minutosAlimentacao)
    d.push({
      id: "alimentacao",
      categoria: "assistencia",
      titulo: "Alimentação",
      texto: "Depois de 2 horas de espera, a companhia deve dar alimentação adequada, por refeição, voucher ou solução equivalente, de graça.",
      oferecido: ofereceu(r, "alimentacao"),
      fontes,
    });
  if (minutos > R.minutosHospedagem) {
    const pnae = r.pnae === "sim";
    const pernoite = r.pernoite === "sim";
    const mora = r.reside === "sim";
    if (pnae || (pernoite && !mora))
      d.push({
        id: "hospedagem",
        categoria: "assistencia",
        titulo: "Hotel e transporte",
        texto: pnae
          ? "Depois de 4 horas, a pessoa com deficiência ou mobilidade reduzida e seus acompanhantes têm direito a hospedagem mesmo sem pernoite, salvo acomodação adequada aceita por eles, além do transporte."
          : "Depois de 4 horas, com pernoite, a companhia deve dar hospedagem e o transporte de ida e volta entre o aeroporto e o hotel.",
        oferecido: ofereceu(r, "hospedagem"),
        fontes,
      });
    if (!pnae && pernoite && mora)
      d.push({
        id: "transporte-casa",
        categoria: "assistencia",
        titulo: "Transporte até sua casa",
        texto: "Quem mora na cidade do aeroporto de origem pode receber, em vez de hotel, o transporte de ida e volta até a residência.",
        oferecido: ofereceu(r, "transporte"),
        fontes,
      });
    if (!pnae && !pernoite)
      d.push({
        id: "sem-pernoite",
        categoria: "assistencia",
        titulo: "Sem pernoite, sem hotel",
        texto: "A hospedagem só é obrigatória quando há necessidade de pernoite. Sem isso, continuam valendo a alimentação e as alternativas de viagem.",
        fontes,
      });
  }
  return d;
}

function alternativas(motivo: string): Direito {
  return {
    id: "alternativas",
    categoria: "alternativas",
    titulo: "Você escolhe: outro voo, reembolso ou outro transporte",
    texto: `${motivo} a companhia deve oferecer, à sua escolha: reacomodação gratuita (no primeiro voo para o mesmo destino, dela ou de outra, ou num voo dela na data e horário que você preferir), reembolso ou a viagem por outro meio de transporte. Você escolhe uma delas, não todas juntas.`,
    excecoes: "Se você escolher o reembolso ou um voo dela em outra data de sua conveniência, a companhia pode deixar de dar a assistência material a partir daí.",
    fontes: ["r400"],
  };
}

const REEMBOLSO: Direito = {
  id: "reembolso",
  categoria: "reembolso",
  titulo: "Reembolso em até 7 dias",
  texto:
    "Se escolher o reembolso: integral (com as taxas), se pedido no aeroporto de origem, escala ou conexão, com o retorno à origem garantido nesses dois últimos; proporcional ao trecho não voado, se a parte já feita aproveitou a você. Pago em até 7 dias do pedido, pelo meio de pagamento da compra. Crédito para outra passagem só se você aceitar.",
  fontes: ["r400"],
};

const INFORMACAO = (data: Data | null): Direito => {
  const novo = data ? compararDatas(data, lerData(R.vigenciaDoNovoArt20)!) >= 0 : false;
  return {
    id: "informacao",
    categoria: "informacao",
    titulo: "Ser informado",
    texto: novo
      ? "A companhia deve informar a ocorrência assim que souber, inclusive por canais digitais, com a previsão de partida, as opções de reacomodação e reembolso e como pedir a assistência, mostrando a data e a hora da última atualização. O motivo deve ser dado por escrito, se você pedir."
      : "A companhia deve informar imediatamente o atraso, com a nova previsão, ou o cancelamento, e atualizar a previsão no máximo a cada 30 minutos. O motivo deve ser dado por escrito, se você pedir. A partir de 25/11/2026, as regras de informação passam a ser as da Resolução 813.",
    fontes: novo ? ["r813", "r819"] : ["r400", "r819"],
  };
};

function ressarcimento(r: Respostas): Direito {
  return {
    id: "ressarcimento",
    categoria: "ressarcimento",
    titulo: "Gastos que você teve",
    texto:
      "Gastos necessários causados pelo problema, como refeições, hotel e transporte que a companhia não forneceu, podem ser cobrados dela com os comprovantes. Quando falta estrutura no aeroporto ou fornecedor no local, a própria norma prevê o reembolso das despesas razoáveis em até 7 dias da apresentação das notas.",
    condicoes: r.despesas === "sim" ? "Guarde as notas fiscais e anote data e motivo de cada gasto." : undefined,
    fontes: ["r813", "cdc"],
  };
}

function indenizacao(r: Respostas, internacionalViagem: boolean): Direito {
  return {
    id: "indenizacao",
    categoria: "indenizacao",
    titulo: "Indenização: só com prova, decidida pelo juiz",
    texto: `Não existe indenização automática nem valor tabelado. O dano moral depende de você provar o prejuízo e o tamanho dele (Código Brasileiro de Aeronáutica, artigo 251-A); danos materiais, com os comprovantes.${internacionalViagem ? " Em voo internacional, os danos materiais seguem os limites das convenções internacionais (STF, Tema 210), mas o dano moral não (STF, Tema 1.240)." : ""}`,
    excecoes:
      "A companhia não responde pelo atraso se provar caso fortuito ou força maior, como restrição de pouso ou decolagem por mau tempo imposta pelo controle do espaço aéreo, falta de infraestrutura no aeroporto ou ordem de autoridade (artigo 256). Dar a assistência não é reconhecer culpa, e não substitui eventual indenização.",
    fontes: internacionalViagem ? ["cba", "stf210", "stf1240"] : ["cba"],
  };
}

const PLANO_BASE = (extra: string[] = []) => [
  "Peça à companhia, no balcão ou no app, a assistência e as alternativas, e o motivo por escrito.",
  "Guarde o bilhete, o cartão de embarque e prints dos avisos e do painel do aeroporto.",
  "Anote o protocolo de cada atendimento.",
  ...extra,
  "Sem solução, reclame no Consumidor.gov.br, que é o canal usado pela ANAC, ou no Procon.",
  "Se houve prejuízo relevante, procure o Juizado Especial Cível (até 20 salários mínimos sem advogado), um advogado ou a Defensoria Pública.",
];

const LINK_ARTIGO = { id: "artigo-voo", href: "/artigos/voo-atrasado-ou-cancelado", texto: "Voo atrasado ou cancelado: direitos do passageiro" };

function avisosGerais(r: Respostas, regime: "original" | "r813"): Aviso[] {
  const a: Aviso[] = [];
  if (r.rota === "chegada-brasil" || r.rota === "exterior")
    a.push({
      id: "territorio",
      texto:
        r.rota === "exterior"
          ? "Voo entre outros países, sem passar pelo Brasil: as regras da ANAC em geral não se aplicam. Valem as normas do país e o contrato; esta simulação não cobre esse caso."
          : "Voo que parte do exterior: a assistência da Resolução 400 é assegurada no território nacional. No aeroporto estrangeiro, valem as regras do país de partida e o contrato; confira com a companhia e o órgão local.",
      fontes: ["r813"],
    });
  if (regime === "original")
    a.push({
      id: "regra-antiga",
      texto: "Para voos até 25/10/2026, valia o texto anterior da Resolução 400, com facilidades de comunicação depois de 1 hora. A simulação usa a regra da data do voo.",
      fontes: ["r400", "r813"],
    });
  return a;
}

export type ResultadoDoDiagnostico = { ok: true; diagnostico: Diagnostico } | { ok: false; erros: { pergunta: string; mensagem: string }[] };

export function diagnosticar(problema: Problema, respostas: Respostas, hoje: string): ResultadoDoDiagnostico {
  const visiveis = perguntasVisiveis(problema, respostas);
  const erros = visiveis
    .map((q) => ({ pergunta: q.id, mensagem: validarResposta(q, respostas[q.id], respostas, hoje) }))
    .filter((e): e is { pergunta: string; mensagem: string } => e.mensagem !== null);
  if (erros.length) return { ok: false, erros };
  const ids = new Set(visiveis.map((q) => q.id));
  const r: Respostas = Object.fromEntries(Object.entries(respostas).filter(([k]) => ids.has(k)));
  const data = dataDoCaso(r);
  const regime = regimeDa(data);
  const minutos = esperaEmMinutos(r);
  const brasil = nacionalOuDoBrasil(r);
  const fora = r.rota === "exterior";
  const intl = internacional(r);
  const direitos: Direito[] = [];
  const avisos = avisosGerais(r, regime);
  let situacao = "geral";
  let resumo = "";
  const extraPlano: string[] = [];
  const checklist = ["bilhete ou comprovante da reserva", "cartão de embarque", "protocolos de atendimento"];
  const links = [LINK_ARTIGO];

  const semAssistencia = r.assistencia === "nada";
  const assistenciaTexto = r.assistencia
    ? r.assistencia === "nada"
      ? " e você declarou não ter recebido assistência material"
      : ` e você recebeu: ${r.assistencia
          .split(",")
          .map((v) => ASSISTENCIA.opcoes!.find((o) => o.valor === v)?.nome.toLowerCase())
          .join(", ")}`
    : "";

  const blocoDeEspera = (motivoAlternativas: string, comAlternativas: boolean) => {
    if (!fora) direitos.push(INFORMACAO(data));
    if (minutos !== null && !fora && brasil) direitos.push(...assistencia(r, minutos, regime));
    if (comAlternativas) direitos.push(alternativas(motivoAlternativas), REEMBOLSO);
    if (minutos !== null && minutos > R.minutosAlimentacao && semAssistencia && brasil)
      avisos.push({
        id: "assistencia-nao-oferecida",
        texto:
          "Você declarou não ter recebido a assistência devida. Peça na hora, no balcão ou no app, e guarde o protocolo; se precisar comprar comida ou hotel, guarde as notas para pedir o ressarcimento.",
        fontes: regime === "r813" ? ["r813"] : ["r400"],
      });
  };

  if (problema === "atraso") {
    const m = minutos ?? 0;
    situacao = r.saiu === "cancelado" ? "atraso-virou-cancelamento" : m > R.minutosHospedagem ? "mais-de-4h" : m > R.minutosAlimentacao ? "2-a-4h" : m > R.minutosComunicacao ? "1-a-2h" : "ate-1h";
    resumo =
      r.saiu === "cancelado"
        ? `Seu voo atrasou e acabou cancelado${assistenciaTexto}.`
        : `Seu voo teve atraso ${r.saiu === "esperando" ? "de " + horasEmTexto(m) + " até agora" : "de " + horasEmTexto(m)}${assistenciaTexto}.`;
    blocoDeEspera(
      r.saiu === "cancelado" ? "No cancelamento," : r.conexao === "sim" ? "Com a conexão perdida por causa do atraso," : "Com atraso de mais de 4 horas,",
      r.saiu === "cancelado" || m > R.minutosHospedagem || r.conexao === "sim",
    );
    if (m > 0 && m <= R.minutosHospedagem && r.saiu !== "cancelado" && r.conexao !== "sim")
      avisos.push({
        id: "previsao-mais-4h",
        texto: "Se a companhia já souber que o atraso passará de 4 horas, deve oferecer o outro voo, o reembolso ou outro transporte na hora, sem esperar completar as 4 horas.",
        fontes: ["r400"],
      });
    if (r.motivo === "mau-tempo" || r.motivo === "aeroporto")
      avisos.push({
        id: "forca-maior",
        texto:
          "Mau tempo com restrição imposta pelo controle do espaço aéreo, problema de infraestrutura do aeroporto ou ordem de autoridade podem afastar a indenização, mas não a assistência nem a escolha entre outro voo e reembolso.",
        fontes: ["cba", "r813"],
      });
    if (r.motivo === "tecnico" || r.motivo === "tripulacao")
      avisos.push({
        id: "risco-da-atividade",
        texto: "Problema técnico no avião e falta de tripulação não estão na lista de força maior da lei (artigo 256, § 3º).",
        fontes: ["cba"],
      });
    if (r.embarcou === "sim")
      avisos.push({
        id: "a-bordo",
        texto:
          regime === "original"
            ? "Para voos até 25/10/2026, a norma dizia expressamente que a assistência valia também para quem estava a bordo, com as portas abertas."
            : "O texto anterior da norma dizia expressamente que a assistência valia também a bordo, com as portas abertas; o texto em vigor desde 26/10/2026 não repete essa frase. Peça a assistência mesmo assim e anote a resposta.",
        fontes: regime === "original" ? ["r400"] : ["r400", "r813"],
      });
    checklist.push("foto do painel do aeroporto com o horário", "avisos da companhia (e-mail, app, SMS)");
  } else if (problema === "cancelamento") {
    const programado = r.aviso === "mais-72h";
    situacao = programado ? "cancelamento-com-antecedencia" : r.aviso === "menos-72h" ? "cancelamento-menos-72h" : "cancelamento-no-dia";
    resumo = `Seu voo foi cancelado, com aviso ${r.aviso === "mais-72h" ? "de mais de 72 horas" : r.aviso === "menos-72h" ? "de menos de 72 horas" : "no dia do voo"}${assistenciaTexto}.`;
    if (programado) {
      direitos.push({
        id: "alteracao-programada",
        categoria: "alternativas",
        titulo: "Mudança programada: outro voo ou reembolso integral",
        texto:
          "Cancelamento avisado com mais de 72 horas costuma ser uma alteração programada: se o novo horário mudar mais de 30 minutos (nacional) ou 1 hora (internacional) e você não concordar, a companhia deve oferecer reacomodação ou reembolso integral, à sua escolha.",
        excecoes: "Se a companhia cancelou e não ofereceu voo equivalente, as alternativas do cancelamento também podem ser pedidas.",
        fontes: ["r400"],
      });
      direitos.push(REEMBOLSO);
    } else {
      blocoDeEspera(r.aviso === "menos-72h" ? "Com aviso de menos de 72 horas," : "No cancelamento,", true);
    }
    if (r.aceitou === "credito")
      avisos.push({ id: "credito", texto: "Crédito no lugar do reembolso só vale se você concordou; o uso do crédito é livre, inclusive para outra pessoa.", fontes: ["r400"] });
    if (r.compra === "intermediario")
      avisos.push({
        id: "intermediario",
        texto: "Compra por agência ou site de viagens: peça a solução às duas empresas. Pelo CDC, quem participou da venda responde junto com a companhia.",
        fontes: ["cdc"],
      });
    if (r.finalidade === "sim")
      avisos.push({
        id: "finalidade",
        texto: "A viagem perdeu a finalidade: o reembolso integral, pedido no aeroporto de origem, devolve tudo o que você pagou. O prejuízo do compromisso perdido pode ser discutido como indenização, com prova.",
        fontes: ["r400", "cba"],
      });
    checklist.push("comunicação do cancelamento (e-mail, SMS, print do app)", "comprovante do compromisso perdido, se houver");
  } else if (problema === "conexao") {
    const daCompanhia = r.causa !== "passageiro";
    const mesma = r.mesmaReserva === "sim";
    situacao = daCompanhia ? (mesma ? "conexao-por-culpa-da-companhia" : "conexao-reservas-separadas") : "conexao-por-motivo-do-passageiro";
    resumo = daCompanhia ? `Você perdeu a conexão porque ${r.causa === "troca" ? "a companhia mudou o portão ou o aeroporto" : "o primeiro voo atrasou ou foi cancelado"}${assistenciaTexto.replace(/^ e /, "; ")}.` : "Você perdeu a conexão por um motivo seu.";
    if (daCompanhia && r.mesmaReserva !== "nao") blocoDeEspera("Quando a causa da perda da conexão é da companhia,", true);
    if (daCompanhia && r.mesmaReserva !== "sim")
      avisos.push({
        id: "reservas-separadas",
        texto:
          r.mesmaReserva === "nao"
            ? "Com voos em reservas separadas, a regra da conexão perdida não se aplica automaticamente: cada bilhete é um contrato. Valem os direitos do voo que atrasou ou foi cancelado; o segundo voo depende das regras dele."
            : "Confira se os voos estavam na mesma reserva: a regra da conexão perdida vale para voos com conexão no mesmo contrato.",
        fontes: ["r400"],
      });
    if (!daCompanhia)
      avisos.push({ id: "motivo-do-passageiro", texto: "Quando a perda da conexão é por motivo do passageiro, a companhia não é obrigada a reacomodar de graça; valem as regras da tarifa.", fontes: ["r400"] });
    checklist.push("cartões de embarque dos dois voos", "foto do painel com o atraso do primeiro voo");
  } else if (problema === "pretericao") {
    const pret = preterido(r);
    situacao = pret ? "pretericao" : r.motivo === "voluntario" ? "voluntario" : r.motivo === "documentacao" || r.motivo === "atrasado" ? "motivo-do-passageiro" : "sem-apresentacao";
    resumo = pret ? `Você se apresentou no horário e foi impedido de embarcar${assistenciaTexto.replace(/^ e /, "; ")}.` : "Você não embarcou por um motivo que, pelas suas respostas, não configura preterição.";
    if (pret) {
      direitos.push({
        id: "compensacao",
        categoria: "compensacao",
        titulo: `Compensação imediata: ${intl ? R.preterimentoInternacionalDes : R.preterimentoDomesticoDes} DES`,
        texto: `Na preterição, a companhia deve pagar na hora uma compensação de ${R.preterimentoDomesticoDes} DES no voo doméstico ou ${R.preterimentoInternacionalDes} DES no internacional, por transferência, voucher ou em dinheiro. O DES é uma moeda de referência do FMI: o valor em reais muda com a cotação do dia.`,
        condicoes: "Vale para quem se apresentou para embarque no voo contratado e não foi transportado.",
        excecoes: "Não é indenização judicial: é uma compensação da regulamentação, que não impede pedir indenização por outros prejuízos comprovados.",
        oferecido: r.compensacao === "sim",
        fontes: ["r400"],
      });
      blocoDeEspera("Na preterição,", true);
    } else if (r.motivo === "voluntario")
      avisos.push({ id: "voluntario", texto: "Quem aceita sair do voo em troca de uma compensação negociada não é considerado preterido: valem as condições que você aceitou.", fontes: ["r400"] });
    else
      avisos.push({
        id: "requisitos-do-passageiro",
        texto: "O passageiro deve se apresentar no horário fixado pela companhia, com documento de identificação e com visto e certificados exigidos no destino; sem isso, a companhia pode negar o embarque.",
        fontes: ["r400"],
      });
    checklist.push("comprovante do horário do check-in", "documento de identificação usado");
  } else if (problema === "extravio") {
    const desembarque = lerData(r.desembarque ?? "")!;
    const dias = intl ? R.bagagemInternacionalDias : R.bagagemDomesticoDias;
    const prazo = deNumero(numeroDoDia(desembarque) + dias);
    situacao = r.entregue === "sim" ? "bagagem-entregue" : "bagagem-nao-entregue";
    resumo = `Sua bagagem foi extraviada em ${formatarData(desembarque)}${r.entregue === "sim" ? " e já foi entregue" : " e ainda não foi entregue"}.`;
    direitos.push({
      id: "devolucao-bagagem",
      categoria: "informacao",
      titulo: `Devolução em até ${dias} dias`,
      texto: `A companhia deve devolver a bagagem no local que você indicar em até ${dias} dias (voo ${intl ? "internacional" : "doméstico"}). Contando do desembarque, até ${formatarData(prazo)}. Se não encontrar no prazo, deve indenizar em até 7 dias.`,
      condicoes: r.registro === "nao" ? "O extravio deve ser registrado de imediato na companhia. Faça o registro agora pelos canais dela e guarde o protocolo." : undefined,
      fontes: ["r400"],
    });
    direitos.push({
      id: "despesas-bagagem",
      categoria: "ressarcimento",
      titulo: "Despesas enquanto a mala não chega",
      texto:
        r.foraDeCasa === "sim"
          ? "Fora da sua cidade, você tem direito ao ressarcimento das despesas causadas pela falta da bagagem, em até 7 dias da entrega dos comprovantes, nos limites diários do contrato da companhia."
          : "O ressarcimento de despesas da regra da ANAC é para quem está fora do seu domicílio. Em casa, gastos extras podem ser discutidos com prova.",
      condicoes: r.comprou === "sim" && r.notas === "nao" ? "Sem notas, o ressarcimento fica difícil: peça segunda via ou guarde o extrato do cartão." : undefined,
      fontes: ["r400"],
    });
    direitos.push({
      id: "indenizacao-bagagem",
      categoria: "indenizacao",
      titulo: "Indenização pelo que estava na mala",
      texto: `Se a bagagem não for encontrada, a indenização cobre o conteúdo comprovado, até o limite da regulamentação (${R.limiteBagagemDes} DES no voo doméstico, salvo declaração especial de valor) ou, no internacional, o do tratado aplicável. Dano moral depende de prova do prejuízo.`,
      fontes: intl ? ["r400", "stf210", "stf1240", "cba"] : ["r400", "cba"],
    });
    checklist.push("etiqueta da bagagem", "registro do extravio (formulário da companhia)", "fotos e notas dos itens da mala", "notas das compras de emergência");
  } else if (problema === "avaria") {
    const receb = lerData(r.recebimento ?? "")!;
    const limite = deNumero(numeroDoDia(receb) + R.protestoAvariaDias);
    situacao = r.protesto === "sim" ? "avaria-reclamada" : "avaria-a-reclamar";
    resumo = `Sua bagagem chegou ${r.tipoDano === "violacao" ? "aberta ou com itens faltando" : "danificada"} em ${formatarData(receb)}.`;
    direitos.push({
      id: "avaria",
      categoria: "informacao",
      titulo: "Reclamar em até 7 dias; resposta em até 7 dias",
      texto: `A reclamação deve ser feita em até 7 dias do recebimento (até ${formatarData(limite)}). A companhia tem 7 dias, contados da reclamação, para consertar, trocar a mala por outra equivalente ou indenizar, no caso de violação.`,
      condicoes: "Receber a bagagem sem protestar faz presumir que ela chegou em bom estado.",
      excecoes: r.fragil === "sim" ? "Danos a item frágil despachado podem deixar de ser indenizados, conforme o contrato de transporte." : undefined,
      fontes: ["r400"],
    });
    checklist.push("fotos da mala e do dano", "etiqueta da bagagem", "registro da reclamação");
  } else if (problema === "alteracao") {
    const curto = r.aviso === "menos-72h";
    const naoAvisou = r.aviso === "nao-avisou";
    // Acima de 30 minutos no voo nacional; acima de 1 hora no internacional
    const grande = r.diferenca === "mais-60" || (!intl && r.diferenca === "30-60");
    situacao = naoAvisou ? "alteracao-sem-aviso" : curto ? "alteracao-menos-72h" : grande && r.concorda === "nao" ? "alteracao-grande" : "alteracao-sem-direito-extra";
    resumo = naoAvisou ? "A companhia mudou seu voo e você só soube no aeroporto." : `A companhia mudou o horário do seu voo, com aviso ${curto ? "de menos de 72 horas" : "de mais de 72 horas"}.`;
    if (naoAvisou) {
      direitos.push({
        id: "falha-de-informacao",
        categoria: "alternativas",
        titulo: "Assistência e escolha entre outro voo, reembolso ou outro transporte",
        texto: "Se você foi ao aeroporto por falha da companhia em avisar a mudança, ela deve dar a assistência material e oferecer, à sua escolha, reacomodação, reembolso integral ou outro meio de transporte.",
        fontes: ["r400"],
      });
      direitos.push(REEMBOLSO);
    } else if (curto || (grande && r.concorda === "nao")) {
      direitos.push({
        id: "alteracao",
        categoria: "alternativas",
        titulo: "Outro voo ou reembolso integral, à sua escolha",
        texto: curto
          ? "Mudança avisada com menos de 72 horas: a companhia deve oferecer reacomodação ou reembolso integral, e a escolha é sua."
          : `Mudança de mais de ${intl ? "1 hora (internacional)" : "30 minutos (nacional)"} que não serve para você: a companhia deve oferecer reacomodação ou reembolso integral, à sua escolha.`,
        fontes: ["r400"],
      });
      direitos.push(REEMBOLSO);
    } else
      avisos.push({
        id: "alteracao-aceitavel",
        texto: `Mudança avisada com mais de 72 horas e ${r.concorda === "sim" ? "que serve para você" : `de até ${intl ? "1 hora" : "30 minutos"}`}: a regra da ANAC não obriga a oferecer outro voo ou reembolso. Ainda assim, vale pedir, e o contrato pode prever mais.`,
        fontes: ["r400"],
      });
    checklist.push("e-mail ou mensagem com a mudança de horário");
  } else {
    situacao = "outro";
    resumo = "Você teve outro problema com a viagem aérea.";
    direitos.push(INFORMACAO(data));
    direitos.push({
      id: "desistencia-24h",
      categoria: "reembolso",
      titulo: "Desistir da compra em 24 horas",
      texto: "Você pode desistir da passagem sem custo em até 24 horas do recebimento do comprovante, se a compra foi feita com 7 dias ou mais de antecedência do embarque.",
      fontes: ["r400"],
    });
  }

  if (["atraso", "cancelamento", "conexao", "pretericao", "alteracao"].includes(problema) && r.despesas === "sim") direitos.push(ressarcimento(r));
  if (problema !== "extravio" && problema !== "avaria" && problema !== "outro") direitos.push(indenizacao(r, intl));
  if (problema === "outro") direitos.push(indenizacao(r, intl));
  if (r.despesas === "sim") checklist.push("notas fiscais e recibos das despesas");
  if (problema === "cancelamento" || problema === "atraso") extraPlano.push("Se escolher o reembolso, peça pelo canal da companhia e anote a data: o prazo é de 7 dias.");

  return {
    ok: true,
    diagnostico: {
      problema,
      situacao,
      resumo,
      esperaMinutos: minutos,
      regime,
      direitos,
      avisos,
      plano: PLANO_BASE(extraPlano),
      checklist,
      links,
    },
  };
}

// ---------- despesas ----------

export const CATEGORIAS_DE_DESPESA = ["alimentacao", "hospedagem", "transporte", "itens", "passagem", "outros"] as const;
export type CategoriaDeDespesa = (typeof CATEGORIAS_DE_DESPESA)[number];
export const NOME_DA_DESPESA: Record<CategoriaDeDespesa, string> = {
  alimentacao: "Alimentação",
  hospedagem: "Hospedagem",
  transporte: "Transporte",
  itens: "Itens essenciais",
  passagem: "Nova passagem",
  outros: "Outros gastos documentados",
};
export type Despesa = { categoria: CategoriaDeDespesa; descricao: string; data: string; valor: number };

export function somarDespesas(despesas: Despesa[]) {
  const validas = despesas.filter((d) => Number.isInteger(d.valor) && d.valor > 0);
  const porCategoria = CATEGORIAS_DE_DESPESA.map((c) => ({
    categoria: c,
    total: validas.filter((d) => d.categoria === c).reduce((s, d) => s + d.valor, 0),
  })).filter((c) => c.total > 0);
  return { total: validas.reduce((s, d) => s + d.valor, 0), porCategoria, quantidade: validas.length };
}
