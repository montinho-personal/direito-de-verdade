"use client";

// Simulador de direitos em compras online: uma pergunta por vez, só as necessárias para o
// problema escolhido, e um diagnóstico informativo no fim. As regras ficam em
// src/lib/compras-online; nada do que a pessoa responde é enviado ou guardado, e o
// Analytics só recebe o tipo de problema, a pergunta (pelo nome interno) e a situação.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, type Ref, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { hojeEmBrasilia } from "@/components/fgts/comum";
import { Compartilhar, estiloDoBotao, estiloDoCampo } from "@/components/partes-da-calculadora";
import { registrarEvento } from "@/lib/analitico";
import {
  type Diagnostico,
  diagnosticar,
  fontesDoDiagnostico,
  type Item,
  NOME_DO_PROBLEMA,
  type Pergunta,
  type Problema,
  PROBLEMAS,
  perguntasVisiveis,
  type Respostas,
  validarResposta,
} from "@/lib/compras-online/diagnostico.ts";
import { FONTES, type IdDaFonte, REGRAS_DAS_COMPRAS as R } from "@/lib/compras-online/regras.ts";
import { formatarData, lerData, paraTexto } from "@/lib/trabalhista/datas.ts";

const link = "text-accent underline underline-offset-2";
const revisao = formatarData(lerData(R.revisadoEm)!);
const nadaParaOuvir = () => () => {};
const botaoPrincipal =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60";

type Fase = "problema" | "perguntas" | "resultado";

