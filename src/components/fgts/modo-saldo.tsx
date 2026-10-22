"use client";

// Modalidade 2: quanto eu deveria ter acumulado de FGTS
import { useEffect, useState } from "react";
import { Campo, Compartilhar, estiloDoBotao, Linha } from "@/components/partes-da-calculadora";
import { lerReais, percentualPorMil, reais } from "@/lib/dinheiro";
import { type Competencia, nomeDaCompetencia, textoDaCompetencia } from "@/lib/fgts/competencias.ts";
import { type ResultadoDoSaldo, simularSaldo } from "@/lib/fgts/saldo.ts";
import { lerData, paraTexto } from "@/lib/trabalhista/datas.ts";
import { Grafico } from "./grafico";
import {
  aviso,
  Caixinha,
  type Contrato,
  caixa,
  dataBr,
  Destaque,
  Detalhes,
  lista,
  NOME_DO_VINCULO,
  type Nivel,
  SeletorDeCompetencia,
  Vazio,
} from "./comum";

type ItemComValor = { competencia: Competencia; valor: string };
type Afastamento = { inicio: Competencia; fim: Competencia };

export function ModoSaldo({
  idBase,
  contrato,
  anos,
  Sub,
  registrar,
  resumoBase,
  aoCalcular,
}: {
  idBase: string;
  contrato: Contrato;
  anos: number[];
  Sub: Nivel;
  registrar: (nome: string, p?: Record<string, string>) => void;
  resumoBase: (linhas: string[]) => string;
  // Leva a base estimada da multa para a modalidade da multa
  aoCalcular: (r: ResultadoDoSaldo | null, fim: string, encerrado: boolean) => void;
}) {
  const [fim, setFim] = useState("");
  const [encerrado, setEncerrado] = useState(false);
  const [variaveis, setVariaveis] = useState("");
  const [incluir13, setIncluir13] = useState(true);
  const [incluirTerco, setIncluirTerco] = useState(true);
  const [detalhado, setDetalhado] = useState(false);
  const [reajustes, setReajustes] = useState<ItemComValor[]>([]);
  const [saques, setSaques] = useState<ItemComValor[]>([]);
  const [afastamentos, setAfastamentos] = useState<Afastamento[]>([]);
  const [saldoInicial, setSaldoInicial] = useState("");

  const hoje = paraTexto(contrato.hoje);
  const dataFinal = fim || hoje;
  const leituras = { variaveis: lerReais(variaveis), saldoInicial: lerReais(saldoInicial) };
  const erros: Record<string, string> = {};
  for (const [k, l] of Object.entries(leituras)) if (l.tipo === "invalido") erros[k] = l.mensagem;
  const lerItens = (itens: ItemComValor[], campo: string) =>
    itens.map((i) => {
      const l = lerReais(i.valor);
      if (l.tipo !== "valido") erros[campo] = "Digite o valor de cada item, ou retire a linha.";
      return { competencia: textoDaCompetencia(i.competencia), valor: l.tipo === "valido" ? l.centavos : 0 };
    });
  const listaDeReajustes = detalhado ? lerItens(reajustes, "reajustes").map((r) => ({ aPartirDe: r.competencia, salario: r.valor })) : [];
  const listaDeSaques = detalhado ? lerItens(saques, "saques") : [];
  const centavos = (l: (typeof leituras)["variaveis"]) => (l.tipo === "valido" ? l.centavos : 0);

  const calculo =
    contrato.salario > 0 && contrato.admissao && !Object.keys(erros).length
      ? simularSaldo({
          vinculo: contrato.vinculo,
          admissao: contrato.admissao,
          fim: dataFinal,
          salario: contrato.salario,
          variaveis: centavos(leituras.variaveis),
          contratoEncerrado: encerrado,
          incluir13,
          incluirTercoDeFerias: incluirTerco,
          reajustes: listaDeReajustes,
          saques: listaDeSaques,
          afastamentos: detalhado
            ? afastamentos.map((a) => ({ inicio: textoDaCompetencia(a.inicio), fim: textoDaCompetencia(a.fim) }))
            : [],
          saldoInicial: detalhado ? centavos(leituras.saldoInicial) : 0,
        })
      : null;
  const errosDoMotor = calculo && !calculo.ok ? calculo.erros : [];
  const erro = (campo: string) => erros[campo] ?? errosDoMotor.find((e) => e.campo === campo)?.mensagem;
  const r = calculo?.ok ? calculo : null;

  useEffect(() => {
    aoCalcular(r, dataFinal, encerrado);
    if (r) registrar("fgts_saldo_simulado", { detalhado: detalhado ? "sim" : "nao" });
  }, [r?.saldo, r?.baseDaMulta, dataFinal, encerrado]); // eslint-disable-line react-hooks/exhaustive-deps

  const competenciaPadrao = (() => {
    const d = lerData(dataFinal) ?? contrato.hoje;
    return { ano: d.ano, mes: d.mes };
  })();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          id={`${idBase}-fim`}
          rotulo="Data final da simulação"
          tipo="date"
          valor={dataFinal}
          aoMudar={setFim}
          erro={erro("fim")}
          dica="Hoje, ou o último dia do contrato."
        />
        <Campo
          id={`${idBase}-variaveis-saldo`}
          rotulo="Média mensal de horas extras e adicionais (R$, opcional)"
          exemplo="Ex.: 300,00"
          valor={variaveis}
          aoMudar={setVariaveis}
          erro={erro("variaveis")}
        />
      </div>
      <div className="space-y-1">
        <Caixinha rotulo="O contrato terminou na data final (o 13º proporcional entra no último mês)" marcado={encerrado} aoMudar={setEncerrado} />
        <Caixinha rotulo="Somar o FGTS do 13º (em dezembro)" marcado={incluir13} aoMudar={setIncluir13} />
        <Caixinha rotulo="Somar o FGTS do 1/3 das férias (uma vez por ano)" marcado={incluirTerco} aoMudar={setIncluirTerco} />
        <Caixinha rotulo="Cálculo detalhado: reajustes, afastamentos, saques e saldo inicial" marcado={detalhado} aoMudar={setDetalhado} />
      </div>

      {detalhado && (
        <div className="space-y-4 rounded-xl border border-border bg-white px-4 py-4">
          <ListaDeValores
            idBase={`${idBase}-reajuste`}
            titulo="Reajustes de salário"
            rotuloDoMes="Novo salário a partir de"
            rotuloDoValor="Novo salário (R$)"
            itens={reajustes}
            aoMudar={setReajustes}
            anos={anos}
            padrao={competenciaPadrao}
            erro={erro("reajustes")}
          />
          <ListaDeValores
            idBase={`${idBase}-saque`}
            titulo="Saques que você já fez (saque-aniversário, imóvel...)"
            rotuloDoMes="Mês do saque"
            rotuloDoValor="Valor sacado (R$)"
            itens={saques}
            aoMudar={setSaques}
            anos={anos}
            padrao={competenciaPadrao}
            erro={erro("saques")}
          />
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">Afastamentos pelo INSS por doença (sem depósito)</legend>
            <p className="text-xs leading-5 text-muted">
              Acidente de trabalho, licença-maternidade e serviço militar não entram aqui: neles o depósito continua.
            </p>
            {afastamentos.map((a, i) => (
              <div key={i} className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <SeletorDeCompetencia
                  id={`${idBase}-afast-ini-${i}`}
                  rotulo="Do mês"
                  valor={a.inicio}
                  anos={anos}
                  aoMudar={(c) => setAfastamentos((l) => l.map((x, j) => (j === i ? { ...x, inicio: c } : x)))}
                />
                <SeletorDeCompetencia
                  id={`${idBase}-afast-fim-${i}`}
                  rotulo="Até o mês"
                  valor={a.fim}
                  anos={anos}
                  aoMudar={(c) => setAfastamentos((l) => l.map((x, j) => (j === i ? { ...x, fim: c } : x)))}
                />
                <button type="button" className={estiloDoBotao} onClick={() => setAfastamentos((l) => l.filter((_, j) => j !== i))}>
                  Retirar
                </button>
              </div>
            ))}
            {erro("afastamentos") && <p className="text-sm text-red-700">{erro("afastamentos")}</p>}
            <button
              type="button"
              className={estiloDoBotao}
              onClick={() => setAfastamentos((l) => [...l, { inicio: competenciaPadrao, fim: competenciaPadrao }])}
            >
              + Afastamento
            </button>
          </fieldset>
          <Campo
            id={`${idBase}-saldo-inicial`}
            rotulo="Saldo que já estava na conta no começo (R$, opcional)"
            exemplo="Ex.: 0,00"
            valor={saldoInicial}
            aoMudar={setSaldoInicial}
            erro={erro("saldoInicial")}
            dica="Rende junto, mas não entra na base da multa."
          />
        </div>
      )}

      {r ? (
        <Resultado r={r} contrato={contrato} dataFinal={dataFinal} Sub={Sub} idBase={idBase} registrar={registrar} resumoBase={resumoBase} />
      ) : (
        <Vazio>Digite o salário e a data de admissão acima para ver o FGTS acumulado.</Vazio>
      )}
    </div>
  );
}

