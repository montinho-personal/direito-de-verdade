"use client";

// Painel do Google SEO Research Lab (uso local). Lê e grava pela API em /seo-lab/api.
import { useCallback, useEffect, useState } from "react";
import type { Analise, ItemAnalisado } from "../../../tools/google-seo-research/lib/analise.ts";
import type { Comparacao, Diferenca } from "../../../tools/google-seo-research/lib/comparar.ts";
import {
  CATEGORIAS,
  NOME_DO_STATUS,
  type ChaveDaCategoria,
  type Coleta,
  type PalavraChave,
  type ResumoDaColeta,
  type StatusDaColeta,
} from "../../../tools/google-seo-research/lib/tipos.ts";

const API = "/seo-lab/api";

type Estado = { palavras: PalavraChave[]; coletas: ResumoDaColeta[] };

const ABAS = [
  { id: "palavras", nome: "Palavras-chave" },
  { id: "historico", nome: "Histórico" },
  { id: "resultados", nome: "Resultados" },
  { id: "comparar", nome: "Comparar" },
  { id: "oportunidades", nome: "Oportunidades" },
] as const;
type Aba = (typeof ABAS)[number]["id"];

async function pedir<T>(caminho: string, opcoes?: RequestInit): Promise<T> {
  const resposta = await fetch(`${API}${caminho}`, opcoes);
  const dados = await resposta.json();
  if (!resposta.ok) throw new Error(dados?.erro ?? "Falha no pedido.");
  return dados as T;
}

const dataHora = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

const CORES_DO_STATUS: Record<StatusDaColeta, string> = {
  coletado: "border-emerald-200 bg-emerald-50 text-emerald-900",
  nao_encontrado: "border-amber-200 bg-amber-50 text-amber-900",
  bloqueado: "border-red-200 bg-red-50 text-red-900",
  erro: "border-red-200 bg-red-50 text-red-900",
};

