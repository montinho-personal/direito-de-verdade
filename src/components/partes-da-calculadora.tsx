// Peças de formulário e de resultado usadas pelas calculadoras de salário e imposto
// de renda (calculadora do IR, comparador de salários e conferência do holerite).
import Link from "next/link";
import type { ReactNode } from "react";
import { PARAMETROS_2026 } from "@/lib/tributos/parametros-2026.ts";

export const estiloDoCampo =
  "mt-1.5 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-base text-foreground focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/40 aria-[invalid=true]:border-red-700";

export const estiloDoBotao =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-foreground hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60";

// Campo de texto com rótulo, dica e mensagem de erro ligados ao campo para leitores de tela
export function Campo({
  id,
  rotulo,
  dica,
  erro,
  valor,
  aoMudar,
  modo = "decimal",
  exemplo,
}: {
  id: string;
  rotulo: string;
  dica?: ReactNode;
  erro?: string;
  valor: string;
  aoMudar: (valor: string) => void;
  modo?: "decimal" | "numeric";
  exemplo?: string;
}) {
  const descricao = [dica ? `${id}-dica` : null, erro ? `${id}-erro` : null]
    .filter(Boolean)
    .join(" ");
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {rotulo}
      </label>
      <input
        id={id}
        type="text"
        inputMode={modo}
        autoComplete="off"
        placeholder={exemplo}
        value={valor}
        onChange={(evento) => aoMudar(evento.target.value)}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descricao || undefined}
        className={estiloDoCampo}
      />
      {dica && (
        <p id={`${id}-dica`} className="mt-1 text-xs leading-5 text-muted">
          {dica}
        </p>
      )}
      {erro && (
        <p id={`${id}-erro`} className="mt-1 text-sm text-red-700">
          {erro}
        </p>
      )}
    </div>
  );
}

export function Linha({
  nome,
  valor,
  destaque = false,
}: {
  nome: ReactNode;
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

const dataDaRevisao = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
}).format(new Date(`${PARAMETROS_2026.revisadoEm}T00:00:00Z`));

// Rodapé das calculadoras de IR: ano das regras, data da revisão e o aviso de estimativa
export function NotaDaEstimativa({ children }: { children?: ReactNode }) {
  return (
    <div className="mt-4 space-y-2 text-xs leading-5 text-muted">
      {children}
      <p>
        Esta ferramenta apresenta uma estimativa baseada nas informações fornecidas e nas
        regras tributárias aplicáveis. O resultado pode variar conforme outras verbas,
        deduções e situações específicas. A simulação não substitui a análise
        individualizada de um profissional habilitado.
      </p>
      <p>
        Regras de {PARAMETROS_2026.ano} (INSS e imposto de renda), revisadas em{" "}
        {dataDaRevisao}.{" "}
        <Link
          href="/calculadoras/imposto-de-renda#como-calculamos"
          className="text-accent underline underline-offset-2"
        >
          Como calculamos
        </Link>
      </p>
    </div>
  );
}