function ListaDeValores({
  idBase,
  titulo,
  rotuloDoMes,
  rotuloDoValor,
  itens,
  aoMudar,
  anos,
  padrao,
  erro,
}: {
  idBase: string;
  titulo: string;
  rotuloDoMes: string;
  rotuloDoValor: string;
  itens: ItemComValor[];
  aoMudar: (f: (l: ItemComValor[]) => ItemComValor[]) => void;
  anos: number[];
  padrao: Competencia;
  erro?: string;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">{titulo}</legend>
      {itens.map((item, i) => (
        <div key={i} className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <SeletorDeCompetencia
            id={`${idBase}-${i}`}
            rotulo={rotuloDoMes}
            valor={item.competencia}
            anos={anos}
            aoMudar={(c) => aoMudar((l) => l.map((x, j) => (j === i ? { ...x, competencia: c } : x)))}
          />
          <Campo
            id={`${idBase}-${i}-valor`}
            rotulo={rotuloDoValor}
            exemplo="Ex.: 2.500,00"
            valor={item.valor}
            aoMudar={(v) => aoMudar((l) => l.map((x, j) => (j === i ? { ...x, valor: v } : x)))}
          />
          <button type="button" className={estiloDoBotao} onClick={() => aoMudar((l) => l.filter((_, j) => j !== i))}>
            Retirar
          </button>
        </div>
      ))}
      {erro && <p className="text-sm text-red-700">{erro}</p>}
      <button type="button" className={estiloDoBotao} onClick={() => aoMudar((l) => [...l, { competencia: padrao, valor: "" }])}>
        + {titulo.split(" ")[0].replace(/s$/, "")}
      </button>
    </fieldset>
  );
}