export function SimuladorComprasOnline({ nivelDoTitulo = 3 }: { nivelDoTitulo?: 2 | 3 }) {
  const id = useId();
  const Titulo = nivelDoTitulo === 2 ? "h2" : "h3";
  const Sub = nivelDoTitulo === 2 ? "h3" : "h4";
  const endereco = `https://direitodeverdade.com.br${usePathname() ?? "/calculadoras/simulador-direitos-compras-online"}`;
  const hoje = useSyncExternalStore(nadaParaOuvir, () => paraTexto(hojeEmBrasilia()), () => R.revisadoEm);

  const [fase, setFase] = useState<Fase>("problema");
  const [problema, setProblema] = useState<Problema | "">("");
  const [respostas, setRespostas] = useState<Respostas>({});
  const [indice, setIndice] = useState(0);
  const [erro, setErro] = useState("");
  const titulo = useRef<HTMLHeadingElement>(null);
  const mudou = useRef(false);

  // Analytics: só categorias fixas, nunca datas ou respostas
  const registrados = useRef(new Set<string>());
  const registrar = (nome: string, parametros: Record<string, string | number> = {}, repetir = false) => {
    const chave = `${nome}:${JSON.stringify(parametros)}`;
    if (!repetir && registrados.current.has(chave)) return;
    registrados.current.add(chave);
    registrarEvento(nome, parametros);
  };
  useEffect(() => {
    registrar("simulador_compras_visualizado");
  }, []);
  useEffect(() => {
    if (mudou.current) titulo.current?.focus();
  }, [fase, indice]);

  const perguntas = problema ? perguntasVisiveis(problema, respostas, hoje) : [];
  const atual = perguntas[indice];

  const ir = (novaFase: Fase, novoIndice = 0) => {
    mudou.current = true;
    setErro("");
    setFase(novaFase);
    setIndice(novoIndice);
  };

  const concluir = () => {
    if (!problema) return;
    const r = diagnosticar(problema, respostas, hoje);
    if (!r.ok) {
      // Leva de volta à primeira pergunta com problema
      const i = perguntas.findIndex((p) => p.id === r.erros[0].pergunta);
      ir("perguntas", Math.max(0, i));
      setErro(r.erros[0].mensagem);
      return;
    }
    registrar("simulador_compras_resultado", { problema, situacao: r.diagnostico.situacao }, true);
    ir("resultado");
  };

  const avancar = () => {
    if (fase === "problema") {
      if (!problema) return setErro("Escolha o que aconteceu.");
      registrar("simulador_compras_etapa_concluida", { problema, etapa: 0, pergunta: "problema" });
      if (perguntasVisiveis(problema, respostas, hoje).length === 0) return concluir();
      return ir("perguntas", 0);
    }
    if (!atual || !problema) return;
    const mensagem = validarResposta(atual, respostas[atual.id], hoje);
    if (mensagem) return setErro(mensagem);
    registrar("simulador_compras_etapa_concluida", { problema, etapa: indice + 1, pergunta: atual.id });
    if (indice + 1 >= perguntas.length) return concluir();
    ir("perguntas", indice + 1);
  };

  const voltar = () => (fase === "perguntas" && indice > 0 ? ir("perguntas", indice - 1) : ir("problema"));

  const responder = (valor: string) => {
    if (!atual) return;
    setRespostas((r) => ({ ...r, [atual.id]: valor }));
    setErro("");
  };

  const escolherProblema = (p: Problema) => {
    registrar("simulador_compras_iniciado");
    registrar("simulador_compras_problema_selecionado", { problema: p }, true);
    if (p !== problema) setRespostas({});
    setProblema(p);
    setErro("");
  };

  const recomecar = () => {
    setProblema("");
    setRespostas({});
    ir("problema");
  };

  const resultado = fase === "resultado" && problema ? diagnosticar(problema, respostas, hoje) : null;
  const total = perguntas.length;

  return (
    <section
      id="simulador-de-direitos"
      aria-labelledby={`${id}-titulo`}
      data-track="artigo:ferramenta-inline"
      className="my-10 scroll-mt-6 rounded-2xl border border-border bg-surface p-5 sm:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">Simulador</p>
      <Titulo id={`${id}-titulo`} className="mt-2 font-serif text-2xl leading-snug">
        Descubra o que fazer com a sua compra
      </Titulo>

      {fase !== "resultado" && (
        <div className="mt-5 print:hidden">
          <p className="text-sm text-muted">
            {fase === "problema" ? "Para começar" : `Pergunta ${indice + 1} de ${total}`}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border" aria-hidden="true">
            <div
              className="h-full rounded-full bg-gold transition-[width]"
              style={{ width: `${fase === "problema" ? 5 : Math.round(((indice + 1) / (total + 1)) * 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-6">
        {fase === "problema" && (
          <Opcoes
            nome={`${id}-problema`}
            titulo="O que aconteceu com sua compra?"
            Sub={Sub}
            refDoTitulo={titulo}
            valor={problema}
            opcoes={PROBLEMAS.map((p) => ({ valor: p, nome: NOME_DO_PROBLEMA[p] }))}
            aoMudar={(v) => escolherProblema(v as Problema)}
          />
        )}

        {fase === "perguntas" && atual && (
          <PerguntaAtual
            key={atual.id}
            idBase={id}
            pergunta={atual}
            valor={respostas[atual.id] ?? ""}
            hoje={hoje}
            Sub={Sub}
            refDoTitulo={titulo}
            erro={erro}
            aoMudar={responder}
          />
        )}

        {fase !== "resultado" && (
          <div className="mt-6 print:hidden">
            <p role="alert" className="min-h-6 text-sm text-red-700">
              {fase === "problema" ? erro : ""}
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              {fase === "perguntas" && (
                <button type="button" className={estiloDoBotao} onClick={voltar}>
                  Voltar
                </button>
              )}
              <button type="button" className={botaoPrincipal} onClick={avancar}>
                {fase === "perguntas" && indice + 1 >= total ? "Ver o diagnóstico" : "Continuar"}
              </button>
            </div>
          </div>
        )}

        {resultado?.ok && (
          <Resultado
            d={resultado.diagnostico}
            Sub={Sub}
            refDoTitulo={titulo}
            endereco={endereco}
            registrar={registrar}
            aoEditar={() => (total > 0 ? ir("perguntas", 0) : ir("problema"))}
            aoRecomecar={recomecar}
          />
        )}
      </div>

      <p className="mt-6 text-xs leading-5 text-muted">
        Diagnóstico informativo, com as regras conferidas em {revisao} (CDC e Decreto 7.962/2013). Não substitui a
        orientação de um advogado ou da Defensoria Pública e não garante resultado. As respostas ficam só no seu
        navegador: nada é enviado ou guardado.{" "}
        <Link href="/calculadoras/simulador-direitos-compras-online#como-o-simulador-funciona" className={link}>
          Como o simulador funciona
        </Link>
      </p>
    </section>
  );
}

function Opcoes({
  nome,
  titulo,
  ajuda,
  Sub,
  refDoTitulo,
  valor,
  opcoes,
  aoMudar,
  descricao,
}: {
  nome: string;
  titulo: string;
  ajuda?: string;
  Sub: "h3" | "h4";
  refDoTitulo: Ref<HTMLHeadingElement>;
  valor: string;
  opcoes: { valor: string; nome: string; dica?: string }[];
  aoMudar: (v: string) => void;
  descricao?: string;
}) {
  return (
    <fieldset aria-describedby={descricao}>
      <legend className="w-full">
        <Sub ref={refDoTitulo} tabIndex={-1} className="font-serif text-xl focus:outline-none">
          {titulo}
        </Sub>
      </legend>
      {ajuda && <p className="mt-2 text-sm leading-6 text-muted">{ajuda}</p>}
      <div className="mt-4 grid gap-2">
        {opcoes.map((o) => (
          <label
            key={o.valor}
            className="flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm has-[:checked]:border-gold has-[:checked]:bg-gold/10 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold/60"
          >
            <input
              type="radio"
              name={nome}
              value={o.valor}
              checked={valor === o.valor}
              onChange={() => aoMudar(o.valor)}
              className="mt-0.5 accent-[var(--accent)]"
            />
            <span>
              <span className="font-medium">{o.nome}</span>
              {o.dica && <span className="mt-0.5 block text-muted">{o.dica}</span>}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function PerguntaAtual({
  idBase,
  pergunta,
  valor,
  hoje,
  Sub,
  refDoTitulo,
  erro,
  aoMudar,
}: {
  idBase: string;
  pergunta: Pergunta;
  valor: string;
  hoje: string;
  Sub: "h3" | "h4";
  refDoTitulo: Ref<HTMLHeadingElement>;
  erro: string;
  aoMudar: (v: string) => void;
}) {
  const idDoErro = `${idBase}-erro-${pergunta.id}`;
  if (pergunta.tipo === "opcoes")
    return (
      <>
        <Opcoes
          nome={`${idBase}-${pergunta.id}`}
          titulo={pergunta.texto}
          ajuda={pergunta.ajuda}
          Sub={Sub}
          refDoTitulo={refDoTitulo}
          valor={valor}
          opcoes={pergunta.opcoes ?? []}
          aoMudar={aoMudar}
          descricao={erro ? idDoErro : undefined}
        />
        <p id={idDoErro} role="alert" className="mt-2 min-h-6 text-sm text-red-700">
          {erro}
        </p>
      </>
    );
  const idDoCampo = `${idBase}-${pergunta.id}`;
  const naoSei = valor === "nao-sei";
  return (
    <div>
      <Sub ref={refDoTitulo} tabIndex={-1} className="font-serif text-xl focus:outline-none">
        <label htmlFor={idDoCampo}>{pergunta.texto}</label>
      </Sub>
      {pergunta.ajuda && <p className="mt-2 text-sm leading-6 text-muted">{pergunta.ajuda}</p>}
      <input
        id={idDoCampo}
        type="date"
        value={naoSei ? "" : valor}
        max={pergunta.id === "prometida" ? undefined : hoje}
        onChange={(e) => aoMudar(e.target.value)}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? idDoErro : undefined}
        className={`${estiloDoCampo} mt-4 sm:max-w-xs`}
      />
      {pergunta.naoSei && (
        <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={naoSei}
            onChange={(e) => aoMudar(e.target.checked ? "nao-sei" : "")}
            className="size-4 accent-[var(--accent)]"
          />
          {pergunta.naoSei}
        </label>
      )}
      <p id={idDoErro} role="alert" className="mt-2 min-h-6 text-sm text-red-700">
        {erro}
      </p>
    </div>
  );
}

function Fontes({ ids }: { ids: IdDaFonte[] }) {
  if (ids.length === 0) return null;
  const unicos = [...new Map(ids.map((f) => [FONTES[f].curto, f])).values()];
  return (
    <span className="block text-xs text-muted">
      {unicos.length > 1 ? "Fontes: " : "Fonte: "}
      {unicos.map((f, i) => (
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

function Lista({ itens, ordenada = false }: { itens: ReactNode[]; ordenada?: boolean }) {
  const Tag = ordenada ? "ol" : "ul";
  return (
    <Tag className={`mt-2 space-y-2 pl-5 text-sm leading-6 ${ordenada ? "list-decimal" : "list-disc"}`}>
      {itens.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </Tag>
  );
}

const textoDoItem = (i: Item) => (i.titulo ? `${i.titulo}: ${i.texto}` : i.texto);

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
  const [aviso, setAviso] = useState("");

  const texto = [
    `${d.titulo}.`,
    d.resumo,
    "",
    "O que você pode fazer:",
    ...d.alternativas.map((a) => `- ${textoDoItem(a)}`),
    ...(d.prazos.length ? ["", "Prazos:", ...d.prazos.map((p) => `- ${p.texto}`)] : []),
    ...(d.avisos.length ? ["", "Atenção:", ...d.avisos.map((a) => `- ${a.texto}`)] : []),
    "",
    "Seu plano de ação:",
    ...d.plano.map((p, i) => `${i + 1}. ${p}`),
    "",
    "Diagnóstico informativo; não substitui a orientação de um advogado ou da Defensoria Pública.",
    `Simulador: ${endereco}`,
  ].join("\n");

  async function compartilharFerramenta() {
    registrar("simulador_compras_compartilhado", { canal: "ferramenta" }, true);
    const dados = { title: "Simulador de direitos em compras online", url: endereco };
    try {
      if (navigator.share) {
        await navigator.share(dados);
        return;
      }
      await navigator.clipboard.writeText(endereco);
      setAviso("Link do simulador copiado.");
    } catch {
      setAviso("Não deu para compartilhar automaticamente. Copie o endereço da página.");
    }
  }

  const fontes = fontesDoDiagnostico(d);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">{NOME_DO_PROBLEMA[d.problema]}</p>
        <Sub ref={refDoTitulo} tabIndex={-1} className="mt-1 font-serif text-xl focus:outline-none">
          {d.titulo}
        </Sub>
        <p className="mt-2 text-sm leading-6">{d.resumo}</p>
      </div>

      <div>
        <Menor className="font-semibold">O que você pode fazer</Menor>
        <div className="mt-2 grid gap-3">
          {d.alternativas.map((a) => (
            <div key={a.id} className="rounded-xl border border-border bg-white px-4 py-3 text-sm leading-6">
              <p className="font-medium">{a.titulo}</p>
              <p className="mt-1">
                {a.texto}
                <Fontes ids={a.fontes} />
              </p>
            </div>
          ))}
        </div>
      </div>

      {d.prazos.length > 0 && (
        <div>
          <Menor className="font-semibold">Prazos</Menor>
          <Lista
            itens={d.prazos.map((p) => (
              <>
                {p.passou && <strong>Já passou: </strong>}
                {p.texto}
                <Fontes ids={p.fontes} />
              </>
            ))}
          />
        </div>
      )}

      {d.avisos.length > 0 && (
        <div className="rounded-xl border border-gold/50 bg-gold/10 px-4 py-3">
          <Menor className="font-semibold">Atenção ao seu caso</Menor>
          <Lista
            itens={d.avisos.map((a) => (
              <>
                {a.texto}
                <Fontes ids={a.fontes} />
              </>
            ))}
          />
        </div>
      )}

      <div>
        <Menor className="font-semibold">Seu plano de ação</Menor>
        <Lista ordenada itens={d.plano} />
      </div>

      <div>
        <Menor className="font-semibold">Documentos para reunir</Menor>
        <Lista itens={d.documentos} />
      </div>

      <div>
        <Menor className="font-semibold">Onde reclamar</Menor>
        <Lista
          itens={d.canais.map((c) => (
            <>
              <strong>{c.titulo}:</strong> {c.texto}
              <Fontes ids={c.fontes} />
            </>
          ))}
        />
      </div>

      {d.links.length > 0 && (
        <nav aria-label="Artigos e ferramentas relacionados" className="print:hidden">
          <Menor className="font-semibold">Leia também</Menor>
          <Lista
            itens={d.links.map((l) => (
              <Link
                key={l.id}
                href={l.href}
                className={link}
                onClick={() => registrar("simulador_compras_cta_clicado", { problema: d.problema, destino: l.href }, true)}
              >
                {l.texto}
              </Link>
            ))}
          />
        </nav>
      )}

      <p className="text-xs leading-5 text-muted">
        Fontes:{" "}
        {fontes.map((f, i) => (
          <span key={f}>
            {i > 0 && "; "}
            <a href={FONTES[f].url} target="_blank" rel="noopener noreferrer" className={link}>
              {FONTES[f].nome}
            </a>
          </span>
        ))}
        . Este diagnóstico é informativo, não promete resultado nem indenização.
      </p>

      <Compartilhar
        texto={texto}
        aoCompartilhar={(canal) => registrar("simulador_compras_compartilhado", { canal }, true)}
      />
      <div className="flex flex-wrap gap-3 print:hidden">
        <button type="button" className={estiloDoBotao} onClick={compartilharFerramenta}>
          Compartilhar o simulador
        </button>
        <button type="button" className={estiloDoBotao} onClick={aoEditar}>
          Mudar as respostas
        </button>
        <button type="button" className={estiloDoBotao} onClick={aoRecomecar}>
          Simular outro problema
        </button>
      </div>
      <p aria-live="polite" className="text-sm text-muted print:hidden">
        {aviso}
      </p>
    </div>
  );
}
