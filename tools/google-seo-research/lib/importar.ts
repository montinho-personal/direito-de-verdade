// Importação de uma página de resultados que a pessoa pesquisou e salvou no próprio navegador.
// É o caminho para quando o Google bloqueia o navegador automatizado: nenhuma busca é feita
// pelo laboratório. O painel lê o arquivo salvo (com o mesmo extrator do coletor) e manda o
// resultado para cá, que confere e limpa tudo antes de gravar.
import type { Bloco, Coleta, Dispositivo, StatusDaColeta } from "./tipos.ts";
import { idDaColeta } from "./armazenamento.ts";
import { dominioDe } from "./texto.ts";

export type PaginaImportada = {
  palavra: string;
  dispositivo: Dispositivo;
  // Sugestões do autocompletar, digitadas pela pessoa (uma por linha); a página salva não as tem
  autocompletar: string[];
  // O que o extrator leu do arquivo
  lido: Record<string, unknown>;
  temHtml: boolean;
  capturas: { nome: string; descricao: string }[];
};

const texto = (valor: unknown, limite: number) =>
  typeof valor === "string" ? valor.replace(/\s+/g, " ").trim().slice(0, limite) : "";

const endereco = (valor: unknown) => {
  const url = texto(valor, 2000);
  return /^https?:\/\//.test(url) ? url : "";
};

const STATUS: StatusDaColeta[] = ["coletado", "nao_encontrado", "bloqueado", "erro"];

function bloco<T>(bruto: unknown, limpar: (item: Record<string, unknown>, i: number) => T | undefined): Bloco<T> {
  const b = (bruto ?? {}) as { status?: unknown; itens?: unknown; observacao?: unknown };
  const itens = (Array.isArray(b.itens) ? b.itens : [])
    .slice(0, 200)
    .map((item, i) => (item && typeof item === "object" ? limpar(item as Record<string, unknown>, i) : undefined))
    .filter((item): item is T => item !== undefined);
  const status = STATUS.includes(b.status as StatusDaColeta) ? (b.status as StatusDaColeta) : "nao_encontrado";
  return {
    status: itens.length ? "coletado" : status === "coletado" ? "nao_encontrado" : status,
    itens,
    observacao: texto(b.observacao, 300) || undefined,
  };
}

export function montarColetaImportada(entrada: PaginaImportada, quando: Date): Coleta {
  const palavra = texto(entrada.palavra, 150).toLowerCase();
  if (!palavra) throw new Error("Informe a busca a que a página se refere.");
  const sugestoes = [...new Set(entrada.autocompletar.map((s) => texto(s, 150)).filter(Boolean))].slice(0, 30);
  const lido = entrada.lido ?? {};
  const bloqueio = lido.bloqueio === true;

  const coleta: Coleta = {
    id: idDaColeta(palavra, quando),
    palavra,
    coletadaEm: quando.toISOString(),
    provedor: "pagina-salva",
    dispositivo: entrada.dispositivo === "celular" ? "celular" : "computador",
    idioma: "pt-BR",
    pais: "BR",
    status: "coletado",
    autocompletar: sugestoes.length
      ? { status: "coletado", itens: sugestoes.map((s) => ({ texto: s })), observacao: "Digitadas por quem importou a página." }
      : { status: "nao_encontrado", itens: [], observacao: "Sugestões não informadas na importação." },
    outrasPesquisas: bloco(lido.outrasPesquisas, (i) => {
      const t = texto(i.texto, 150);
      return t ? { texto: t } : undefined;
    }),
    perguntas: bloco(lido.perguntas, (i) => {
      const pergunta = texto(i.pergunta, 200);
      if (!pergunta) return undefined;
      return {
        pergunta,
        resposta: texto(i.resposta, 1500) || undefined,
        fonteTitulo: texto(i.fonteTitulo, 150) || undefined,
        fonteUrl: endereco(i.fonteUrl) || undefined,
      };
    }),
    visaoDeIA: bloco(lido.visaoDeIA, (i) => {
      const t = texto(i.texto, 6000);
      if (!t) return undefined;
      const fontes = (Array.isArray(i.fontes) ? i.fontes : [])
        .slice(0, 50)
        .map((f: Record<string, unknown>) => ({ titulo: texto(f?.titulo, 150), url: endereco(f?.url) }))
        .filter((f: { url: string }) => f.url);
      return { texto: t, fontes };
    }),
    organicos: bloco(lido.organicos, (i, n) => {
      const titulo = texto(i.titulo, 300);
      const url = endereco(i.url);
      if (!titulo || !url) return undefined;
      return {
        posicao: n + 1,
        titulo,
        url,
        dominio: dominioDe(url),
        enderecoExibido: texto(i.enderecoExibido, 200) || undefined,
        trecho: texto(i.trecho, 400) || undefined,
      };
    }),
    capturas: entrada.capturas,
    html: entrada.temHtml ? "pagina.html" : undefined,
  };

  const lidos = [coleta.perguntas, coleta.visaoDeIA, coleta.outrasPesquisas, coleta.organicos].filter((b) => b.itens.length);
  if (bloqueio) {
    coleta.status = "bloqueado";
    coleta.observacao = "O arquivo é a página de verificação do Google, não a de resultados.";
  } else if (lidos.length === 0) {
    coleta.status = "nao_encontrado";
    coleta.observacao = "Nenhum bloco reconhecido no arquivo. Salve como \"Página da web, completa\" e confira se é a página de resultados.";
  }
  return coleta;
}
