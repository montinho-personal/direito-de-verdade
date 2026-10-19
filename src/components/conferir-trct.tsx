"use client";

import { useId, useState } from "react";
import { Campo } from "@/components/partes-da-calculadora";
import { lerFormulario, useFormulario } from "@/components/rescisao/formulario";
import { lerReais, reais } from "@/lib/dinheiro";
import { calcularRescisao, type ResultadoDaRescisao } from "@/lib/trabalhista/rescisao.ts";

// Diferenças de até R$ 1 são tratadas como arredondamento
const TOLERANCIA = 100;

type Rubrica = {
  chave: string;
  nome: string;
  dica: string;
  estimar: (r: ResultadoDaRescisao) => number;
};

const soma = (r: ResultadoDaRescisao, ...ids: string[]) =>
  r.verbas.filter((v) => ids.includes(v.id)).reduce((total, v) => total + v.valor, 0);

const RUBRICAS: Rubrica[] = [
  {
    chave: "saldo",
    nome: "Saldo de salário",
    dica: "Dias trabalhados no mês da saída.",
    estimar: (r) => soma(r, "saldo"),
  },
  {
    chave: "aviso",
    nome: "Aviso prévio indenizado",
    dica: "Deixe vazio se o aviso foi trabalhado.",
    estimar: (r) => soma(r, "aviso"),
  },
  {
    chave: "decimo",
    nome: "13º salário",
    dica: "Some o 13º proporcional e o 13º sobre o aviso, se vierem separados.",
    estimar: (r) => soma(r, "decimo-proporcional", "decimo-aviso"),
  },
  {
    chave: "ferias",
    nome: "Férias com 1/3",
    dica: "Some férias vencidas, proporcionais, sobre o aviso e o terço.",
    estimar: (r) => soma(r, "ferias-vencidas", "ferias-proporcionais", "ferias-aviso", "terco"),
  },
  {
    chave: "descontos",
    nome: "Total de descontos",
    dica: "INSS, imposto de renda, adiantamentos e outros descontos.",
    estimar: (r) => r.totalDeDescontos,
  },
  {
    chave: "liquido",
    nome: "Valor líquido",
    dica: "O total que a empresa vai pagar.",
    estimar: (r) => r.liquido,
  },
];

