"use client";

// Calculadora de cobrança indevida, em 4 etapas: tipo do problema, pagamento, valores e
// situação. A conta é feita no navegador (src/lib/cobranca-indevida) e nada do que a
// pessoa digita é enviado ou guardado; o Analytics só recebe etapas e categorias fixas.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, type Ref, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { DOCUMENTOS, FONTES, Fundamentos, link, TEXTO_DO_AVISO } from "@/components/cobranca-indevida/textos";
import { hojeEmBrasilia } from "@/components/fgts/comum";
import { Campo, Compartilhar, estiloDoBotao, Linha } from "@/components/partes-da-calculadora";
import { registrarEvento } from "@/lib/analitico";
import {
  calcularCobrancaIndevida,
  type CampoComErro,
  type ErroDaCobranca,
  type ResultadoDaCobranca,
  type SituacaoDoPagamento,
} from "@/lib/cobranca-indevida/calculo.ts";
import { NOME_DO_PROBLEMA, REGRAS_DA_COBRANCA as R, TIPOS_DE_PROBLEMA, type TipoDeProblema } from "@/lib/cobranca-indevida/regras.ts";
import { lerReais, reais } from "@/lib/dinheiro";
import { formatarData, lerData, paraTexto } from "@/lib/trabalhista/datas.ts";

type Etapa = 1 | 2 | 3 | 4 | 5;
type SimNao = "" | "sim" | "nao";
type Pergunta = "reclamou" | "justificativa" | "continua" | "negativado" | "processo";
type LinhaDigitada = { chave: number; data: string; cobrado: string; devido: string; pago: string; repeticoes: string };

const NOMES_DAS_ETAPAS = ["O problema", "O pagamento", "Os valores", "A situação"];

const PAGAMENTOS: { valor: SituacaoDoPagamento; nome: string; dica: string }[] = [
  { valor: "integral", nome: "Sim, paguei tudo", dica: "Paguei o valor cobrado inteiro." },
  { valor: "parcial", nome: "Paguei uma parte", dica: "Paguei só o que eu achava correto, ou parte da conta." },
  { valor: "nao", nome: "Não paguei", dica: "A cobrança chegou, mas não paguei." },
  { valor: "incerto", nome: "Não tenho certeza", dica: "Pode ter caído no débito automático ou no cartão." },
];

const PERGUNTAS: { chave: Pergunta; texto: string }[] = [
  { chave: "reclamou", texto: "Você já reclamou com a empresa?" },
  { chave: "justificativa", texto: "A empresa deu alguma explicação para a cobrança?" },
  { chave: "continua", texto: "A cobrança continua vindo?" },
  { chave: "negativado", texto: "Seu nome foi negativado por causa dela?" },
  { chave: "processo", texto: "Já existe processo na Justiça sobre essa cobrança?" },
];

