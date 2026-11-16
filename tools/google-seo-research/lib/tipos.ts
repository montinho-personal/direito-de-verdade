// Tipos do Google SEO Research Lab. Tudo o que o coletor grava e o painel lê passa por aqui.

// coletado: o elemento apareceu e foi lido.
// nao_encontrado: não apareceu na página ou o leitor não o reconheceu; a captura de tela
//   é a evidência para conferir.
// bloqueado: o Google pediu verificação (CAPTCHA) e a coleta parou.
// erro: falha técnica na leitura.
export type StatusDaColeta = "coletado" | "nao_encontrado" | "bloqueado" | "erro";

export type Bloco<T> = {
  status: StatusDaColeta;
  itens: T[];
  observacao?: string;
  // Nome do arquivo de captura de tela do bloco, dentro da pasta da coleta
  captura?: string;
};

export type Sugestao = { texto: string };

export type PerguntaDoGoogle = {
  pergunta: string;
  // Só vem preenchida se a pergunta estava aberta na hora da captura
  resposta?: string;
  fonteTitulo?: string;
  fonteUrl?: string;
};

export type FonteDaIA = { titulo: string; url: string };

export type VisaoDeIA = { texto: string; fontes: FonteDaIA[] };

export type ResultadoOrganico = {
  posicao: number;
  titulo: string;
  url: string;
  dominio: string;
  trecho?: string;
};

export type Dispositivo = "computador" | "celular";

export type Coleta = {
  id: string;
  palavra: string;
  // ISO 8601, horário em que a coleta terminou
  coletadaEm: string;
  // Quem trouxe os dados: "navegador-supervisionado" ou o nome de um provedor de SERP
  provedor: string;
  dispositivo: Dispositivo;
  idioma: string;
  pais: string;
  // Endereço da página de resultados
  urlDaBusca?: string;
  status: StatusDaColeta;
  observacao?: string;
  autocompletar: Bloco<Sugestao>;
  outrasPesquisas: Bloco<Sugestao>;
  perguntas: Bloco<PerguntaDoGoogle>;
  visaoDeIA: Bloco<VisaoDeIA>;
  organicos: Bloco<ResultadoOrganico>;
  // Evidências: arquivos na pasta da coleta
  capturas: { nome: string; descricao: string }[];
  html?: string;
};

export type PalavraChave = {
  id: string;
  termo: string;
  // Assunto ou página a que a busca se refere (livre), para agrupar no painel
  grupo?: string;
  criadaEm: string;
};

export type ResumoDaColeta = Pick<
  Coleta,
  "id" | "palavra" | "coletadaEm" | "provedor" | "dispositivo" | "status"
> & {
  contagem: { autocompletar: number; outrasPesquisas: number; perguntas: number; visaoDeIA: number; organicos: number };
};

export const CATEGORIAS = [
  { chave: "autocompletar", nome: "Autocompletar" },
  { chave: "outrasPesquisas", nome: "Outras pessoas pesquisaram" },
  { chave: "perguntas", nome: "As pessoas também perguntam" },
  { chave: "visaoDeIA", nome: "Visão geral criada por IA" },
  { chave: "organicos", nome: "Resultados orgânicos" },
] as const;

export type ChaveDaCategoria = (typeof CATEGORIAS)[number]["chave"];

export const NOME_DO_STATUS: Record<StatusDaColeta, string> = {
  coletado: "coletado",
  nao_encontrado: "não encontrado",
  bloqueado: "bloqueado pelo Google",
  erro: "erro",
};
