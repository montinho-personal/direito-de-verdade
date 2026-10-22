"use client";

// Modalidade 3: minha empresa está depositando meu FGTS corretamente?
import { useEffect, useState } from "react";
import { Campo, Compartilhar, Escolha, Linha } from "@/components/partes-da-calculadora";
import { lerReais, reais } from "@/lib/dinheiro";
import { type Competencia, competenciasEntre, indice, nomeDaCompetencia, somarMesesNaCompetencia, textoDaCompetencia } from "@/lib/fgts/competencias.ts";
import { conferirDepositos, type LinhaConferida, type SituacaoInformada, type StatusDaLinha } from "@/lib/fgts/conferencia.ts";
import { simularSaldo } from "@/lib/fgts/saldo.ts";
import { diasDoMes, lerData, paraTexto } from "@/lib/trabalhista/datas.ts";
import { aviso, Caixinha, type Contrato, caixa, dataBr, Destaque, lista, link, NOME_DO_VINCULO, type Nivel, SeletorDeCompetencia, Vazio } from "./comum";

const MAXIMO = 60;

type Preenchimento = { remuneracao: string; situacao: SituacaoInformada; informado: string };

const NOME_DO_STATUS: Record<StatusDaLinha, string> = {
  confere: "Confere",
  abaixo: "Abaixo do esperado",
  acima: "Acima do esperado",
  "sem-deposito": "Sem depósito",
  "nao-informado": "Falta informar",
  "nao-venceu": "Ainda não venceu",
};

const COR_DO_STATUS: Record<StatusDaLinha, string> = {
  confere: "border-border bg-white",
  abaixo: "border-gold bg-gold/10",
  acima: "border-gold bg-gold/10",
  "sem-deposito": "border-gold bg-gold/10",
  "nao-informado": "border-border bg-white",
  "nao-venceu": "border-border bg-white",
};

