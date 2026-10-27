"use client";

// Calculadora de juros abusivos: descobre a taxa do contrato, compara com a média do
// Banco Central da mesma modalidade e mostra o mesmo contrato à taxa média. A conta é
// feita no navegador (src/lib/juros) e nada do que a pessoa digita é enviado ou guardado;
// o Analytics só recebe a modalidade e categorias fixas, nunca valores ou taxas.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, type Ref, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { hojeEmBrasilia } from "@/components/fgts/comum";
import { ExplicacaoJuridica, FONTES, Fora, link, textoDoSinal } from "@/components/juros/textos";
import { Campo, Compartilhar, Escolha, estiloDoBotao } from "@/components/partes-da-calculadora";
import { registrarEvento } from "@/lib/analitico";
import { lerReais, reais } from "@/lib/dinheiro";
import { type AnaliseDeJuros, analisarJuros, type CampoDeJuros, type ErroDeJuros, type Sistema } from "@/lib/juros/analise.ts";
import { mensalParaAnual, percentual, type LinhaDaTabela } from "@/lib/juros/financeiro.ts";
import { EH_ROTATIVO, MODALIDADES, type Modalidade, NOME_DA_MODALIDADE, SUBTIPOS } from "@/lib/juros/modalidades.ts";
import { SERIES_ATUALIZADAS_EM, SERIES_BCB } from "@/lib/juros/series-bcb.ts";
import { formatarData, lerData, paraTexto } from "@/lib/trabalhista/datas.ts";

const nadaParaOuvir = () => () => {};
const botaoPrincipal =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60";
const nomeDoMes = (m: { ano: number; mes: number }) =>
  `${["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"][m.mes - 1]} de ${m.ano}`;

// Máscara de moeda: os dígitos entram pela direita (1 → 0,01)
function mascararReais(texto: string) {
  const digitos = texto.replace(/\D/g, "").replace(/^0+/, "").slice(0, 10);
  if (!digitos) return "";
  const cheio = digitos.padStart(3, "0");
  return `${cheio.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${cheio.slice(-2)}`;
}

const centavos = (texto: string) => {
  const l = lerReais(texto);
  return l.tipo === "valido" ? l.centavos : 0;
};

// "2,5" ou "2,5%" → 0,025; vazio → null; inválido → NaN
function lerPercentual(texto: string): number | null {
  const limpo = texto.replace(/%|\s/g, "").replace(",", ".");
  if (!limpo) return null;
  if (!/^\d+(\.\d{1,4})?$/.test(limpo)) return Number.NaN;
  return Number(limpo) / 100;
}

type Dados = {
  data: string;
  recebido: string;
  financiado: string;
  parcela: string;
  parcelas: string;
  sistema: Sistema;
  taxaMensal: string;
  taxaAnual: string;
  cet: string;
  encargos: string;
  pagas: string;
  saldo: string;
};

const VAZIO: Dados = {
  data: "",
  recebido: "",
  financiado: "",
  parcela: "",
  parcelas: "",
  sistema: "price",
  taxaMensal: "",
  taxaAnual: "",
  cet: "",
  encargos: "",
  pagas: "",
  saldo: "",
};

type Resposta = "" | "sim" | "nao";
const PERGUNTAS = [
  { id: "copia", texto: "Você recebeu uma cópia do contrato?" },
  { id: "cet", texto: "O CET foi informado antes de você assinar?" },
  { id: "seguros", texto: "Existem seguros ou tarifas que você não reconhece?" },
  { id: "alteracao", texto: "As parcelas mudaram de valor sem você esperar?" },
  { id: "pediu", texto: "Você já pediu esclarecimentos ao banco?" },
  { id: "respondeu", texto: "O banco respondeu?" },
] as const;
type IdDaPergunta = (typeof PERGUNTAS)[number]["id"];

