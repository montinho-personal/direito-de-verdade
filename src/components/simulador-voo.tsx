"use client";

// Simulador de direitos do passageiro aéreo: uma pergunta por vez, só as necessárias para o
// problema, e um resultado em três blocos (o que aconteceu, direitos por categoria, o que
// fazer), com calculadora de despesas e checklist de provas. As regras ficam em
// src/lib/voo; nada do que a pessoa responde é enviado ou guardado, e o Analytics só
// recebe o tipo de problema, a pergunta e a situação.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type Ref, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { Campo, Compartilhar, estiloDoBotao, estiloDoCampo } from "@/components/partes-da-calculadora";
import { registrarEvento } from "@/lib/analitico";
import { lerReais, reais } from "@/lib/dinheiro";
import { formatarData, lerData } from "@/lib/trabalhista/datas.ts";
import {
  CATEGORIAS_DE_DESPESA,
  type Categoria,
  type CategoriaDeDespesa,
  type Despesa,
  type Diagnostico,
  diagnosticar,
  NOME_DA_CATEGORIA,
  NOME_DA_DESPESA,
  NOME_DO_PROBLEMA,
  type Pergunta,
  type Problema,
  PROBLEMAS,
  perguntasVisiveis,
  type Respostas,
  somarDespesas,
  validarResposta,
} from "@/lib/voo/diagnostico.ts";
import { FONTES, type IdDaFonte, REGRAS_DO_VOO as R } from "@/lib/voo/regras.ts";

const link = "text-accent underline underline-offset-2";
const botaoPrincipal =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60";
const cartao =
  "flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm has-[:checked]:border-gold has-[:checked]:bg-gold/10 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold/60";
const ORDEM: Categoria[] = ["informacao", "assistencia", "alternativas", "reembolso", "compensacao", "ressarcimento", "indenizacao"];

// Hoje no horário de Brasília (o simulador é usado na hora, inclusive de madrugada)
function hojeEmTexto() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}
const nadaParaOuvir = () => () => {};
// Hora atual do aparelho no formato do campo datetime-local
function agoraLocal() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function mascararReais(texto: string) {
  const digitos = texto.replace(/\D/g, "").replace(/^0+/, "").slice(0, 9);
  if (!digitos) return "";
  const cheio = digitos.padStart(3, "0");
  return `${cheio.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${cheio.slice(-2)}`;
}

type Fase = "problema" | "perguntas" | "resultado";
type LinhaDeDespesa = { chave: number; categoria: CategoriaDeDespesa; descricao: string; data: string; valor: string };

