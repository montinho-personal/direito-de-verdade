// Armazenamento local do laboratório: arquivos JSON e capturas em dados/ (fora do Git).
// Só roda em Node, na máquina de quem pesquisa; nada daqui vai para a Vercel.
import fs from "node:fs";
import path from "node:path";
import type { Coleta, PalavraChave, ResumoDaColeta } from "./tipos.ts";

export function pastaDeDados() {
  if (process.env.SEO_LAB_DADOS) return process.env.SEO_LAB_DADOS;
  const daRaiz = path.join(process.cwd(), "tools", "google-seo-research");
  return path.join(fs.existsSync(daRaiz) ? daRaiz : process.cwd(), "dados");
}

const ID_VALIDO = /^[a-z0-9][a-z0-9-]{0,120}$/;
const ARQUIVO_VALIDO = /^[a-z0-9][a-z0-9._-]{0,80}\.(png|jpg|html|json)$/;

export function idValido(id: string) {
  return ID_VALIDO.test(id);
}

export function criarId(texto: string) {
  return (
    texto
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "busca"
  );
}

function lerJson<T>(arquivo: string, padrao: T): T {
  try {
    return JSON.parse(fs.readFileSync(arquivo, "utf8")) as T;
  } catch {
    return padrao;
  }
}

function gravarJson(arquivo: string, dados: unknown) {
  fs.mkdirSync(path.dirname(arquivo), { recursive: true });
  fs.writeFileSync(arquivo, JSON.stringify(dados, null, 2) + "\n");
}

// ---- Palavras-chave ----

const arquivoDePalavras = () => path.join(pastaDeDados(), "palavras.json");

// Buscas com que o laboratório começa (pedido de 16/11/2026): a calculadora de multa de aluguel.
// Valem enquanto palavras.json não existe; o primeiro cadastro ou remoção grava a lista.
const PALAVRAS_INICIAIS = [
  "calculadora multa rescisão aluguel",
  "multa proporcional aluguel",
  "multa de 3 aluguéis proporcional",
];

export function listarPalavras(): PalavraChave[] {
  const iniciais: PalavraChave[] = PALAVRAS_INICIAIS.map((termo) => ({
    id: criarId(termo),
    termo,
    grupo: "multa de aluguel",
    criadaEm: "2026-11-16T00:00:00.000Z",
  }));
  return lerJson<PalavraChave[]>(arquivoDePalavras(), iniciais);
}

export function adicionarPalavra(termo: string, grupo?: string): PalavraChave {
  const limpo = termo.replace(/\s+/g, " ").trim().toLowerCase();
  if (!limpo) throw new Error("Escreva a palavra-chave.");
  if (limpo.length > 150) throw new Error("Palavra-chave longa demais (máximo de 150 caracteres).");
  const lista = listarPalavras();
  const existente = lista.find((p) => p.termo === limpo);
  if (existente) return existente;
  const nova: PalavraChave = {
    id: criarId(limpo),
    termo: limpo,
    grupo: grupo?.trim() || undefined,
    criadaEm: new Date().toISOString(),
  };
  gravarJson(arquivoDePalavras(), [...lista, nova]);
  return nova;
}

export function removerPalavra(id: string) {
  gravarJson(
    arquivoDePalavras(),
    listarPalavras().filter((p) => p.id !== id),
  );
}

// ---- Coletas ----

const pastaDeColetas = () => path.join(pastaDeDados(), "coletas");

export function pastaDaColeta(id: string) {
  if (!idValido(id)) throw new Error("Identificador de coleta inválido.");
  return path.join(pastaDeColetas(), id);
}

// "multa proporcional aluguel" em 16/11/2026 15:04 → "2026-11-16-1504-multa-proporcional-aluguel"
export function idDaColeta(palavra: string, quando: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  const data = `${quando.getFullYear()}-${p(quando.getMonth() + 1)}-${p(quando.getDate())}-${p(quando.getHours())}${p(quando.getMinutes())}`;
  return `${data}-${criarId(palavra)}`.slice(0, 120);
}

export function gravarColeta(coleta: Coleta) {
  gravarJson(path.join(pastaDaColeta(coleta.id), "coleta.json"), coleta);
}

export function lerColeta(id: string): Coleta | undefined {
  if (!idValido(id)) return undefined;
  return lerJson<Coleta | undefined>(path.join(pastaDaColeta(id), "coleta.json"), undefined);
}

export function listarColetas(): Coleta[] {
  let pastas: string[] = [];
  try {
    pastas = fs.readdirSync(pastaDeColetas());
  } catch {
    return [];
  }
  return pastas
    .filter(idValido)
    .map(lerColeta)
    .filter((c): c is Coleta => Boolean(c))
    .sort((a, b) => b.coletadaEm.localeCompare(a.coletadaEm));
}

export function resumir(coleta: Coleta): ResumoDaColeta {
  return {
    id: coleta.id,
    palavra: coleta.palavra,
    coletadaEm: coleta.coletadaEm,
    provedor: coleta.provedor,
    dispositivo: coleta.dispositivo,
    status: coleta.status,
    contagem: {
      autocompletar: coleta.autocompletar.itens.length,
      outrasPesquisas: coleta.outrasPesquisas.itens.length,
      perguntas: coleta.perguntas.itens.length,
      visaoDeIA: coleta.visaoDeIA.itens.length,
      organicos: coleta.organicos.itens.length,
    },
  };
}

// A coleta mais recente de cada palavra-chave, que é o que a análise usa
export function ultimasColetas(coletas: Coleta[] = listarColetas()): Coleta[] {
  const vistas = new Set<string>();
  return coletas.filter((c) => {
    if (c.status === "bloqueado" || vistas.has(c.palavra)) return false;
    vistas.add(c.palavra);
    return true;
  });
}

// Caminho de um arquivo de evidência (captura ou HTML), ou undefined se o nome não for seguro
export function arquivoDaColeta(id: string, nome: string): string | undefined {
  if (!idValido(id) || !ARQUIVO_VALIDO.test(nome)) return undefined;
  const arquivo = path.join(pastaDaColeta(id), nome);
  return fs.existsSync(arquivo) ? arquivo : undefined;
}
