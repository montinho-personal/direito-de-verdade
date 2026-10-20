"use client";

import { useId, useState } from "react";
import { lerFormulario13, NOMES_DOS_MESES, useFormulario13 } from "@/components/decimo/formulario";
import { Campo, Escolha } from "@/components/partes-da-calculadora";
import { lerReais, reais } from "@/lib/dinheiro";
import { calcular13 } from "@/lib/trabalhista/decimo-terceiro.ts";

const QUANDO = [
  ...NOMES_DOS_MESES.map((nome, i) => ({ valor: String(i + 1), nome: `${nome[0].toUpperCase()}${nome.slice(1)} de 2026` })),
  { valor: "depois", nome: "Janeiro de 2027 ou depois" },
];

// 13º com e sem um reajuste, com os mesmos dados da calculadora. O 13º usa o salário
// de dezembro (Decreto 10.854/2021, art. 76); a 1ª parcela, o do mês anterior a ela.
export function Comparador13({ nivelDoTitulo = 3 }: { nivelDoTitulo?: 2 | 3 }) {
  const id = useId();
  const Titulo = nivelDoTitulo === 2 ? "h2" : "h3";
  const f = useFormulario13();
  const { entrada } = lerFormulario13(f);
  const [novo, setNovo] = useState("");
  const [quando, setQuando] = useState("12");
  const leitura = lerReais(novo);

  const semReajuste = entrada ? calcular13({ ...entrada, reajuste: undefined }) : null;
  const comReajuste =
    entrada && leitura.tipo === "valido" && leitura.centavos > 0 && quando !== "depois"
      ? calcular13({ ...entrada, reajuste: { salario: leitura.centavos, mes: Number(quando) } })
      : semReajuste;
  const a = semReajuste?.ok ? semReajuste : null;
  const b = comReajuste?.ok ? comReajuste : null;

  return (
    <section
      aria-labelledby={`${id}-titulo`}
      data-track="artigo:ferramenta-inline"
      className="my-10 rounded-2xl border border-border bg-surface p-6 sm:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">Comparador</p>
      <Titulo id={`${id}-titulo`} className="mt-2 font-serif text-2xl leading-snug">
        Quanto muda o 13º com um aumento
      </Titulo>
      {!a ? (
        <p className="mt-4 rounded-xl border border-dashed border-border bg-white px-4 py-5 text-sm text-muted">
          Preencha primeiro a{" "}
          <a href="#calculadora-do-13" className="text-accent underline underline-offset-2">
            calculadora do começo da página
          </a>
          . Depois informe o novo salário e quando ele passa a valer.
        </p>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Campo
              id={`${id}-novo`}
              rotulo="Novo salário bruto (R$)"
              exemplo="Ex.: 3.300,00"
              valor={novo}
              aoMudar={setNovo}
              erro={leitura.tipo === "invalido" ? leitura.mensagem : undefined}
            />
            <Escolha id={`${id}-quando`} rotulo="Passa a valer em" valor={quando} opcoes={QUANDO} aoMudar={setQuando} />
          </div>
          {b && b !== a && (
            <div className="mt-6 space-y-4">
              <p className="rounded-xl border border-border bg-white px-4 py-4 text-base">
                Com o aumento, o 13º líquido vai de <span className="tabular-nums">{reais(a.totalLiquido)}</span> para{" "}
                <strong className="tabular-nums">{reais(b.totalLiquido)}</strong>: diferença de{" "}
                <strong className="tabular-nums">{reais(b.totalLiquido - a.totalLiquido)}</strong>.
              </p>
              <div className="overflow-hidden rounded-xl border border-border bg-white">
                <table className="w-full text-sm sm:text-base">
                  <caption className="sr-only">13º sem e com o reajuste</caption>
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th scope="col" className="px-4 py-3 font-medium text-muted">&nbsp;</th>
                      <th scope="col" className="px-2 py-3 text-right font-medium">Sem aumento</th>
                      <th scope="col" className="px-4 py-3 text-right font-medium">Com aumento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border tabular-nums">
                    {(
                      [
                        ["13º bruto", a.bruto, b.bruto],
                        ["1ª parcela", a.primeira.valor, b.primeira.valor],
                        ["INSS + imposto", a.inss.total + a.irrf.imposto, b.inss.total + b.irrf.imposto],
                        ["2ª parcela", a.segunda, b.segunda],
                        ["Total líquido", a.totalLiquido, b.totalLiquido],
                      ] as const
                    ).map(([nome, x, y]) => (
                      <tr key={nome}>
                        <th scope="row" className="px-4 py-3 text-left font-normal text-muted">{nome}</th>
                        <td className="whitespace-nowrap px-2 py-3 text-right">{reais(x)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">{reais(y)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm leading-6 text-muted">
                O 13º é calculado sobre o salário de dezembro: um aumento até dezembro muda o 13º
                inteiro, não só os meses depois dele. A 1ª parcela usa o salário do mês anterior
                ao pagamento; se o aumento veio depois dela, a diferença entra na 2ª.
              </p>
            </div>
          )}
          {quando === "depois" && (
            <p className="mt-4 rounded-xl border border-border bg-white px-4 py-4 text-sm leading-6">
              Um aumento que só vale a partir de 2027 não muda o 13º de 2026, que usa o salário de
              dezembro de 2026.
            </p>
          )}
        </>
      )}
    </section>
  );
}