export function SimuladorVoo({ nivelDoTitulo = 3 }: { nivelDoTitulo?: 2 | 3 }) {
  const id = useId();
  const Titulo = nivelDoTitulo === 2 ? "h2" : "h3";
  const Sub = nivelDoTitulo === 2 ? "h3" : "h4";
  const endereco = `https://direitodeverdade.com.br${usePathname() ?? "/calculadoras/simulador-direitos-voo-atrasado-cancelado"}`;

  const [fase, setFase] = useState<Fase>("problema");
  const [problema, setProblema] = useState<Problema | "">("");
  const [respostas, setRespostas] = useState<Respostas>({});
  const [indice, setIndice] = useState(0);
  const [erro, setErro] = useState("");
  const hoje = useSyncExternalStore(nadaParaOuvir, hojeEmTexto, () => R.revisadoEm as string);
  const titulo = useRef<HTMLHeadingElement>(null);
  const mudou = useRef(false);

  const registrados = useRef(new Set<string>());
  const registrar = (nome: string, parametros: Record<string, string | number> = {}, repetir = false) => {
    const chave = `${nome}:${JSON.stringify(parametros)}`;
    if (!repetir && registrados.current.has(chave)) return;
    registrados.current.add(chave);
    registrarEvento(nome, parametros);
  };
  useEffect(() => {
    registrar("voo_simulador_visualizado");
  }, []);
  useEffect(() => {
    if (mudou.current) titulo.current?.focus();
  }, [fase, indice]);

  const perguntas = problema ? perguntasVisiveis(problema, respostas) : [];
  const atual = perguntas[indice];
  const ir = (f: Fase, i = 0) => {
    mudou.current = true;
    setErro("");
    setFase(f);
    setIndice(i);
  };

  const concluir = () => {
    if (!problema) return;
    const r = diagnosticar(problema, respostas, hoje);
    if (!r.ok) {
      ir("perguntas", Math.max(0, perguntas.findIndex((p) => p.id === r.erros[0].pergunta)));
      setErro(r.erros[0].mensagem);
      return;
    }
    registrar("voo_resultado_exibido", { problema, situacao: r.diagnostico.situacao }, true);
    ir("resultado");
  };

  const avancar = () => {
    if (fase === "problema") {
      if (!problema) return setErro("Escolha o que aconteceu.");
      registrar("voo_etapa_concluida", { problema, etapa: 0, pergunta: "problema" });
      return ir("perguntas", 0);
    }
    if (!atual || !problema) return;
    const msg = validarResposta(atual, respostas[atual.id], respostas, hoje);
    if (msg) return setErro(msg);
    registrar("voo_etapa_concluida", { problema, etapa: indice + 1, pergunta: atual.id });
    if (indice + 1 >= perguntas.length) return concluir();
    ir("perguntas", indice + 1);
  };

  const responder = (valor: string) => {
    if (!atual) return;
    setRespostas((r) => ({ ...r, [atual.id]: valor }));
    setErro("");
  };

  const resultado = fase === "resultado" && problema ? diagnosticar(problema, respostas, hoje) : null;
  const total = perguntas.length;

  return (
    <section
      id="simulador-de-voo"
      aria-labelledby={`${id}-titulo`}
      data-track="artigo:ferramenta-inline"
      className="my-10 scroll-mt-6 rounded-2xl border border-border bg-surface p-5 sm:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">Simulador</p>
      <Titulo id={`${id}-titulo`} className="mt-2 font-serif text-2xl leading-snug">
        Quais são seus direitos nesta viagem?
      </Titulo>

      {fase !== "resultado" && (
        <div className="mt-5 print:hidden">
          <p className="text-sm text-muted">{fase === "problema" ? "Para começar" : `Pergunta ${indice + 1} de ${total}`}</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border" aria-hidden="true">
            <div className="h-full rounded-full bg-gold" style={{ width: `${fase === "problema" ? 5 : Math.round(((indice + 1) / (total + 1)) * 100)}%` }} />
          </div>
        </div>
      )}

      <div className="mt-6">
        {fase === "problema" && (
          <fieldset>
            <legend className="w-full">
              <Sub ref={titulo} tabIndex={-1} className="font-serif text-xl focus:outline-none">
                Qual foi o problema?
              </Sub>
            </legend>
            <div className="mt-4 grid gap-2">
              {PROBLEMAS.map((p) => (
                <label key={p} className={cartao}>
                  <input
                    type="radio"
                    name={`${id}-problema`}
                    checked={problema === p}
                    onChange={() => {
                      registrar("voo_simulador_iniciado");
                      registrar("voo_tipo_problema", { problema: p }, true);
                      if (p !== problema) setRespostas({});
                      setProblema(p);
                      setErro("");
                    }}
                    className="mt-0.5 accent-[var(--accent)]"
                  />
                  <span className="font-medium">{NOME_DO_PROBLEMA[p]}</span>
                </label>
              ))}
            </div>
            <p role="alert" className="mt-2 min-h-6 text-sm text-red-700">
              {erro}
            </p>
          </fieldset>
        )}

        {fase === "perguntas" && atual && (
          <PerguntaAtual key={atual.id} idBase={id} q={atual} valor={respostas[atual.id] ?? ""} Sub={Sub} refDoTitulo={titulo} erro={erro} aoMudar={responder} />
        )}

        {fase !== "resultado" && (
          <div className="mt-4 flex flex-wrap gap-3 print:hidden">
            {fase === "perguntas" && (
              <button type="button" className={estiloDoBotao} onClick={() => (indice > 0 ? ir("perguntas", indice - 1) : ir("problema"))}>
                Voltar
              </button>
            )}
            <button type="button" className={botaoPrincipal} onClick={avancar}>
              {fase === "perguntas" && indice + 1 >= total ? "Ver meus direitos" : "Continuar"}
            </button>
          </div>
        )}

        {resultado?.ok && (
          <Resultado
            d={resultado.diagnostico}
            Sub={Sub}
            refDoTitulo={titulo}
            endereco={endereco}
            registrar={registrar}
            aoEditar={() => ir("perguntas", 0)}
            aoRecomecar={() => {
              setProblema("");
              setRespostas({});
              ir("problema");
            }}
          />
        )}
      </div>

      <p className="mt-6 text-xs leading-5 text-muted">
        Orientação informativa com a Resolução ANAC 400 e as alterações das Resoluções 813 e 819, revisadas em{" "}
        {formatarData(lerData(R.revisadoEm)!)}. Não promete indenização. As respostas ficam só no seu navegador.{" "}
        <Link href="/calculadoras/simulador-direitos-voo-atrasado-cancelado#como-o-simulador-funciona" className={link}>
          Como o simulador funciona
        </Link>
      </p>
    </section>
  );
}