function Resultado({
  r,
  contrato,
  dataFinal,
  Sub,
  idBase,
  registrar,
  resumoBase,
}: {
  r: ResultadoDoSaldo;
  contrato: Contrato;
  dataFinal: string;
  Sub: Nivel;
  idBase: string;
  registrar: (nome: string, p?: Record<string, string>) => void;
  resumoBase: (linhas: string[]) => string;
}) {
  const primeiro = r.meses[0].competencia;
  const ultimo = r.meses[r.meses.length - 1].competencia;
  const periodo = `${nomeDaCompetencia(primeiro)} a ${nomeDaCompetencia(ultimo)}`;
  const domestico = contrato.vinculo === "domestico";
  return (
    <div className="space-y-4">
      <div className={caixa}>
        <Destaque
          rotulo="Total estimado de depósitos"
          valor={reais(r.depositos)}
          detalhe={`${r.meses.length} competências, de ${periodo}, a ${percentualPorMil(r.aliquotaPorMil)} da remuneração.`}
        />
        <dl className="divide-y divide-border border-t border-border text-sm sm:text-base">
          {r.saldoInicial > 0 && <Linha nome="Saldo que já estava na conta" valor={reais(r.saldoInicial)} />}
          <Linha nome="Depósitos do período" valor={reais(r.depositos)} />
          <Linha nome="Juros de 3% ao ano (estimados)" valor={`+ ${reais(r.juros)}`} />
          {r.saques > 0 && <Linha nome="Saques informados" valor={`− ${reais(r.saques)}`} />}
          <Linha nome="Saldo atualizado estimado" valor={reais(r.saldo)} destaque />
          {domestico && <Linha nome="Indenização de 3,2% (conta separada, sem juros)" valor={reais(r.indenizacaoDomestico)} />}
        </dl>
      </div>
      <ul className={aviso}>
        <li>
          <strong>Isto não é o seu saldo oficial.</strong> A conta soma os depósitos e os juros de 3% ao ano, mas não
          tem a TR nem a distribuição anual de lucros do FGTS, que costumam deixar o extrato um pouco maior. O valor
          exato está no app FGTS.
        </li>
        <li>Depósito devido não é saldo disponível: o saque depende do motivo (veja a modalidade &quot;Posso sacar?&quot;).</li>
        {r.saqueMaiorQueOSaldo && <li>Algum saque informado é maior que o saldo estimado no mês: confira os valores.</li>}
      </ul>

      <section aria-labelledby={`${idBase}-grafico`} className={`${caixa} px-4 py-4`}>
        <Sub id={`${idBase}-grafico`} className="font-serif text-lg">
          Evolução estimada, ano a ano
        </Sub>
        <Grafico anos={r.anos} />
        {/* Rolagem com teclado quando a tabela não cabe na tela */}
        <div className="mt-3 overflow-x-auto" tabIndex={0} role="region" aria-label="Tabela do saldo por ano">
          <table className="w-full min-w-[22rem] text-left text-sm tabular-nums">
            <caption className="sr-only">Depósitos, juros, saques e saldo estimado por ano</caption>
            <thead className="text-xs text-muted">
              <tr>
                <th scope="col" className="py-2 pr-2 font-medium">Ano</th>
                <th scope="col" className="py-2 pr-2 text-right font-medium">Depósitos</th>
                <th scope="col" className="py-2 pr-2 text-right font-medium">Juros</th>
                {r.saques > 0 && <th scope="col" className="py-2 pr-2 text-right font-medium">Saques</th>}
                <th scope="col" className="py-2 text-right font-medium">Saldo no fim</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {r.anos.map((a) => (
                <tr key={a.ano}>
                  <th scope="row" className="py-2 pr-2 font-normal">{a.ano}</th>
                  <td className="py-2 pr-2 text-right">{reais(a.depositos)}</td>
                  <td className="py-2 pr-2 text-right">{reais(a.juros)}</td>
                  {r.saques > 0 && <td className="py-2 pr-2 text-right">{a.saques ? `− ${reais(a.saques)}` : "—"}</td>}
                  <td className="py-2 text-right">{reais(a.saldo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ul className={lista}>
        <li>
          Base estimada para a multa rescisória: <strong>{reais(r.baseDaMulta)}</strong> (depósitos com juros, sem
          descontar saques e sem o saldo anterior). Ela já aparece na modalidade &quot;Multa rescisória&quot;.
        </li>
      </ul>

      <Detalhes titulo="Como chegamos a esse valor?">
        <ol className="list-decimal space-y-2 pl-5">
          <li>Para cada mês do contrato: remuneração × {percentualPorMil(r.aliquotaPorMil)}. No mês de entrada e no de saída, o salário é proporcional aos dias.</li>
          <li>13º: 1/12 do salário por mês do ano com 15 dias ou mais de trabalho, na competência de dezembro.</li>
          <li>1/3 de férias: uma vez a cada 12 meses de contrato, no mês em que o período se completa.</li>
          <li>Juros: 0,2466% ao mês (equivalente a 3% ao ano) sobre o saldo do mês anterior. A TR e a distribuição de lucros ficam de fora.</li>
          <li>Afastamento por doença pelo INSS: sem depósito nos meses informados.</li>
        </ol>
      </Detalhes>

      <Compartilhar
        texto={resumoBase([
          `Simulação do FGTS acumulado, de ${periodo} (data final ${dataBr(lerData(dataFinal)!)})`,
          `Vínculo: ${NOME_DO_VINCULO[contrato.vinculo]}; alíquota ${percentualPorMil(r.aliquotaPorMil)}`,
          `Total estimado de depósitos: ${reais(r.depositos)}`,
          `Juros de 3% ao ano (estimados): ${reais(r.juros)}${r.saques ? `; saques: ${reais(r.saques)}` : ""}`,
          `Saldo atualizado estimado: ${reais(r.saldo)} (sem TR e sem distribuição de lucros; não é o saldo oficial)`,
          `Base estimada da multa: ${reais(r.baseDaMulta)}`,
        ])}
        aoCompartilhar={(canal) => registrar("fgts_resultado_compartilhado", { canal, modo: "saldo" })}
      />
    </div>
  );
}