export function ModoConferencia({
  idBase,
  contrato,
  anos,
  Sub,
  registrar,
  resumoBase,
}: {
  idBase: string;
  contrato: Contrato;
  anos: number[];
  Sub: Nivel;
  registrar: (nome: string, p?: Record<string, string>) => void;
  resumoBase: (linhas: string[]) => string;
}) {
  const ultimoMes = somarMesesNaCompetencia({ ano: contrato.hoje.ano, mes: contrato.hoje.mes }, -1);
  const admissao = contrato.admissao ? lerData(contrato.admissao) : null;
  const [fim, setFim] = useState<Competencia | null>(null);
  const [inicio, setInicio] = useState<Competencia | null>(null);
  const [incluir13, setIncluir13] = useState(true);
  const [linhas, setLinhas] = useState<Record<string, Preenchimento>>({});

  const fimUsado = fim ?? ultimoMes;
  const inicioPadrao = (() => {
    const doze = somarMesesNaCompetencia(fimUsado, -11);
    return admissao && indice(admissao) > indice(doze) ? { ano: admissao.ano, mes: admissao.mes } : doze;
  })();
  const inicioUsado = inicio ?? inicioPadrao;

  // Remuneração esperada de cada mês, pela mesma simulação do saldo (salário proporcional
  // na admissão e 13º em dezembro)
  const fimDoPeriodo = { ...fimUsado, dia: diasDoMes(fimUsado.ano, fimUsado.mes) };
  const simulacao =
    contrato.salario > 0 && admissao && indice(fimUsado) >= indice(admissao)
      ? simularSaldo({
          vinculo: contrato.vinculo,
          admissao: contrato.admissao,
          fim: paraTexto(fimDoPeriodo),
          salario: contrato.salario,
          incluir13,
          incluirTercoDeFerias: false,
        })
      : null;
  const estimada = new Map<string, number>();
  if (simulacao?.ok) for (const m of simulacao.meses) estimada.set(textoDaCompetencia(m.competencia), m.remuneracao + m.decimoTerceiro);

  const periodo = admissao
    ? competenciasEntre(indice(inicioUsado) < indice(admissao) ? admissao : inicioUsado, fimUsado)
    : [];
  const grandeDemais = periodo.length > MAXIMO;
  const competencias = grandeDemais ? [] : periodo;

  const erros: Record<string, string> = {};
  const paraConferir = competencias.map((c) => {
    const chave = textoDaCompetencia(c);
    const p = linhas[chave] ?? { remuneracao: "", situacao: "nao-sei", informado: "" };
    const rem = lerReais(p.remuneracao);
    if (rem.tipo === "invalido") erros[`${chave}-rem`] = rem.mensagem;
    const inf = lerReais(p.informado);
    if (p.situacao === "valor" && inf.tipo !== "valido") erros[`${chave}-inf`] = inf.tipo === "invalido" ? inf.mensagem : "Digite o valor do extrato, ou escolha outra opção.";
    return {
      competencia: c,
      remuneracao: rem.tipo === "valido" ? rem.centavos : (estimada.get(chave) ?? contrato.salario),
      situacao: p.situacao === "valor" && inf.tipo !== "valido" ? ("nao-sei" as const) : p.situacao,
      informado: inf.tipo === "valido" ? inf.centavos : undefined,
    };
  });
  const r = competencias.length && contrato.salario > 0 ? conferirDepositos(contrato.vinculo, paraConferir, contrato.hoje) : null;
  const mudar = (chave: string, m: Partial<Preenchimento>) =>
    setLinhas((atual) => ({ ...atual, [chave]: { ...(atual[chave] ?? { remuneracao: "", situacao: "nao-sei", informado: "" }), ...m } }));

  const iniciou = r ? r.conferidas > 0 : false;
  const concluiu = r ? r.conferidas > 0 && r.pendentes === 0 : false;
  useEffect(() => {
    if (iniciou) registrar("fgts_conferencia_iniciada");
  }, [iniciou]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (concluiu) registrar("fgts_conferencia_concluida");
  }, [concluiu]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!(contrato.salario > 0) || !admissao) {
    return <Vazio>Digite o salário e a data de admissão acima para montar a tabela de conferência.</Vazio>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <SeletorDeCompetencia id={`${idBase}-conf-ini`} rotulo="Conferir a partir de" valor={inicioUsado} aoMudar={setInicio} anos={anos} />
        <SeletorDeCompetencia
          id={`${idBase}-conf-fim`}
          rotulo="Até o mês"
          valor={fimUsado}
          aoMudar={setFim}
          anos={anos}
          dica={`Até ${MAXIMO} meses por vez. O prazo para cobrar é de 5 anos.`}
        />
      </div>
      <Caixinha rotulo="Somar o 13º na competência de dezembro" marcado={incluir13} aoMudar={setIncluir13} />
      <p className="text-sm leading-6 text-muted">
        Abra o extrato no app FGTS e copie o depósito de cada mês. Deixe &quot;Não sei&quot; quando não tiver a
        informação: campo vazio não conta como zero. Se tirou férias no mês, some o 1/3 na remuneração.
      </p>

      {grandeDemais ? (
        <p className="text-sm text-red-700">O período tem {periodo.length} meses. Escolha até {MAXIMO} meses por vez.</p>
      ) : (
        <ol className="space-y-3">
          {(r?.linhas ?? []).map((l) => {
            const chave = textoDaCompetencia(l.competencia);
            const p = linhas[chave];
            return (
              <li key={chave}>
                <fieldset className={`rounded-xl border px-4 py-3 ${COR_DO_STATUS[l.status]}`}>
                  <legend className="sr-only">{nomeDaCompetencia(l.competencia)}</legend>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-medium capitalize">{nomeDaCompetencia(l.competencia)}</span>
                    <span className="text-xs text-muted">
                      Esperado {reais(l.esperado)} · vence {dataBr(l.vencimento)}
                    </span>
                  </div>
                  <div className="mt-2 grid gap-3 sm:grid-cols-3">
                    <Campo
                      id={`${idBase}-rem-${chave}`}
                      rotulo="Remuneração do mês (R$)"
                      exemplo={reais(l.remuneracao).replace("R$", "").trim()}
                      valor={p?.remuneracao ?? ""}
                      aoMudar={(v) => mudar(chave, { remuneracao: v })}
                      erro={erros[`${chave}-rem`]}
                    />
                    <Escolha
                      id={`${idBase}-sit-${chave}`}
                      rotulo="No extrato"
                      valor={p?.situacao ?? "nao-sei"}
                      opcoes={[
                        { valor: "nao-sei", nome: "Não sei" },
                        { valor: "valor", nome: "Tem depósito" },
                        { valor: "sem-deposito", nome: "Não houve depósito" },
                      ]}
                      aoMudar={(situacao) => mudar(chave, { situacao })}
                    />
                    {p?.situacao === "valor" && (
                      <Campo
                        id={`${idBase}-inf-${chave}`}
                        rotulo="Valor depositado (R$)"
                        exemplo="Ex.: 160,00"
                        valor={p.informado}
                        aoMudar={(v) => mudar(chave, { informado: v })}
                        erro={erros[`${chave}-inf`]}
                      />
                    )}
                  </div>
                  <p className="mt-2 text-sm">
                    <strong>{NOME_DO_STATUS[l.status]}</strong>
                    {l.diferenca !== null && l.status !== "confere" && (
                      <>: diferença de {l.diferenca < 0 ? "− " : "+ "}{reais(Math.abs(l.diferenca))}</>
                    )}
                  </p>
                </fieldset>
              </li>
            );
          })}
        </ol>
      )}

      {r && <Resumo r={r} linhas={r.linhas} contrato={contrato} Sub={Sub} idBase={idBase} registrar={registrar} resumoBase={resumoBase} />}
    </div>
  );
}

