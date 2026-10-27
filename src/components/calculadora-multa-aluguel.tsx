"use client";

// Calculadora de multa por quebra de contrato de aluguel, em 4 etapas: quem simula, a
// situação, os dados do contrato e as informações que mudam a regra. A conta é feita no
// navegador (src/lib/aluguel) e nada é enviado ou guardado; o Analytics só recebe o perfil,
// a situação e o desfecho, nunca valores ou datas.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, type Ref, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { FONTES, Fora, Fundamentos, link, TEXTO_DO_AVISO, TextoDaRetomada, TITULO_DO_DESFECHO } from "@/components/aluguel/textos";
import { hojeEmBrasilia } from "@/components/fgts/comum";
import { Campo, Compartilhar, estiloDoBotao } from "@/components/partes-da-calculadora";
import {
  avisoAte,
  calcularMultaDoAluguel,
  type CampoDaMulta,
  type EntradaDaMulta,
  type ErroDaMulta,
  type FormaDaMulta,
  type Perfil,
  periodoEmTexto,
  REGRAS_DA_MULTA as R,
  type ResultadoDaMulta,
  type SimNao,
  type Situacao,
  type TipoDeLocacao,
} from "@/lib/aluguel/multa.ts";
import { registrarEvento } from "@/lib/analitico";
import { lerReais, reais } from "@/lib/dinheiro";
import { compararDatas, formatarData, lerData, numeroDoDia, paraTexto, somarMeses } from "@/lib/trabalhista/datas.ts";

const nadaParaOuvir = () => () => {};
const botaoPrincipal =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60";
const cartao =
  "flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm has-[:checked]:border-gold has-[:checked]:bg-gold/10 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold/60";
const pilula =
  "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm has-[:checked]:border-gold has-[:checked]:bg-gold/10 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold/60";

function mascararReais(texto: string) {
  const digitos = texto.replace(/\D/g, "").replace(/^0+/, "").slice(0, 10);
  if (!digitos) return "";
  const cheio = digitos.padStart(3, "0");
  return `${cheio.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${cheio.slice(-2)}`;
}
const centavos = (t: string) => {
  const l = lerReais(t);
  return l.tipo === "valido" ? l.centavos : 0;
};

const PERFIS: { valor: Perfil; nome: string }[] = [
  { valor: "inquilino", nome: "Sou inquilino" },
  { valor: "proprietario", nome: "Sou proprietário" },
  { valor: "corretor", nome: "Sou corretor ou administrador" },
];

const SITUACOES = (perfil: Perfil): { valor: Situacao; nome: string; dica?: string }[] =>
  perfil === "inquilino"
    ? [
        { valor: "sair-antes", nome: "Quero sair antes do término do contrato" },
        { valor: "contrato-terminou", nome: "O contrato já terminou", dica: "Ou vai terminar antes da minha saída." },
        { valor: "proprietario-pediu", nome: "O proprietário pediu a desocupação" },
        { valor: "transferencia", nome: "Houve transferência de trabalho" },
        { valor: "clausula", nome: "Existe uma cláusula de rescisão que quero entender" },
        { valor: "descumprimento", nome: "Atrasei o aluguel ou houve outra infração" },
        { valor: "outro", nome: "Outro caso" },
      ]
    : [
        { valor: "sair-antes", nome: "O inquilino quer sair antecipadamente" },
        { valor: "contrato-terminou", nome: "O contrato já terminou" },
        { valor: "proprietario-pediu", nome: "O proprietário quer o imóvel de volta" },
        { valor: "transferencia", nome: "O inquilino foi transferido pelo trabalho" },
        { valor: "clausula", nome: "Existe uma cláusula de rescisão que quero entender" },
        { valor: "descumprimento", nome: "O inquilino atrasou o aluguel ou descumpriu o contrato" },
        { valor: "outro", nome: "Outro caso" },
      ];

type Dados = {
  aluguel: string;
  inicio: string;
  termino: string;
  usarMeses: boolean;
  prazoMeses: string;
  devolucao: string;
  forma: FormaDaMulta;
  alugueis: string;
  multaFixa: string;
  tipo: TipoDeLocacao;
  semProporcao: boolean;
  transferencia: SimNao;
  outraLocalidade: SimNao;
  aviso: SimNao;
  acordo: SimNao;
  valorAcordo: string;
  renovado: SimNao;
  encargosMensais: string;
  somarEncargos: boolean;
  alugueisPendentes: string;
  condominio: string;
  iptu: string;
  contas: string;
  outros: string;
  jaPagos: string;
};

