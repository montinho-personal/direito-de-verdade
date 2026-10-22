"use client";

// Modalidade 1: quanto a empresa deve depositar no mês
import { useEffect, useState } from "react";
import { Campo, Compartilhar, Linha } from "@/components/partes-da-calculadora";
import { lerReais, percentualPorMil, reais } from "@/lib/dinheiro";
import { type Competencia, nomeDaCompetencia } from "@/lib/fgts/competencias.ts";
import { calcularDeposito } from "@/lib/fgts/deposito.ts";
import { type Contrato, caixa, dataBr, Destaque, Detalhes, lista, NOME_DO_VINCULO, SeletorDeCompetencia, Vazio } from "./comum";

const CAMPOS = [
  { chave: "variaveis", rotulo: "Horas extras, adicionais e comissões do mês (R$, opcional)", dica: "Adicional noturno, insalubridade, periculosidade, gorjetas." },
  { chave: "decimo", rotulo: "13º pago no mês (R$, opcional)", dica: "1ª ou 2ª parcela, ou o proporcional da rescisão." },
  { chave: "ferias", rotulo: "Férias tiradas no mês, com o 1/3 (R$, opcional)", dica: "Férias vendidas (abono) e férias pagas na saída não entram." },
  { chave: "aviso", rotulo: "Aviso prévio (R$, opcional)", dica: "Trabalhado ou indenizado: tem FGTS (Súmula 305 do TST)." },
] as const;
type Chave = (typeof CAMPOS)[number]["chave"];

