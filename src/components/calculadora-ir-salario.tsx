"use client";

import { useId, useState } from "react";
import {
  Campo,
  Compartilhar,
  Linha,
  NotaDaEstimativa,
} from "@/components/partes-da-calculadora";
import { lerQuantidade, lerReais, percentualPorMil, reais } from "@/lib/dinheiro";
import { calcularSalario, type ResultadoDoSalario } from "@/lib/tributos/calculo.ts";
import { PARAMETROS_2026 } from "@/lib/tributos/parametros-2026.ts";

const MAXIMO_DE_DEPENDENTES = 20;

// Imposto de renda e salário líquido de quem tem carteira assinada, com as regras de 2026
export function CalculadoraIrSalario({ nivelDoTitulo = 3 }: { nivelDoTitulo?: 2 | 3 }) {
  const id = useId();
  const Titulo = nivelDoTitulo === 2 ? "h2" : "h3";
  const [salario, setSalario] = useState("");
  const [dependentes, setDependentes] = useState("");
  const [variaveis, setVariaveis] = useState("");
  const [pensao, setPensao] = useState("");

  const leituraDoSalario = lerReais(salario);
  const leituraDosDependentes = lerQuantidade(dependentes, MAXIMO_DE_DEPENDENTES);
  const leituraDasVariaveis = lerReais(variaveis);
  const leituraDaPensao = lerReais(pensao);

  const erroDoSalario =
    leituraDoSalario.tipo === "invalido"
      ? leituraDoSalario.mensagem
      : leituraDoSalario.tipo === "valido" && leituraDoSalario.centavos === 0
        ? "Digite um salário maior que zero."
        : undefined;
  const erroDosDependentes =
    leituraDosDependentes.tipo === "invalido" ? leituraDosDependentes.mensagem : undefined;
  const erroDasVariaveis =
    leituraDasVariaveis.tipo === "invalido" ? leituraDasVariaveis.mensagem : undefined;
  const erroDaPensao = leituraDaPensao.tipo === "invalido" ? leituraDaPensao.mensagem : undefined;

  const resultado =
    leituraDoSalario.tipo === "valido" &&
    leituraDoSalario.centavos > 0 &&
    leituraDosDependentes.tipo === "valido" &&
    !erroDasVariaveis &&
    !erroDaPensao
      ? calcularSalario({
          salario: leituraDoSalario.centavos,
          variaveis: leituraDasVariaveis.tipo === "valido" ? leituraDasVariaveis.centavos : 0,
          dependentes: leituraDosDependentes.quantidade,
          pensaoAlimenticia: leituraDaPensao.tipo === "valido" ? leituraDaPensao.centavos : 0,
        })
      : null;
  const quantidadeDeDependentes =
    leituraDosDependentes.tipo === "valido" ? leituraDosDependentes.quantidade : 0;

  return (
    <section
      aria-labelledby={`${id}-titulo`}
      data-track="artigo:ferramenta-inline"
      className="my-10 rounded-2xl border border-border bg-surface p-6 sm:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">
        Calculadora
      </p>
      <Titulo id={`${id}-titulo`} className="mt-2 font-serif text-2xl leading-snug">
        Calcule o imposto de renda e o salário líquido de 2026
      </Titulo>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Campo
          id={`${id}-salario`}
          rotulo="Salário bruto mensal (R$)"
          exemplo="Ex.: 5.500,00"
          valor={salario}
          aoMudar={setSalario}
          erro={erroDoSalario}
        />
        <Campo
          id={`${id}-dependentes`}
          rotulo="Dependentes no imposto de renda"
          exemplo="0"
          modo="numeric"
          valor={dependentes}
          aoMudar={setDependentes}
          erro={erroDosDependentes}
          dica={`Os informados à empresa. Cada um diminui a base em ${reais(PARAMETROS_2026.deducaoPorDependente)}.`}
        />
      </div>

      <details className="group mt-4 rounded-xl border border-border bg-white">
        <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
          Tenho outros descontos ou situações específicas
          <span aria-hidden="true" className="text-muted transition-transform group-open:rotate-180 motion-reduce:transition-none">
            ▾
          </span>
        </summary>
        <div className="grid gap-4 border-t border-border px-4 py-4 sm:grid-cols-2">
          <Campo
            id={`${id}-variaveis`}
            rotulo="Horas extras, adicionais e comissões do mês (R$)"
            exemplo="Ex.: 450,00"
            valor={variaveis}
            aoMudar={setVariaveis}
            erro={erroDasVariaveis}
            dica="Somam ao salário e entram no INSS e no imposto de renda do mês."
          />
          <Campo
            id={`${id}-pensao`}
            rotulo="Pensão alimentícia descontada (R$ por mês)"
            exemplo="Ex.: 800,00"
            valor={pensao}
            aoMudar={setPensao}
            erro={erroDaPensao}
            dica="Só a pensão fixada pela Justiça, em acordo homologado ou em escritura pública diminui o imposto."
          />
          <p className="text-xs leading-5 text-muted sm:col-span-2">
            Fora da conta: previdência complementar, aposentadoria de quem tem 65 anos ou
            mais, pró-labore, trabalho autônomo e salário de mais de uma empresa (cada uma
            calcula o imposto só sobre o que paga).
          </p>
        </div>
      </details>

      <div className="mt-6">
        {resultado ? (
          <Resultado resultado={resultado} dependentes={quantidadeDeDependentes} />
        ) : (
          <p className="rounded-xl border border-dashed border-border bg-white px-4 py-5 text-sm text-muted">
            Digite o seu salário bruto para ver o imposto de renda e o salário líquido de 2026.
          </p>
        )}
        <p aria-live="polite" className="sr-only">
          {resultado ? `Salário líquido estimado: ${reais(resultado.liquido)} por mês.` : ""}
        </p>
      </div>

      <NotaDaEstimativa />
    </section>
  );
}