function PerguntaAtual({
  idBase,
  q,
  valor,
  Sub,
  refDoTitulo,
  erro,
  aoMudar,
}: {
  idBase: string;
  q: Pergunta;
  valor: string;
  Sub: "h3" | "h4";
  refDoTitulo: Ref<HTMLHeadingElement>;
  erro: string;
  aoMudar: (v: string) => void;
}) {
  const idErro = `${idBase}-erro-${q.id}`;
  const Erro = (
    <p id={idErro} role="alert" className="mt-2 min-h-6 text-sm text-red-700">
      {erro}
    </p>
  );
  if (q.tipo === "data" || q.tipo === "datahora") {
    const campo = `${idBase}-${q.id}`;
    return (
      <div>
        <Sub ref={refDoTitulo} tabIndex={-1} className="font-serif text-xl focus:outline-none">
          <label htmlFor={campo}>{q.texto}</label>
        </Sub>
        {q.ajuda && <p className="mt-2 text-sm leading-6 text-muted">{q.ajuda}</p>}
        <input
          id={campo}
          type={q.tipo === "data" ? "date" : "datetime-local"}
          value={valor}
          onChange={(e) => aoMudar(e.target.value)}
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro ? idErro : undefined}
          className={`${estiloDoCampo} mt-4 sm:max-w-xs`}
        />
        {q.id === "agora" && (
          <button type="button" className={`${estiloDoBotao} mt-3`} onClick={() => aoMudar(agoraLocal())}>
            Usar a hora do meu celular
          </button>
        )}
        {Erro}
      </div>
    );
  }
  const multipla = q.tipo === "multipla";
  const marcados = valor ? valor.split(",") : [];
  const alternar = (v: string) => {
    if (!multipla) return aoMudar(v);
    if (v === "nada") return aoMudar(marcados.includes("nada") ? "" : "nada");
    const sem = marcados.filter((m) => m !== "nada");
    const novo = sem.includes(v) ? sem.filter((m) => m !== v) : [...sem, v];
    aoMudar(novo.join(","));
  };
  return (
    <fieldset aria-describedby={erro ? idErro : undefined}>
      <legend className="w-full">
        <Sub ref={refDoTitulo} tabIndex={-1} className="font-serif text-xl focus:outline-none">
          {q.texto}
        </Sub>
      </legend>
      {q.ajuda && <p className="mt-2 text-sm leading-6 text-muted">{q.ajuda}</p>}
      <div className="mt-4 grid gap-2">
        {(q.opcoes ?? []).map((o) => (
          <label key={o.valor} className={cartao}>
            <input
              type={multipla ? "checkbox" : "radio"}
              name={`${idBase}-${q.id}`}
              checked={multipla ? marcados.includes(o.valor) : valor === o.valor}
              onChange={() => alternar(o.valor)}
              className="mt-0.5 size-4 accent-[var(--accent)]"
            />
            <span>
              <span className="font-medium">{o.nome}</span>
              {o.dica && <span className="mt-0.5 block text-muted">{o.dica}</span>}
            </span>
          </label>
        ))}
      </div>
      {Erro}
    </fieldset>
  );
}

