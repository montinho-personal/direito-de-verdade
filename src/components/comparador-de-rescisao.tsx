"use client";

import { useId } from "react";
import { lerFormulario, useFormulario } from "@/components/rescisao/formulario";
import { reais } from "@/lib/dinheiro";
import { calcularRescisao, type Motivo, type ResultadoDaRescisao } from "@/lib/trabalhista/rescisao.ts";

const CENARIOS: { motivo: Motivo; nome: string; aviso: "indenizado" | "trabalhado" | undefined }[] = [
  { motivo: "sem-justa-causa", nome: "Demissão sem justa causa", aviso: "indenizado" },
  { motivo: "acordo", nome: "Acordo", aviso: "indenizado" },
  { motivo: "pedido", nome: "Pedido de demissão", aviso: "trabalhado" },
  { motivo: "justa-causa", nome: "Justa causa", aviso: undefined },
];

const SAQUE: Record<ResultadoDaRescisao["fgts"]["saque"], string> = {
  tudo: "Saca tudo",
  "ate-80": "Até 80%",
  "so-multa": "Só a multa",
  nao: "Não saca",
};

// Os quatro tipos de saída com os mesmos dados, lado a lado. É hipotético: a
// modalidade não é escolha só do trabalhador.
export function ComparadorDeRescisao({ nivelDoTitulo = 3 }: { nivelDoTitulo?: 2 | 3 }) {
  const id = useId();
  const Titulo = nivelDoTitulo === 2 ? "h2" : "h3";
  const formulario = useFormulario();
  const { entrada } = lerFormulario(formulario);
  const cenarios = entrada
    ? CENARIOS.map((c) => {
        const r = calcularRescisao({ ...entrada, motivo: c.motivo, aviso: c.aviso });
        return { ...c, r: r.ok ? r : null };
      })
    : null;
  const validos = cenarios?.every((c) => c.r) ? (cenarios as { nome: string; r: ResultadoDaRescisao }[]) : null;

  return (
    <section
      aria-labelledby={`${id}-titulo`}
      data-track="artigo:ferramenta-inline"
      className="my-10 rounded-2xl border border-border bg-surface p-6 sm:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">Comparador</p>
      <Titulo id={`${id}-titulo`} className="mt-2 font-serif text-2xl leading-snug">
        Compare os tipos de saída
      </Titulo>

      {!validos ? (
        <p className="mt-4 rounded-xl border border-dashed border-border bg-white px-4 py-5 text-sm text-muted">
          Preencha a{" "}
          <a href="#calculadora-de-rescisao" className="text-accent underline underline-offset-2">
            calculadora do começo da página
          </a>{" "}
          para comparar, com os mesmos dados, quanto você receberia em cada tipo de saída.
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm leading-6 text-muted">
            Simulação hipotética com o salário e as datas da calculadora acima: aviso
            indenizado na demissão e no acordo, aviso cumprido no pedido. O tipo de saída
            não é uma escolha só sua: a demissão depende da empresa, o acordo depende das
            duas partes e a justa causa depende de uma falta grave.
          </p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-white" tabIndex={0} role="region" aria-label="Tabela de comparação; role para os lados no celular">
            <table className="w-full min-w-[34rem] text-sm">
              <caption className="sr-only">Comparação dos tipos de saída com os mesmos dados</caption>
              <thead>
                <tr className="border-b border-border text-left">
                  <th scope="col" className="px-3 py-3 font-medium text-muted">
                    &nbsp;
                  </th>
                  {validos.map((c) => (
                    <th key={c.nome} scope="col" className="px-3 py-3 text-right font-medium">
                      {c.nome}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border tabular-nums">
                <Linha nome="Líquido pago pela empresa" valores={validos.map((c) => reais(c.r.liquido))} destaque />
                <Linha
                  nome="Aviso prévio indenizado"
                  valores={validos.map((c) => reais(c.r.verbas.find((v) => v.id === "aviso")?.valor ?? 0))}
                />
                <Linha
                  nome="Multa do FGTS"
                  valores={validos.map((c) =>
                    c.r.fgts.percentualDaMultaPorMil ? `${reais(c.r.fgts.multa)} (${c.r.fgts.percentualDaMultaPorMil / 10}%)` : "—",
                  )}
                />
                <Linha nome="Saque do FGTS" valores={validos.map((c) => SAQUE[c.r.fgts.saque])} />
                <Linha
                  nome="Seguro-desemprego"
                  valores={validos.map((c) => (c.r.podeTerSeguroDesemprego ? "Pode ter direito" : "Não"))}
                />
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs leading-5 text-muted">
            A multa usa o FGTS informado na calculadora ou a estimativa. O seguro-desemprego
            depende do tempo trabalhado e é pago pelo governo.
          </p>
        </>
      )}
    </section>
  );
}

function Linha({ nome, valores, destaque = false }: { nome: string; valores: string[]; destaque?: boolean }) {
  return (
    <tr>
      <th scope="row" className={`px-3 py-3 text-left ${destaque ? "font-semibold" : "font-normal text-muted"}`}>
        {nome}
      </th>
      {valores.map((valor, i) => (
        <td key={i} className={`whitespace-nowrap px-3 py-3 text-right ${destaque ? "font-semibold" : ""}`}>
          {valor}
        </td>
      ))}
    </tr>
  );
}
