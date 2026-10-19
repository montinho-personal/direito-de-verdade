"use client";

import { useId, useState } from "react";
import { Campo, NotaDaEstimativa } from "@/components/partes-da-calculadora";
import { lerQuantidade, lerReais, percentualPorMil, reais } from "@/lib/dinheiro";
import { compararSalarios } from "@/lib/tributos/calculo.ts";

type Modo = "novo" | "percentual" | "reais";

const MODOS: { valor: Modo; nome: string }[] = [
  { valor: "percentual", nome: "Aumento em %" },
  { valor: "reais", nome: "Aumento em R$" },
  { valor: "novo", nome: "Novo salário" },
];

// Mostra quanto de um aumento sobra no bolso depois do INSS e do imposto de renda
export function ComparadorDeSalario({ nivelDoTitulo = 3 }: { nivelDoTitulo?: 2 | 3 }) {
  const id = useId();
  const Titulo = nivelDoTitulo === 2 ? "h2" : "h3";
  const [modo, setModo] = useState<Modo>("percentual");
  const [atual, setAtual] = useState("");
  const [valor, setValor] = useState("");
  const [dependentes, setDependentes] = useState("");

  const leituraAtual = lerReais(atual);
  const leituraDoValor = lerReais(valor);
  const leituraDosDependentes = lerQuantidade(dependentes, 20);

  let novoEmCentavos: number | null = null;
  if (leituraAtual.tipo === "valido" && leituraDoValor.tipo === "valido" && leituraAtual.centavos > 0) {
    // No modo percentual, "10,5" vira 1050 (centésimos de ponto percentual)
    novoEmCentavos =
      modo === "novo"
        ? leituraDoValor.centavos
        : modo === "reais"
          ? leituraAtual.centavos + leituraDoValor.centavos
          : leituraAtual.centavos + Math.round((leituraAtual.centavos * leituraDoValor.centavos) / 10000);
  }
  const quantidade = leituraDosDependentes.tipo === "valido" ? leituraDosDependentes.quantidade : 0;
  const comparacao =
    novoEmCentavos !== null && novoEmCentavos > 0 && leituraDosDependentes.tipo === "valido"
      ? compararSalarios(
          { salario: leituraAtual.tipo === "valido" ? leituraAtual.centavos : 0, dependentes: quantidade },
          { salario: novoEmCentavos, dependentes: quantidade },
        )
      : null;

  const rotuloDoValor =
    modo === "novo" ? "Novo salário bruto (R$)" : modo === "reais" ? "Aumento bruto (R$)" : "Aumento (%)";

  return (
    <section
      aria-labelledby={`${id}-titulo`}
      data-track="artigo:ferramenta-inline"
      className="my-10 rounded-2xl border border-border bg-surface p-6 sm:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">Comparador</p>
      <Titulo id={`${id}-titulo`} className="mt-2 font-serif text-2xl leading-snug">
        Quanto do aumento cai na sua conta
      </Titulo>

      <fieldset className="mt-6">
        <legend className="text-sm font-medium">Como você quer informar o aumento</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {MODOS.map((item) => (
            <label
              key={item.valor}
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm has-[:checked]:border-gold has-[:checked]:bg-gold/10 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold/60"
            >
              <input
                type="radio"
                name={`${id}-modo`}
                value={item.valor}
                checked={modo === item.valor}
                onChange={() => {
                  setModo(item.valor);
                  setValor("");
                }}
                className="accent-[var(--accent)]"
              />
              {item.nome}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Campo
          id={`${id}-atual`}
          rotulo="Salário bruto atual (R$)"
          exemplo="Ex.: 5.000,00"
          valor={atual}
          aoMudar={setAtual}
          erro={leituraAtual.tipo === "invalido" ? leituraAtual.mensagem : undefined}
        />
        <Campo
          id={`${id}-valor`}
          rotulo={rotuloDoValor}
          exemplo={modo === "percentual" ? "Ex.: 10" : modo === "reais" ? "Ex.: 500,00" : "Ex.: 6.000,00"}
          valor={valor}
          aoMudar={setValor}
          erro={leituraDoValor.tipo === "invalido" ? leituraDoValor.mensagem : undefined}
        />
        <Campo
          id={`${id}-dependentes`}
          rotulo="Dependentes no IR"
          exemplo="0"
          modo="numeric"
          valor={dependentes}
          aoMudar={setDependentes}
          erro={leituraDosDependentes.tipo === "invalido" ? leituraDosDependentes.mensagem : undefined}
        />
      </div>

      <div className="mt-6">
        {comparacao ? (
          <div className="space-y-4">
            <p className="rounded-xl border border-border bg-white px-4 py-4 text-base">
              {comparacao.aumentoBruto > 0 ? (
                <>
                  Seu ganho líquido real seria de{" "}
                  <strong className="tabular-nums">{reais(comparacao.aumentoLiquido)} por mês</strong>,
                  de um aumento bruto de{" "}
                  <span className="tabular-nums">{reais(comparacao.aumentoBruto)}</span>.
                  {comparacao.percentualQueFicaPorMil !== null && (
                    <>
                      {" "}
                      Ficam com você{" "}
                      <strong className="tabular-nums">
                        {percentualPorMil(comparacao.percentualQueFicaPorMil)}
                      </strong>{" "}
                      do aumento.
                    </>
                  )}
                </>
              ) : (
                "O novo salário não é maior que o atual. Digite um aumento para comparar."
              )}
            </p>
            <div className="overflow-hidden rounded-xl border border-border bg-white">
              <table className="w-full text-sm sm:text-base">
                <caption className="sr-only">Comparação do salário atual com o novo</caption>
                <thead>
                  <tr className="border-b border-border text-left">
                    <th scope="col" className="px-4 py-3 font-medium text-muted">
                      Valor mensal
                    </th>
                    <th scope="col" className="px-2 py-3 text-right font-medium">
                      Atual
                    </th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">
                      Novo
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border tabular-nums">
                  {[
                    ["Salário bruto", comparacao.atual.bruto, comparacao.novo.bruto],
                    ["INSS", comparacao.atual.inss.total, comparacao.novo.inss.total],
                    ["Imposto de renda", comparacao.atual.irrf.imposto, comparacao.novo.irrf.imposto],
                    ["Salário líquido", comparacao.atual.liquido, comparacao.novo.liquido],
                  ].map(([nome, a, n]) => (
                    <tr key={nome as string}>
                      <th scope="row" className="px-4 py-3 text-left font-normal text-muted">
                        {nome}
                      </th>
                      <td className="whitespace-nowrap px-2 py-3 text-right">{reais(a as number)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">{reais(n as number)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {comparacao.aumentoBruto > 0 && (
              <ul className="space-y-1 text-sm text-muted">
                <li>
                  O INSS sobe <span className="tabular-nums">{reais(comparacao.diferencaInss)}</span> e o
                  imposto de renda sobe{" "}
                  <span className="tabular-nums">{reais(comparacao.diferencaIrrf)}</span>.
                </li>
              </ul>
            )}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-border bg-white px-4 py-5 text-sm text-muted">
            Digite o salário atual e o aumento para ver quanto sobra de verdade.
          </p>
        )}
        <p aria-live="polite" className="sr-only">
          {comparacao && comparacao.aumentoBruto > 0
            ? `Ganho líquido de ${reais(comparacao.aumentoLiquido)} por mês.`
            : ""}
        </p>
      </div>

      <NotaDaEstimativa />
    </section>
  );
}