function Resultado({
  resultado: r,
  dependentes,
}: {
  resultado: ResultadoDoSalario;
  dependentes: number;
}) {
  const isento = r.irrf.imposto === 0 && r.irrf.tipoDeReducao === "isencao";
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-white">
        <div className="px-4 pb-4 pt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Seu salário líquido estimado
          </p>
          <p className="mt-1 font-serif text-4xl tabular-nums sm:text-5xl">{reais(r.liquido)}</p>
          <p className="mt-1 text-sm text-muted">
            por mês, depois do INSS{r.pensaoAlimenticia > 0 ? ", do imposto de renda e da pensão" : " e do imposto de renda"}
          </p>
        </div>
        <dl className="divide-y divide-border border-t border-border text-sm sm:text-base">
          <Linha nome="Salário bruto" valor={reais(r.bruto)} />
          <Linha nome="Desconto do INSS" valor={`− ${reais(r.inss.total)}`} />
          <Linha
            nome="Imposto de renda retido"
            valor={isento ? "Isento" : `− ${reais(r.irrf.imposto)}`}
          />
          {r.pensaoAlimenticia > 0 && (
            <Linha nome="Pensão alimentícia" valor={`− ${reais(r.pensaoAlimenticia)}`} />
          )}
          <Linha nome="Total de descontos considerados" valor={reais(r.totalDeDescontos)} destaque />
        </dl>
        <Composicao resultado={r} />
      </div>
      <MemoriaDeCalculo resultado={r} dependentes={dependentes} />
      <Compartilhar texto={resumoEmTexto(r)} />
    </div>
  );
}

