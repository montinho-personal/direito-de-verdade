// Comparação entre duas coletas: a mesma busca em datas diferentes, ou duas buscas vizinhas.
import type { Coleta } from "./tipos.ts";
import { chave } from "./texto.ts";

export type Diferenca = { emComum: string[]; soNaA: string[]; soNaB: string[] };

export type MudancaDePosicao = {
  url: string;
  titulo: string;
  posicaoA?: number;
  posicaoB?: number;
};

export type Comparacao = {
  a: { id: string; palavra: string; coletadaEm: string };
  b: { id: string; palavra: string; coletadaEm: string };
  autocompletar: Diferenca;
  outrasPesquisas: Diferenca;
  perguntas: Diferenca;
  organicos: MudancaDePosicao[];
  visaoDeIA: { naA: boolean; naB: boolean };
};

function diferenca(a: string[], b: string[]): Diferenca {
  const chavesA = new Map(a.map((t) => [chave(t), t]));
  const chavesB = new Map(b.map((t) => [chave(t), t]));
  return {
    emComum: [...chavesA].filter(([k]) => chavesB.has(k)).map(([, t]) => t),
    soNaA: [...chavesA].filter(([k]) => !chavesB.has(k)).map(([, t]) => t),
    soNaB: [...chavesB].filter(([k]) => !chavesA.has(k)).map(([, t]) => t),
  };
}

const semParametros = (url: string) => url.replace(/[?#].*$/, "").replace(/\/$/, "");

export function comparar(a: Coleta, b: Coleta): Comparacao {
  const organicos = new Map<string, MudancaDePosicao>();
  for (const r of a.organicos.itens) {
    organicos.set(semParametros(r.url), { url: r.url, titulo: r.titulo, posicaoA: r.posicao });
  }
  for (const r of b.organicos.itens) {
    const k = semParametros(r.url);
    organicos.set(k, { ...(organicos.get(k) ?? { url: r.url, titulo: r.titulo }), posicaoB: r.posicao });
  }
  const resumo = (c: Coleta) => ({ id: c.id, palavra: c.palavra, coletadaEm: c.coletadaEm });
  return {
    a: resumo(a),
    b: resumo(b),
    autocompletar: diferenca(
      a.autocompletar.itens.map((s) => s.texto),
      b.autocompletar.itens.map((s) => s.texto),
    ),
    outrasPesquisas: diferenca(
      a.outrasPesquisas.itens.map((s) => s.texto),
      b.outrasPesquisas.itens.map((s) => s.texto),
    ),
    perguntas: diferenca(
      a.perguntas.itens.map((p) => p.pergunta),
      b.perguntas.itens.map((p) => p.pergunta),
    ),
    organicos: [...organicos.values()].sort(
      (x, y) => (x.posicaoB ?? x.posicaoA ?? 99) - (y.posicaoB ?? y.posicaoA ?? 99),
    ),
    visaoDeIA: { naA: a.visaoDeIA.itens.length > 0, naB: b.visaoDeIA.itens.length > 0 },
  };
}
