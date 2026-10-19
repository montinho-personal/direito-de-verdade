"use client";

import { useId, useState } from "react";
import { calcular13, LIMITE_ISENCAO_IR_2026 } from "@/lib/decimo-terceiro";

const real = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// Aceita "2.500,50", "2500,50", "2500.50" e "2500"
function lerValor(texto: string) {
  const limpo = texto.replace(/[^\d,.]/g, "");
  if (!limpo) return 0;
  const normalizado = limpo.includes(",")
    ? limpo.replace(/\./g, "").replace(",", ".")
    : limpo.replace(/\.(?=\d{3}(\.|$))/g, "");
  const valor = Number(normalizado);
  return Number.isFinite(valor) ? valor : 0;
}

const MESES = Array.from({ length: 12 }, (_, i) => 12 - i);
const DEPENDENTES = Array.from({ length: 7 }, (_, i) => i);

const estiloDoCampo =
  "mt-1.5 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-base text-foreground focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/40";

// No meio do artigo o título é h3 (fica dentro de uma seção); no topo da página, h2
export function Calculadora13Salario({ nivelDoTitulo = 3 }: { nivelDoTitulo?: 2 | 3 }) {
  const id = useId();
  const Titulo = nivelDoTitulo === 2 ? "h2" : "h3";
  const [salario, setSalario] = useState("");
  const [meses, setMeses] = useState(12);
  const [variaveis, setVariaveis] = useState("");
  const [dependentes, setDependentes] = useState(0);

  const valorDoSalario = lerValor(salario);
  const resultado =
    valorDoSalario > 0
      ? calcular13({
          salario: valorDoSalario,
          meses,
          mediaVariaveis: lerValor(variaveis),
          dependentes,
        })
      : null;
  const isento = resultado !== null && resultado.bruto <= LIMITE_ISENCAO_IR_2026;

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
        Calcule o seu 13º salário de 2026
      </Titulo>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Salário bruto mensal (R$)
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="Ex.: 2.500,00"
            value={salario}
            onChange={(evento) => setSalario(evento.target.value)}
            className={estiloDoCampo}
          />
        </label>
        <label className="block text-sm font-medium">
          Meses trabalhados em 2026
          <select
            value={meses}
            onChange={(evento) => setMeses(Number(evento.target.value))}
            className={estiloDoCampo}
          >
            {MESES.map((quantidade) => (
              <option key={quantidade} value={quantidade}>
                {quantidade === 12 ? "12 (o ano todo)" : quantidade}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs font-normal text-muted">
            Conte cada mês em que trabalhou 15 dias ou mais.
          </span>
        </label>
        <label className="block text-sm font-medium">
          Média mensal de horas extras, comissões ou adicionais (opcional)
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="Ex.: 300,00"
            value={variaveis}
            onChange={(evento) => setVariaveis(evento.target.value)}
            className={estiloDoCampo}
          />
        </label>
        <label className="block text-sm font-medium">
          Dependentes no imposto de renda
          <select
            value={dependentes}
            onChange={(evento) => setDependentes(Number(evento.target.value))}
            className={estiloDoCampo}
          >
            {DEPENDENTES.map((quantidade) => (
              <option key={quantidade} value={quantidade}>
                {quantidade === 6 ? "6 ou mais" : quantidade}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs font-normal text-muted">
            Só muda a conta se o 13º passar de R$ 5 mil.
          </span>
        </label>
      </div>

      <div aria-live="polite" className="mt-6">
        {resultado ? (
          <dl className="divide-y divide-border rounded-xl border border-border bg-white text-sm sm:text-base">
            <Linha nome="13º salário bruto" valor={real.format(resultado.bruto)} />
            <Linha
              nome="1ª parcela, até 30/11 (sem descontos)"
              valor={real.format(resultado.primeiraParcela)}
              destaque
            />
            <Linha
              nome="Desconto do INSS (sai da 2ª parcela)"
              valor={`− ${real.format(resultado.inss)}`}
            />
            {isento ? (
              <Linha
                nome="Imposto de renda"
                texto
                valor={`Isento (13º de até ${real.format(LIMITE_ISENCAO_IR_2026).replace(",00", "")})`}
              />
            ) : (
              <Linha
                nome="Imposto de renda (sai da 2ª parcela)"
                valor={`− ${real.format(resultado.impostoDeRenda)}`}
              />
            )}
            <Linha
              nome="2ª parcela, até 18/12"
              valor={real.format(resultado.segundaParcela)}
              destaque
            />
            <Linha
              nome="Total que cai na conta"
              valor={real.format(resultado.primeiraParcela + resultado.segundaParcela)}
            />
          </dl>
        ) : (
          <p className="rounded-xl border border-dashed border-border bg-white px-4 py-5 text-sm text-muted">
            Digite o seu salário bruto para ver o valor de cada parcela.
          </p>
        )}
      </div>

      <p className="mt-4 text-xs leading-5 text-muted">
        Estimativa com as tabelas do INSS e do imposto de renda de 2026, para
        quem trabalha com carteira assinada. A empresa pode chegar a um valor
        um pouco diferente, por exemplo se calcular a 1ª parcela sobre o
        salário de outubro ou descontar pensão alimentícia, que a calculadora
        não inclui.
      </p>
    </section>
  );
}

function Linha({
  nome,
  valor,
  destaque = false,
  texto = false,
}: {
  nome: string;
  valor: string;
  destaque?: boolean;
  // Valor em palavras (pode quebrar linha); números ficam sempre inteiros
  texto?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-3">
      <dt className={`min-w-0 ${destaque ? "font-semibold" : "text-muted"}`}>{nome}</dt>
      <dd
        className={`text-right ${texto ? "max-w-[50%]" : "shrink-0 whitespace-nowrap tabular-nums"} ${destaque ? "font-semibold" : ""}`}
      >
        {valor}
      </dd>
    </div>
  );
}