// Barra do salário dividida entre o que fica e o que é descontado. A legenda traz os
// nomes, os valores e os percentuais em texto: a informação não depende da cor.
function Composicao({ resultado: r }: { resultado: ResultadoDoSalario }) {
  const partes = [
    { nome: "Salário líquido", valor: r.liquido, cor: "bg-navy" },
    { nome: "INSS", valor: r.inss.total, cor: "bg-gold" },
    { nome: "Imposto de renda", valor: r.irrf.imposto, cor: "bg-accent" },
    { nome: "Pensão alimentícia", valor: r.pensaoAlimenticia, cor: "bg-navy-muted" },
  ].filter((parte) => parte.valor > 0);
  const porMil = (valor: number) => Math.round((valor * 1000) / r.bruto);
  return (
    <div className="border-t border-border px-4 py-4">
      <p className="text-sm font-medium">Para onde vai o seu salário bruto</p>
      <div aria-hidden="true" className="mt-3 flex h-4 w-full overflow-hidden rounded-full bg-border">
        {partes.map((parte) => (
          <div
            key={parte.nome}
            className={`${parte.cor} h-full border-r-2 border-white last:border-r-0 motion-safe:transition-[width] motion-safe:duration-300`}
            style={{ width: `${(parte.valor * 100) / r.bruto}%` }}
          />
        ))}
      </div>
      <ul className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
        {partes.map((parte) => (
          <li key={parte.nome} className="flex items-center gap-2">
            <span aria-hidden="true" className={`${parte.cor} h-3 w-3 shrink-0 rounded-sm`} />
            <span className="min-w-0">
              {parte.nome}: <span className="tabular-nums">{reais(parte.valor)}</span>{" "}
              <span className="text-muted tabular-nums">({percentualPorMil(porMil(parte.valor))})</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MemoriaDeCalculo({
  resultado: r,
  dependentes,
}: {
  resultado: ResultadoDoSalario;
  dependentes: number;
}) {
  const ir = r.irrf;
  const aliquota = percentualPorMil(ir.aliquotaPorMil);
  return (
    <details className="group rounded-xl border border-border bg-white">
      <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
        Entenda como chegamos a esse resultado
        <span aria-hidden="true" className="text-muted transition-transform group-open:rotate-180 motion-reduce:transition-none">
          ▾
        </span>
      </summary>
      <ol className="list-decimal space-y-3 border-t border-border py-4 pl-9 pr-4 text-sm leading-6">
        <li>
          <strong>Salário bruto do mês:</strong> {reais(r.bruto)}
        </li>
        <li>
          <strong>INSS por faixa</strong> (cada alíquota vale só para a parte do salário dentro da faixa):
          <ul className="mt-1 space-y-0.5">
            {r.inss.faixas.map((faixa) => (
              <li key={faixa.de} className="tabular-nums">
                {percentualPorMil(faixa.aliquotaPorMil)} sobre {reais(faixa.ate - faixa.de)} (de{" "}
                {reais(faixa.de)} a {reais(faixa.ate)}) = {reais(faixa.valor)}
              </li>
            ))}
          </ul>
        </li>
        <li>
          <strong>INSS total:</strong> {reais(r.inss.total)}
          {r.inss.acimaDoTeto && " (o salário passa do teto do INSS, então a contribuição para no valor máximo)"}
        </li>
        <li>
          <strong>Deduções legais:</strong> INSS {reais(r.inss.total)}
          {dependentes > 0 && ` + ${dependentes} dependente${dependentes > 1 ? "s" : ""} (${reais(ir.deducaoDosDependentes)})`}
          {r.pensaoAlimenticia > 0 && ` + pensão ${reais(r.pensaoAlimenticia)}`} ={" "}
          {reais(ir.deducoesLegais)}
        </li>
        <li>
          <strong>Desconto simplificado:</strong> {reais(ir.descontoSimplificado)}, que substitui
          todas as deduções legais quando é maior que elas.
        </li>
        <li>
          <strong>Dedução usada:</strong> {reais(ir.deducaoUsada)} (
          {ir.usaDescontoSimplificado ? "o desconto simplificado, que é maior" : "as deduções legais, que são maiores"}
          ). As duas nunca se somam.
        </li>
        <li>
          <strong>Base do imposto:</strong> {reais(r.bruto)} − {reais(ir.deducaoUsada)} ={" "}
          {reais(ir.base)}
        </li>
        <li>
          <strong>Faixa da tabela:</strong>{" "}
          {ir.aliquotaPorMil === 0
            ? "isenta (base de até R$ 2.428,80)"
            : `${ir.faixa}ª faixa, alíquota de ${aliquota} e parcela a deduzir de ${reais(ir.parcelaADeduzir)}`}
        </li>
        <li>
          <strong>Imposto pela tabela:</strong>{" "}
          {ir.aliquotaPorMil === 0
            ? reais(0)
            : `${reais(ir.base)} × ${aliquota} − ${reais(ir.parcelaADeduzir)} = ${reais(ir.impostoPelaTabela)}`}
        </li>
        <li>
          <strong>Redução de 2026 (Lei 15.270/2025):</strong>{" "}
          {ir.tipoDeReducao === "isencao" &&
            `salário de até R$ 5.000, então a redução zera o imposto: − ${reais(ir.reducao)}.`}
          {ir.tipoDeReducao === "parcial" &&
            `salário entre R$ 5.000,01 e R$ 7.350: R$ 978,62 − 0,133145 × ${reais(r.bruto)} = − ${reais(ir.reducao)}.`}
          {ir.tipoDeReducao === "nenhuma" && "salário acima de R$ 7.350, sem redução."} A
          redução olha o salário bruto, não a base.
        </li>
        <li>
          <strong>Imposto de renda retido:</strong> {reais(ir.impostoPelaTabela)} −{" "}
          {reais(ir.reducao)} = {reais(ir.imposto)}
        </li>
        <li>
          <strong>Salário líquido:</strong> {reais(r.bruto)} − {reais(r.inss.total)} −{" "}
          {reais(ir.imposto)}
          {r.pensaoAlimenticia > 0 && ` − ${reais(r.pensaoAlimenticia)}`} = {reais(r.liquido)}
        </li>
      </ol>
      <p className="border-t border-border px-4 py-3 text-xs leading-5 text-muted">
        Cada etapa é arredondada ao centavo mais próximo. O holerite pode ter 1 centavo de
        diferença, conforme o sistema da empresa. Esta conta é o imposto retido no mês; o
        imposto do ano é acertado na declaração.
      </p>
    </details>
  );
}

function resumoEmTexto(r: ResultadoDoSalario) {
  return [
    `Simulação de salário líquido ${PARAMETROS_2026.ano} (estimativa)`,
    `Salário bruto: ${reais(r.bruto)}`,
    `INSS: ${reais(r.inss.total)}`,
    `Imposto de renda: ${reais(r.irrf.imposto)}`,
    ...(r.pensaoAlimenticia > 0 ? [`Pensão alimentícia: ${reais(r.pensaoAlimenticia)}`] : []),
    `Salário líquido estimado: ${reais(r.liquido)}`,
    "Estimativa com as regras de 2026; o holerite pode variar com outras verbas e descontos.",
    "Calculado em https://direitodeverdade.com.br/calculadoras/imposto-de-renda",
  ].join("\n");
}