function Fontes({ ids }: { ids: IdDaFonte[] }) {
  if (!ids.length) return null;
  return (
    <span className="mt-1 block text-xs text-muted">
      {ids.length > 1 ? "Fontes: " : "Fonte: "}
      {ids.map((f, i) => (
        <span key={f}>
          {i > 0 && ", "}
          <a href={FONTES[f].url} target="_blank" rel="noopener noreferrer" className={link}>
            {FONTES[f].curto}
          </a>
        </span>
      ))}
    </span>
  );
}

function Resultado({
  d,
  Sub,
  refDoTitulo,
  endereco,
  registrar,
  aoEditar,
  aoRecomecar,
}: {
  d: Diagnostico;
  Sub: "h3" | "h4";
  refDoTitulo: Ref<HTMLHeadingElement>;
  endereco: string;
  registrar: (nome: string, parametros?: Record<string, string | number>, repetir?: boolean) => void;
  aoEditar: () => void;
  aoRecomecar: () => void;
}) {
  const Menor = Sub === "h3" ? "h4" : "h5";
  const id = useId();
  const [despesas, setDespesas] = useState<LinhaDeDespesa[]>([]);
  const [proxima, setProxima] = useState(1);
  const [tenho, setTenho] = useState<Set<string>>(new Set());
  const [aviso, setAviso] = useState("");
  const caixa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const abertos: HTMLDetailsElement[] = [];
    const abrir = () =>
      caixa.current?.querySelectorAll("details").forEach((el) => {
        if (!el.open) {
          el.open = true;
          abertos.push(el);
        }
      });
    const fechar = () => abertos.splice(0).forEach((el) => (el.open = false));
    window.addEventListener("beforeprint", abrir);
    window.addEventListener("afterprint", fechar);
    return () => {
      window.removeEventListener("beforeprint", abrir);
      window.removeEventListener("afterprint", fechar);
    };
  }, []);

  const lidas: Despesa[] = despesas.map((x) => {
    const l = lerReais(x.valor);
    return { categoria: x.categoria, descricao: x.descricao, data: x.data, valor: l.tipo === "valido" ? l.centavos : 0 };
  });
  const soma = somarDespesas(lidas);
  const somaRegistrada = useRef(false);
  useEffect(() => {
    if (soma.quantidade > 0 && !somaRegistrada.current) {
      somaRegistrada.current = true;
      registrarEvento("voo_despesas_calculadas", { problema: d.problema });
    }
  }, [soma.quantidade, d.problema]);

  const porCategoria = ORDEM.map((c) => ({ c, itens: d.direitos.filter((x) => x.categoria === c) })).filter((g) => g.itens.length);

  const texto = [
    `O que aconteceu: ${d.resumo}`,
    "",
    "Direitos que podem ser aplicáveis:",
    ...porCategoria.flatMap((g) => [`[${NOME_DA_CATEGORIA[g.c]}]`, ...g.itens.map((x) => `- ${x.titulo}: ${x.texto}`)]),
    ...(d.avisos.length ? ["", "Atenção:", ...d.avisos.map((a) => `- ${a.texto}`)] : []),
    "",
    "O que fazer agora:",
    ...d.plano.map((p, i) => `${i + 1}. ${p}`),
    ...(soma.total ? ["", `Total de despesas informadas: ${reais(soma.total)} (gastos declarados, não um valor automaticamente devido).`] : []),
    "",
    "Orientação informativa; não promete indenização.",
    `Simulador: ${endereco}`,
  ].join("\n");

  async function compartilharFerramenta() {
    registrar("voo_compartilhamento", { canal: "ferramenta" }, true);
    try {
      if (navigator.share) return void (await navigator.share({ title: "Simulador de direitos do passageiro aéreo", url: endereco }));
      await navigator.clipboard.writeText(endereco);
      setAviso("Link do simulador copiado.");
    } catch {
      setAviso("Não deu para compartilhar automaticamente. Copie o endereço da página.");
    }
  }

  return (
    <div ref={caixa} className="space-y-6">
      <div className="rounded-xl border border-border bg-white px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">A. O que aconteceu</p>
        <Sub ref={refDoTitulo} tabIndex={-1} className="mt-1 font-serif text-xl leading-snug focus:outline-none">
          {d.resumo}
        </Sub>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">B. Quais direitos podem ser aplicáveis</p>
        <div className="mt-2 space-y-4">
          {porCategoria.map((g) => (
            <div key={g.c}>
              <Menor className="font-semibold">{NOME_DA_CATEGORIA[g.c]}</Menor>
              <div className="mt-2 grid gap-2">
                {g.itens.map((x) => (
                  <div key={x.id} className="rounded-xl border border-border bg-white px-4 py-3 text-sm leading-6">
                    <p className="font-medium">
                      {x.titulo}
                      {x.oferecido === true && <span className="ml-2 rounded-full bg-gold/15 px-2 py-0.5 text-xs font-normal">você recebeu</span>}
                      {x.oferecido === false && <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-xs font-normal text-red-800">não recebido</span>}
                    </p>
                    <p className="mt-1">{x.texto}</p>
                    {x.condicoes && <p className="mt-1 text-muted">Condição: {x.condicoes}</p>}
                    {x.excecoes && <p className="mt-1 text-muted">Exceção: {x.excecoes}</p>}
                    <Fontes ids={x.fontes} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {d.avisos.length > 0 && (
        <div className="rounded-xl border border-gold/50 bg-gold/10 px-4 py-3">
          <Menor className="font-semibold">Atenção ao seu caso</Menor>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6">
            {d.avisos.map((a) => (
              <li key={a.id}>
                {a.texto}
                <Fontes ids={a.fontes} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">C. O que fazer agora</p>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6">
          {d.plano.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ol>
        <p className="mt-2 text-sm">
          <a href={FONTES.consumidorGov.url} target="_blank" rel="noopener noreferrer" className={link}>
            Abrir o Consumidor.gov.br
          </a>
        </p>
      </div>

      <fieldset>
        <legend className="font-semibold">Checklist de provas</legend>
        <p className="mt-1 text-sm text-muted">Marque o que você já tem. Nada é guardado.</p>
        <div className="mt-2 grid gap-1">
          {d.checklist.map((item) => (
            <label key={item} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={tenho.has(item)}
                onChange={() =>
                  setTenho((t) => {
                    const n = new Set(t);
                    if (n.has(item)) n.delete(item);
                    else n.add(item);
                    return n;
                  })
                }
                className="size-4 accent-[var(--accent)]"
              />
              <span className={tenho.has(item) ? "text-muted line-through" : ""}>{item}</span>
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs text-muted">
          {tenho.size} de {d.checklist.length} reunidos.
        </p>
      </fieldset>

      <details className="rounded-xl border border-border bg-white px-4 py-3" open={despesas.length > 0}>
        <summary className="cursor-pointer text-sm font-medium">Calculadora de despesas (opcional)</summary>
        <p className="mt-2 text-xs leading-5 text-muted">
          Anote os gastos que o problema causou. Não precisa enviar comprovante; guarde as notas com você.
        </p>
        <div className="mt-3 space-y-3">
          {despesas.map((x, i) => (
            <fieldset key={x.chave} className="rounded-xl border border-border p-3">
              <legend className="px-1 text-sm font-medium">Despesa {i + 1}</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor={`${id}-cat-${x.chave}`} className="block text-sm font-medium">
                    Tipo
                  </label>
                  <select
                    id={`${id}-cat-${x.chave}`}
                    value={x.categoria}
                    onChange={(e) => setDespesas((l) => l.map((y) => (y.chave === x.chave ? { ...y, categoria: e.target.value as CategoriaDeDespesa } : y)))}
                    className={estiloDoCampo}
                  >
                    {CATEGORIAS_DE_DESPESA.map((c) => (
                      <option key={c} value={c}>
                        {NOME_DA_DESPESA[c]}
                      </option>
                    ))}
                  </select>
                </div>
                <Campo
                  id={`${id}-valor-${x.chave}`}
                  rotulo="Valor (R$)"
                  exemplo="0,00"
                  valor={x.valor}
                  aoMudar={(v) => setDespesas((l) => l.map((y) => (y.chave === x.chave ? { ...y, valor: mascararReais(v) } : y)))}
                />
                <div>
                  <label htmlFor={`${id}-desc-${x.chave}`} className="block text-sm font-medium">
                    Descrição
                  </label>
                  <input
                    id={`${id}-desc-${x.chave}`}
                    type="text"
                    autoComplete="off"
                    placeholder="Ex.: jantar no aeroporto"
                    value={x.descricao}
                    onChange={(e) => setDespesas((l) => l.map((y) => (y.chave === x.chave ? { ...y, descricao: e.target.value.slice(0, 80) } : y)))}
                    className={estiloDoCampo}
                  />
                </div>
                <Campo
                  id={`${id}-data-${x.chave}`}
                  rotulo="Data"
                  tipo="date"
                  valor={x.data}
                  aoMudar={(v) => setDespesas((l) => l.map((y) => (y.chave === x.chave ? { ...y, data: v } : y)))}
                />
              </div>
              <button type="button" className={`${estiloDoBotao} mt-3`} onClick={() => setDespesas((l) => l.filter((y) => y.chave !== x.chave))}>
                Remover despesa {i + 1}
              </button>
            </fieldset>
          ))}
        </div>
        <button
          type="button"
          className={`${estiloDoBotao} mt-3`}
          onClick={() => {
            setDespesas((l) => [...l, { chave: proxima, categoria: "alimentacao", descricao: "", data: "", valor: "" }]);
            setProxima((n) => n + 1);
          }}
        >
          + Adicionar despesa
        </button>
        {soma.quantidade > 0 && (
          <div className="mt-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm" aria-live="polite">
            <p>
              Total de despesas informadas: <strong className="tabular-nums">{reais(soma.total)}</strong>
            </p>
            <ul className="mt-1 text-xs text-muted">
              {soma.porCategoria.map((c) => (
                <li key={c.categoria}>
                  {NOME_DA_DESPESA[c.categoria]}: {reais(c.total)}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs leading-5 text-muted">
              É a soma dos gastos que você declarou, não um valor que a companhia deve automaticamente. O ressarcimento depende de
              o gasto ser necessário, causado pelo problema e comprovado.
            </p>
          </div>
        )}
      </details>

      <nav aria-label="Leia também" className="text-sm print:hidden">
        Leia também:{" "}
        {d.links.map((l) => (
          <Link key={l.id} href={l.href} className={link} onClick={() => registrar("voo_artigo_clicado", { destino: l.href }, true)}>
            {l.texto}
          </Link>
        ))}
        {" "}e{" "}
        <Link href="/artigos/como-reclamar-procon" className={link} onClick={() => registrar("voo_artigo_clicado", { destino: "/artigos/como-reclamar-procon" }, true)}>
          como reclamar no Procon e no Juizado
        </Link>
        .
      </nav>

      <Compartilhar
        texto={texto}
        aoCompartilhar={(canal) => (canal === "imprimir" ? registrar("voo_pdf_gerado", {}, true) : registrar("voo_compartilhamento", { canal }, true))}
      />
      <div className="flex flex-wrap gap-3 print:hidden">
        <button type="button" className={estiloDoBotao} onClick={compartilharFerramenta}>
          Compartilhar o simulador
        </button>
        <button type="button" className={estiloDoBotao} onClick={aoEditar}>
          Mudar as respostas
        </button>
        <button type="button" className={estiloDoBotao} onClick={aoRecomecar}>
          Nova simulação
        </button>
      </div>
      <p aria-live="polite" className="text-sm text-muted print:hidden">
        {aviso}
      </p>
    </div>
  );
}