// Compara os valores do termo de rescisão (TRCT) com a estimativa da calculadora.
// É uma conferência preliminar: uma diferença não quer dizer erro da empresa.
export function ConferirTrct({ nivelDoTitulo = 3 }: { nivelDoTitulo?: 2 | 3 }) {
  const id = useId();
  const Titulo = nivelDoTitulo === 2 ? "h2" : "h3";
  const formulario = useFormulario();
  const { entrada } = lerFormulario(formulario);
  const calculo = entrada ? calcularRescisao(entrada) : null;
  const r = calculo?.ok ? calculo : null;
  const [valores, setValores] = useState<Record<string, string>>({});

  const linhas = r
    ? RUBRICAS.map((rubrica) => {
        const leitura = lerReais(valores[rubrica.chave] ?? "");
        return {
          ...rubrica,
          estimado: rubrica.estimar(r),
          leitura,
          empresa: leitura.tipo === "valido" ? leitura.centavos : null,
        };
      })
    : [];
  const comparadas = linhas.filter((l) => l.empresa !== null);
  const divergentes = comparadas.filter((l) => Math.abs((l.empresa ?? 0) - l.estimado) > TOLERANCIA);

  return (
    <section
      aria-labelledby={`${id}-titulo`}
      data-track="artigo:ferramenta-inline"
      className="my-10 rounded-2xl border border-border bg-surface p-6 sm:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">Conferência</p>
      <Titulo id={`${id}-titulo`} className="mt-2 font-serif text-2xl leading-snug">
        Confira o seu termo de rescisão (TRCT)
      </Titulo>

      {!r ? (
        <p className="mt-4 rounded-xl border border-dashed border-border bg-white px-4 py-5 text-sm text-muted">
          Preencha primeiro a{" "}
          <a href="#calculadora-de-rescisao" className="text-accent underline underline-offset-2">
            calculadora do começo da página
          </a>
          , com os mesmos dados do termo. Depois copie aqui os valores que a empresa
          informou.
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm leading-6 text-muted">
            Copie do termo de rescisão os valores de cada linha. Pode deixar em branco o
            que não encontrar. A comparação usa os dados que você digitou na calculadora
            acima.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {linhas.map((linha) => (
              <Campo
                key={linha.chave}
                id={`${id}-${linha.chave}`}
                rotulo={`${linha.nome} no termo (R$)`}
                exemplo="Opcional"
                valor={valores[linha.chave] ?? ""}
                aoMudar={(valor) => setValores((atuais) => ({ ...atuais, [linha.chave]: valor }))}
                erro={linha.leitura.tipo === "invalido" ? linha.leitura.mensagem : undefined}
                dica={linha.dica}
              />
            ))}
          </div>

          <div className="mt-6">
            {comparadas.length ? (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-xl border border-border bg-white">
                  <table className="w-full text-sm sm:text-base">
                    <caption className="sr-only">Termo de rescisão comparado com a estimativa</caption>
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th scope="col" className="px-3 py-3 font-medium text-muted sm:px-4">
                          Verba
                        </th>
                        <th scope="col" className="px-2 py-3 text-right font-medium">
                          Estimativa
                        </th>
                        <th scope="col" className="px-2 py-3 text-right font-medium">
                          Empresa
                        </th>
                        <th scope="col" className="px-3 py-3 text-right font-medium sm:px-4">
                          Diferença
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border tabular-nums">
                      {comparadas.map((linha) => {
                        const diferenca = (linha.empresa ?? 0) - linha.estimado;
                        const confere = Math.abs(diferenca) <= TOLERANCIA;
                        return (
                          <tr key={linha.chave}>
                            <th scope="row" className="px-3 py-3 text-left font-normal text-muted sm:px-4">
                              {linha.nome}
                            </th>
                            <td className="px-2 py-3 text-right">{reais(linha.estimado)}</td>
                            <td className="px-2 py-3 text-right">{reais(linha.empresa ?? 0)}</td>
                            <td className={`px-3 py-3 text-right sm:px-4 ${confere ? "" : "font-semibold"}`}>
                              {confere ? "Confere" : `${diferenca > 0 ? "+" : "−"} ${reais(Math.abs(diferenca))}`}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {divergentes.length ? (
                  <div className="rounded-xl border border-border bg-white px-4 py-4 text-sm leading-6">
                    <p className="font-medium">
                      {divergentes.length === 1 ? "Uma linha ficou diferente" : `${divergentes.length} linhas ficaram diferentes`}{" "}
                      da estimativa. Isso não quer dizer que a empresa errou: é uma
                      conferência preliminar. Diferenças costumam vir de:
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
                      <li>convenção ou acordo coletivo da categoria, que pode dar valores a mais;</li>
                      <li>médias de horas extras, comissões e adicionais (informe no cálculo detalhado);</li>
                      <li>faltas, que diminuem o saldo e podem reduzir os dias de férias;</li>
                      <li>datas diferentes das que você digitou, como o último dia trabalhado;</li>
                      <li>13º ou férias pagos antes, adiantamentos e outros descontos;</li>
                      <li>regras que a calculadora não cobre, como estabilidade ou contrato com prazo.</li>
                    </ul>
                    <p className="mt-2">
                      Peça ao RH a explicação da linha que ficou diferente. Se a dúvida
                      continuar, o sindicato da categoria, um advogado trabalhista ou a
                      Defensoria Pública podem conferir o termo com você.
                    </p>
                  </div>
                ) : (
                  <p className="rounded-xl border border-border bg-white px-4 py-4 text-sm leading-6">
                    Os valores que você copiou batem com a estimativa (diferença de até R$ 1
                    é arredondamento).
                  </p>
                )}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-border bg-white px-4 py-5 text-sm text-muted">
                Digite pelo menos um valor do termo para comparar.
              </p>
            )}
            <p aria-live="polite" className="sr-only">
              {comparadas.length
                ? divergentes.length
                  ? `${divergentes.length} diferença(s) em relação à estimativa.`
                  : "Os valores conferem com a estimativa."
                : ""}
            </p>
          </div>
        </>
      )}
    </section>
  );
}