const VAZIO: Dados = {
  aluguel: "",
  inicio: "",
  termino: "",
  usarMeses: false,
  prazoMeses: "",
  devolucao: "",
  forma: "alugueis",
  alugueis: "3",
  multaFixa: "",
  tipo: "residencial",
  semProporcao: false,
  transferencia: "",
  outraLocalidade: "",
  aviso: "",
  acordo: "",
  valorAcordo: "",
  renovado: "",
  encargosMensais: "",
  somarEncargos: false,
  alugueisPendentes: "",
  condominio: "",
  iptu: "",
  contas: "",
  outros: "",
  jaPagos: "",
};

const NOMES_DAS_ETAPAS = ["Quem simula", "A situação", "O contrato", "Detalhes"];

// Aluguéis de multa: "3" ou "2,5" → décimos (30, 25); inválido → -1
function decimosDeAluguel(texto: string) {
  const t = texto.trim().replace(",", ".");
  if (!/^\d{1,2}(\.\d)?$/.test(t)) return -1;
  return Math.round(Number(t) * 10);
}

export function CalculadoraMultaAluguel({ nivelDoTitulo = 3 }: { nivelDoTitulo?: 2 | 3 }) {
  const id = useId();
  const Titulo = nivelDoTitulo === 2 ? "h2" : "h3";
  const Sub = nivelDoTitulo === 2 ? "h3" : "h4";
  const endereco = `https://direitodeverdade.com.br${usePathname() ?? "/calculadoras/multa-rescisao-aluguel"}`;
  const hoje = useSyncExternalStore(nadaParaOuvir, () => paraTexto(hojeEmBrasilia()), () => R.revisadoEm);

  const [etapa, setEtapa] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [perfil, setPerfil] = useState<Perfil | "">("");
  const [situacao, setSituacao] = useState<Situacao | "">("");
  const [d, setD] = useState<Dados>(VAZIO);
  const [erros, setErros] = useState<ErroDaMulta[]>([]);
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
    registrar("multa_aluguel_visualizada");
  }, []);
  useEffect(() => {
    if (mudou.current) titulo.current?.focus();
  }, [etapa]);

  const ir = (nova: typeof etapa) => {
    mudou.current = true;
    setAviso("");
    setEtapa(nova);
  };
  const mudar = <K extends keyof Dados>(campo: K, valor: Dados[K]) => {
    setD((a) => ({ ...a, [campo]: valor }));
    setErros([]);
    setAviso("");
  };

  const retomada = situacao === "proprietario-pediu";
  const termino = d.usarMeses ? null : lerData(d.termino);
  const devolucao = lerData(d.devolucao);
  // Devolução no fim do prazo ou depois: as perguntas de prazo indeterminado
  const inicioLido = lerData(d.inicio);
  const fim = termino ?? (d.usarMeses && inicioLido && /^\d+$/.test(d.prazoMeses) ? somarMeses(inicioLido, Number(d.prazoMeses)) : null);
  const depoisDoPrazo = devolucao && fim ? compararDatas(devolucao, fim) >= 0 : situacao === "contrato-terminou";

  const entrada = (): EntradaDaMulta => ({
    perfil: perfil || "inquilino",
    situacao: situacao || "outro",
    tipo: d.tipo,
    aluguel: centavos(d.aluguel),
    inicio: d.inicio,
    termino: d.usarMeses ? "" : d.termino,
    prazoMeses: d.usarMeses && /^\d+$/.test(d.prazoMeses) ? Number(d.prazoMeses) : 0,
    devolucao: d.devolucao,
    forma: retomada ? "sem-multa" : d.forma,
    alugueisDeMultaDecimos: d.forma === "alugueis" ? decimosDeAluguel(d.alugueis) : 0,
    multaFixa: d.forma === "fixa" ? centavos(d.multaFixa) : 0,
    clausulaSemProporcao: d.semProporcao,
    transferenciaPeloEmpregador: situacao === "transferencia" ? d.transferencia : "",
    outraLocalidade: situacao === "transferencia" ? d.outraLocalidade : "",
    avisoEscrito30Dias: d.aviso,
    acordo: retomada ? "" : d.acordo,
    valorDoAcordo: d.acordo === "sim" ? centavos(d.valorAcordo) : 0,
    encargosMensais: centavos(d.encargosMensais),
    encargos: d.somarEncargos
      ? {
          alugueisPendentes: centavos(d.alugueisPendentes),
          condominio: centavos(d.condominio),
          iptu: centavos(d.iptu),
          contas: centavos(d.contas),
          outros: centavos(d.outros),
          jaPagos: centavos(d.jaPagos),
        }
      : null,
    hoje,
  });

  const avancar = () => {
    if (etapa === 1) {
      if (!perfil) return setAviso("Escolha uma opção.");
      return ir(2);
    }
    if (etapa === 2) {
      if (!situacao) return setAviso("Escolha a situação.");
      registrar("multa_aluguel_tipo_selecionado", { perfil: perfil || "", situacao }, true);
      return ir(3);
    }
    if (etapa === 3) {
      const r = calcularMultaDoAluguel(entrada());
      const errosDaEtapa = r.ok ? [] : r.erros.filter((e) => e.campo !== "valorDoAcordo" && e.campo !== "encargos");
      if (errosDaEtapa.length) {
        setErros(errosDaEtapa);
        return setAviso(`Confira ${errosDaEtapa.length === 1 ? "o campo marcado" : "os campos marcados"}.`);
      }
      return ir(4);
    }
    const r = calcularMultaDoAluguel(entrada());
    if (!r.ok) {
      setErros(r.erros);
      return setAviso("Confira os campos marcados.");
    }
    registrar("multa_aluguel_resultado", { perfil: perfil || "", situacao: situacao || "", desfecho: r.desfecho }, true);
    ir(5);
  };

  const erroDe = (campo: CampoDaMulta) => erros.find((e) => e.campo === campo)?.mensagem;
  const resultado = etapa === 5 ? calcularMultaDoAluguel(entrada()) : null;

  type CampoSimNao = "transferencia" | "outraLocalidade" | "aviso" | "acordo" | "renovado";
  const simNao = (campo: CampoSimNao, texto: string, ajuda?: string, comNaoSei = false) => (
    <PerguntaSimNao nome={`${id}-${campo}`} texto={texto} ajuda={ajuda} comNaoSei={comNaoSei} valor={d[campo]} aoMudar={(v) => mudar(campo, v)} />
  );

  return (
    <section
      id="calculadora-de-multa-do-aluguel"
      aria-labelledby={`${id}-titulo`}
      data-track="artigo:ferramenta-inline"
      className="my-10 scroll-mt-6 rounded-2xl border border-border bg-surface p-5 sm:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">Calculadora</p>
      <Titulo id={`${id}-titulo`} className="mt-2 font-serif text-2xl leading-snug">
        Quanto é a multa por sair antes?
      </Titulo>

      {etapa <= 4 && (
        <div className="mt-5 print:hidden">
          <p className="text-sm text-muted">
            Etapa {etapa} de 4: <span className="font-medium text-foreground">{NOMES_DAS_ETAPAS[etapa - 1]}</span>
          </p>
          <div className="mt-2 grid grid-cols-4 gap-1.5" aria-hidden="true">
            {NOMES_DAS_ETAPAS.map((n, i) => (
              <span key={n} className={`h-1.5 rounded-full ${i < etapa ? "bg-gold" : "bg-border"}`} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        {etapa === 1 && (
          <fieldset>
            <legend className="w-full">
              <Sub ref={titulo} tabIndex={-1} className="font-serif text-xl focus:outline-none">
                Quem está fazendo a simulação?
              </Sub>
            </legend>
            <div className="mt-4 grid gap-2">
              {PERFIS.map((p) => (
                <label key={p.valor} className={cartao}>
                  <input
                    type="radio"
                    name={`${id}-perfil`}
                    checked={perfil === p.valor}
                    onChange={() => {
                      registrar("multa_aluguel_iniciada");
                      setPerfil(p.valor);
                      setSituacao("");
                      setAviso("");
                    }}
                    className="mt-0.5 accent-[var(--accent)]"
                  />
                  <span className="font-medium">{p.nome}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {etapa === 2 && perfil && (
          <fieldset>
            <legend className="w-full">
              <Sub ref={titulo} tabIndex={-1} className="font-serif text-xl focus:outline-none">
                Qual é a situação?
              </Sub>
            </legend>
            <div className="mt-4 grid gap-2">
              {SITUACOES(perfil).map((s) => (
                <label key={s.valor} className={cartao}>
                  <input
                    type="radio"
                    name={`${id}-situacao`}
                    checked={situacao === s.valor}
                    onChange={() => {
                      setSituacao(s.valor);
                      setAviso("");
                    }}
                    className="mt-0.5 accent-[var(--accent)]"
                  />
                  <span>
                    <span className="font-medium">{s.nome}</span>
                    {s.dica && <span className="mt-0.5 block text-muted">{s.dica}</span>}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {etapa === 3 && (
          <div>
            <Sub ref={titulo} tabIndex={-1} className="font-serif text-xl focus:outline-none">
              Os dados do contrato
            </Sub>
            <p className="mt-2 text-sm leading-6 text-muted">Estão no contrato de locação. Não pedimos nomes, CPF nem endereço do imóvel.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Campo
                id={`${id}-aluguel`}
                rotulo="Valor mensal do aluguel (R$)"
                exemplo="0,00"
                valor={d.aluguel}
                aoMudar={(v) => mudar("aluguel", mascararReais(v))}
                erro={erroDe("aluguel")}
                dica="Só o aluguel, sem condomínio e IPTU."
              />
              <Campo id={`${id}-inicio`} rotulo="Início do contrato" tipo="date" valor={d.inicio} aoMudar={(v) => mudar("inicio", v)} erro={erroDe("inicio")} />
              {d.usarMeses ? (
                <Campo
                  id={`${id}-meses`}
                  rotulo="Prazo total do contrato (meses)"
                  modo="numeric"
                  exemplo="Ex.: 30"
                  valor={d.prazoMeses}
                  aoMudar={(v) => mudar("prazoMeses", v.replace(/\D/g, "").slice(0, 3))}
                  erro={erroDe("prazoMeses")}
                />
              ) : (
                <Campo
                  id={`${id}-termino`}
                  rotulo="Término previsto no contrato"
                  tipo="date"
                  valor={d.termino}
                  aoMudar={(v) => mudar("termino", v)}
                  erro={erroDe("termino") ?? erroDe("prazoMeses")}
                />
              )}
              <Campo
                id={`${id}-devolucao`}
                rotulo={retomada ? "Data pedida para a desocupação" : "Data da devolução do imóvel"}
                tipo="date"
                valor={d.devolucao}
                aoMudar={(v) => mudar("devolucao", v)}
                erro={erroDe("devolucao")}
                dica={retomada ? undefined : "O dia da entrega das chaves (pretendido ou já feito)."}
              />
            </div>
            <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3 text-sm">
              <input type="checkbox" checked={d.usarMeses} onChange={(e) => mudar("usarMeses", e.target.checked)} className="size-4 accent-[var(--accent)]" />
              Prefiro informar o prazo em meses
            </label>

            {!retomada && (
              <div className="mt-4 space-y-4">
                <fieldset>
                  <legend className="text-sm font-medium">Como o contrato define a multa?</legend>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {(
                      [
                        { valor: "alugueis", nome: "Um número de aluguéis" },
                        { valor: "fixa", nome: "Um valor fixo em reais" },
                        { valor: "sem-multa", nome: "O contrato não prevê multa" },
                        { valor: "outra", nome: "Outra forma de cálculo" },
                      ] as const
                    ).map((o) => (
                      <label key={o.valor} className={cartao}>
                        <input type="radio" name={`${id}-forma`} checked={d.forma === o.valor} onChange={() => mudar("forma", o.valor)} className="mt-0.5 accent-[var(--accent)]" />
                        <span className="font-medium">{o.nome}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                {d.forma === "alugueis" && (
                  <Campo
                    id={`${id}-alugueis`}
                    rotulo="Multa integral prevista (número de aluguéis)"
                    modo="decimal"
                    exemplo="Ex.: 3"
                    valor={d.alugueis}
                    aoMudar={(v) => mudar("alugueis", v.replace(/[^\d,]/g, "").slice(0, 4))}
                    erro={erroDe("alugueisDeMulta")}
                    dica="É o valor da cláusula, antes da proporção. A lei não fixa um número: três é só comum."
                  />
                )}
                {d.forma === "fixa" && (
                  <Campo
                    id={`${id}-fixa`}
                    rotulo="Multa integral prevista (R$)"
                    exemplo="0,00"
                    valor={d.multaFixa}
                    aoMudar={(v) => mudar("multaFixa", mascararReais(v))}
                    erro={erroDe("multaFixa")}
                  />
                )}
                {(d.forma === "alugueis" || d.forma === "fixa") && (
                  <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-6">
                    <input type="checkbox" checked={d.semProporcao} onChange={(e) => mudar("semProporcao", e.target.checked)} className="mt-1 size-4 accent-[var(--accent)]" />
                    A cláusula diz que a multa é cobrada inteira, sem desconto pelo tempo cumprido
                  </label>
                )}
              </div>
            )}
            <fieldset className="mt-4">
              <legend className="text-sm font-medium">Tipo de locação</legend>
              <div className="mt-2 grid gap-2">
                {(
                  [
                    { valor: "residencial", nome: "Residencial (moradia)" },
                    { valor: "nao-residencial", nome: "Não residencial (comércio, escritório)" },
                    { valor: "sob-medida", nome: "Não residencial sob medida (built to suit)", dica: "Imóvel comprado, construído ou reformado para o inquilino." },
                  ] as const
                ).map((o) => (
                  <label key={o.valor} className={cartao}>
                    <input type="radio" name={`${id}-tipo`} checked={d.tipo === o.valor} onChange={() => mudar("tipo", o.valor)} className="mt-0.5 accent-[var(--accent)]" />
                    <span>
                      <span className="font-medium">{o.nome}</span>
                      {"dica" in o && <span className="mt-0.5 block text-muted">{o.dica}</span>}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        )}

        {etapa === 4 && (
          <div>
            <Sub ref={titulo} tabIndex={-1} className="font-serif text-xl focus:outline-none">
              Informações que podem mudar a conta
            </Sub>
            <div className="mt-4 space-y-4">
              {situacao === "transferencia" && (
                <>
                  {simNao("transferencia", "A transferência foi determinada pelo empregador?", "Empresa privada ou órgão público. Pedir demissão ou mudar por conta própria não conta.", true)}
                  {simNao("outraLocalidade", "É para trabalhar em outra cidade ou localidade?", undefined, true)}
                </>
              )}
              {(situacao === "transferencia" || depoisDoPrazo || situacao === "contrato-terminou") && (
                simNao(
                  "aviso",
                  "O aviso de saída foi (ou será) feito por escrito, com pelo menos 30 dias de antecedência?",
                  devolucao ? `Para sair em ${formatarData(devolucao)}, o aviso precisa chegar até ${formatarData(avisoAte(devolucao))}.` : undefined,
                  true,
                )
              )}
              {(depoisDoPrazo || situacao === "contrato-terminou") && d.aviso === "nao" && (
                <Campo
                  id={`${id}-encargos-mensais`}
                  rotulo="Encargos mensais (condomínio, IPTU) pagos com o aluguel (R$)"
                  exemplo="0,00"
                  valor={d.encargosMensais}
                  aoMudar={(v) => mudar("encargosMensais", mascararReais(v))}
                  dica="Opcional: entram no valor de um mês de aluguel e encargos."
                />
              )}
              {situacao === "contrato-terminou" && (
simNao("renovado", "O contrato foi renovado por escrito, com um novo prazo?")
              )}
              {d.renovado === "sim" && situacao === "contrato-terminou" && (
                <p className="rounded-xl border border-gold/50 bg-gold/10 px-4 py-3 text-sm leading-6">
                  Se houve renovação com novo prazo, volte e use as datas do contrato renovado: a multa proporcional vale durante o
                  prazo dele.
                </p>
              )}
              {!retomada && simNao("acordo", "Há acordo entre inquilino e proprietário sobre a saída?", "Por exemplo, dispensa ou redução da multa.")}
              {d.acordo === "sim" && !retomada && (
                <Campo
                  id={`${id}-acordo`}
                  rotulo="Valor combinado para a saída (R$)"
                  exemplo="0,00"
                  valor={d.valorAcordo}
                  aoMudar={(v) => mudar("valorAcordo", mascararReais(v))}
                  erro={erroDe("valorDoAcordo")}
                  dica="0,00 se a multa foi dispensada."
                />
              )}
              <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-6">
                <input type="checkbox" checked={d.somarEncargos} onChange={(e) => mudar("somarEncargos", e.target.checked)} className="mt-1 size-4 accent-[var(--accent)]" />
                Existem aluguéis ou encargos pendentes? Quero somar outros valores (opcional)
              </label>
              {d.somarEncargos && (
                <fieldset className="rounded-xl border border-border bg-white p-4">
                  <legend className="px-1 text-sm font-medium">Outros valores do encerramento</legend>
                  <p className="text-xs leading-5 text-muted">
                    Só o que estiver comprovado. Danos ao imóvel só com vistoria e orçamento; a caução não é descontada
                    automaticamente.
                  </p>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    {(
                      [
                        ["alugueisPendentes", "Aluguéis pendentes (R$)"],
                        ["condominio", "Condomínio pendente (R$)"],
                        ["iptu", "IPTU a cargo do inquilino pelo contrato (R$)"],
                        ["contas", "Contas de luz, água e gás (R$)"],
                        ["outros", "Outros encargos comprovados (R$)"],
                        ["jaPagos", "Valores já pagos (R$)"],
                      ] as const
                    ).map(([campo, rotulo]) => (
                      <Campo key={campo} id={`${id}-${campo}`} rotulo={rotulo} exemplo="0,00" valor={d[campo]} aoMudar={(v) => mudar(campo, mascararReais(v))} />
                    ))}
                  </div>
                  {erroDe("encargos") && <p className="mt-2 text-sm text-red-700">{erroDe("encargos")}</p>}
                </fieldset>
              )}
            </div>
          </div>
        )}

        {etapa <= 4 && (
          <div className="mt-6 print:hidden">
            <p role="alert" className="min-h-6 text-sm text-red-700">
              {aviso}
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              {etapa > 1 && (
                <button type="button" className={estiloDoBotao} onClick={() => ir((etapa - 1) as typeof etapa)}>
                  Voltar
                </button>
              )}
              <button type="button" className={botaoPrincipal} onClick={avancar}>
                {etapa === 4 ? "Ver o resultado" : "Continuar"}
              </button>
            </div>
          </div>
        )}

        {resultado?.ok && perfil && (
          <Resultado
            r={resultado}
            perfil={perfil}
            Sub={Sub}
            refDoTitulo={titulo}
            endereco={endereco}
            registrar={registrar}
            aoEditar={() => ir(3)}
            aoRecomecar={() => {
              setPerfil("");
              setSituacao("");
              setD(VAZIO);
              ir(1);
            }}
          />
        )}
      </div>

      <p className="mt-6 text-xs leading-5 text-muted">
        Estimativa com a Lei do Inquilinato, conferida em {formatarData(lerData(R.revisadoEm)!)}. O valor devido depende do
        contrato e das circunstâncias. A conta é feita no seu navegador e nada é enviado ou guardado.{" "}
        <Link href="/calculadoras/multa-rescisao-aluguel#como-calcular-a-multa-proporcional" className={link}>
          Como calculamos
        </Link>
      </p>
    </section>
  );
}

function PerguntaSimNao({
  nome,
  texto,
  ajuda,
  comNaoSei,
  valor,
  aoMudar,
}: {
  nome: string;
  texto: string;
  ajuda?: string;
  comNaoSei: boolean;
  valor: SimNao;
  aoMudar: (v: SimNao) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium">{texto}</legend>
      {ajuda && <p className="mt-0.5 text-xs leading-5 text-muted">{ajuda}</p>}
      <div className="mt-1.5 flex flex-wrap gap-2">
        {(comNaoSei ? (["sim", "nao", "nao-sei"] as const) : (["sim", "nao"] as const)).map((v) => (
          <label key={v} className={pilula}>
            <input type="radio" name={nome} checked={valor === v} onChange={() => aoMudar(v)} className="accent-[var(--accent)]" />
            {v === "sim" ? "Sim" : v === "nao" ? "Não" : "Não sei"}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function LinhaDoTempo({ r }: { r: Extract<ResultadoDaMulta, { ok: true }> }) {
  const ini = numeroDoDia(r.inicio);
  const fim = numeroDoDia(r.termino);
  const dev = numeroDoDia(r.devolucao);
  const ultimo = Math.max(fim, dev);
  const pos = (n: number) => `${((n - ini) / (ultimo - ini)) * 100}%`;
  return (
    <figure className="rounded-xl border border-border bg-white px-4 py-4">
      <figcaption className="text-sm font-medium">Linha do tempo do contrato</figcaption>
      <div className="relative mt-4 h-3 rounded-full bg-border/60" aria-hidden="true">
        <div className="absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: pos(Math.min(dev, fim)) }} />
        {dev > fim && <div className="absolute inset-y-0 rounded-r-full bg-navy/40" style={{ left: pos(fim), width: `calc(${pos(dev)} - ${pos(fim)})` }} />}
        <div className="absolute -top-1 h-5 w-1 rounded bg-navy" style={{ left: `calc(${pos(dev)} - 2px)` }} />
      </div>
      <ul className="mt-3 grid gap-1 text-xs leading-5 text-muted sm:grid-cols-3">
        <li>
          <span className="font-medium text-foreground">Início:</span> {formatarData(r.inicio)}
        </li>
        <li>
          <span className="font-medium text-foreground">Devolução:</span> {formatarData(r.devolucao)}
        </li>
        <li>
          <span className="font-medium text-foreground">Fim do prazo:</span> {formatarData(r.termino)}
        </li>
      </ul>
      <p className="mt-2 text-xs text-muted">
        Cumprido: {periodoEmTexto(r.cumprido)}. {r.restante.fracao > 0 ? `Faltando: ${periodoEmTexto(r.restante)}.` : "O prazo já terminou na devolução."}
      </p>
    </figure>
  );
}

function Resultado({
  r,
  perfil,
  Sub,
  refDoTitulo,
  endereco,
  registrar,
  aoEditar,
  aoRecomecar,
}: {
  r: Extract<ResultadoDaMulta, { ok: true }>;
  perfil: Perfil;
  Sub: "h3" | "h4";
  refDoTitulo: Ref<HTMLHeadingElement>;
  endereco: string;
  registrar: (nome: string, parametros?: Record<string, string>, repetir?: boolean) => void;
  aoEditar: () => void;
  aoRecomecar: () => void;
}) {
  const Menor = Sub === "h3" ? "h4" : "h5";
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
  const artigo = (href: string, texto: string) => (
    <Link href={href} className={link} onClick={() => registrar("multa_aluguel_artigo_clicado", { destino: href }, true)}>
      {texto}
    </Link>
  );
  const terminou = r.restante.fracao === 0;
  const inquilino = perfil === "inquilino";

  const linhas: [string, string][] = [];
  if (r.multaIntegral !== null) linhas.push(["Multa integral prevista", reais(r.multaIntegral)]);
  linhas.push(["Prazo total", periodoEmTexto(r.prazoTotal)], ["Prazo cumprido", periodoEmTexto(r.cumprido)], ["Prazo restante", terminou ? "o prazo terminou" : periodoEmTexto(r.restante)]);
  if (r.desfecho !== "retomada-pelo-proprietario" && r.multaEstimada !== null)
    linhas.push([r.desfecho === "acordo" ? "Valor combinado" : "Multa estimada", reais(r.multaEstimada)]);
  if (r.valorSemAviso !== null) linhas.push(["Sem o aviso de 30 dias: até", reais(r.valorSemAviso)]);

  const passos: ReactNode[] = [];
  if (r.desfecho === "retomada-pelo-proprietario")
    passos.push(
      inquilino ? "Peça o pedido de desocupação por escrito e confira em que hipótese da lei ele se encaixa." : "Faça o pedido por escrito, com a hipótese da lei e o prazo de desocupação.",
      "Se houver acordo, registre por escrito a data da entrega das chaves e o que cada um paga.",
    );
  else {
    passos.push(
      "Releia o contrato: prazo, cláusula de multa, forma de aviso e regras da vistoria.",
      inquilino ? "Avise o proprietário por escrito, com a data da entrega das chaves, e guarde o comprovante." : "Peça ao inquilino o aviso por escrito, com a data da entrega das chaves.",
      "Faça a vistoria de saída e compare com o laudo de entrada: o imóvel volta no estado em que foi recebido, salvo o desgaste do uso normal (artigo 23, III).",
      "Acerte aluguel, condomínio e contas até a entrega das chaves, com recibo discriminado de cada valor (artigo 22, VI).",
    );
    if (r.desfecho === "sem-multa-transferencia") passos.push("Junte o documento da transferência e a prova de entrega do aviso.");
    if (r.multaEstimada && r.multaEstimada > 0)
      passos.push(
        inquilino
          ? "Se cobrarem mais que a proporção, mostre a conta e o artigo 4º; tente um acordo por escrito."
          : "Cobre só o valor proporcional e registre o acerto por escrito, para evitar discussão.",
      );
  }
  passos.push("Sem acordo, o Juizado Especial Cível julga causas de até 40 salários mínimos, sem advogado até 20 (Lei 9.099/1995).");

  const resumo = [
    `${TITULO_DO_DESFECHO[r.desfecho]}.`,
    ...linhas.map(([n, v]) => `${n}: ${v}.`),
    ...r.memoria,
    "O valor foi calculado proporcionalmente ao período restante do contrato, considerando as informações fornecidas. O valor efetivamente devido depende das cláusulas contratuais e das circunstâncias jurídicas.",
    `Calculado em ${endereco}`,
  ].join("\n");

  async function compartilharFerramenta() {
    registrar("multa_aluguel_compartilhamento", { canal: "ferramenta" }, true);
    try {
      if (navigator.share) return void (await navigator.share({ title: "Calculadora de multa de aluguel", url: endereco }));
      await navigator.clipboard.writeText(endereco);
      setAviso("Link da calculadora copiado.");
    } catch {
      setAviso("Não deu para compartilhar automaticamente. Copie o endereço da página.");
    }
  }

  return (
    <div ref={caixa} className="space-y-6">
      <Sub ref={refDoTitulo} tabIndex={-1} className="font-serif text-xl focus:outline-none">
        {TITULO_DO_DESFECHO[r.desfecho]}
      </Sub>

      <dl className="divide-y divide-border rounded-xl border border-border bg-white text-sm">
        {linhas.map(([n, v], i) => (
          <div key={n} className="flex items-baseline justify-between gap-4 px-4 py-2.5">
            <dt className={i === linhas.length - 1 ? "font-semibold" : "text-muted"}>{n}</dt>
            <dd className={`text-right tabular-nums ${i === linhas.length - 1 ? "font-semibold" : ""}`}>{v}</dd>
          </div>
        ))}
      </dl>

      {r.desfecho === "retomada-pelo-proprietario" ? (
        <TextoDaRetomada perfil={perfil} terminou={terminou} />
      ) : (
        <p className="text-sm leading-6">
          {r.desfecho === "multa-proporcional" || r.desfecho === "descumprimento"
            ? "O valor foi calculado proporcionalmente ao período restante do contrato, considerando as informações fornecidas. O valor efetivamente devido depende das cláusulas contratuais e das circunstâncias jurídicas."
            : r.desfecho === "sem-valor-no-contrato"
              ? "Sem multa no contrato, a lei diz que vale a multa que o juiz fixar (artigo 4º). Não há um número a calcular: negocie e registre o acordo por escrito."
              : r.desfecho === "clausula-a-analisar"
                ? "A calculadora não converte cláusulas com outras fórmulas. Leia a cláusula com atenção e, na dúvida, peça orientação a um advogado ou à Defensoria Pública."
                : "O valor depende das informações fornecidas e das cláusulas do contrato; não é uma decisão jurídica."}
        </p>
      )}

      <LinhaDoTempo r={r} />

      {r.encargos && (
        <div>
          <Menor className="font-semibold">Valores do encerramento</Menor>
          <dl className="mt-2 divide-y divide-border rounded-xl border border-border bg-white text-sm">
            {[
              ["Multa por rescisão", reais((r.multaEstimada ?? 0) + (r.valorSemAviso ?? 0))],
              ...r.encargos.itens.map((i) => [i.nome, reais(i.valor)]),
              ["Outros valores informados", reais(r.encargos.soma)],
              ...(r.encargos.jaPagos ? [["Já pagos", `− ${reais(r.encargos.jaPagos)}`]] : []),
              ["Total financeiro estimado", reais(Math.max(0, r.encargos.total))],
            ].map(([n, v], i, todos) => (
              <div key={n} className="flex items-baseline justify-between gap-4 px-4 py-2.5">
                <dt className={i === todos.length - 1 ? "font-semibold" : "text-muted"}>{n}</dt>
                <dd className={`text-right tabular-nums ${i === todos.length - 1 ? "font-semibold" : ""}`}>{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-xs leading-5 text-muted">
            Só os valores que você informou. Cada um precisa estar previsto no contrato ou na lei e comprovado; danos ao imóvel
            dependem de vistoria.
          </p>
        </div>
      )}

      <div className="rounded-xl border border-gold/50 bg-gold/10 px-4 py-3">
        <Menor className="font-semibold">Exceções e pontos de atenção</Menor>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6">
          {r.avisos.map((a) => (
            <li key={a}>{TEXTO_DO_AVISO[a]}</li>
          ))}
          {r.desfecho !== "sem-multa-transferencia" && r.desfecho !== "retomada-pelo-proprietario" && (
            <li>
              Sem multa: transferência pelo empregador para outra localidade com aviso escrito de 30 dias, devolução depois do
              fim do prazo e acordo entre as partes.
            </li>
          )}
        </ul>
      </div>

      <details className="rounded-xl border border-border bg-white px-4 py-3 text-sm leading-6">
        <summary className="cursor-pointer font-medium">Memória de cálculo</summary>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          {r.memoria.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ol>
      </details>

      <div>
        <Menor className="font-semibold">Fundamentos legais</Menor>
        <div className="mt-2">
          <Fundamentos />
        </div>
      </div>

      <div>
        <Menor className="font-semibold">Como encerrar a locação</Menor>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6">
          {passos.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ol>
        <p className="mt-3 text-sm leading-6">
          Leia mais em {artigo("/artigos/multa-contrato-de-aluguel", "multa por quebra de contrato de aluguel")} e, para o
          Juizado, em {artigo("/artigos/como-reclamar-procon", "como reclamar no Procon e no Juizado")}.{" "}
          <Fora href={FONTES.juizados.url}>Lei 9.099/1995</Fora>.
        </p>
      </div>

      <Compartilhar
        texto={resumo}
        aoCompartilhar={(canal) =>
          canal === "imprimir" ? registrar("multa_aluguel_pdf", {}, true) : registrar("multa_aluguel_compartilhamento", { canal }, true)
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
          Nova simulação
        </button>
      </div>
      <p aria-live="polite" className="text-sm text-muted print:hidden">
        {aviso}
      </p>
    </div>
  );
}
