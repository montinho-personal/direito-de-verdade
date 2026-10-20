"use client";

import { useId, useState } from "react";
import { lerFormulario13, useFormulario13 } from "@/components/decimo/formulario";
import { Campo } from "@/components/partes-da-calculadora";
import { lerReais, reais } from "@/lib/dinheiro";
import { calcular13, type ResultadoDo13 } from "@/lib/trabalhista/decimo-terceiro.ts";

// Diferenças de até R$ 1 são tratadas como arredondamento
const TOLERANCIA = 100;

const LINHAS: { chave: string; nome: string; estimar: (r: ResultadoDo13) => number }[] = [
  { chave: "bruto", nome: "13º bruto", estimar: (r) => r.bruto },
  { chave: "primeira", nome: "1ª parcela", estimar: (r) => r.primeira.valor },
  { chave: "segunda", nome: "2ª parcela (líquida)", estimar: (r) => r.segunda },
  { chave: "inss", nome: "INSS", estimar: (r) => r.inss.total },
  { chave: "irrf", nome: "Imposto de renda", estimar: (r) => r.irrf.imposto },
];

// Compara o 13º pago pela empresa com a estimativa. Conferência preliminar: uma
// diferença não quer dizer erro da empresa.
export function Conferir13({ nivelDoTitulo = 3 }: { nivelDoTitulo?: 2 | 3 }) {
  const id = useId();
  const Titulo = nivelDoTitulo === 2 ? "h2" : "h3";
  const f = useFormulario13();
  const { entrada } = lerFormulario13(f);
  const calculo = entrada ? calcular13(entrada) : null;
  const r = calculo?.ok ? calculo : null;
  const [valores, setValores] = useState<Record<string, string>>({});

  const linhas = r
    ? LINHAS.map((l) => {
        const leitura = lerReais(valores[l.chave] ?? "");
        return { ...l, estimado: l.estimar(r), leitura, empresa: leitura.tipo === "valido" ? leitura.centavos : null };
      })
    : [];
  const comparadas = linhas.filter((l) => l.empresa !== null);
  const diferentes = comparadas.filter((l) => Math.abs((l.empresa ?? 0) - l.estimado) > TOLERANCIA);

  return (
    <section
      aria-labelledby={`${id}-titulo`}
      data-track="artigo:ferramenta-inline"
      className="my-10 rounded-2xl border border-border bg-surface p-6 sm:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">Conferência</p>
      <Titulo id={`${id}-titulo`} className="mt-2 font-serif text-2xl leading-snug">
        Confira o 13º que a empresa pagou
      </Titulo>
      {!r ? (
        <p className="mt-4 rounded-xl border border-dashed border-border bg-white px-4 py-5 text-sm text-muted">
          Preencha primeiro a{" "}
          <a href="#calculadora-do-13" className="text-accent underline underline-offset-2">
            calculadora do começo da página
          </a>{" "}
          com o salário e os meses que a empresa considerou. Depois copie aqui os valores do
          holerite do 13º.
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm leading-6 text-muted">
            Copie os valores dos holerites da 1ª e da 2ª parcela. Pode deixar em branco o que não
            tiver. A comparação usa os dados da calculadora acima.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {linhas.map((l) => (
              <Campo
                key={l.chave}
                id={`${id}-${l.chave}`}
                rotulo={`${l.nome} no holerite (R$)`}
                exemplo="Opcional"
                valor={valores[l.chave] ?? ""}
                aoMudar={(valor) => setValores((atuais) => ({ ...atuais, [l.chave]: valor }))}
                erro={l.leitura.tipo === "invalido" ? l.leitura.mensagem : undefined}
              />
            ))}
          </div>
          <div className="mt-6">
            {comparadas.length ? (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-xl border border-border bg-white">
                  <table className="w-full text-sm sm:text-base">
                    <caption className="sr-only">13º pago comparado com a estimativa</caption>
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th scope="col" className="px-3 py-3 font-medium text-muted sm:px-4">Indicador</th>
                        <th scope="col" className="px-2 py-3 text-right font-medium">Estimativa</th>
                        <th scope="col" className="px-2 py-3 text-right font-medium">Empresa</th>
                        <th scope="col" className="px-3 py-3 text-right font-medium sm:px-4">Diferença</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border tabular-nums">
                      {comparadas.map((l) => {
                        const diferenca = (l.empresa ?? 0) - l.estimado;
                        const confere = Math.abs(diferenca) <= TOLERANCIA;
                        return (
                          <tr key={l.chave}>
                            <th scope="row" className="px-3 py-3 text-left font-normal text-muted sm:px-4">{l.nome}</th>
                            <td className="px-2 py-3 text-right">{reais(l.estimado)}</td>
                            <td className="px-2 py-3 text-right">{reais(l.empresa ?? 0)}</td>
                            <td className={`px-3 py-3 text-right sm:px-4 ${confere ? "" : "font-semibold"}`}>
                              {confere ? "Confere" : `${diferenca > 0 ? "+" : "−"} ${reais(Math.abs(diferenca))}`}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {diferentes.length ? (
                  <div className="rounded-xl border border-border bg-white px-4 py-4 text-sm leading-6">
                    <p className="font-medium">
                      Há diferença em relação à estimativa. Isso não quer dizer que a empresa errou:
                      é uma conferência preliminar. As causas mais comuns são:
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
                      <li>salário de dezembro diferente (reajuste, promoção ou dissídio no fim do ano);</li>
                      <li>média de horas extras, comissões e adicionais calculada com outros meses;</li>
                      <li>meses que a empresa contou de outro jeito (admissão, faltas, afastamentos);</li>
                      <li>1ª parcela paga em outro mês, nas férias ou com outro salário;</li>
                      <li>dependentes, pensão ou previdência complementar informados de outro jeito;</li>
                      <li>regras da convenção coletiva da categoria.</li>
                    </ul>
                    <p className="mt-2">
                      Peça ao RH a memória de cálculo do 13º. Se a dúvida continuar, o sindicato,
                      um contador ou um advogado podem conferir com você.
                    </p>
                  </div>
                ) : (
                  <p className="rounded-xl border border-border bg-white px-4 py-4 text-sm leading-6">
                    Os valores que você copiou batem com a estimativa (diferença de até R$ 1 é
                    arredondamento).
                  </p>
                )}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-border bg-white px-4 py-5 text-sm text-muted">
                Digite pelo menos um valor do holerite para comparar.
              </p>
            )}
            <p aria-live="polite" className="sr-only">
              {comparadas.length ? (diferentes.length ? "Há diferença em relação à estimativa." : "Os valores conferem.") : ""}
            </p>
          </div>
        </>
      )}
    </section>
  );
}
