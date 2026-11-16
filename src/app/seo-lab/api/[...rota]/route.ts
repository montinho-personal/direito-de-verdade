// API local do Google SEO Research Lab. Só responde com o painel ligado (veja src/lib/seo-lab.ts);
// na Vercel devolve 404 antes de ler qualquer arquivo.
import fs from "node:fs";
import path from "node:path";
import { connection } from "next/server";
import { DOMINIO_DO_SITE, labAtivo } from "@/lib/seo-lab";
import { analisar } from "../../../../../tools/google-seo-research/lib/analise.ts";
import {
  adicionarPalavra,
  arquivoDaColeta,
  gravarColeta,
  lerColeta,
  listarColetas,
  listarPalavras,
  pastaDaColeta,
  removerPalavra,
  resumir,
  ultimasColetas,
} from "../../../../../tools/google-seo-research/lib/armazenamento.ts";
import { montarColetaImportada, type PaginaImportada } from "../../../../../tools/google-seo-research/lib/importar.ts";
import { comparar } from "../../../../../tools/google-seo-research/lib/comparar.ts";
import { paraCsv, paraJson, paraXlsx } from "../../../../../tools/google-seo-research/lib/exportar.ts";
import { lerIndiceDoSite } from "../../../../../tools/google-seo-research/lib/indice-do-site.ts";

const naoEncontrado = () => Response.json({ erro: "Não encontrado." }, { status: 404 });
const invalido = (erro: string) => Response.json({ erro }, { status: 400 });

const TIPOS: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  html: "text/plain; charset=utf-8", // o HTML salvo é mostrado como texto, nunca executado
  json: "application/json; charset=utf-8",
};

function baixar(corpo: BodyInit, tipo: string, nome: string) {
  return new Response(corpo, {
    headers: { "content-type": tipo, "content-disposition": `attachment; filename="${nome}"` },
  });
}

export async function GET(request: Request, contexto: RouteContext<"/seo-lab/api/[...rota]">) {
  await connection();
  if (!labAtivo()) return naoEncontrado();
  const { rota } = await contexto.params;
  const busca = new URL(request.url).searchParams;

  if (rota.length === 1 && rota[0] === "estado") {
    return Response.json({ palavras: listarPalavras(), coletas: listarColetas().map(resumir) });
  }

  if (rota[0] === "coletas" && rota.length === 2) {
    const coleta = lerColeta(rota[1]);
    return coleta ? Response.json(coleta) : naoEncontrado();
  }

  if (rota[0] === "coletas" && rota[2] === "arquivo" && rota.length === 4) {
    const arquivo = arquivoDaColeta(rota[1], rota[3]);
    if (!arquivo) return naoEncontrado();
    const extensao = arquivo.split(".").pop() ?? "";
    return new Response(new Uint8Array(fs.readFileSync(arquivo)), {
      headers: { "content-type": TIPOS[extensao] ?? "application/octet-stream", "x-content-type-options": "nosniff" },
    });
  }

  if (rota.length === 1 && rota[0] === "comparar") {
    const a = lerColeta(busca.get("a") ?? "");
    const b = lerColeta(busca.get("b") ?? "");
    return a && b ? Response.json(comparar(a, b)) : invalido("Escolha duas coletas.");
  }

  if (rota.length === 1 && rota[0] === "analise") {
    return Response.json(analisar(ultimasColetas(), lerIndiceDoSite(), DOMINIO_DO_SITE));
  }

  if (rota.length === 1 && rota[0] === "exportar") {
    const id = busca.get("id");
    const coletas = id ? [lerColeta(id)].filter((c) => c !== undefined) : listarColetas();
    if (coletas.length === 0) return invalido("Nenhuma coleta para exportar.");
    const nome = `seo-lab-${id ?? "todas-as-coletas"}`;
    switch (busca.get("formato")) {
      case "csv":
        return baixar(paraCsv(coletas), "text/csv; charset=utf-8", `${nome}.csv`);
      case "json":
        return baixar(paraJson(coletas), "application/json; charset=utf-8", `${nome}.json`);
      case "xlsx":
        return baixar(
          new Uint8Array(paraXlsx(coletas)),
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          `${nome}.xlsx`,
        );
      default:
        return invalido("Formato inválido: use csv, json ou xlsx.");
    }
  }

  return naoEncontrado();
}

export async function POST(request: Request, contexto: RouteContext<"/seo-lab/api/[...rota]">) {
  await connection();
  if (!labAtivo()) return naoEncontrado();
  const { rota } = await contexto.params;
  if (rota.length === 1 && rota[0] === "coletas") return importarPagina(request);
  if (rota.length !== 1 || rota[0] !== "palavras") return naoEncontrado();
  try {
    const { termo, grupo } = (await request.json()) as { termo?: unknown; grupo?: unknown };
    const palavra = adicionarPalavra(String(termo ?? ""), typeof grupo === "string" ? grupo : undefined);
    return Response.json(palavra, { status: 201 });
  } catch (erro) {
    return invalido(erro instanceof Error ? erro.message : "Pedido inválido.");
  }
}

export async function DELETE(_request: Request, contexto: RouteContext<"/seo-lab/api/[...rota]">) {
  await connection();
  if (!labAtivo()) return naoEncontrado();
  const { rota } = await contexto.params;
  if (rota.length !== 2 || rota[0] !== "palavras") return naoEncontrado();
  removerPalavra(rota[1]);
  return Response.json({ ok: true });
}

// Grava uma página que a pessoa pesquisou e salvou no próprio navegador (aba "Importar")
type Importacao = Omit<PaginaImportada, "temHtml" | "capturas"> & {
  html?: unknown;
  imagens?: { tipo?: unknown; base64?: unknown }[];
};

async function importarPagina(request: Request) {
  try {
    const corpo = (await request.json()) as Importacao;
    const html = typeof corpo.html === "string" ? corpo.html.slice(0, 15_000_000) : "";
    const imagens = (Array.isArray(corpo.imagens) ? corpo.imagens : [])
      .slice(0, 8)
      .filter((i) => (i.tipo === "png" || i.tipo === "jpg") && typeof i.base64 === "string")
      .map((i, n) => ({ nome: `captura-${n + 1}.${i.tipo}`, dados: Buffer.from(i.base64 as string, "base64") }));
    const coleta = montarColetaImportada(
      {
        palavra: String(corpo.palavra ?? ""),
        dispositivo: corpo.dispositivo,
        autocompletar: Array.isArray(corpo.autocompletar) ? corpo.autocompletar.map(String) : [],
        lido: (corpo.lido ?? {}) as Record<string, unknown>,
        temHtml: Boolean(html),
        capturas: imagens.map((i, n) => ({ nome: i.nome, descricao: `Captura enviada na importação (${n + 1})` })),
      },
      new Date(),
    );
    const pasta = pastaDaColeta(coleta.id);
    fs.mkdirSync(pasta, { recursive: true });
    if (html) fs.writeFileSync(path.join(pasta, "pagina.html"), html);
    for (const imagem of imagens) fs.writeFileSync(path.join(pasta, imagem.nome), imagem.dados);
    adicionarPalavra(coleta.palavra);
    gravarColeta(coleta);
    return Response.json({ id: coleta.id, status: coleta.status, observacao: coleta.observacao }, { status: 201 });
  } catch (erro) {
    return invalido(erro instanceof Error ? erro.message : "Não foi possível importar a página.");
  }
}
