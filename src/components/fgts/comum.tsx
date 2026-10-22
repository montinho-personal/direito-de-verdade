"use client";

// Peças comuns às modalidades da calculadora de FGTS
import type { ReactNode } from "react";
import { estiloDoCampo } from "@/components/partes-da-calculadora";
import { type Competencia, MESES } from "@/lib/fgts/competencias.ts";
import type { Vinculo } from "@/lib/fgts/parametros.ts";
import { type Data, formatarData } from "@/lib/trabalhista/datas.ts";

export type Nivel = "h3" | "h4";

export type Contrato = {
  vinculo: Vinculo;
  // Salário bruto em centavos (0 enquanto não foi digitado)
  salario: number;
  // AAAA-MM-DD ou ""
  admissao: string;
  hoje: Data;
};

export const NOME_DO_VINCULO: Record<Vinculo, string> = {
  clt: "Carteira assinada (CLT)",
  aprendiz: "Jovem aprendiz",
  domestico: "Empregado doméstico",
};

export const link = "text-accent underline underline-offset-2";
export const caixa = "rounded-xl border border-border bg-white";
export const lista = "space-y-2 rounded-xl border border-border bg-white px-4 py-4 text-sm leading-6";
export const aviso = "space-y-2 rounded-xl border border-gold/50 bg-gold/10 px-4 py-4 text-sm leading-6";

// Dia de hoje no horário de Brasília
export function hojeEmBrasilia(): Data {
  const [ano, mes, dia] = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .split("-")
    .map(Number);
  return { ano, mes, dia };
}

export const dataBr = (d: Data) => formatarData(d);

// Mês e ano em duas listas (o campo "month" não funciona em todos os navegadores)
export function SeletorDeCompetencia({
  id,
  rotulo,
  valor,
  aoMudar,
  anos,
  dica,
}: {
  id: string;
  rotulo: string;
  valor: Competencia;
  aoMudar: (c: Competencia) => void;
  anos: number[];
  dica?: ReactNode;
}) {
  return (
    <fieldset aria-describedby={dica ? `${id}-dica` : undefined}>
      <legend className="block text-sm font-medium">{rotulo}</legend>
      <div className="grid grid-cols-[3fr_2fr] gap-2">
        <label className="sr-only" htmlFor={`${id}-mes`}>
          Mês
        </label>
        <select
          id={`${id}-mes`}
          value={valor.mes}
          onChange={(e) => aoMudar({ ...valor, mes: Number(e.target.value) })}
          className={estiloDoCampo}
        >
          {MESES.map((nome, i) => (
            <option key={nome} value={i + 1}>
              {nome}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor={`${id}-ano`}>
          Ano
        </label>
        <select
          id={`${id}-ano`}
          value={valor.ano}
          onChange={(e) => aoMudar({ ...valor, ano: Number(e.target.value) })}
          className={estiloDoCampo}
        >
          {anos.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>
      {dica && (
        <p id={`${id}-dica`} className="mt-1 text-xs leading-5 text-muted">
          {dica}
        </p>
      )}
    </fieldset>
  );
}

// Opções em "pílulas" (rádio), como nas outras calculadoras
export function Pilulas<T extends string>({
  nome,
  legenda,
  valor,
  opcoes,
  aoMudar,
}: {
  nome: string;
  legenda: string;
  valor: T;
  opcoes: readonly { valor: T; nome: string }[];
  aoMudar: (v: T) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium">{legenda}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {opcoes.map((o) => (
          <label
            key={o.valor}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm has-[:checked]:border-gold has-[:checked]:bg-gold/10 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold/60"
          >
            <input
              type="radio"
              name={nome}
              value={o.valor}
              checked={valor === o.valor}
              onChange={() => aoMudar(o.valor)}
              className="accent-[var(--accent)]"
            />
            {o.nome}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Caixinha({ rotulo, marcado, aoMudar }: { rotulo: ReactNode; marcado: boolean; aoMudar: (v: boolean) => void }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-6">
      <input
        type="checkbox"
        checked={marcado}
        onChange={(e) => aoMudar(e.target.checked)}
        className="mt-1.5 size-4 accent-[var(--accent)]"
      />
      <span>{rotulo}</span>
    </label>
  );
}

export function Destaque({ rotulo, valor, detalhe }: { rotulo: string; valor: string; detalhe?: ReactNode }) {
  return (
    <div className="px-4 pb-4 pt-5">
      <p className="text-sm text-muted">{rotulo}</p>
      <p className="mt-1 font-serif text-4xl tabular-nums sm:text-5xl">{valor}</p>
      {detalhe && <p className="mt-1 text-sm text-muted">{detalhe}</p>}
    </div>
  );
}

export function Detalhes({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <details className={`group ${caixa}`}>
      <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
        {titulo}
        <span aria-hidden="true" className="text-muted transition-transform group-open:rotate-180 motion-reduce:transition-none">
          ▾
        </span>
      </summary>
      <div className="border-t border-border px-4 py-4 text-sm leading-6">{children}</div>
    </details>
  );
}

export function Vazio({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-border bg-white px-4 py-5 text-sm text-muted">{children}</p>;
}
