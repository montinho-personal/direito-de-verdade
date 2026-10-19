"use client";

import { useId, useState } from "react";
import { CARENCIA, calcularSeguro, type Pedido } from "@/lib/seguro-desemprego";

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

const estiloDoCampo =
  "mt-1.5 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-base text-foreground focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/40";

const PEDIDOS: { valor: Pedido; nome: string; janela: string }[] = [
  { valor: 1, nome: "1º pedido", janela: "nos últimos 18 meses" },
  { valor: 2, nome: "2º pedido", janela: "nos últimos 12 meses" },
  { valor: 3, nome: "3º pedido ou mais", janela: "nos 6 meses antes da dispensa" },
];

const MESES_DOS_SALARIOS = ["Último salário", "Penúltimo salário", "Antepenúltimo salário"];

// Seguro-desemprego de 2026: valor da parcela, número de parcelas e total
export function CalculadoraSeguroDesemprego({ nivelDoTitulo = 3 }: { nivelDoTitulo?: 2 | 3 }) {
  const id = useId();
  const Titulo = nivelDoTitulo === 2 ? "h2" : "h3";
  const [salarios, setSalarios] = useState(["", "", ""]);
  const [meses, setMeses] = useState("");
  const [pedido, setPedido] = useState<Pedido>(1);
  const [domestico, setDomestico] = useState(false);

  const resultado =
    meses.trim() === ""
      ? null
      : calcularSeguro({
          salarios: salarios.map(lerValor),
          meses: Math.floor(lerValor(meses)),
          pedido,
          domestico,
        });
  const regra = PEDIDOS.find((item) => item.valor === pedido)!;

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
        Calcule o seu seguro-desemprego de 2026
      </Titulo>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {MESES_DOS_SALARIOS.map((nome, indice) => (
          <label key={nome} className="block text-sm font-medium">
            {nome} bruto (R$)
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="Ex.: 2.500,00"
              value={salarios[indice]}
              onChange={(evento) =>
                setSalarios((atuais) =>
                  atuais.map((valor, i) => (i === indice ? evento.target.value : valor)),
                )
              }
              className={estiloDoCampo}
            />
          </label>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Tipo de emprego
          <select
            value={domestico ? "domestico" : "clt"}
            onChange={(evento) => setDomestico(evento.target.value === "domestico")}
            className={estiloDoCampo}
          >
            <option value="clt">Carteira assinada (empresa)</option>
            <option value="domestico">Empregado doméstico</option>
          </select>
        </label>
        {!domestico && (
          <label className="block text-sm font-medium">
            Quantas vezes já pediu o seguro
            <select
              value={pedido}
              onChange={(evento) => setPedido(Number(evento.target.value) as Pedido)}
              className={estiloDoCampo}
            >
              {PEDIDOS.map((item) => (
                <option key={item.valor} value={item.valor}>
                  {item.nome}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="block text-sm font-medium">
          {domestico
            ? "Meses trabalhados nos últimos 24 meses"
            : "Meses trabalhados com carteira nos últimos 36 meses"}
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="Ex.: 18"
            value={meses}
            onChange={(evento) => setMeses(evento.target.value)}
            className={estiloDoCampo}
          />
        </label>
      </div>

      <div aria-live="polite" className="mt-6">
        {resultado ? (
          resultado.temDireito ? (
            <dl className="divide-y divide-border rounded-xl border border-border bg-white text-sm sm:text-base">
              {!domestico && (
                <Linha nome="Salário médio dos últimos meses" valor={real.format(resultado.salarioMedio)} />
              )}
              <Linha nome="Valor de cada parcela" valor={real.format(resultado.parcela)} destaque />
              <Linha nome="Número de parcelas" valor={String(resultado.parcelas)} destaque />
              <Linha nome="Total do seguro-desemprego" valor={real.format(resultado.total)} />
            </dl>
          ) : (
            <p className="rounded-xl border border-border bg-white px-4 py-5 text-sm">
              {domestico
                ? "O empregado doméstico precisa de pelo menos 15 meses de trabalho nos últimos 24 meses para ter o seguro-desemprego."
                : `No ${regra.nome.replace(" ou mais", "")}, é preciso ter trabalhado pelo menos ${CARENCIA[pedido]} meses ${regra.janela}.`}
            </p>
          )
        ) : (
          <p className="rounded-xl border border-dashed border-border bg-white px-4 py-5 text-sm text-muted">
            Digite os seus últimos salários e os meses trabalhados para ver o valor e as
            parcelas do seguro-desemprego.
          </p>
        )}
      </div>

      <p className="mt-4 text-xs leading-5 text-muted">
        Estimativa com a tabela de 2026 do Ministério do Trabalho, para quem foi demitido
        sem justa causa.{" "}
        {domestico
          ? "Para o doméstico, a parcela é sempre de um salário mínimo."
          : `Para ter direito no ${regra.nome.replace(" ou mais", "")}, conte também ${CARENCIA[pedido]} meses trabalhados ${regra.janela}.`}{" "}
        O valor exato sai no pedido, pela Carteira de Trabalho Digital.
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
