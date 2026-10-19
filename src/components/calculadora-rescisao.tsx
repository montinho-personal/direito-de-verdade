"use client";

import { useId, useState } from "react";
import { calcularRescisao } from "@/lib/rescisao";

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

// Rescisão de quem é demitido sem justa causa, com as tabelas de 2026
export function CalculadoraRescisao({ nivelDoTitulo = 3 }: { nivelDoTitulo?: 2 | 3 }) {
  const id = useId();
  const Titulo = nivelDoTitulo === 2 ? "h2" : "h3";
  const [salario, setSalario] = useState("");
  const [admissao, setAdmissao] = useState("");
  const [saida, setSaida] = useState("");
  const [aviso, setAviso] = useState("indenizado");
  const [vencidas, setVencidas] = useState(0);
  const [fgts, setFgts] = useState("");

  const resultado = calcularRescisao({
    salario: lerValor(salario),
    admissao,
    saida,
    avisoIndenizado: aviso === "indenizado",
    feriasVencidas: vencidas,
    saldoFgts: lerValor(fgts),
  });

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
        Calcule a sua rescisão sem justa causa
      </Titulo>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium sm:col-span-2">
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
          Data de admissão
          <input
            type="date"
            value={admissao}
            onChange={(evento) => setAdmissao(evento.target.value)}
            className={estiloDoCampo}
          />
        </label>
        <label className="block text-sm font-medium">
          Último dia trabalhado
          <input
            type="date"
            value={saida}
            onChange={(evento) => setSaida(evento.target.value)}
            className={estiloDoCampo}
          />
        </label>
        <label className="block text-sm font-medium">
          Aviso prévio
          <select
            value={aviso}
            onChange={(evento) => setAviso(evento.target.value)}
            className={estiloDoCampo}
          >
            <option value="indenizado">Indenizado (dispensado de trabalhar)</option>
            <option value="trabalhado">Trabalhado</option>
          </select>
        </label>
        <label className="block text-sm font-medium">
          Férias vencidas e não tiradas
          <select
            value={vencidas}
            onChange={(evento) => setVencidas(Number(evento.target.value))}
            className={estiloDoCampo}
          >
            <option value={0}>Não tenho</option>
            <option value={1}>Tenho 1 período</option>
          </select>
        </label>
        <label className="block text-sm font-medium sm:col-span-2">
          Saldo do FGTS no extrato (opcional, para a multa de 40%)
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="Ex.: 8.000,00"
            value={fgts}
            onChange={(evento) => setFgts(evento.target.value)}
            className={estiloDoCampo}
          />
        </label>
      </div>

      <div aria-live="polite" className="mt-6">
        {resultado ? (
          <>
            <dl className="divide-y divide-border rounded-xl border border-border bg-white text-sm sm:text-base">
              <Linha
                nome={`Saldo de salário (${resultado.diasTrabalhadosNoMes} dias)`}
                valor={real.format(resultado.saldoDeSalario)}
              />
              {resultado.avisoPrevio > 0 && (
                <Linha
                  nome={`Aviso prévio indenizado (${resultado.diasDeAviso} dias)`}
                  valor={real.format(resultado.avisoPrevio)}
                />
              )}
              <Linha
                nome={`13º proporcional (${resultado.avos13}/12)`}
                valor={real.format(resultado.decimoTerceiro)}
              />
              <Linha
                nome={`Férias proporcionais (${resultado.avosFerias}/12)`}
                valor={real.format(resultado.feriasProporcionais)}
              />
              {resultado.feriasVencidas > 0 && (
                <Linha nome="Férias vencidas" valor={real.format(resultado.feriasVencidas)} />
              )}
              <Linha nome="1/3 de férias" valor={real.format(resultado.tercoDeFerias)} />
              <Linha nome="Total bruto" valor={real.format(resultado.bruto)} destaque />
              <Linha
                nome="INSS (saldo de salário e 13º)"
                valor={`− ${real.format(resultado.inss)}`}
              />
              <Linha
                nome="Imposto de renda"
                valor={
                  resultado.impostoDeRenda > 0
                    ? `− ${real.format(resultado.impostoDeRenda)}`
                    : "Isento"
                }
              />
              <Linha
                nome="Rescisão a receber da empresa"
                valor={real.format(resultado.liquido)}
                destaque
              />
            </dl>
            <dl className="mt-4 divide-y divide-border rounded-xl border border-border bg-white text-sm sm:text-base">
              <Linha
                nome="Multa de 40% do FGTS (depositada na conta do FGTS)"
                valor={real.format(resultado.multaFgts)}
                destaque
              />
            </dl>
            <p className="mt-2 text-xs leading-5 text-muted">
              Além da multa, você saca o saldo do FGTS, a não ser que tenha optado
              pelo saque-aniversário.
            </p>
          </>
        ) : (
          <p className="rounded-xl border border-dashed border-border bg-white px-4 py-5 text-sm text-muted">
            Preencha o salário e as datas para ver a sua rescisão.
          </p>
        )}
      </div>

      <p className="mt-4 text-xs leading-5 text-muted">
        Estimativa para quem tem carteira assinada, contrato sem prazo e foi
        demitido sem justa causa, com as tabelas de 2026. Não inclui horas
        extras, comissões, adicionais nem descontos como adiantamentos e a 1ª
        parcela do 13º já paga. Confira o termo de rescisão que a empresa entregar.
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
