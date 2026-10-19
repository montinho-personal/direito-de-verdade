"use client";

import { useId, useState } from "react";
import {
  DESCONTO_SIMPLIFICADO_2026,
  detalheDoImposto2026,
  inss2026,
  LIMITE_ISENCAO_IR_2026,
} from "@/lib/decimo-terceiro";

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

const DEPENDENTES = Array.from({ length: 7 }, (_, i) => i);

const estiloDoCampo =
  "mt-1.5 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-base text-foreground focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/40";

// Imposto de renda do salário em 2026, com a redução da Lei 15.270/2025
export function CalculadoraIrSalario({ nivelDoTitulo = 3 }: { nivelDoTitulo?: 2 | 3 }) {
  const id = useId();
  const Titulo = nivelDoTitulo === 2 ? "h2" : "h3";
  const [salario, setSalario] = useState("");
  const [dependentes, setDependentes] = useState(0);

  const bruto = lerValor(salario);
  const inss = bruto > 0 ? inss2026(bruto) : 0;
  const ir = bruto > 0 ? detalheDoImposto2026(bruto, inss, dependentes) : null;

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
        Calcule o imposto de renda do seu salário em 2026
      </Titulo>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Salário bruto mensal (R$)
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="Ex.: 5.500,00"
            value={salario}
            onChange={(evento) => setSalario(evento.target.value)}
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
        </label>
      </div>

      <div aria-live="polite" className="mt-6">
        {ir ? (
          <dl className="divide-y divide-border rounded-xl border border-border bg-white text-sm sm:text-base">
            <Linha nome="Desconto do INSS" valor={`− ${real.format(inss)}`} />
            <Linha
              nome={
                ir.usaDescontoSimplificado
                  ? "Desconto simplificado (vale mais que o INSS e os dependentes)"
                  : "Base do imposto (salário menos INSS e dependentes)"
              }
              valor={real.format(ir.usaDescontoSimplificado ? DESCONTO_SIMPLIFICADO_2026 : ir.base)}
            />
            <Linha nome="Imposto pela tabela" valor={real.format(ir.pelaTabela)} />
            <Linha
              nome="Redução da nova lei (até R$ 5 mil zera o imposto)"
              valor={`− ${real.format(ir.reducao)}`}
            />
            <Linha
              nome="Imposto de renda a pagar"
              valor={
                ir.imposto === 0 && bruto <= LIMITE_ISENCAO_IR_2026
                  ? "Isento"
                  : real.format(ir.imposto)
              }
              destaque
            />
            <Linha
              nome="Salário depois do INSS e do IR"
              valor={real.format(bruto - inss - ir.imposto)}
              destaque
            />
          </dl>
        ) : (
          <p className="rounded-xl border border-dashed border-border bg-white px-4 py-5 text-sm text-muted">
            Digite o seu salário bruto para ver o imposto de renda de 2026.
          </p>
        )}
      </div>

      <p className="mt-4 text-xs leading-5 text-muted">
        Estimativa com as tabelas do INSS e do imposto de renda de 2026, para quem
        trabalha com carteira assinada. Não inclui pensão alimentícia, previdência
        privada, vale-transporte ou outros descontos da empresa.
      </p>
    </section>
  );
}

function Linha({
  nome,
  valor,
  destaque = false,
}: {
  nome: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-3">
      <dt className={`min-w-0 ${destaque ? "font-semibold" : "text-muted"}`}>{nome}</dt>
      <dd
        className={`shrink-0 whitespace-nowrap text-right tabular-nums ${destaque ? "font-semibold" : ""}`}
      >
        {valor}
      </dd>
    </div>
  );
}