function Resumo({
  r,
  linhas,
  contrato,
  Sub,
  idBase,
  registrar,
  resumoBase,
}: {
  r: NonNullable<ReturnType<typeof conferirDepositos>>;
  linhas: LinhaConferida[];
  contrato: Contrato;
  Sub: Nivel;
  idBase: string;
  registrar: (nome: string, p?: Record<string, string>) => void;
  resumoBase: (linhas: string[]) => string;
}) {
  const divergentes = linhas.filter((l) => l.diferenca !== null && l.status !== "confere");
  const pendentes = linhas.filter((l) => l.status === "nao-informado");
  const primeiro = linhas[0].competencia;
  const ultimo = linhas[linhas.length - 1].competencia;
  return (
    <section aria-labelledby={`${idBase}-resumo-conf`} className="space-y-4">
      <div className={caixa}>
        <Sub id={`${idBase}-resumo-conf`} className="px-4 pt-5 font-serif text-lg">
          Resultado da conferência
        </Sub>
        {r.conferidas ? (
          <Destaque
            rotulo="Diferença estimada nos meses conferidos"
            valor={`${r.diferenca < 0 ? "− " : r.diferenca > 0 ? "+ " : ""}${reais(Math.abs(r.diferenca))}`}
            detalhe={r.diferenca < 0 ? "Os depósitos informados ficaram abaixo do esperado." : r.diferenca > 0 ? "Os depósitos informados ficaram acima do esperado." : undefined}
          />
        ) : (
          <p className="px-4 pb-4 pt-2 text-sm text-muted">Informe o depósito (ou a falta dele) de pelo menos um mês já vencido.</p>
        )}
        <dl className="divide-y divide-border border-t border-border text-sm sm:text-base">
          <Linha nome="Depósitos esperados (meses conferidos)" valor={reais(r.esperadoConferido)} />
          <Linha nome="Depósitos informados" valor={reais(r.informadoConferido)} />
          <Linha nome="Meses conferidos" valor={String(r.conferidas)} />
          <Linha nome="Meses com possível divergência" valor={String(r.divergentes)} destaque />
          <Linha nome="Meses sem informação" valor={String(r.pendentes)} />
          {r.naoVencidas > 0 && <Linha nome="Meses que ainda não venceram" valor={String(r.naoVencidas)} />}
        </dl>
      </div>
      {divergentes.length > 0 && (
        <div className={aviso}>
          <p>
            <strong>Possíveis divergências:</strong>{" "}
            {divergentes.map((l) => `${nomeDaCompetencia(l.competencia, true)} (${l.diferenca! < 0 ? "−" : "+"}${reais(Math.abs(l.diferenca!))})`).join("; ")}.
          </p>
          <p>
            Uma diferença não prova, sozinha, que a empresa deixou de depositar. Antes, confira: a remuneração do mês
            (horas extras, faltas, férias), se o depósito caiu com outra competência ou com atraso, retificações e
            depósitos de 13º separados.
          </p>
        </div>
      )}
      {pendentes.length > 0 && (
        <p className="text-sm leading-6 text-muted">
          Faltam {pendentes.length} meses: {pendentes.map((l) => nomeDaCompetencia(l.competencia, true)).join(", ")}.
        </p>
      )}
      <ul className={lista}>
        <li>
          <strong>Se faltar depósito:</strong> peça a explicação ao RH, com o extrato. Se não resolver, registre uma{" "}
          <a href="https://www.gov.br/pt-br/servicos/realizar-denuncia-trabalhista" className={link} rel="noopener noreferrer" target="_blank">
            denúncia trabalhista no gov.br
          </a>{" "}
          ou procure o sindicato, a Defensoria Pública ou um advogado. Veja o passo a passo{" "}
          <a href="#empresa-nao-depositou-o-fgts-o-que-fazer" className={link}>
            mais abaixo
          </a>
          .
        </li>
      </ul>
      <Compartilhar
        texto={resumoBase([
          `Conferência dos depósitos de FGTS de ${nomeDaCompetencia(primeiro)} a ${nomeDaCompetencia(ultimo)}`,
          `Vínculo: ${NOME_DO_VINCULO[contrato.vinculo]}`,
          `Esperado nos meses conferidos: ${reais(r.esperadoConferido)}; informado: ${reais(r.informadoConferido)}; diferença: ${reais(r.diferenca)}`,
          `Meses conferidos: ${r.conferidas}; com possível divergência: ${r.divergentes}; sem informação: ${r.pendentes}`,
          ...divergentes.map((l) => `- ${nomeDaCompetencia(l.competencia)}: esperado ${reais(l.esperado)}, informado ${reais(l.esperado + l.diferenca!)}`),
          "Uma diferença calculada não comprova irregularidade: confira a remuneração e o extrato oficial.",
        ])}
        aoCompartilhar={(canal) => registrar("fgts_resultado_compartilhado", { canal, modo: "conferencia" })}
      />
    </section>
  );
}