function Selo({ status }: { status: StatusDaColeta }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${CORES_DO_STATUS[status]}`}
    >
      {NOME_DO_STATUS[status]}
    </span>
  );
}

function Cartao({ titulo, children, acoes }: { titulo: string; children: React.ReactNode; acoes?: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-xl border border-border bg-surface p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-xl">{titulo}</h2>
        {acoes}
      </div>
      {children}
    </section>
  );
}

const botao =
  "rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium hover:border-accent hover:text-accent disabled:opacity-50";
const botaoPrincipal =
  "rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50";
const campo = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm";

function Exportar({ id }: { id?: string }) {
  const sufixo = id ? `&id=${id}` : "";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted">Exportar{id ? "" : " tudo"}:</span>
      {[
        ["csv", "CSV"],
        ["json", "JSON"],
        ["xlsx", "Excel"],
      ].map(([formato, nome]) => (
        <a key={formato} className={botao} href={`${API}/exportar?formato=${formato}${sufixo}`}>
          {nome}
        </a>
      ))}
    </div>
  );
}

function Comando({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <div className="flex items-center gap-2 rounded-lg bg-navy px-3 py-2 font-mono text-sm text-white">
      <code className="flex-1 overflow-x-auto whitespace-nowrap">{texto}</code>
      <button
        type="button"
        className="rounded border border-navy-line px-2 py-0.5 text-xs hover:border-gold hover:text-gold"
        onClick={() => {
          navigator.clipboard.writeText(texto).then(() => {
            setCopiado(true);
            setTimeout(() => setCopiado(false), 1500);
          });
        }}
      >
        {copiado ? "copiado" : "copiar"}
      </button>
    </div>
  );
}

// ---------- Palavras-chave ----------

function Palavras({
  estado,
  recarregar,
  abrirColeta,
}: {
  estado: Estado;
  recarregar: () => void;
  abrirColeta: (id: string) => void;
}) {
  const [termo, setTermo] = useState("");
  const [grupo, setGrupo] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function cadastrar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      await pedir("/palavras", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ termo, grupo }),
      });
      setTermo("");
      recarregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível cadastrar.");
    } finally {
      setEnviando(false);
    }
  }

  async function remover(palavra: PalavraChave) {
    if (!window.confirm(`Remover "${palavra.termo}" da lista? As coletas já feitas continuam no histórico.`)) return;
    await pedir(`/palavras/${palavra.id}`, { method: "DELETE" });
    recarregar();
  }

  const pendentes = estado.palavras.filter((p) => !estado.coletas.some((c) => c.palavra === p.termo));

  return (
    <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
      <Cartao titulo="Palavras-chave cadastradas">
        <form onSubmit={cadastrar} className="mb-5 grid gap-3 sm:grid-cols-[2fr_1fr_auto] sm:items-end">
          <label className="text-sm font-medium">
            Busca no Google
            <input
              className={`${campo} mt-1`}
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              placeholder="ex.: multa proporcional aluguel"
              required
              maxLength={150}
            />
          </label>
          <label className="text-sm font-medium">
            Grupo (opcional)
            <input
              className={`${campo} mt-1`}
              value={grupo}
              onChange={(e) => setGrupo(e.target.value)}
              placeholder="ex.: multa de aluguel"
              maxLength={60}
            />
          </label>
          <button type="submit" className={botaoPrincipal} disabled={enviando}>
            Cadastrar
          </button>
        </form>
        {erro && (
          <p role="alert" className="mb-4 text-sm text-red-800">
            {erro}
          </p>
        )}
        {estado.palavras.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma palavra-chave ainda. Cadastre a primeira acima.</p>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="py-2 pr-3 font-medium">Busca</th>
                  <th className="py-2 pr-3 font-medium">Grupo</th>
                  <th className="py-2 pr-3 font-medium">Coletas</th>
                  <th className="py-2 pr-3 font-medium">Última</th>
                  <th className="py-2 font-medium">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {estado.palavras.map((palavra) => {
                  const coletas = estado.coletas.filter((c) => c.palavra === palavra.termo);
                  const ultima = coletas[0];
                  return (
                    <tr key={palavra.id} className="border-b border-border last:border-0">
                      <td className="py-2.5 pr-3 font-medium">{palavra.termo}</td>
                      <td className="py-2.5 pr-3 text-muted">{palavra.grupo ?? "—"}</td>
                      <td className="py-2.5 pr-3">{coletas.length}</td>
                      <td className="py-2.5 pr-3">
                        {ultima ? (
                          <span className="flex flex-wrap items-center gap-2">
                            {dataHora(ultima.coletadaEm)} <Selo status={ultima.status} />
                          </span>
                        ) : (
                          <span className="text-muted">aguardando coleta</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right">
                        <span className="flex justify-end gap-2">
                          {ultima && (
                            <button type="button" className={botao} onClick={() => abrirColeta(ultima.id)}>
                              Ver
                            </button>
                          )}
                          <button type="button" className={botao} onClick={() => remover(palavra)}>
                            Remover
                          </button>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Cartao>

      <Cartao titulo="Como coletar">
        <div className="space-y-3 text-sm">
          <p>
            A coleta roda no terminal, na raiz do projeto, com o navegador aberto na sua frente.{" "}
            {pendentes.length > 0
              ? `${pendentes.length} busca(s) aguardando coleta.`
              : "Nenhuma busca aguardando coleta."}
          </p>
          <Comando texto="npm run seo:coletar" />
          <ol className="list-decimal space-y-1 pl-5 text-muted">
            <li>O coletor digita a busca e lê o autocompletar.</li>
            <li>Na página de resultados, você abre 2 ou 3 perguntas, expande a visão de IA e rola até o fim.</li>
            <li>Você aperta Enter no terminal e ele captura o que está na tela.</li>
          </ol>
          <p className="text-muted">Para repetir as buscas já coletadas e comparar depois:</p>
          <Comando texto="npm run seo:coletar -- --todas" />
          <p className="text-muted">
            Se o Google pedir verificação, a coleta para e fica registrada como bloqueada. O coletor não
            contorna CAPTCHA.
          </p>
        </div>
      </Cartao>
    </div>
  );
}

// ---------- Histórico ----------

function Historico({ estado, abrirColeta }: { estado: Estado; abrirColeta: (id: string) => void }) {
  const [filtro, setFiltro] = useState("");
  const coletas = estado.coletas.filter((c) => !filtro || c.palavra === filtro);
  const buscas = [...new Set(estado.coletas.map((c) => c.palavra))].sort();
  return (
    <Cartao
      titulo="Histórico de pesquisas"
      acoes={
        <label className="flex items-center gap-2 text-sm">
          Busca
          <select className={`${campo} w-auto max-w-[60vw]`} value={filtro} onChange={(e) => setFiltro(e.target.value)}>
            <option value="">todas</option>
            {buscas.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </label>
      }
    >
      {coletas.length === 0 ? (
        <p className="text-sm text-muted">Nenhuma coleta ainda. Rode o coletor para começar.</p>
      ) : (
        <div className="relative overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="py-2 pr-3 font-medium">Data</th>
                <th className="py-2 pr-3 font-medium">Busca</th>
                <th className="py-2 pr-3 font-medium">Dispositivo</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 pr-3 text-right font-medium" title="Autocompletar">Auto.</th>
                <th className="py-2 pr-3 text-right font-medium" title="Outras pessoas pesquisaram">Outras</th>
                <th className="py-2 pr-3 text-right font-medium" title="As pessoas também perguntam">Perg.</th>
                <th className="py-2 pr-3 text-right font-medium" title="Visão geral criada por IA">IA</th>
                <th className="py-2 pr-3 text-right font-medium" title="Resultados orgânicos">Org.</th>
                <th className="py-2 font-medium">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {coletas.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="whitespace-nowrap py-2.5 pr-3">{dataHora(c.coletadaEm)}</td>
                  <td className="py-2.5 pr-3 font-medium">{c.palavra}</td>
                  <td className="py-2.5 pr-3 text-muted">{c.dispositivo}</td>
                  <td className="py-2.5 pr-3">
                    <Selo status={c.status} />
                  </td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{c.contagem.autocompletar}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{c.contagem.outrasPesquisas}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{c.contagem.perguntas}</td>
                  <td className="py-2.5 pr-3 text-right">{c.contagem.visaoDeIA ? "sim" : "—"}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{c.contagem.organicos}</td>
                  <td className="py-2.5 text-right">
                    <button type="button" className={botao} onClick={() => abrirColeta(c.id)}>
                      Abrir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Cartao>
  );
}

// ---------- Resultados de uma coleta ----------

function SeletorDeColeta({
  coletas,
  valor,
  aoMudar,
  rotulo,
}: {
  coletas: ResumoDaColeta[];
  valor: string;
  aoMudar: (id: string) => void;
  rotulo: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium">
      {rotulo}
      <select className={campo} value={valor} onChange={(e) => aoMudar(e.target.value)}>
        <option value="">escolha uma coleta</option>
        {coletas.map((c) => (
          <option key={c.id} value={c.id}>
            {c.palavra} · {dataHora(c.coletadaEm)} · {c.dispositivo}
          </option>
        ))}
      </select>
    </label>
  );
}

function ConteudoDaCategoria({ coleta, categoria }: { coleta: Coleta; categoria: ChaveDaCategoria }) {
  const bloco = coleta[categoria];
  if (bloco.itens.length === 0) {
    return (
      <p className="text-sm text-muted">
        {bloco.observacao ?? "Nada coletado neste bloco."} As capturas de tela abaixo são a evidência.
      </p>
    );
  }
  if (categoria === "perguntas") {
    return (
      <ul className="space-y-2">
        {coleta.perguntas.itens.map((p) => (
          <li key={p.pergunta} className="rounded-lg border border-border">
            <details>
              <summary className="cursor-pointer px-3 py-2 text-sm font-medium">{p.pergunta}</summary>
              <div className="border-t border-border px-3 py-2 text-sm">
                {p.resposta ? (
                  <p>{p.resposta}</p>
                ) : (
                  <p className="text-muted">Resposta não capturada: a pergunta estava fechada na hora da coleta.</p>
                )}
                {p.fonteUrl && (
                  <p className="mt-2 break-all text-xs text-muted">
                    Fonte: {p.fonteTitulo ? `${p.fonteTitulo} · ` : ""}
                    <a className="text-accent underline" href={p.fonteUrl} target="_blank" rel="noreferrer noopener">
                      {p.fonteUrl}
                    </a>
                  </p>
                )}
              </div>
            </details>
          </li>
        ))}
      </ul>
    );
  }
  if (categoria === "visaoDeIA") {
    return (
      <div className="space-y-3 text-sm">
        {coleta.visaoDeIA.itens.map((v, i) => (
          <div key={i}>
            <p className="whitespace-pre-line rounded-lg border border-border bg-background p-3">{v.texto}</p>
            <h4 className="mt-3 font-semibold">Fontes citadas ({v.fontes.length})</h4>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {v.fontes.map((f) => (
                <li key={f.url} className="break-all">
                  {f.titulo} ·{" "}
                  <a className="text-accent underline" href={f.url} target="_blank" rel="noreferrer noopener">
                    {f.url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }
  if (categoria === "organicos") {
    return (
      <ol className="space-y-3">
        {coleta.organicos.itens.map((r) => {
          const doSite = r.dominio.endsWith("direitodeverdade.com.br");
          return (
            <li
              key={r.url}
              className={`flex gap-3 rounded-lg border p-3 text-sm ${doSite ? "border-gold bg-background" : "border-border"}`}
            >
              <span className="w-6 shrink-0 text-right font-semibold tabular-nums text-muted">{r.posicao}</span>
              <div className="min-w-0">
                <p className="font-medium">
                  {r.titulo}
                  {doSite && (
                    <span className="ml-2 rounded-full bg-gold px-2 py-0.5 text-xs font-semibold text-navy">
                      nosso site
                    </span>
                  )}
                </p>
                <a className="break-all text-xs text-accent underline" href={r.url} target="_blank" rel="noreferrer noopener">
                  {r.url}
                </a>
                {r.trecho && <p className="mt-1 text-muted">{r.trecho}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    );
  }
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {coleta[categoria].itens.map((s) => (
        <li key={s.texto} className="rounded-lg border border-border px-3 py-2 text-sm">
          {s.texto}
        </li>
      ))}
    </ul>
  );
}

function Resultados({
  estado,
  id,
  aoEscolher,
}: {
  estado: Estado;
  id: string;
  aoEscolher: (id: string) => void;
}) {
  const [carregada, setCarregada] = useState<Coleta | null>(null);
  const [categoria, setCategoria] = useState<ChaveDaCategoria>("autocompletar");

  useEffect(() => {
    if (!id) return;
    let vigente = true;
    pedir<Coleta>(`/coletas/${id}`)
      .then((c) => vigente && setCarregada(c))
      .catch(() => vigente && setCarregada(null));
    return () => {
      vigente = false;
    };
  }, [id]);

  const coleta = carregada?.id === id ? carregada : null;

  return (
    <div className="space-y-5">
      <Cartao titulo="Resultados por categoria" acoes={coleta ? <Exportar id={coleta.id} /> : undefined}>
        <SeletorDeColeta coletas={estado.coletas} valor={id} aoMudar={aoEscolher} rotulo="Coleta" />
        {coleta && (
          <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
            <div className="flex gap-1">
              <dt>Status:</dt>
              <dd>
                <Selo status={coleta.status} />
              </dd>
            </div>
            <div className="flex gap-1">
              <dt>Coletada em:</dt>
              <dd>{dataHora(coleta.coletadaEm)}</dd>
            </div>
            <div className="flex gap-1">
              <dt>Origem:</dt>
              <dd>
                {coleta.provedor}, {coleta.dispositivo}, {coleta.idioma}/{coleta.pais}
              </dd>
            </div>
            {coleta.observacao && (
              <div className="flex gap-1">
                <dt>Observação:</dt>
                <dd>{coleta.observacao}</dd>
              </div>
            )}
          </dl>
        )}
      </Cartao>

      {coleta && (
        <>
          <Cartao titulo={CATEGORIAS.find((c) => c.chave === categoria)!.nome}>
            <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Categorias">
              {CATEGORIAS.map((c) => (
                <button
                  key={c.chave}
                  type="button"
                  role="tab"
                  aria-selected={categoria === c.chave}
                  onClick={() => setCategoria(c.chave)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium ${
                    categoria === c.chave ? "border-navy bg-navy text-white" : "border-border hover:border-accent"
                  }`}
                >
                  {c.nome}
                  <span className="tabular-nums opacity-80">{coleta[c.chave].itens.length}</span>
                </button>
              ))}
            </div>
            <div className="mb-3">
              <Selo status={coleta[categoria].status} />
            </div>
            <ConteudoDaCategoria coleta={coleta} categoria={categoria} />
          </Cartao>

          <Cartao titulo="Capturas de tela (evidências)">
            {coleta.capturas.length === 0 ? (
              <p className="text-sm text-muted">Nenhuma captura nesta coleta.</p>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {coleta.capturas.map((captura) => {
                  const url = `${API}/coletas/${coleta.id}/arquivo/${captura.nome}`;
                  return (
                    <li key={captura.nome}>
                      <a href={url} target="_blank" rel="noreferrer" className="block">
                        {/* Arquivo local servido pela API do painel; não passa pelo otimizador de imagens */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`Captura: ${captura.descricao}`}
                          loading="lazy"
                          className="h-56 w-full rounded-lg border border-border bg-background object-contain object-top"
                        />
                        <span className="mt-1 block text-sm">{captura.descricao}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
            {coleta.html && (
              <p className="mt-4 text-sm text-muted">
                HTML da página salvo como evidência:{" "}
                <a
                  className="text-accent underline"
                  href={`${API}/coletas/${coleta.id}/arquivo/${coleta.html}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  abrir como texto
                </a>
                .
              </p>
            )}
          </Cartao>
        </>
      )}
    </div>
  );
}

// ---------- Comparar ----------

function ColunasDaDiferenca({ titulo, diferenca }: { titulo: string; diferenca: Diferenca }) {
  const colunas = [
    { nome: "Só na A", itens: diferenca.soNaA },
    { nome: "Nas duas", itens: diferenca.emComum },
    { nome: "Só na B", itens: diferenca.soNaB },
  ];
  return (
    <div>
      <h3 className="mb-2 font-semibold">{titulo}</h3>
      <div className="grid gap-3 md:grid-cols-3">
        {colunas.map((coluna) => (
          <div key={coluna.nome} className="rounded-lg border border-border p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              {coluna.nome} ({coluna.itens.length})
            </p>
            {coluna.itens.length === 0 ? (
              <p className="text-sm text-muted">—</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {coluna.itens.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Comparar({ estado }: { estado: Estado }) {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [carregada, setCarregada] = useState<Comparacao | null>(null);

  useEffect(() => {
    if (!a || !b || a === b) return;
    let vigente = true;
    pedir<Comparacao>(`/comparar?a=${a}&b=${b}`)
      .then((c) => vigente && setCarregada(c))
      .catch(() => vigente && setCarregada(null));
    return () => {
      vigente = false;
    };
  }, [a, b]);

  const comparacao = carregada && carregada.a.id === a && carregada.b.id === b ? carregada : null;

  return (
    <div className="space-y-5">
      <Cartao titulo="Comparar duas pesquisas">
        <p className="mb-4 text-sm text-muted">
          Compare a mesma busca em datas diferentes (o que mudou no Google) ou duas buscas vizinhas (o que
          elas têm em comum).
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <SeletorDeColeta coletas={estado.coletas} valor={a} aoMudar={setA} rotulo="Coleta A" />
          <SeletorDeColeta coletas={estado.coletas} valor={b} aoMudar={setB} rotulo="Coleta B" />
        </div>
        {a && a === b && <p className="mt-3 text-sm text-amber-900">Escolha duas coletas diferentes.</p>}
      </Cartao>
      {comparacao && (
        <Cartao titulo="Diferenças">
          <div className="space-y-6">
            <ColunasDaDiferenca titulo="Autocompletar" diferenca={comparacao.autocompletar} />
            <ColunasDaDiferenca titulo="As pessoas também perguntam" diferenca={comparacao.perguntas} />
            <ColunasDaDiferenca titulo="Outras pessoas pesquisaram" diferenca={comparacao.outrasPesquisas} />
            <div>
              <h3 className="mb-2 font-semibold">Visão geral criada por IA</h3>
              <p className="text-sm">
                A: {comparacao.visaoDeIA.naA ? "capturada" : "não capturada"} · B:{" "}
                {comparacao.visaoDeIA.naB ? "capturada" : "não capturada"}
              </p>
            </div>
            <div>
              <h3 className="mb-2 font-semibold">Resultados orgânicos</h3>
              <div className="relative overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
                    <tr>
                      <th className="py-2 pr-3 font-medium">Posição A</th>
                      <th className="py-2 pr-3 font-medium">Posição B</th>
                      <th className="py-2 font-medium">Página</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparacao.organicos.map((r) => (
                      <tr key={r.url} className="border-b border-border last:border-0">
                        <td className="py-2 pr-3 tabular-nums">{r.posicaoA ?? "—"}</td>
                        <td className="py-2 pr-3 tabular-nums">{r.posicaoB ?? "—"}</td>
                        <td className="py-2">
                          {r.titulo}
                          <span className="block break-all text-xs text-muted">{r.url}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Cartao>
      )}
    </div>
  );
}

// ---------- Oportunidades ----------

const NOME_DA_ORIGEM: Record<ChaveDaCategoria, string> = {
  autocompletar: "autocompletar",
  outrasPesquisas: "outras pesquisas",
  perguntas: "perguntas",
  visaoDeIA: "visão de IA",
  organicos: "orgânicos",
};

const CORES_DA_SITUACAO = {
  coberta: "border-emerald-200 bg-emerald-50 text-emerald-900",
  parcial: "border-amber-200 bg-amber-50 text-amber-900",
  lacuna: "border-red-200 bg-red-50 text-red-900",
};

function ListaDeItens({ itens, vazio }: { itens: ItemAnalisado[]; vazio: string }) {
  if (itens.length === 0) return <p className="text-sm text-muted">{vazio}</p>;
  return (
    <ul className="space-y-2">
      {itens.map((item) => (
        <li key={item.texto} className="rounded-lg border border-border p-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{item.texto}</span>
            <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${CORES_DA_SITUACAO[item.situacao]}`}>
              {item.situacao}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            Veio de: {item.origens.map((o) => NOME_DA_ORIGEM[o]).join(", ")} · apareceu {item.vezes}x · buscas:{" "}
            {item.palavras.join("; ")}
          </p>
          {item.pagina && (
            <p className="mt-1 text-xs text-muted">
              Página mais próxima: <span className="font-mono">{item.pagina.caminho}</span> · trecho comparado: “
              {item.pagina.trecho}” ({Math.round(item.pagina.nota * 100)}% das palavras)
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

function Oportunidades() {
  const [analise, setAnalise] = useState<Analise | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let vigente = true;
    pedir<Analise>("/analise")
      .then((a) => vigente && setAnalise(a))
      .catch((e) => vigente && setErro(e instanceof Error ? e.message : "Falha ao analisar."));
    return () => {
      vigente = false;
    };
  }, []);

  if (erro) return <p role="alert" className="text-sm text-red-800">{erro}</p>;
  if (!analise) return <p className="text-sm text-muted">Analisando…</p>;
  if (analise.coletasAnalisadas === 0) {
    return (
      <Cartao titulo="Análise de oportunidades">
        <p className="text-sm text-muted">A análise aparece depois da primeira coleta.</p>
      </Cartao>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-background p-4 text-sm text-muted">
        A análise usa a coleta mais recente de cada busca ({analise.coletasAnalisadas}) e compara com os
        títulos, intertítulos e perguntas frequentes já publicados em <span className="font-mono">content/</span>.
        São regras simples de palavras em comum: servem para apontar onde olhar, e a decisão é sua. Nada é
        criado ou publicado a partir daqui.
      </div>

      <Cartao titulo="Intenção de busca">
        <ul className="space-y-3">
          {analise.intencoes.map((i) => (
            <li key={i.palavra} className="rounded-lg border border-border p-3 text-sm">
              <p>
                <span className="font-medium">{i.palavra}</span> → <span className="font-semibold">{i.nome}</span>
              </p>
              {i.sinais.length > 0 && <p className="mt-1 text-xs text-muted">Sinais: {i.sinais.join("; ")}.</p>}
            </li>
          ))}
        </ul>
      </Cartao>

      <div className="grid gap-5 lg:grid-cols-2">
        <Cartao titulo={`Melhorias nas calculadoras (${analise.melhoriasEmCalculadoras.length})`}>
          <ListaDeItens
            itens={analise.melhoriasEmCalculadoras}
            vazio="Nenhuma pergunta ou busca em aberto perto de uma calculadora."
          />
        </Cartao>
        <Cartao titulo={`Melhorias em artigos (${analise.melhoriasEmArtigos.length})`}>
          <ListaDeItens itens={analise.melhoriasEmArtigos} vazio="Nenhuma pergunta ou busca em aberto perto de um artigo." />
        </Cartao>
      </div>

      <Cartao titulo={`Possíveis novos artigos (${analise.novosArtigos.length})`}>
        <p className="mb-3 text-sm text-muted">
          Perguntas e buscas sem página próxima no site. Antes de escrever, valem as regras do projeto: prints,
          fonte oficial e um artigo por vez.
        </p>
        <ListaDeItens itens={analise.novosArtigos} vazio="Nenhum assunto sem página próxima." />
      </Cartao>

      <Cartao titulo={`Perguntas frequentes (${analise.perguntasFrequentes.length})`}>
        <ListaDeItens itens={analise.perguntasFrequentes} vazio="Nenhuma pergunta coletada." />
      </Cartao>

      <Cartao titulo="Possível canibalização">
        <ul className="space-y-3">
          {analise.canibalizacao.map((c) => (
            <li
              key={c.palavra}
              className={`rounded-lg border p-3 text-sm ${c.alerta ? "border-amber-300 bg-amber-50" : "border-border"}`}
            >
              <p>
                <span className="font-medium">{c.palavra}</span>: {c.motivo}
              </p>
              {c.paginas.length > 0 && (
                <ul className="mt-1 list-disc pl-5 text-xs text-muted">
                  {c.paginas.map((p) => (
                    <li key={p.caminho}>
                      <span className="font-mono">{p.caminho}</span> · {p.titulo}
                    </li>
                  ))}
                </ul>
              )}
              {c.noGoogle.length > 0 && (
                <p className="mt-1 text-xs text-muted">
                  No Google: {c.noGoogle.map((r) => `posição ${r.posicao} (${r.url})`).join("; ")}
                </p>
              )}
            </li>
          ))}
        </ul>
      </Cartao>

      <Cartao titulo="Visibilidade em respostas de IA">
        <ul className="space-y-3">
          {analise.visibilidadeEmIA.map((v) => (
            <li key={v.coletaId} className="rounded-lg border border-border p-3 text-sm">
              <p className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{v.palavra}</span>
                <span className="rounded-full border border-border px-2 py-0.5 text-xs">
                  {v.exibida ? (v.citaOSite ? "cita o site" : "não cita o site") : "não capturada"}
                </span>
              </p>
              <p className="mt-1 text-muted">{v.recomendacao}</p>
            </li>
          ))}
        </ul>
      </Cartao>
    </div>
  );
}

// ---------- Painel ----------

export function PainelDoSeoLab() {
  const [estado, setEstado] = useState<Estado | null>(null);
  const [erro, setErro] = useState("");
  const [aba, setAba] = useState<Aba>("palavras");
  const [coletaAberta, setColetaAberta] = useState("");

  const recarregar = useCallback(() => {
    pedir<Estado>("/estado")
      .then((e) => {
        setEstado(e);
        setErro("");
      })
      .catch((e) => setErro(e instanceof Error ? e.message : "Falha ao carregar."));
  }, []);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  const abrirColeta = (id: string) => {
    setColetaAberta(id);
    setAba("resultados");
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Ferramenta interna · só nesta máquina
          </p>
          <h1 className="mt-1 font-serif text-3xl sm:text-4xl">Google SEO Research Lab</h1>
          <p className="mt-1 text-sm text-muted">
            O que o Google Brasil mostrou para cada busca, com evidências, e o que isso sugere para o site.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className={botao} onClick={recarregar}>
            Atualizar
          </button>
          {estado && estado.coletas.length > 0 && <Exportar />}
        </div>
      </header>

      {erro && (
        <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          {erro}
        </p>
      )}

      {estado && (
        <>
          <dl className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Palavras-chave", estado.palavras.length],
              ["Coletas", estado.coletas.length],
              ["Perguntas coletadas", estado.coletas.reduce((s, c) => s + c.contagem.perguntas, 0)],
              ["Com visão de IA", estado.coletas.filter((c) => c.contagem.visaoDeIA > 0).length],
            ].map(([nome, valor]) => (
              <div key={nome} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
                <dt className="text-xs uppercase tracking-wide text-muted">{nome}</dt>
                <dd className="mt-1 font-serif text-3xl tabular-nums">{valor}</dd>
              </div>
            ))}
          </dl>

          <nav className="mb-5 flex flex-wrap gap-1 border-b border-border" aria-label="Seções do painel">
            {ABAS.map((a) => (
              <button
                key={a.id}
                type="button"
                aria-current={aba === a.id ? "page" : undefined}
                onClick={() => setAba(a.id)}
                className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
                  aba === a.id ? "border-gold text-foreground" : "border-transparent text-muted hover:text-foreground"
                }`}
              >
                {a.nome}
              </button>
            ))}
          </nav>

          {aba === "palavras" && <Palavras estado={estado} recarregar={recarregar} abrirColeta={abrirColeta} />}
          {aba === "historico" && <Historico estado={estado} abrirColeta={abrirColeta} />}
          {aba === "resultados" && <Resultados estado={estado} id={coletaAberta} aoEscolher={setColetaAberta} />}
          {aba === "comparar" && <Comparar estado={estado} />}
          {aba === "oportunidades" && <Oportunidades />}
        </>
      )}
      {!estado && !erro && <p className="text-sm text-muted">Carregando…</p>}
    </div>
  );
}