// Máscara de moeda: os dígitos entram pela direita, como no app do banco (1 → 0,01).
// Um 0 sozinho vira 0,00; apagar o 0,00 limpa o campo.
function mascararReais(texto: string, anterior: string) {
  const bruto = texto.replace(/\D/g, "");
  const digitos = bruto.replace(/^0+/, "").slice(0, 10);
  if (!digitos) return bruto && texto.length >= anterior.length ? "0,00" : "";
  const cheio = digitos.padStart(3, "0");
  const inteiros = cheio.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${inteiros},${cheio.slice(-2)}`;
}

const centavos = (texto: string) => {
  const leitura = lerReais(texto);
  return leitura.tipo === "valido" ? leitura.centavos : 0;
};

const linhaVazia = (chave: number): LinhaDigitada => ({ chave, data: "", cobrado: "", devido: "", pago: "", repeticoes: "1" });

const revisao = formatarData(lerData(R.revisadoEm)!);
const nadaParaOuvir = () => () => {};

export function CalculadoraCobrancaIndevida({ nivelDoTitulo = 3 }: { nivelDoTitulo?: 2 | 3 }) {
  const id = useId();
  const Titulo = nivelDoTitulo === 2 ? "h2" : "h3";
  const Sub = nivelDoTitulo === 2 ? "h3" : "h4";
  const endereco = `https://direitodeverdade.com.br${usePathname() ?? "/calculadoras/cobranca-indevida"}`;
  const hoje = useSyncExternalStore(nadaParaOuvir, () => paraTexto(hojeEmBrasilia()), () => R.revisadoEm);

  const [etapa, setEtapa] = useState<Etapa>(1);
  const [tipo, setTipo] = useState<TipoDeProblema | "">("");
  const [pagamento, setPagamento] = useState<SituacaoDoPagamento | "">("");
  const [linhas, setLinhas] = useState<LinhaDigitada[]>([linhaVazia(0)]);
  const [devolveu, setDevolveu] = useState<SimNao>("");
  const [devolvido, setDevolvido] = useState("");
  const [dataDaDevolucao, setDataDaDevolucao] = useState("");
  const [respostas, setRespostas] = useState<Record<Pergunta, SimNao>>({
    reclamou: "",
    justificativa: "",
    continua: "",
    negativado: "",
    processo: "",
  });
  const [faltando, setFaltando] = useState("");
  const [erros, setErros] = useState<ErroDaCobranca[]>([]);
  const proximaChave = useRef(1);
  const tituloDaEtapa = useRef<HTMLHeadingElement>(null);
  const mudouDeEtapa = useRef(false);

  // Eventos do Analytics só com etapas e categorias fixas, nunca com valores ou datas
  const registrados = useRef(new Set<string>());
  const registrar = (nome: string, parametros: Record<string, string | number | boolean> = {}, repetir = false) => {
    const chave = `${nome}:${JSON.stringify(parametros)}`;
    if (!repetir && registrados.current.has(chave)) return;
    registrados.current.add(chave);
    registrarEvento(nome, parametros);
  };
  useEffect(() => {
    registrar("calculadora_cobranca_visualizada");
  }, []);
  // Leva o foco ao título da etapa nova, para teclado e leitor de tela
  useEffect(() => {
    if (mudouDeEtapa.current) tituloDaEtapa.current?.focus();
  }, [etapa]);

  const pagou = pagamento !== "" && pagamento !== "nao";
  const pedePago = pagamento === "parcial" || pagamento === "incerto";

  const entrada = () => ({
    tipo: tipo || "outro",
    pagamento: pagamento || "integral",
    linhas: linhas.map((l) => ({
      data: l.data,
      cobrado: centavos(l.cobrado),
      devido: centavos(l.devido),
      pago: centavos(l.pago),
      repeticoes: /^\d+$/.test(l.repeticoes.trim()) ? Number(l.repeticoes) : 0,
    })),
    devolvido: pagou && devolveu === "sim" ? centavos(devolvido) : 0,
    dataDaDevolucao: pagou && devolveu === "sim" ? dataDaDevolucao : "",
    hoje,
  });

  const irPara = (nova: Etapa) => {
    mudouDeEtapa.current = true;
    setFaltando("");
    setEtapa(nova);
  };

  const avancar = () => {
    if (etapa === 1 && !tipo) return setFaltando("Escolha o tipo de problema.");
    if (etapa === 2 && !pagamento) return setFaltando("Escolha uma opção.");
    if (etapa === 3) {
      const r = calcularCobrancaIndevida(entrada());
      // Campo vazio não vira zero sem a pessoa dizer: o valor correto e o pago são obrigatórios
      const invalidos = linhas.flatMap((l, i) =>
        (pedePago ? (["cobrado", "devido", "pago"] as const) : (["cobrado", "devido"] as const)).flatMap((campo) => {
          const leitura = lerReais(l[campo]);
          if (leitura.tipo === "invalido") return [{ linha: i, campo, mensagem: leitura.mensagem } as ErroDaCobranca];
          if (leitura.tipo === "vazio" && campo !== "cobrado")
            return [{ linha: i, campo, mensagem: "Informe o valor (0,00 se for nada)." } as ErroDaCobranca];
          return [];
        }),
      );
      const devolvidoInvalido =
        pagou && devolveu === "sim" && centavos(devolvido) === 0
          ? [{ linha: null, campo: "devolvido" as const, mensagem: "Informe quanto foi devolvido." }]
          : [];
      const todos = [...invalidos, ...devolvidoInvalido, ...(r.ok ? [] : r.erros)];
      setErros(todos);
      if (todos.length > 0) {
        setFaltando(`Confira ${todos.length === 1 ? "o campo marcado" : `os ${todos.length} campos marcados`}.`);
        return;
      }
    }
    registrar("calculadora_cobranca_etapa_concluida", { etapa });
    if (etapa === 4) {
      const r = calcularCobrancaIndevida(entrada());
      if (r.ok)
        registrar(
          "calculadora_cobranca_resultado",
          { situacao: r.situacao, tipo_problema: tipo, pagamento, varias_cobrancas: r.parcelas.length > 1 },
          true,
        );
    }
    irPara((etapa + 1) as Etapa);
  };

  const erroDe = (linha: number | null, campo: CampoComErro) =>
    erros.find((e) => e.linha === linha && e.campo === campo)?.mensagem;

  const mudarLinha = (chave: number, campo: keyof Omit<LinhaDigitada, "chave">, valor: string) => {
    setLinhas((atuais) => atuais.map((l) => (l.chave === chave ? { ...l, [campo]: valor } : l)));
    setErros([]);
    setFaltando("");
  };

  const escolherTipo = (valor: TipoDeProblema) => {
    registrar("calculadora_cobranca_iniciada");
    setTipo(valor);
    setFaltando("");
  };

  const recomecar = () => {
    setTipo("");
    setPagamento("");
    setLinhas([linhaVazia(proximaChave.current++)]);
    setDevolveu("");
    setDevolvido("");
    setDataDaDevolucao("");
    setRespostas({ reclamou: "", justificativa: "", continua: "", negativado: "", processo: "" });
    setErros([]);
    irPara(1);
  };

  const resultado = etapa === 5 ? calcularCobrancaIndevida(entrada()) : null;

  return (
    <section
      id="calculadora-de-cobranca-indevida"
      aria-labelledby={`${id}-titulo`}
      data-track="artigo:ferramenta-inline"
      className="my-10 scroll-mt-6 rounded-2xl border border-border bg-surface p-5 sm:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">Calculadora</p>
      <Titulo id={`${id}-titulo`} className="mt-2 font-serif text-2xl leading-snug">
        Quanto você pode receber de volta?
      </Titulo>

      {etapa <= 4 && (
        <div className="mt-5 print:hidden">
          <p className="text-sm text-muted">
            Etapa {etapa} de 4: <span className="font-medium text-foreground">{NOMES_DAS_ETAPAS[etapa - 1]}</span>
          </p>
          <div className="mt-2 grid grid-cols-4 gap-1.5" aria-hidden="true">
            {NOMES_DAS_ETAPAS.map((nome, i) => (
              <span key={nome} className={`h-1.5 rounded-full ${i < etapa ? "bg-gold" : "bg-border"}`} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        {etapa === 1 && (
          <Grupo
            idBase={`${id}-tipo`}
            titulo="Qual é o problema?"
            Sub={Sub}
            refDoTitulo={tituloDaEtapa}
            valor={tipo}
            opcoes={TIPOS_DE_PROBLEMA.map((t) => ({ valor: t, nome: NOME_DO_PROBLEMA[t] }))}
            aoMudar={escolherTipo}
          />
        )}

        {etapa === 2 && (
          <Grupo
            idBase={`${id}-pagamento`}
            titulo="Você pagou a cobrança?"
            Sub={Sub}
            refDoTitulo={tituloDaEtapa}
            valor={pagamento}
            opcoes={PAGAMENTOS}
            aoMudar={(v) => {
              setPagamento(v);
              setFaltando("");
            }}
          />
        )}

        {etapa === 3 && (
          <div>
            <Sub ref={tituloDaEtapa} tabIndex={-1} className="font-serif text-xl focus:outline-none">
              Quanto foi cobrado e quanto deveria ser?
            </Sub>
            <p className="mt-2 text-sm leading-6 text-muted">
              Uma linha por cobrança. Se a mesma cobrança se repetiu todo mês, use uma linha só e diga quantos meses.
              Não pedimos nome, CPF nem número de contrato.
            </p>
            <div className="mt-4 space-y-4">
              {linhas.map((l, i) => (
                <fieldset key={l.chave} className="rounded-xl border border-border bg-white p-4">
                  <legend className="px-1 text-sm font-medium">Cobrança {i + 1}</legend>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Campo
                      id={`${id}-data-${l.chave}`}
                      rotulo={pagou ? "Data do pagamento" : "Data da cobrança (vencimento)"}
                      tipo="date"
                      valor={l.data}
                      aoMudar={(v) => mudarLinha(l.chave, "data", v)}
                      erro={erroDe(i, "data")}
                    />
                    <Campo
                      id={`${id}-repeticoes-${l.chave}`}
                      rotulo="Quantos meses seguidos?"
                      modo="numeric"
                      valor={l.repeticoes}
                      aoMudar={(v) => mudarLinha(l.chave, "repeticoes", v.replace(/\D/g, "").slice(0, 3))}
                      erro={erroDe(i, "repeticoes")}
                      dica="1 se foi uma vez só."
                    />
                    <Campo
                      id={`${id}-cobrado-${l.chave}`}
                      rotulo="Valor cobrado (R$)"
                      exemplo="0,00"
                      valor={l.cobrado}
                      aoMudar={(v) => mudarLinha(l.chave, "cobrado", mascararReais(v, l.cobrado))}
                      erro={erroDe(i, "cobrado")}
                    />
                    <Campo
                      id={`${id}-devido-${l.chave}`}
                      rotulo="Valor que deveria ser cobrado (R$)"
                      exemplo="0,00"
                      valor={l.devido}
                      aoMudar={(v) => mudarLinha(l.chave, "devido", mascararReais(v, l.devido))}
                      erro={erroDe(i, "devido")}
                      dica="0,00 se nada era devido (serviço não contratado, cobrança repetida)."
                    />
                    {pedePago && (
                      <Campo
                        id={`${id}-pago-${l.chave}`}
                        rotulo="Valor que você pagou (R$)"
                        exemplo="0,00"
                        valor={l.pago}
                        aoMudar={(v) => mudarLinha(l.chave, "pago", mascararReais(v, l.pago))}
                        erro={erroDe(i, "pago")}
                      />
                    )}
                  </div>
                  {linhas.length > 1 && (
                    <button
                      type="button"
                      className={`${estiloDoBotao} mt-3`}
                      onClick={() => {
                        setLinhas((atuais) => atuais.filter((x) => x.chave !== l.chave));
                        setErros([]);
                      }}
                    >
                      Remover cobrança {i + 1}
                    </button>
                  )}
                </fieldset>
              ))}
            </div>
            {erroDe(null, "linhas") && <p className="mt-2 text-sm text-red-700">{erroDe(null, "linhas")}</p>}
            {linhas.length < R.maximoDeLinhas && (
              <button
                type="button"
                className={`${estiloDoBotao} mt-4`}
                onClick={() => {
                  setLinhas((atuais) => [...atuais, linhaVazia(proximaChave.current++)]);
                  setErros([]);
                }}
              >
                + Outra cobrança, com outra data ou valor
              </button>
            )}

            {pagou && (
              <div className="mt-6 space-y-4">
                <Grupo
                  idBase={`${id}-devolveu`}
                  titulo="A empresa já devolveu algum valor?"
                  Sub="p"
                  valor={devolveu}
                  opcoes={[
                    { valor: "nao", nome: "Não" },
                    { valor: "sim", nome: "Sim" },
                  ]}
                  aoMudar={(v) => {
                    setDevolveu(v);
                    setErros([]);
                  }}
                  emLinha
                />
                {devolveu === "sim" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Campo
                      id={`${id}-devolvido`}
                      rotulo="Quanto foi devolvido (R$)"
                      exemplo="0,00"
                      valor={devolvido}
                      aoMudar={(v) => {
                        setDevolvido(mascararReais(v, devolvido));
                        setErros([]);
                      }}
                      erro={erroDe(null, "devolvido")}
                      dica="Estorno, crédito na conta ou desconto na fatura."
                    />
                    <Campo
                      id={`${id}-data-devolucao`}
                      rotulo="Data da devolução"
                      tipo="date"
                      valor={dataDaDevolucao}
                      aoMudar={(v) => {
                        setDataDaDevolucao(v);
                        setErros([]);
                      }}
                      erro={erroDe(null, "dataDaDevolucao")}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {etapa === 4 && (
          <div>
            <Sub ref={tituloDaEtapa} tabIndex={-1} className="font-serif text-xl focus:outline-none">
              Como está a situação?
            </Sub>
            <p className="mt-2 text-sm leading-6 text-muted">
              Opcional. As respostas não mudam a conta: só ajustam os próximos passos.
            </p>
            <div className="mt-4 space-y-4">
              {PERGUNTAS.map((p) => (
                <Grupo
                  key={p.chave}
                  idBase={`${id}-${p.chave}`}
                  titulo={p.texto}
                  Sub="p"
                  valor={respostas[p.chave]}
                  opcoes={[
                    { valor: "sim", nome: "Sim" },
                    { valor: "nao", nome: "Não" },
                  ]}
                  aoMudar={(v) => setRespostas((atuais) => ({ ...atuais, [p.chave]: v }))}
                  emLinha
                />
              ))}
            </div>
          </div>
        )}

        {etapa <= 4 && (
          <div className="mt-6 print:hidden">
            <p role="alert" className="min-h-6 text-sm text-red-700">
              {faltando}
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              {etapa > 1 && (
                <button type="button" className={estiloDoBotao} onClick={() => irPara((etapa - 1) as Etapa)}>
                  Voltar
                </button>
              )}
              <button
                type="button"
                onClick={avancar}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
              >
                {etapa === 4 ? "Ver o resultado" : "Continuar"}
              </button>
            </div>
          </div>
        )}

        {resultado?.ok && tipo && pagamento && (
          <Resultado
            r={resultado}
            tipo={tipo}
            pagamento={pagamento}
            respostas={respostas}
            Sub={Sub}
            refDoTitulo={tituloDaEtapa}
            endereco={endereco}
            hoje={hoje}
            registrar={registrar}
            aoEditar={() => irPara(3)}
            aoRecomecar={recomecar}
          />
        )}
      </div>

      <p className="mt-6 text-xs leading-5 text-muted">
        Simulação com as regras conferidas em {revisao} (CDC, Código Civil, STJ e IPCA do IBGE). A conta é feita no seu
        navegador e nada do que você digita é enviado ou guardado.{" "}
        <Link href="/calculadoras/cobranca-indevida#como-funciona-o-calculo" className={link}>
          Como funciona o cálculo
        </Link>
      </p>
    </section>
  );
}

// Opções em lista (com dica) ou em linha (Sim/Não), em um fieldset com legenda
function Grupo<T extends string>({
  idBase,
  titulo,
  Sub,
  refDoTitulo,
  valor,
  opcoes,
  aoMudar,
  emLinha = false,
}: {
  idBase: string;
  titulo: string;
  Sub: "h3" | "h4" | "p";
  refDoTitulo?: Ref<HTMLHeadingElement>;
  valor: T | "";
  opcoes: { valor: T; nome: string; dica?: string }[];
  aoMudar: (v: T) => void;
  emLinha?: boolean;
}) {
  return (
    <fieldset>
      <legend className="w-full">
        {Sub === "p" ? (
          <span className="text-sm font-medium">{titulo}</span>
        ) : (
          <Sub ref={refDoTitulo} tabIndex={-1} className="font-serif text-xl focus:outline-none">
            {titulo}
          </Sub>
        )}
      </legend>
      <div className={emLinha ? "mt-2 flex flex-wrap gap-2" : "mt-4 grid gap-2 sm:grid-cols-2"}>
        {opcoes.map((o) => (
          <label
            key={o.valor}
            className={`flex min-h-11 cursor-pointer items-start gap-3 border border-border bg-white text-sm has-[:checked]:border-gold has-[:checked]:bg-gold/10 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold/60 ${
              emLinha ? "items-center rounded-full px-4 py-2" : "rounded-xl px-4 py-3"
            }`}
          >
            <input
              type="radio"
              name={idBase}
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

type Sucesso = Extract<ResultadoDaCobranca, { ok: true }>;

function Resultado({
  r,
  tipo,
  pagamento,
  respostas,
  Sub,
  refDoTitulo,
  endereco,
  hoje,
  registrar,
  aoEditar,
  aoRecomecar,
}: {
  r: Sucesso;
  tipo: TipoDeProblema;
  pagamento: SituacaoDoPagamento;
  respostas: Record<Pergunta, SimNao>;
  Sub: "h3" | "h4";
  refDoTitulo: Ref<HTMLHeadingElement>;
  endereco: string;
  hoje: string;
  registrar: (nome: string, parametros?: Record<string, string | number | boolean>, repetir?: boolean) => void;
  aoEditar: () => void;
  aoRecomecar: () => void;
}) {
  const Menor = Sub === "h3" ? "h4" : "h5";
  const artigo = (href: string, texto: string) => (
    <Link
      href={href}
      className={link}
      onClick={() => registrar("calculadora_cobranca_artigo_clicado", { destino: href }, true)}
    >
      {texto}
    </Link>
  );

  const titulo =
    r.situacao === "com-excesso"
      ? "Simulação da restituição"
      : r.situacao === "sem-pagamento"
        ? "Sem pagamento, não há valor a restituir"
        : "Pelo que você informou, não houve pagamento a mais";

  const passos = proximosPassos(r, tipo, respostas, artigo);
  const documentos = [...DOCUMENTOS[tipo], ...DOCUMENTOS.geral];

  const resumo = [
    `Simulação de cobrança indevida (${formatarData(lerData(hoje)!)}): ${NOME_DO_PROBLEMA[tipo].toLowerCase()}; pagamento: ${PAGAMENTOS.find((p) => p.valor === pagamento)?.nome.toLowerCase()}.`,
    ...r.memoria,
    "A restituição em dobro depende dos requisitos previstos na legislação e da análise das circunstâncias da cobrança. Os valores apresentados são simulações, não uma garantia de recebimento.",
    `Calculado em ${endereco}`,
  ].join("\n");

  return (
    <div className="space-y-6">
      <Sub ref={refDoTitulo} tabIndex={-1} className="font-serif text-xl focus:outline-none">
        {titulo}
      </Sub>

      {r.situacao === "com-excesso" && (
        <>
          <p className="text-sm leading-6">
            Pelo que você informou, você pagou <strong>{reais(r.excesso)}</strong> a mais
            {r.devolvido > 0 && (
              <>
                {" "}
                e a empresa já devolveu <strong>{reais(r.devolvido)}</strong>
              </>
            )}
            . A lei prevê a devolução em dobro, salvo engano justificável; se o engano for justificável, a devolução é
            simples. Por isso mostramos os dois cenários, que <strong>não se somam</strong>.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { nome: "Restituição simples", c: r.simples },
              { nome: "Restituição em dobro", c: r.dobro },
            ].map(({ nome, c }) => (
              <div key={nome} className="rounded-xl border border-border bg-white">
                <p className="px-4 pt-3 font-medium">{nome}</p>
                <dl className="divide-y divide-border text-sm">
                  <Linha nome="Sem correção" valor={reais(c.principal)} />
                  <Linha nome="Com correção pelo IPCA" valor={reais(c.total)} destaque />
                </dl>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted">Juros: não incluídos (veja abaixo). Os dois cenários não se somam.</p>
          <p className="rounded-xl border border-gold/50 bg-gold/10 px-4 py-3 text-sm leading-6">
            A restituição em dobro depende dos requisitos previstos na legislação e da análise das circunstâncias da
            cobrança. Os valores apresentados são simulações, não uma garantia de recebimento.
          </p>
          <p className="text-sm leading-6 text-muted">
            <strong className="text-foreground">Por que os juros ficaram de fora:</strong> nas cobranças de contrato, os
            juros de mora contam, em regra, da citação no processo (Código Civil, artigo 405), e a taxa legal muda todo
            mês (Selic menos IPCA, calculada pelo Banco Central). Sem essa data, qualquer número seria chute. Com ela,
            dá para calcular na{" "}
            <a href={FONTES.calculadoraDoCidadao} target="_blank" rel="noopener noreferrer" className={link}>
              Calculadora do Cidadão do Banco Central
            </a>
            , na opção da taxa legal.
            {tipo === "telecom" &&
              " Na telefonia, internet e TV, a regra da Anatel prevê juros de 1% ao mês na devolução em dobro, que também não estão na conta."}
          </p>
        </>
      )}

      {r.situacao === "sem-pagamento" && (
        <p className="text-sm leading-6">
          O direito à devolução, simples ou em dobro, é sobre o que foi <strong>pago</strong> (CDC, artigo 42). Como
          você não pagou, o caminho é <strong>contestar</strong> a cobrança
          {r.contestavel > 0 && (
            <>
              : pelo que você informou, <strong>{reais(r.contestavel)}</strong> foram cobrados acima do correto
            </>
          )}
          .
        </p>
      )}

      {r.situacao === "sem-excesso" && (
        <p className="text-sm leading-6">
          Você pagou até o valor correto, então não há o que restituir.
          {r.contestavel > 0 && (
            <>
              {" "}
              Ainda assim, <strong>{reais(r.contestavel)}</strong> foram cobrados acima do correto: conteste essa
              diferença antes de pagar.
            </>
          )}
        </p>
      )}

      {r.avisos.length > 0 && (
        <div>
          <Menor className="font-semibold">Atenção ao seu caso</Menor>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6">
            {r.avisos.map((a) => (
              <li key={a}>{TEXTO_DO_AVISO[a]}</li>
            ))}
          </ul>
        </div>
      )}

      <details className="rounded-xl border border-border bg-white px-4 py-3 text-sm leading-6 print:hidden">
        <summary className="cursor-pointer font-medium">Memória de cálculo</summary>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          {r.memoria.map((linha, i) => (
            <li key={i}>{linha}</li>
          ))}
        </ol>
      </details>
      {/* Na impressão, a memória sai aberta */}
      <div className="hidden text-sm leading-6 print:block">
        <Menor className="font-semibold">Memória de cálculo</Menor>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          {r.memoria.map((linha, i) => (
            <li key={i}>{linha}</li>
          ))}
        </ol>
      </div>

      <div>
        <Menor className="font-semibold">Próximos passos</Menor>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6">
          {passos.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ol>
      </div>

      <div>
        <Menor className="font-semibold">Documentos para separar</Menor>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
          {documentos.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </div>

      <div className="text-sm leading-6">
        <Menor className="font-semibold">Base legal</Menor>
        <div className="mt-2">
          <Fundamentos />
        </div>
      </div>

      <Compartilhar
        texto={resumo}
        aoCompartilhar={(canal) =>
          canal === "imprimir"
            ? registrar("calculadora_cobranca_pdf", {}, true)
            : registrar("calculadora_cobranca_compartilhamento", { canal }, true)
        }
      />

      <div className="flex flex-wrap gap-3 print:hidden">
        <button type="button" className={estiloDoBotao} onClick={aoEditar}>
          Corrigir os valores
        </button>
        <button type="button" className={estiloDoBotao} onClick={aoRecomecar}>
          Fazer outra simulação
        </button>
      </div>
    </div>
  );
}

function proximosPassos(
  r: Sucesso,
  tipo: TipoDeProblema,
  respostas: Record<Pergunta, SimNao>,
  artigo: (href: string, texto: string) => ReactNode,
) {
  const passos: ReactNode[] = [];
  const fora = (href: string, texto: string) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className={link}>
      {texto}
    </a>
  );

  if (respostas.reclamou === "sim")
    passos.push(
      <>
        Você já reclamou: guarde o número do protocolo. O SAC tem 7 dias corridos para responder e, em cobrança
        indevida, deve suspender a cobrança na hora ({fora(FONTES.sac, "Decreto 11.034/2022, artigo 13")}).
      </>,
    );
  else
    passos.push(
      <>
        Reclame no SAC da empresa{r.situacao === "com-excesso" ? " e peça a devolução por escrito, citando o artigo 42 do CDC" : ""}.
        Em cobrança indevida, ela deve suspender a cobrança na hora e responder em até 7 dias corridos (
        {fora(FONTES.sac, "Decreto 11.034/2022")}). Anote o protocolo.
      </>,
    );

  if (respostas.continua === "sim")
    passos.push(<>A cobrança continua vindo: peça o cancelamento e anote cada novo protocolo e cada fatura com o valor.</>);

  if (respostas.justificativa === "sim" && r.situacao === "com-excesso")
    passos.push(
      <>
        A empresa deu uma explicação. Se ela provar que foi um engano justificável, a devolução tende a ser simples, e
        quem tem de provar é ela, não você.
      </>,
    );

  if (tipo === "telecom")
    passos.push(
      <>
        Na operadora, você pode contestar a conta em até 3 anos, e ela tem 30 dias para responder; sem resposta, deve
        devolver ou cancelar a cobrança ({fora(FONTES.anatel, "Anatel")}). Sem solução, reclame na Anatel.
      </>,
    );
  if (tipo === "energia-agua")
    passos.push(
      <>
        Na conta de luz, a distribuidora que cobra a mais deve devolver em dobro, corrigido pelo IPCA, salvo se provar
        que o erro foi do consumidor ({fora(FONTES.aneel, "Aneel")}). Na conta de água, reclame na companhia e, sem
        solução, na agência reguladora do seu estado ou município.
      </>,
    );
  if (tipo === "duplicada" || tipo === "compra-cancelada" || tipo === "assinatura-cancelada")
    passos.push(
      <>Se a cobrança veio no cartão de crédito, conteste também na fatura: veja {artigo("/artigos/estorno-cartao-de-credito", "como pedir o estorno no cartão")}.</>,
    );
  if (tipo === "tarifa-bancaria")
    passos.push(<>No banco, depois do SAC, recorra à ouvidoria; sem solução, registre no Banco Central ou no Consumidor.gov.br.</>);

  passos.push(
    <>
      Sem solução, registre no {fora(FONTES.consumidorGov, "Consumidor.gov.br")} ou no Procon: o passo a passo está em{" "}
      {artigo("/artigos/como-reclamar-procon", "como reclamar no Procon e no Consumidor.gov.br")}.
    </>,
  );

  if (respostas.negativado === "sim")
    passos.push(
      <>
        Seu nome foi negativado: a negativação indevida gera dano moral presumido, segundo o STJ. Veja{" "}
        {artigo("/artigos/nome-sujo", "como tirar o nome do Serasa")}.
      </>,
    );

  if (respostas.processo === "sim")
    passos.push(
      <>
        Já existe processo: leve esta simulação a quem cuida do caso, sem perder os prazos do processo. Se a empresa
        entrou na Justiça cobrando dívida já paga, o Código Civil prevê que ela pague o dobro do que cobrou (artigo
        940), quando houver má-fé.
      </>,
    );
  else if (r.situacao === "com-excesso")
    passos.push(
      <>
        Ainda sem solução, o Juizado Especial Cível julga causas de até 20 salários mínimos (R$ 32.420 em 2026) sem
        advogado ({fora(FONTES.juizados, "Lei 9.099/1995")}). A Defensoria Pública pode ajudar quem não pode pagar
        advogado.
      </>,
    );

  passos.push(<>Entenda as regras em {artigo("/artigos/cobranca-indevida", "cobrança indevida: quando a devolução é em dobro")}.</>);
  return passos;
}