export function CalculadoraJurosAbusivos({ nivelDoTitulo = 3 }: { nivelDoTitulo?: 2 | 3 }) {
  const id = useId();
  const Titulo = nivelDoTitulo === 2 ? "h2" : "h3";
  const Sub = nivelDoTitulo === 2 ? "h3" : "h4";
  const endereco = `https://direitodeverdade.com.br${usePathname() ?? "/calculadoras/juros-abusivos"}`;
  const hoje = useSyncExternalStore(nadaParaOuvir, () => paraTexto(hojeEmBrasilia()), () => SERIES_ATUALIZADAS_EM);

  const [etapa, setEtapa] = useState<1 | 2 | 3>(1);
  const [modalidade, setModalidade] = useState<Modalidade | "">("");
  const [subtipo, setSubtipo] = useState("");
  const [d, setD] = useState<Dados>(VAZIO);
  const [avancado, setAvancado] = useState(false);
  const [erros, setErros] = useState<ErroDeJuros[]>([]);
  const [aviso, setAviso] = useState("");
  const titulo = useRef<HTMLHeadingElement>(null);
  const mudou = useRef(false);

  const registrados = useRef(new Set<string>());
  const registrar = (nome: string, parametros: Record<string, string> = {}, repetir = false) => {
    const chave = `${nome}:${JSON.stringify(parametros)}`;
    if (!repetir && registrados.current.has(chave)) return;
    registrados.current.add(chave);
    registrarEvento(nome, parametros);
  };
  useEffect(() => {
    registrar("juros_simulador_visualizado");
  }, []);
  useEffect(() => {
    if (mudou.current) titulo.current?.focus();
  }, [etapa]);

  const ir = (nova: 1 | 2 | 3) => {
    mudou.current = true;
    setAviso("");
    setEtapa(nova);
  };
  const mudar = (campo: keyof Dados, valor: string) => {
    setD((atual) => ({ ...atual, [campo]: valor }));
    setErros([]);
  };
  const rotativo = modalidade ? EH_ROTATIVO[modalidade] : false;

  const entrada = () => {
    const pct = (t: string) => {
      const v = lerPercentual(t);
      return v === null ? null : v;
    };
    return {
      modalidade: (modalidade || "outro") as Modalidade,
      subtipo: subtipo || undefined,
      data: d.data,
      hoje,
      valorRecebido: rotativo ? 0 : centavos(d.recebido),
      valorFinanciado: rotativo || !avancado ? 0 : centavos(d.financiado),
      parcela: rotativo ? 0 : centavos(d.parcela),
      parcelas: rotativo ? 0 : /^\d+$/.test(d.parcelas.trim()) ? Number(d.parcelas) : d.parcelas.trim() ? -1 : 0,
      sistema: d.sistema,
      taxaMensal: !rotativo && !avancado ? null : pct(d.taxaMensal),
      taxaAnual: avancado ? pct(d.taxaAnual) : null,
      cetAnual: avancado ? pct(d.cet) : null,
      encargosAParte: avancado && !rotativo ? centavos(d.encargos) : 0,
      parcelasPagas: avancado && !rotativo && /^\d+$/.test(d.pagas.trim()) ? Number(d.pagas) : 0,
      saldo: rotativo ? centavos(d.saldo) : 0,
    };
  };

  const avancarModalidade = () => {
    if (!modalidade) return setAviso("Escolha o tipo de crédito.");
    if (SUBTIPOS[modalidade] && !subtipo) return setAviso("Responda à pergunta sobre o tipo de crédito.");
    ir(2);
  };

  const calcular = () => {
    const e = entrada();
    // Percentuais inválidos viram erro antes da conta
    const invalidos: ErroDeJuros[] = (
      [
        ["taxaMensal", e.taxaMensal],
        ["taxaAnual", e.taxaAnual],
        ["cetAnual", e.cetAnual],
      ] as [CampoDeJuros, number | null][]
    )
      .filter(([, v]) => v !== null && Number.isNaN(v))
      .map(([campo]) => ({ campo, mensagem: "Use só números, com vírgula: 2,5 para 2,5%." }));
    const r = invalidos.length ? null : analisarJuros(e);
    const todos = invalidos.length ? invalidos : r && !r.ok ? r.erros : [];
    if (todos.length) {
      setErros(todos);
      setAviso(`Confira ${todos.length === 1 ? "o campo marcado" : "os campos marcados"}.`);
      return;
    }
    if (r?.ok) {
      if (r.taxa) registrar("juros_taxa_calculada", { modalidade: e.modalidade, origem: r.taxa.origem }, true);
      registrar(
        "juros_comparacao_exibida",
        { modalidade: e.modalidade, posicao: !r.referencia.ok ? "sem-referencia" : !r.comparacao ? "sem-taxa" : r.comparacao.diferencaPp > 0.005 ? "acima" : "abaixo" },
        true,
      );
    }
    ir(3);
  };

  const erroDe = (campo: CampoDeJuros) => erros.find((e) => e.campo === campo)?.mensagem;
  const resultado = etapa === 3 ? analisarJuros(entrada()) : null;

  return (
    <section
      id="calculadora-de-juros"
      aria-labelledby={`${id}-titulo`}
      data-track="artigo:ferramenta-inline"
      className="my-10 scroll-mt-6 rounded-2xl border border-border bg-surface p-5 sm:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">Calculadora</p>
      <Titulo id={`${id}-titulo`} className="mt-2 font-serif text-2xl leading-snug">
        Seus juros estão acima da média?
      </Titulo>

      {etapa < 3 && (
        <div className="mt-5 print:hidden">
          <p className="text-sm text-muted">
            Etapa {etapa} de 2: <span className="font-medium text-foreground">{etapa === 1 ? "o tipo de crédito" : "os dados do contrato"}</span>
          </p>
          <div className="mt-2 grid grid-cols-2 gap-1.5" aria-hidden="true">
            <span className="h-1.5 rounded-full bg-gold" />
            <span className={`h-1.5 rounded-full ${etapa === 2 ? "bg-gold" : "bg-border"}`} />
          </div>
        </div>
      )}

      <div className="mt-6">
        {etapa === 1 && (
          <div className="space-y-6">
            <fieldset>
              <legend className="w-full">
                <Sub ref={titulo} tabIndex={-1} className="font-serif text-xl focus:outline-none">
                  Qual é o tipo de crédito?
                </Sub>
              </legend>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {MODALIDADES.map((m) => (
                  <label
                    key={m}
                    className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium has-[:checked]:border-gold has-[:checked]:bg-gold/10 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold/60"
                  >
                    <input
                      type="radio"
                      name={`${id}-modalidade`}
                      value={m}
                      checked={modalidade === m}
                      onChange={() => {
                        registrar("juros_simulador_iniciado");
                        registrar("juros_modalidade_selecionada", { modalidade: m }, true);
                        setModalidade(m);
                        setSubtipo("");
                        setAviso("");
                      }}
                      className="accent-[var(--accent)]"
                    />
                    {NOME_DA_MODALIDADE[m]}
                  </label>
                ))}
              </div>
            </fieldset>
            {modalidade && SUBTIPOS[modalidade] && (
              <fieldset>
                <legend className="text-sm font-medium">{SUBTIPOS[modalidade].pergunta}</legend>
                {SUBTIPOS[modalidade].ajuda && <p className="mt-1 text-xs leading-5 text-muted">{SUBTIPOS[modalidade].ajuda}</p>}
                <div className="mt-2 grid gap-2">
                  {SUBTIPOS[modalidade].opcoes.map((o) => (
                    <label
                      key={o.valor}
                      className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-border bg-white px-4 py-2 text-sm has-[:checked]:border-gold has-[:checked]:bg-gold/10 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold/60"
                    >
                      <input
                        type="radio"
                        name={`${id}-subtipo`}
                        value={o.valor}
                        checked={subtipo === o.valor}
                        onChange={() => {
                          setSubtipo(o.valor);
                          setAviso("");
                        }}
                        className="accent-[var(--accent)]"
                      />
                      {o.nome}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
          </div>
        )}

        {etapa === 2 && modalidade && (
          <div>
            <Sub ref={titulo} tabIndex={-1} className="font-serif text-xl focus:outline-none">
              {rotativo ? "Qual é a taxa e o valor da dívida?" : "Os dados do contrato"}
            </Sub>
            <p className="mt-2 text-sm leading-6 text-muted">
              {rotativo
                ? "A taxa está na fatura do cartão ou no extrato da conta. "
                : "Preencha o que você tiver; o resto pode ficar em branco. "}
              Não pedimos CPF, número do contrato nem dados do banco.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {rotativo ? (
                <>
                  <Campo
                    id={`${id}-taxa`}
                    rotulo="Taxa de juros ao mês (%)"
                    exemplo="Ex.: 12,5"
                    valor={d.taxaMensal}
                    aoMudar={(v) => mudar("taxaMensal", v)}
                    erro={erroDe("taxaMensal")}
                  />
                  <Campo
                    id={`${id}-saldo`}
                    rotulo={modalidade === "rotativo" ? "Valor que ficou no rotativo (R$)" : "Valor usado do limite (R$)"}
                    exemplo="0,00"
                    valor={d.saldo}
                    aoMudar={(v) => mudar("saldo", mascararReais(v))}
                    erro={erroDe("saldo")}
                    dica="Opcional, para ver os juros em reais."
                  />
                </>
              ) : (
                <>
                  <Campo
                    id={`${id}-recebido`}
                    rotulo="Valor que você recebeu (R$)"
                    exemplo="0,00"
                    valor={d.recebido}
                    aoMudar={(v) => mudar("recebido", mascararReais(v))}
                    erro={erroDe("valorRecebido")}
                    dica="O que caiu na sua conta ou foi pago ao vendedor."
                  />
                  <Campo
                    id={`${id}-parcelas`}
                    rotulo="Número de parcelas"
                    modo="numeric"
                    exemplo="Ex.: 48"
                    valor={d.parcelas}
                    aoMudar={(v) => mudar("parcelas", v.replace(/\D/g, "").slice(0, 3))}
                    erro={erroDe("parcelas")}
                  />
                  <Campo
                    id={`${id}-parcela`}
                    rotulo={d.sistema === "sac" ? "Valor da primeira parcela (R$)" : "Valor de cada parcela (R$)"}
                    exemplo="0,00"
                    valor={d.parcela}
                    aoMudar={(v) => mudar("parcela", mascararReais(v))}
                    erro={erroDe("parcela")}
                  />
                </>
              )}
              <Campo
                id={`${id}-data`}
                rotulo="Data da contratação"
                tipo="date"
                valor={d.data}
                aoMudar={(v) => mudar("data", v)}
                erro={erroDe("data")}
                dica="Para comparar com a média do mesmo mês."
              />
            </div>

            <button
              type="button"
              className={`${estiloDoBotao} mt-5`}
              aria-expanded={avancado}
              aria-controls={`${id}-avancado`}
              onClick={() => setAvancado((a) => !a)}
            >
              {avancado ? "− Menos detalhes" : "+ Mais detalhes do contrato (taxa, CET, tarifas)"}
            </button>
            {avancado && (
              <div id={`${id}-avancado`} className="mt-4 grid gap-4 sm:grid-cols-2">
                {!rotativo && (
                  <Campo
                    id={`${id}-financiado`}
                    rotulo="Valor financiado no contrato (R$)"
                    exemplo="0,00"
                    valor={d.financiado}
                    aoMudar={(v) => mudar("financiado", mascararReais(v))}
                    erro={erroDe("valorFinanciado")}
                    dica="Pode ser maior que o recebido, se incluir tarifas, seguros ou IOF."
                  />
                )}
                {!rotativo && (
                  <Campo
                    id={`${id}-taxa-mensal`}
                    rotulo="Taxa de juros ao mês (%)"
                    exemplo="Ex.: 2,35"
                    valor={d.taxaMensal}
                    aoMudar={(v) => mudar("taxaMensal", v)}
                    erro={erroDe("taxaMensal")}
                    dica="Está no contrato, como “taxa de juros mensal”."
                  />
                )}
                <Campo
                  id={`${id}-taxa-anual`}
                  rotulo="Taxa de juros ao ano (%)"
                  exemplo="Ex.: 32,14"
                  valor={d.taxaAnual}
                  aoMudar={(v) => mudar("taxaAnual", v)}
                  erro={erroDe("taxaAnual")}
                />
                <Campo
                  id={`${id}-cet`}
                  rotulo="CET ao ano (%)"
                  exemplo="Ex.: 38,50"
                  valor={d.cet}
                  aoMudar={(v) => mudar("cet", v)}
                  erro={erroDe("cetAnual")}
                  dica="Custo Efetivo Total: juros mais tarifas, seguros e IOF."
                />
                {!rotativo && (
                  <>
                    <Campo
                      id={`${id}-encargos`}
                      rotulo="Tarifas e seguros pagos à parte (R$)"
                      exemplo="0,00"
                      valor={d.encargos}
                      aoMudar={(v) => mudar("encargos", mascararReais(v))}
                      erro={erroDe("encargosAParte")}
                      dica="Só o que você pagou fora das parcelas."
                    />
                    <Escolha
                      id={`${id}-sistema`}
                      rotulo="Sistema de amortização"
                      valor={d.sistema}
                      opcoes={[
                        { valor: "price", nome: "Price (parcelas iguais) ou não sei" },
                        { valor: "sac", nome: "SAC (parcelas que diminuem)" },
                      ]}
                      aoMudar={(v) => mudar("sistema", v)}
                      dica="Empréstimos e veículos costumam ser Price; imóveis, SAC."
                    />
                    <Campo
                      id={`${id}-pagas`}
                      rotulo="Parcelas já pagas"
                      modo="numeric"
                      exemplo="Ex.: 10"
                      valor={d.pagas}
                      aoMudar={(v) => mudar("pagas", v.replace(/\D/g, "").slice(0, 3))}
                      erro={erroDe("parcelasPagas")}
                      dica="Para estimar o saldo e a quitação antecipada."
                    />
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {etapa < 3 && (
          <div className="mt-6 print:hidden">
            <p role="alert" className="min-h-6 text-sm text-red-700">
              {aviso}
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              {etapa === 2 && (
                <button type="button" className={estiloDoBotao} onClick={() => ir(1)}>
                  Voltar
                </button>
              )}
              <button type="button" className={botaoPrincipal} onClick={etapa === 1 ? avancarModalidade : calcular}>
                {etapa === 1 ? "Continuar" : "Calcular"}
              </button>
            </div>
          </div>
        )}

        {resultado?.ok && modalidade && (
          <Resultado
            r={resultado}
            Sub={Sub}
            refDoTitulo={titulo}
            endereco={endereco}
            dataDoContrato={d.data}
            registrar={registrar}
            aoEditar={() => ir(2)}
            aoRecomecar={() => {
              setModalidade("");
              setSubtipo("");
              setD(VAZIO);
              setAvancado(false);
              ir(1);
            }}
          />
        )}
      </div>

      <p className="mt-6 text-xs leading-5 text-muted">
        Médias de juros do Banco Central (séries do SGS) atualizadas em {formatarData(lerData(SERIES_ATUALIZADAS_EM)!)}. Uma
        taxa acima da média não comprova, sozinha, abusividade. A conta é feita no seu navegador e nada do que você digita é
        enviado ou guardado.{" "}
        <Link href="/calculadoras/juros-abusivos#como-funciona-a-calculadora" className={link}>
          Como funciona a calculadora
        </Link>
      </p>
    </section>
  );
}

type Sucesso = Extract<AnaliseDeJuros, { ok: true }>;

function GraficoDeTaxas({ contrato, media }: { contrato: number; media: number }) {
  const maximo = Math.max(contrato, media) * 1.1;
  const barra = (v: number) => `${Math.max(2, (v / maximo) * 100)}%`;
  return (
    <figure className="rounded-xl border border-border bg-white px-4 py-4" aria-label="Comparação das taxas mensais">
      {[
        { nome: "Seu contrato", valor: contrato, cor: "bg-accent" },
        { nome: "Média do Banco Central", valor: media, cor: "bg-navy" },
      ].map((b) => (
        <div key={b.nome} className="mb-3 last:mb-0">
          <div className="flex justify-between text-sm">
            <span>{b.nome}</span>
            <span className="tabular-nums font-medium">{percentual(b.valor)} ao mês</span>
          </div>
          <div className="mt-1 h-3 rounded-full bg-border/60" aria-hidden="true">
            <div className={`h-3 rounded-full ${b.cor}`} style={{ width: barra(b.valor) }} />
          </div>
        </div>
      ))}
    </figure>
  );
}

// Evolução do saldo devedor nos dois cenários (os números estão na tabela abaixo)
function GraficoDoSaldo({ a, b }: { a: LinhaDaTabela[]; b: LinhaDaTabela[] | null }) {
  const L = 320;
  const A = 150;
  const M = { esq: 6, dir: 6, topo: 10, base: 20 };
  const principal = a[0].saldo + a[0].amortizacao;
  const n = a.length;
  const x = (k: number) => M.esq + (k / n) * (L - M.esq - M.dir);
  const y = (v: number) => M.topo + (A - M.topo - M.base) * (1 - v / principal);
  const passo = Math.max(1, Math.floor(n / 60));
  const caminho = (t: LinhaDaTabela[]) =>
    [`M${x(0).toFixed(1)},${y(principal).toFixed(1)}`, ...t.filter((l, i) => i % passo === 0 || i === n - 1).map((l) => `L${x(l.numero).toFixed(1)},${y(l.saldo).toFixed(1)}`)].join(" ");
  const meio = Math.ceil(n / 2);
  return (
    <figure className="mt-3">
      <svg
        viewBox={`0 0 ${L} ${A}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Saldo devedor cai de ${reais(principal)} a zero em ${n} meses. Na metade do prazo, ${reais(a[meio - 1].saldo)} no contrato${b ? ` e ${reais(b[meio - 1].saldo)} à taxa média` : ""}.`}
      >
        <line x1={M.esq} x2={L - M.dir} y1={A - M.base} y2={A - M.base} stroke="var(--border)" />
        {b && <path d={caminho(b)} fill="none" stroke="var(--navy)" strokeWidth={2} strokeDasharray="5 4" />}
        <path d={caminho(a)} fill="none" stroke="var(--accent)" strokeWidth={2.5} />
        <text x={M.esq} y={A - 5} fontSize="10" fill="var(--muted)">
          mês 0
        </text>
        <text x={L - M.dir} y={A - 5} fontSize="10" fill="var(--muted)" textAnchor="end">
          mês {n}
        </text>
      </svg>
      <figcaption className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-0.5 w-5 bg-accent" /> Saldo devedor do contrato
        </span>
        {b && (
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block h-0.5 w-5 border-t-2 border-dashed border-navy" /> À taxa média
          </span>
        )}
      </figcaption>
    </figure>
  );
}

function Tabela({ linhas }: { linhas: LinhaDaTabela[] }) {
  return (
    <div className="mt-2 max-h-96 overflow-auto rounded-xl border border-border bg-white" role="region" aria-label="Tabela de amortização" tabIndex={0}>
      <table className="w-full text-xs tabular-nums sm:text-sm">
        <caption className="sr-only">Tabela de amortização do contrato, mês a mês</caption>
        <thead className="sticky top-0 bg-white">
          <tr className="border-b border-border text-right text-muted">
            <th scope="col" className="px-2 py-2 text-left font-medium">Mês</th>
            <th scope="col" className="px-2 py-2 font-medium">Parcela</th>
            <th scope="col" className="px-2 py-2 font-medium">Juros</th>
            <th scope="col" className="px-2 py-2 font-medium">Amortização</th>
            <th scope="col" className="px-2 py-2 font-medium">Saldo</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.numero} className="border-b border-border/60 text-right last:border-0">
              <th scope="row" className="px-2 py-1.5 text-left font-normal">{l.numero}</th>
              <td className="px-2 py-1.5">{reais(l.parcela)}</td>
              <td className="px-2 py-1.5">{reais(l.juros)}</td>
              <td className="px-2 py-1.5">{reais(l.amortizacao)}</td>
              <td className="px-2 py-1.5">{reais(l.saldo)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Resultado({
  r,
  Sub,
  refDoTitulo,
  endereco,
  dataDoContrato,
  registrar,
  aoEditar,
  aoRecomecar,
}: {
  r: Sucesso;
  Sub: "h3" | "h4";
  refDoTitulo: Ref<HTMLHeadingElement>;
  endereco: string;
  dataDoContrato: string;
  registrar: (nome: string, parametros?: Record<string, string>, repetir?: boolean) => void;
  aoEditar: () => void;
  aoRecomecar: () => void;
}) {
  const Menor = Sub === "h3" ? "h4" : "h5";
  const [respostas, setRespostas] = useState<Record<IdDaPergunta, Resposta>>({
    copia: "",
    cet: "",
    seguros: "",
    alteracao: "",
    pediu: "",
    respondeu: "",
  });
  const [aviso, setAviso] = useState("");
  const ref = r.referencia;
  const caixa = useRef<HTMLDivElement>(null);
  // No PDF e na impressão, a memória de cálculo sai aberta
  useEffect(() => {
    const abertos: HTMLDetailsElement[] = [];
    const abrir = () =>
      caixa.current?.querySelectorAll<HTMLDetailsElement>("details[data-imprimir]").forEach((el) => {
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
  const nome = NOME_DA_MODALIDADE[r.modalidade];
  const artigo = (href: string, texto: string) => (
    <Link href={href} className={link} onClick={() => registrar("juros_artigo_clicado", { destino: href }, true)}>
      {texto}
    </Link>
  );

  const linhasDaTabela: { nome: string; contrato: string; referencia: string }[] = [];
  if (r.taxa)
    linhasDaTabela.push(
      { nome: "Taxa mensal", contrato: percentual(r.taxa.mensal), referencia: ref.ok ? percentual(ref.taxaMensal) : "—" },
      { nome: "Taxa anual (efetiva)", contrato: percentual(r.taxa.anual), referencia: ref.ok ? percentual(mensalParaAnual(ref.taxaMensal)) : "—" },
    );
  if (r.cenarioA)
    linhasDaTabela.push(
      { nome: r.cenarioA.parcela === r.cenarioA.ultimaParcela ? "Parcela" : "Primeira parcela", contrato: reais(r.cenarioA.parcela), referencia: r.cenarioB ? reais(r.cenarioB.parcela) : "—" },
      { nome: "Total das parcelas", contrato: reais(r.cenarioA.total), referencia: r.cenarioB ? reais(r.cenarioB.total) : "—" },
      { nome: "Juros", contrato: reais(r.cenarioA.juros), referencia: r.cenarioB ? reais(r.cenarioB.juros) : "—" },
    );
  if (r.rotativo_)
    linhasDaTabela.push({
      nome: "Juros de um mês",
      contrato: reais(r.rotativo_.jurosDoMes),
      referencia: r.rotativo_.jurosDoMesNaMedia !== null ? reais(r.rotativo_.jurosDoMesNaMedia) : "—",
    });

  const pontos: ReactNode[] = [];
  if (respostas.copia === "nao")
    pontos.push(
      <>Peça a cópia do contrato ao banco, por escrito. Você tem direito à informação clara sobre o que contratou, e cláusulas que você não teve chance de conhecer não obrigam (CDC, artigos 6º, III, e 46).</>,
    );
  if (respostas.cet === "nao")
    pontos.push(<>O CET e o demonstrativo de cálculo têm de ser informados antes da contratação e constar do contrato (Resolução CMN 4.881/2020, artigo 7º). Peça o demonstrativo.</>);
  if (respostas.seguros === "sim")
    pontos.push(<>Seguro ou tarifa que você não pediu merece verificação: condicionar o crédito a outro produto é venda casada (CDC, artigo 39, I). Peça o detalhamento de cada cobrança.</>);
  if (respostas.alteracao === "sim")
    pontos.push(<>Veja no contrato se a taxa é pós-fixada ou se há indexador (TR, IPCA), e peça o demonstrativo da dívida mostrando o motivo da mudança.</>);
  if (respostas.pediu === "sim" && respostas.respondeu === "nao")
    pontos.push(<>Sem resposta do banco, registre reclamação no Banco Central: a instituição tem até 10 dias úteis para responder por escrito.</>);

  const resumo = [
    `Análise de juros: ${nome.toLowerCase()} contratado em ${dataDoContrato ? formatarData(lerData(dataDoContrato)!) : "data não informada"}.`,
    ...linhasDaTabela.map((l) => `${l.nome}: contrato ${l.contrato}; referência ${l.referencia}.`),
    ...(ref.ok ? [`Referência: ${SERIES_BCB[ref.serie].nome} (Banco Central, SGS ${ref.serie}), ${nomeDoMes(ref.mes)}.`] : [`Sem referência: ${ref.detalhe}`]),
    ...r.memoria,
    "Hipóteses: " + r.hipoteses.join(" "),
    "Uma taxa acima da média do Banco Central não comprova, por si só, abusividade. O cenário à taxa média é uma comparação matemática, não um valor devido.",
    `Calculado em ${endereco}`,
  ].join("\n");

  async function compartilharFerramenta() {
    registrar("juros_compartilhamento", { canal: "ferramenta" }, true);
    try {
      if (navigator.share) return void (await navigator.share({ title: "Calculadora de juros abusivos", url: endereco }));
      await navigator.clipboard.writeText(endereco);
      setAviso("Link da calculadora copiado.");
    } catch {
      setAviso("Não deu para compartilhar automaticamente. Copie o endereço da página.");
    }
  }

  return (
    <div ref={caixa} className="space-y-6">
      <div>
        <Sub ref={refDoTitulo} tabIndex={-1} className="font-serif text-xl focus:outline-none">
          Análise do seu {nome.toLowerCase()}
        </Sub>
        {r.taxa && (
          <p className="mt-2 text-sm leading-6">
            Taxa do contrato: <strong>{percentual(r.taxa.mensal)} ao mês</strong> ({percentual(r.taxa.anual)} ao ano)
            {r.taxa.origem.startsWith("calculada") ? ", calculada a partir das parcelas" : ", informada por você"}.
            {r.taxaSobreORecebido && r.taxa.origem !== "calculada-recebido" && Math.abs(r.taxaSobreORecebido.mensal - r.taxa.mensal) > 0.0005 && (
              <> Sobre o dinheiro que você recebeu, o custo efetivo fica em {percentual(r.taxaSobreORecebido.mensal)} ao mês.</>
            )}
          </p>
        )}
      </div>

      {r.faltando.length > 0 && (
        <div className="rounded-xl border border-border bg-white px-4 py-3 text-sm leading-6">
          <p className="font-medium">Para uma análise completa, falta:</p>
          <ul className="mt-1 list-disc pl-5">
            {r.faltando.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      {linhasDaTabela.length > 0 && (
        <dl className="divide-y divide-border rounded-xl border border-border bg-white text-sm sm:hidden">
          {linhasDaTabela.map((l) => (
            <div key={l.nome} className="px-3 py-2.5">
              <dt className="font-medium">{l.nome}</dt>
              <dd className="mt-1 grid grid-cols-2 gap-2 tabular-nums">
                <span>
                  <span className="block text-xs text-muted">Contrato</span>
                  {l.contrato}
                </span>
                <span>
                  <span className="block text-xs text-muted">Referência</span>
                  {l.referencia}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      )}
      {linhasDaTabela.length > 0 && (
        <div className="hidden overflow-hidden rounded-xl border border-border bg-white sm:block">
          <table className="w-full text-sm">
            <caption className="sr-only">Contrato comparado com a referência do Banco Central</caption>
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th scope="col" className="px-2 py-2 sm:px-3 font-medium">Indicador</th>
                <th scope="col" className="px-2 py-2 sm:px-3 text-right font-medium">Contrato</th>
                <th scope="col" className="px-2 py-2 sm:px-3 text-right font-medium">Referência</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {linhasDaTabela.map((l) => (
                <tr key={l.nome} className="border-b border-border last:border-0">
                  <th scope="row" className="px-2 py-2 sm:px-3 text-left font-medium">{l.nome}</th>
                  <td className="px-2 py-2 sm:px-3 text-right">{l.contrato}</td>
                  <td className="px-2 py-2 sm:px-3 text-right">{l.referencia}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {r.taxa && ref.ok && r.comparacao && (
        <div>
          <Menor className="font-semibold">O que isso significa?</Menor>
          <GraficoDeTaxas contrato={r.taxa.mensal} media={ref.taxaMensal} />
          <p className="mt-3 text-sm leading-6">
            Diferença: <strong>{r.comparacao.diferencaPp.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} ponto(s) percentual(is) ao mês</strong>.
            Em termos relativos, a taxa do contrato é {percentual(Math.abs(r.comparacao.relativa), 0)} {r.comparacao.relativa >= 0 ? "maior" : "menor"} que a média.
          </p>
        </div>
      )}
      {!ref.ok && (
        <p className="rounded-xl border border-border bg-white px-4 py-3 text-sm leading-6">
          <strong>Sem comparação segura:</strong> {ref.detalhe} Não usamos a média de outro tipo de crédito no lugar, porque o
          resultado enganaria.
        </p>
      )}

      {r.sinais.length > 0 && (
        <div className="rounded-xl border border-gold/50 bg-gold/10 px-4 py-3">
          <Menor className="font-semibold">Pontos que merecem verificação</Menor>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6">
            {r.sinais.map((s) => (
              <li key={s.id}>{textoDoSinal(s)}</li>
            ))}
          </ul>
        </div>
      )}

      {r.cenarioA && (
        <div>
          <Menor className="font-semibold">Cenário A (seu contrato) e cenário B (mesmo valor e prazo, à taxa média)</Menor>
          {r.cenarioB && (
            <p className="mt-2 text-sm leading-6">
              À taxa média, a parcela {r.cenarioA.parcela === r.cenarioA.ultimaParcela ? "" : "inicial "}seria{" "}
              <strong>{reais(r.cenarioB.parcela)}</strong> e o total, <strong>{reais(r.cenarioB.total)}</strong>: diferença de{" "}
              {reais(Math.abs(r.cenarioB.diferencaMensal))} na parcela e {reais(Math.abs(r.cenarioB.diferencaTotal))} no total
              {r.cenarioB.diferencaTotal >= 0 ? " a mais no seu contrato" : " a menos no seu contrato"}.{" "}
              <strong>O cenário B é uma comparação matemática, não um valor juridicamente devido.</strong>
            </p>
          )}
          <GraficoDoSaldo a={r.cenarioA.tabela} b={r.cenarioB?.tabela ?? null} />
          {r.custo && (
            <dl className="mt-3 divide-y divide-border rounded-xl border border-border bg-white text-sm">
              {[
                ["Valor recebido", reais(r.custo.recebido)],
                ["Total das parcelas", reais(r.custo.totalDasParcelas)],
                ["Juros estimados", reais(r.custo.juros)],
                ...(r.custo.encargosFinanciados ? [["Encargos financiados (financiado − recebido)", reais(r.custo.encargosFinanciados)]] : []),
                ...(r.custo.encargosAParte ? [["Tarifas e seguros pagos à parte", reais(r.custo.encargosAParte)]] : []),
                ["Custo total estimado", reais(r.custo.custoTotal)],
              ].map(([n, v], i, todos) => (
                <div key={n} className="flex items-baseline justify-between gap-4 px-4 py-2.5">
                  <dt className={i === todos.length - 1 ? "font-semibold" : "text-muted"}>{n}</dt>
                  <dd className={`whitespace-nowrap tabular-nums ${i === todos.length - 1 ? "font-semibold" : ""}`}>{v}</dd>
                </div>
              ))}
            </dl>
          )}
          {r.andamento && r.andamento.liquidacao.parcelasRestantes > 0 && (
            <p className="mt-3 text-sm leading-6">
              Depois de {r.andamento.pagas} parcela(s) paga(s), o saldo devedor estimado, que é o valor para quitar hoje
              descontando os juros futuros à taxa do contrato, fica perto de <strong>{reais(r.andamento.saldo)}</strong>, em
              vez dos {reais(r.andamento.liquidacao.somaDasRestantes)} das {r.andamento.liquidacao.parcelasRestantes} parcelas
              restantes.
              É uma estimativa: o valor exato depende das condições do contrato; peça ao banco o cálculo oficial, sem tarifa.
            </p>
          )}
          <details className="mt-3 rounded-xl border border-border bg-white px-4 py-3 text-sm print:hidden">
            <summary className="cursor-pointer font-medium">Tabela de amortização do contrato ({r.cenarioA.tabela.length} meses)</summary>
            <Tabela linhas={r.cenarioA.tabela} />
          </details>
        </div>
      )}

      {ref.ok && (
        <p className="text-xs leading-5 text-muted">
          Referência: <Fora href={SERIES_BCB[ref.serie].pagina}>{SERIES_BCB[ref.serie].nome}</Fora> (Banco Central, SGS{" "}
          {ref.serie}), média de {nomeDoMes(ref.mes)}
          {ref.defasada ? ", a mais recente divulgada" : ""}. É a taxa média das novas operações do mês, ponderada pelo valor; não
          considera o seu perfil de risco, garantias ou prazo. Dados baixados em {formatarData(lerData(ref.atualizadaEm)!)}.
        </p>
      )}

      <details data-imprimir className="rounded-xl border border-border bg-white px-4 py-3 text-sm leading-6">
        <summary className="cursor-pointer font-medium">Memória de cálculo e hipóteses</summary>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          {r.memoria.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ol>
        {r.hipoteses.length > 0 && (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
            {r.hipoteses.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        )}
      </details>

      <div>
        <Menor className="font-semibold">O que diz a lei</Menor>
        <div className="mt-2">
          <ExplicacaoJuridica />
        </div>
      </div>

      <div className="print:hidden">
        <Menor className="font-semibold">Quer conferir mais pontos?</Menor>
        <p className="mt-1 text-sm text-muted">Opcional. As respostas não mudam a conta, só os pontos a verificar.</p>
        <div className="mt-3 space-y-3">
          {PERGUNTAS.filter((p) => p.id !== "respondeu" || respostas.pediu === "sim").map((p) => (
            <fieldset key={p.id}>
              <legend className="text-sm font-medium">{p.texto}</legend>
              <div className="mt-1.5 flex gap-2">
                {(["sim", "nao"] as const).map((v) => (
                  <label
                    key={v}
                    className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm has-[:checked]:border-gold has-[:checked]:bg-gold/10 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold/60"
                  >
                    <input
                      type="radio"
                      name={`diagnostico-${p.id}`}
                      checked={respostas[p.id] === v}
                      onChange={() => setRespostas((a) => ({ ...a, [p.id]: v }))}
                      className="accent-[var(--accent)]"
                    />
                    {v === "sim" ? "Sim" : "Não"}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
        {pontos.length > 0 && (
          <ul aria-live="polite" className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">
            {pontos.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <Menor className="font-semibold">Próximos passos</Menor>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6">
          <li>
            Peça ao banco a cópia do contrato e o demonstrativo da dívida. A lista dos seus empréstimos está no{" "}
            <Fora href={FONTES.scr.url}>relatório do Registrato</Fora>, gratuito, com a conta gov.br.
          </li>
          <li>Confira no contrato a taxa de juros mensal e anual e o CET, e compare com o que você pagou.</li>
          <li>Verifique tarifas e seguros: peça o detalhamento de cada um e o cancelamento do que você não contratou.</li>
          <li>Peça esclarecimentos por escrito ao SAC e, sem solução, à ouvidoria do banco; anote os protocolos.</li>
          <li>
            Sem resposta, reclame no <Fora href={FONTES.reclamacaoBc.url}>Banco Central</Fora> (o banco tem 10 dias úteis para
            responder), no <Fora href={FONTES.consumidorGov.url}>Consumidor.gov.br</Fora> ou no Procon: veja{" "}
            {artigo("/artigos/como-reclamar-procon", "como reclamar no Procon")}.
          </li>
          <li>
            Se houver indícios relevantes, procure um advogado ou a Defensoria Pública. Se você pagou tarifa ou seguro que não
            contratou, simule a devolução na {artigo("/calculadoras/cobranca-indevida", "calculadora de cobrança indevida")}; se o
            nome foi negativado, veja {artigo("/artigos/nome-sujo", "como limpar o nome")}.
          </li>
        </ol>
      </div>

      <Compartilhar
        texto={resumo}
        aoCompartilhar={(canal) =>
          canal === "imprimir" ? registrar("juros_pdf_gerado", {}, true) : registrar("juros_compartilhamento", { canal }, true)
        }
      />
      <div className="flex flex-wrap gap-3 print:hidden">
        <button type="button" className={estiloDoBotao} onClick={compartilharFerramenta}>
          Compartilhar a calculadora
        </button>
        <button type="button" className={estiloDoBotao} onClick={aoEditar}>
          Corrigir os dados
        </button>
        <button type="button" className={estiloDoBotao} onClick={aoRecomecar}>
          Fazer nova simulação
        </button>
      </div>
      <p aria-live="polite" className="text-sm text-muted print:hidden">
        {aviso}
      </p>
    </div>
  );
}