export function ModoDeposito({
  idBase,
  contrato,
  competenciaInicial,
  anos,
  registrar,
  resumoBase,
}: {
  idBase: string;
  contrato: Contrato;
  competenciaInicial: Competencia;
  anos: number[];
  registrar: (nome: string, p?: Record<string, string>) => void;
  resumoBase: (linhas: string[]) => string;
}) {
  const [escolhida, setCompetencia] = useState<Competencia | null>(null);
  const competencia = escolhida ?? competenciaInicial;
  const [valores, setValores] = useState<Record<Chave, string>>({ variaveis: "", decimo: "", ferias: "", aviso: "" });

  const erros: Partial<Record<Chave, string>> = {};
  const centavos = (chave: Chave) => {
    const l = lerReais(valores[chave]);
    if (l.tipo === "invalido") erros[chave] = l.mensagem;
    return l.tipo === "valido" ? l.centavos : 0;
  };
  const extras = { variaveis: centavos("variaveis"), decimo: centavos("decimo"), ferias: centavos("ferias"), aviso: centavos("aviso") };
  const calculo =
    contrato.salario > 0 && !Object.keys(erros).length
      ? calcularDeposito({
          vinculo: contrato.vinculo,
          competencia,
          salario: contrato.salario,
          variaveis: extras.variaveis,
          decimoTerceiro: extras.decimo,
          feriasGozadas: extras.ferias,
          avisoPrevio: extras.aviso,
        })
      : null;
  const r = calculo?.ok ? calculo : null;
  useEffect(() => {
    if (r) registrar("fgts_deposito_calculado", { vinculo: contrato.vinculo });
  }, [Boolean(r), contrato.vinculo]); // eslint-disable-line react-hooks/exhaustive-deps

  const domestico = contrato.vinculo === "domestico";
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <SeletorDeCompetencia
          id={`${idBase}-competencia`}
          rotulo="Mês de referência (competência)"
          valor={competencia}
          aoMudar={setCompetencia}
          anos={anos}
          dica="O mês trabalhado. O depósito vence no mês seguinte."
        />
        {CAMPOS.map((c) => (
          <Campo
            key={c.chave}
            id={`${idBase}-${c.chave}`}
            rotulo={c.rotulo}
            exemplo="Ex.: 0,00"
            valor={valores[c.chave]}
            aoMudar={(v) => setValores((atual) => ({ ...atual, [c.chave]: v }))}
            erro={erros[c.chave]}
            dica={c.dica}
          />
        ))}
      </div>

      {r ? (
        <div className="space-y-4">
          <div className={caixa}>
            <Destaque
              rotulo="Depósito de FGTS estimado"
              valor={reais(r.deposito)}
              detalhe={
                <>
                  Competência de {nomeDaCompetencia(r.competencia)}. A empresa paga à parte: o FGTS não é descontado
                  do salário.
                </>
              }
            />
            <dl className="divide-y divide-border border-t border-border text-sm sm:text-base">
              {r.parcelas.map((p) => (
                <Linha key={p.nome} nome={p.nome} valor={reais(p.valor)} />
              ))}
              <Linha nome="Remuneração-base" valor={reais(r.base)} />
              <Linha nome={`Alíquota (${NOME_DO_VINCULO[contrato.vinculo].toLowerCase()})`} valor={percentualPorMil(r.aliquotaPorMil)} />
              <Linha nome="Depósito de FGTS" valor={reais(r.deposito)} destaque />
              {domestico && <Linha nome="Mais 3,2% de indenização (conta separada)" valor={reais(r.indenizacaoDomestico)} />}
              <Linha nome="Prazo do depósito" valor={dataBr(r.vencimento.data)} />
            </dl>
          </div>
          <ul className={lista}>
            <li>
              {r.vencimento.regra === "dia-20"
                ? `Desde a competência de março de 2024, o depósito vence no dia 20 do mês seguinte${r.vencimento.antecipado ? "; como o dia 20 não é dia útil, o prazo é antecipado" : ""}.`
                : "Até a competência de fevereiro de 2024, o prazo era o dia 7 do mês seguinte."}{" "}
              Feriados estaduais e municipais podem antecipar a data.
            </li>
            {contrato.vinculo === "aprendiz" && <li>No contrato de aprendizagem, a alíquota é de 2% (Lei 8.036, art. 15, § 7º).</li>}
            {domestico && (
              <li>
                No emprego doméstico, o FGTS é de 8%. Os 3,2% a mais não são FGTS: são a antecipação da indenização da
                dispensa, guardada em conta separada, que fica com o empregado na demissão sem justa causa e volta ao
                empregador no pedido de demissão ou na justa causa (LC 150/2015, art. 22). Os dois vão na guia DAE do
                eSocial.
              </li>
            )}
          </ul>
          <Detalhes titulo="Como chegamos a esse valor?">
            <p>
              {reais(r.base)} × {percentualPorMil(r.aliquotaPorMil)} = {reais(r.deposito)}. A base é a remuneração do mês:
              salário, horas extras, adicionais, comissões, 13º, férias tiradas com o 1/3 e aviso prévio (Lei 8.036, art.
              15).
            </p>
            <p className="mt-2">
              Não entram: férias pagas na saída e o 1/3 delas, abono de férias (venda de 10 dias), vale-transporte,
              vale-refeição do PAT, diárias de viagem, PLR e ajuda de custo (Lei 8.036, art. 15, § 6º; Lei 8.212, art.
              28, § 9º).
            </p>
          </Detalhes>
          <Compartilhar
            texto={resumoBase([
              `Depósito de FGTS da competência ${nomeDaCompetencia(r.competencia)}`,
              `Vínculo: ${NOME_DO_VINCULO[contrato.vinculo]}`,
              `Remuneração-base: ${reais(r.base)} × ${percentualPorMil(r.aliquotaPorMil)} = ${reais(r.deposito)}`,
              ...(domestico ? [`Indenização do doméstico (3,2%, conta separada): ${reais(r.indenizacaoDomestico)}`] : []),
              `Prazo: ${dataBr(r.vencimento.data)}`,
            ])}
            aoCompartilhar={(canal) => registrar("fgts_resultado_compartilhado", { canal, modo: "deposito" })}
          />
        </div>
      ) : (
        <Vazio>Digite o salário bruto acima para ver o depósito do mês.</Vazio>
      )}
    </div>
  );
}
