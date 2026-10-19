"use client";

import { useId, useState } from "react";
import { Campo, NotaDaEstimativa } from "@/components/partes-da-calculadora";
import { lerQuantidade, lerReais, reais } from "@/lib/dinheiro";
import { calcularSalario } from "@/lib/tributos/calculo.ts";

// Diferença de até 1 centavo é arredondamento do sistema da folha
const TOLERANCIA = 1;

// Conferência preliminar do INSS e do IR do holerite com a estimativa de 2026.
// Nunca conclui que a empresa errou: só mostra onde os números diferem e por quê
// isso costuma acontecer.
export function ConferirHolerite({ nivelDoTitulo = 3 }: { nivelDoTitulo?: 2 | 3 }) {
  const id = useId();
  const Titulo = nivelDoTitulo === 2 ? "h2" : "h3";
  const [bruto, setBruto] = useState("");
  const [dependentes, setDependentes] = useState("");
  const [pensao, setPensao] = useState("");
  const [inss, setInss] = useState("");
  const [ir, setIr] = useState("");

  const leituras = {
    bruto: lerReais(bruto),
    pensao: lerReais(pensao),
    inss: lerReais(inss),
    ir: lerReais(ir),
  };
  const leituraDosDependentes = lerQuantidade(dependentes, 20);
  const erro = (campo: keyof typeof leituras) => {
    const leitura = leituras[campo];
    return leitura.tipo === "invalido" ? leitura.mensagem : undefined;
  };

  const pronto =
    leituras.bruto.tipo === "valido" &&
    leituras.bruto.centavos > 0 &&
    leituras.inss.tipo === "valido" &&
    leituras.ir.tipo !== "invalido" &&
    leituras.pensao.tipo !== "invalido" &&
    leituraDosDependentes.tipo === "valido";

  const estimativa =
    pronto && leituras.bruto.tipo === "valido" && leituraDosDependentes.tipo === "valido"
      ? calcularSalario({
          salario: leituras.bruto.centavos,
          dependentes: leituraDosDependentes.quantidade,
          pensaoAlimenticia: leituras.pensao.tipo === "valido" ? leituras.pensao.centavos : 0,
        })
      : null;

  const linhas = estimativa
    ? [
        {
          nome: "INSS",
          informado: leituras.inss.tipo === "valido" ? leituras.inss.centavos : 0,
          estimado: estimativa.inss.total,
        },
        {
          nome: "Imposto de renda",
          informado: leituras.ir.tipo === "valido" ? leituras.ir.centavos : 0,
          estimado: estimativa.irrf.imposto,
        },
      ]
    : [];
  const temDiferenca = linhas.some((linha) => Math.abs(linha.informado - linha.estimado) > TOLERANCIA);

  return (
    <section
      aria-labelledby={`${id}-titulo`}
      data-track="artigo:ferramenta-inline"
      className="my-10 rounded-2xl border border-border bg-surface p-6 sm:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">Conferência</p>
      <Titulo id={`${id}-titulo`} className="mt-2 font-serif text-2xl leading-snug">
        Compare com o seu holerite
      </Titulo>
      <p className="mt-2 text-sm leading-6 text-muted">
        Copie os valores do holerite de um mês comum, sem férias nem 13º.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Campo
          id={`${id}-bruto`}
          rotulo="Total de vencimentos do mês (R$)"
          exemplo="Ex.: 6.000,00"
          valor={bruto}
          aoMudar={setBruto}
          erro={erro("bruto")}
          dica="Salário com horas extras, adicionais e comissões, antes dos descontos."
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
        <Campo
          id={`${id}-inss`}
          rotulo="INSS descontado no holerite (R$)"
          exemplo="Ex.: 641,51"
          valor={inss}
          aoMudar={setInss}
          erro={erro("inss")}
        />
        <Campo
          id={`${id}-ir`}
          rotulo="IR descontado no holerite (R$)"
          exemplo="0,00 se não houve"
          valor={ir}
          aoMudar={setIr}
          erro={erro("ir")}
          dica="Pode aparecer como IRRF ou IR fonte. Deixe vazio se não houve desconto."
        />
        <Campo
          id={`${id}-pensao`}
          rotulo="Pensão alimentícia judicial descontada (R$)"
          exemplo="Opcional"
          valor={pensao}
          aoMudar={setPensao}
          erro={erro("pensao")}
        />
      </div>

      <div className="mt-6">
        {estimativa ? (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-xl border border-border bg-white">
              <table className="w-full text-sm sm:text-base">
                <caption className="sr-only">Descontos do holerite comparados com a estimativa</caption>
                <thead>
                  <tr className="border-b border-border text-left">
                    <th scope="col" className="px-4 py-3 font-medium text-muted">
                      Desconto
                    </th>
                    <th scope="col" className="px-2 py-3 text-right font-medium">
                      Holerite
                    </th>
                    <th scope="col" className="px-2 py-3 text-right font-medium">
                      Estimativa
                    </th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">
                      Diferença
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border tabular-nums">
                  {linhas.map((linha) => {
                    const diferenca = linha.informado - linha.estimado;
                    const confere = Math.abs(diferenca) <= TOLERANCIA;
                    return (
                      <tr key={linha.nome}>
                        <th scope="row" className="px-4 py-3 text-left font-normal text-muted">
                          {linha.nome}
                        </th>
                        <td className="whitespace-nowrap px-2 py-3 text-right">{reais(linha.informado)}</td>
                        <td className="whitespace-nowrap px-2 py-3 text-right">{reais(linha.estimado)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          {confere ? "Confere" : `${diferenca > 0 ? "+" : "−"} ${reais(Math.abs(diferenca))}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {temDiferenca ? (
              <div className="rounded-xl border border-border bg-white px-4 py-4 text-sm leading-6">
                <p className="font-medium">
                  Os valores são diferentes. Isso não quer dizer que a empresa errou: é uma
                  conferência preliminar. As causas mais comuns são:
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
                  <li>
                    verbas que não entram no INSS ou no IR, ou que entram e não foram somadas
                    aqui (horas extras, adicionais, comissões, faltas e atrasos);
                  </li>
                  <li>
                    dependentes, pensão ou previdência complementar diferentes dos informados
                    à empresa;
                  </li>
                  <li>férias ou 13º no mesmo mês, que têm cálculo próprio;</li>
                  <li>holerite de outro ano, com tabelas diferentes das de 2026;</li>
                  <li>trabalho em mais de uma empresa, que divide o INSS até o teto;</li>
                  <li>acertos de meses anteriores lançados neste holerite.</li>
                </ul>
                <p className="mt-2">
                  Se a dúvida continuar, peça ao RH a memória de cálculo do desconto. O
                  sindicato da categoria, um contador ou um advogado podem ajudar a conferir.
                </p>
              </div>
            ) : (
              <p className="rounded-xl border border-border bg-white px-4 py-4 text-sm leading-6">
                Os descontos de INSS e imposto de renda batem com a estimativa de 2026 para
                esse salário.
              </p>
            )}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-border bg-white px-4 py-5 text-sm text-muted">
            Digite o total de vencimentos e o INSS do holerite para comparar.
          </p>
        )}
        <p aria-live="polite" className="sr-only">
          {estimativa ? (temDiferenca ? "Há diferença entre o holerite e a estimativa." : "Os descontos conferem com a estimativa.") : ""}
        </p>
      </div>

      <NotaDaEstimativa />
    </section>
  );
}
