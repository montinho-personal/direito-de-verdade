"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { Campo, Compartilhar, Escolha, Linha } from "@/components/partes-da-calculadora";
import { lerQuantidade, lerReais, percentualPorMil, reais } from "@/lib/dinheiro";
import { formatarData } from "@/lib/trabalhista/datas.ts";
import {
  calcularFerias,
  diasPelasFaltas,
  type EntradaDasFerias,
  type ResultadoDasFerias,
} from "@/lib/trabalhista/ferias.ts";

const FALTAS = [
  { valor: "0", nome: "Até 5 (30 dias de férias)" },
  { valor: "6", nome: "De 6 a 14 (24 dias)" },
  { valor: "15", nome: "De 15 a 23 (18 dias)" },
  { valor: "24", nome: "De 24 a 32 (12 dias)" },
];

type Formulario = {
  salario: string;
  media: string;
  faltas: string;
  descanso: string; // "" = todos os que sobram
  vendidos: string;
  dependentes: string;
  pensao: string;
  adiantar13: boolean;
  inicio: string;
};

const INICIAL: Formulario = {
  salario: "",
  media: "",
  faltas: "0",
  descanso: "",
  vendidos: "0",
  dependentes: "",
  pensao: "",
  adiantar13: false,
  inicio: "",
};

// Férias de quem tem carteira assinada e recebe por mês: o recibo pago antes das férias
export function CalculadoraFerias({ nivelDoTitulo = 3 }: { nivelDoTitulo?: 2 | 3 }) {
  const id = useId();
  const Titulo = nivelDoTitulo === 2 ? "h2" : "h3";
  const [f, setF] = useState(INICIAL);
  const mudar = (mudanca: Partial<Formulario>) => setF((atual) => ({ ...atual, ...mudanca }));

  const direito = diasPelasFaltas(Number(f.faltas));
  const maximoParaVender = Math.floor(direito / 3);
  const vendidos = Math.min(Number(f.vendidos), maximoParaVender);
  const disponiveis = direito - vendidos;
  const opcoesDeVenda = Array.from({ length: maximoParaVender + 1 }, (_, n) => ({
    valor: String(n),
    nome: n === 0 ? "Não vender" : n === maximoParaVender ? `${n} dias (1/3, o máximo)` : `${n} dias`,
  }));
  const opcoesDeDescanso = [
    { valor: "", nome: `${disponiveis} dias (todos)` },
    // Só divisões permitidas: sobra 5 dias ou mais, e um dos períodos tem 14 ou mais
    ...Array.from({ length: disponiveis }, (_, i) => disponiveis - 1 - i)
      .filter((n) => n >= 5 && disponiveis - n >= 5 && (n >= 14 || disponiveis - n >= 14))
      .map((n) => ({ valor: String(n), nome: `${n} dias (sobram ${disponiveis - n})` })),
  ];

  const leituras = {
    salario: lerReais(f.salario),
    media: lerReais(f.media),
    pensao: lerReais(f.pensao),
    dependentes: lerQuantidade(f.dependentes, 20),
  };
  const errosDeLeitura = Object.fromEntries(
    Object.entries(leituras).flatMap(([campo, l]) => (l.tipo === "invalido" ? [[campo, l.mensagem]] : [])),
  ) as Record<string, string>;
  const centavos = (l: (typeof leituras)["salario"]) => (l.tipo === "valido" ? l.centavos : 0);
  const entrada: EntradaDasFerias | null =
    f.salario && !Object.keys(errosDeLeitura).length
      ? {
          salario: centavos(leituras.salario),
          mediaVariaveis: centavos(leituras.media),
          faltas: Number(f.faltas),
          diasVendidos: vendidos,
          diasDeDescanso: f.descanso ? Math.min(Number(f.descanso), disponiveis) : undefined,
          dependentes: leituras.dependentes.tipo === "valido" ? leituras.dependentes.quantidade : 0,
          pensao: centavos(leituras.pensao),
          adiantar13: f.adiantar13,
          inicio: f.inicio || undefined,
        }
      : null;
  const calculo = entrada ? calcularFerias(entrada) : null;
  const errosDoMotor = calculo && !calculo.ok ? calculo.erros : [];
  const erro = (campo: string) =>
    errosDeLeitura[campo] ?? errosDoMotor.find((e) => e.campo === campo)?.mensagem;
  const r = calculo?.ok ? calculo : null;
  // Mesmos dados vendendo o máximo, para mostrar quanto a venda põe no bolso
  const comVenda =
    entrada && r && vendidos === 0 && maximoParaVender > 0 && !f.descanso
      ? calcularFerias({ ...entrada, diasVendidos: maximoParaVender, diasDeDescanso: undefined })
      : null;

  return (
    <section
      id="calculadora-de-ferias"
      aria-labelledby={`${id}-titulo`}
      data-track="artigo:ferramenta-inline"
      className="my-10 scroll-mt-6 rounded-2xl border border-border bg-surface p-6 sm:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">Calculadora</p>
      <Titulo id={`${id}-titulo`} className="mt-2 font-serif text-2xl leading-snug">
        Calcule as suas férias
      </Titulo>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Campo
          id={`${id}-salario`}
          rotulo="Salário bruto mensal (R$)"
          exemplo="Ex.: 3.000,00"
          valor={f.salario}
          aoMudar={(salario) => mudar({ salario })}
          erro={erro("salario")}
        />
        <Escolha
          id={`${id}-vender`}
          rotulo="Vender dias de férias (abono)"
          valor={String(vendidos)}
          opcoes={opcoesDeVenda}
          aoMudar={(v) => mudar({ vendidos: v, descanso: "" })}
          dica="A venda precisa ser pedida até 15 dias antes de completar o período aquisitivo."
        />
        <Escolha
          id={`${id}-descanso`}
          rotulo="Dias de descanso agora"
          valor={f.descanso && Number(f.descanso) < disponiveis ? f.descanso : ""}
          opcoes={opcoesDeDescanso}
          aoMudar={(descanso) => mudar({ descanso })}
          dica="Para dividir as férias: um período de 14 dias ou mais e os outros de 5 ou mais."
        />
        <Campo
          id={`${id}-media`}
          rotulo="Média mensal de horas extras, adicionais e comissões (R$)"
          exemplo="Opcional"
          valor={f.media}
          aoMudar={(media) => mudar({ media })}
          erro={erro("media")}
          dica="Adicional noturno, insalubridade, periculosidade e horas extras do período entram na conta."
        />
      </div>
      {erro("diasDeDescanso") && <p className="mt-2 text-sm text-red-700">{erro("diasDeDescanso")}</p>}

      <details className="group mt-4 rounded-xl border border-border bg-white">
        <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
          Quero calcular com mais detalhes
          <span aria-hidden="true" className="text-muted transition-transform group-open:rotate-180 motion-reduce:transition-none">
            ▾
          </span>
        </summary>
        <div className="grid gap-4 border-t border-border px-4 py-4 sm:grid-cols-2">
          <Escolha
            id={`${id}-faltas`}
            rotulo="Faltas sem justificativa no período aquisitivo"
            valor={f.faltas}
            opcoes={FALTAS}
            aoMudar={(faltas) => mudar({ faltas, vendidos: "0", descanso: "" })}
            dica="Faltas justificadas por lei ou abonadas pela empresa não contam."
          />
          <Campo
            id={`${id}-inicio`}
            rotulo="Início das férias"
            tipo="date"
            valor={f.inicio}
            aoMudar={(inicio) => mudar({ inicio })}
            erro={erro("inicio")}
            dica="Para ver até quando a empresa precisa pagar e o dia da volta."
          />
          <Campo
            id={`${id}-dependentes`}
            rotulo="Dependentes no imposto de renda"
            exemplo="0"
            modo="numeric"
            valor={f.dependentes}
            aoMudar={(dependentes) => mudar({ dependentes })}
            erro={erro("dependentes")}
          />
          <Campo
            id={`${id}-pensao`}
            rotulo="Pensão alimentícia descontada das férias (R$)"
            exemplo="Opcional"
            valor={f.pensao}
            aoMudar={(pensao) => mudar({ pensao })}
            erro={erro("pensao")}
            dica="A fixada pela Justiça ou em escritura; diminui o imposto."
          />
          <label className="flex min-h-11 items-start gap-3 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={f.adiantar13}
              onChange={(evento) => mudar({ adiantar13: evento.target.checked })}
              className="mt-1 h-5 w-5 accent-[var(--accent)]"
            />
            <span>
              Receber a 1ª parcela do 13º junto com as férias
              <span className="block text-xs leading-5 text-muted">
                Quem pede em janeiro recebe metade do salário com as férias, sem descontos.
              </span>
            </span>
          </label>
        </div>
      </details>

      <div className="mt-6">
        {r ? (
          <Resultado r={r} comVenda={comVenda?.ok ? comVenda : null} />
        ) : (
          <p className="rounded-xl border border-dashed border-border bg-white px-4 py-5 text-sm text-muted">
            Digite o seu salário bruto para ver o valor das férias.
          </p>
        )}
        <p aria-live="polite" className="sr-only">
          {r ? `Férias líquidas estimadas: ${reais(r.liquido)}.` : ""}
        </p>
      </div>

      <p className="mt-4 text-xs leading-5 text-muted">
        Estimativa do recibo de férias de quem tem carteira assinada e recebe por mês, com as
        tabelas de INSS e imposto de renda de 2026, revisadas em 20/10/2026. O valor pode
        variar com convenção coletiva e verbas que a calculadora não conhece.{" "}
        <Link href="/artigos/como-calcular-ferias#como-calculamos" className="text-accent underline underline-offset-2">
          Como calculamos
        </Link>
      </p>
    </section>
  );
}

function Resultado({ r, comVenda }: { r: ResultadoDasFerias; comVenda: ResultadoDasFerias | null }) {
  const isento = r.irrf.imposto === 0 && r.irrf.tipoDeReducao === "isencao";
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-white">
        <div className="px-4 pb-4 pt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Suas férias líquidas estimadas
          </p>
          <p className="mt-1 font-serif text-4xl tabular-nums sm:text-5xl">{reais(r.liquido)}</p>
          <p className="mt-1 text-sm text-muted">
            {r.diasDeDescanso} dias de descanso
            {r.diasVendidos ? ` e ${r.diasVendidos} vendidos` : ""}
            {r.datas ? `, pagas até ${formatarData(r.datas.pagamentoAte)}` : ", pagas até 2 dias antes do início"}.
          </p>
        </div>
        <dl className="divide-y divide-border border-t border-border text-sm sm:text-base">
          <Linha nome={`Férias (${r.diasDeDescanso} dias)`} valor={reais(r.ferias)} />
          <Linha nome="1/3 das férias" valor={reais(r.tercoDasFerias)} />
          {r.diasVendidos > 0 && (
            <>
              <Linha nome={`Abono: venda de ${r.diasVendidos} dias`} valor={reais(r.abono)} />
              <Linha nome="1/3 do abono" valor={reais(r.tercoDoAbono)} />
            </>
          )}
          {r.adiantamento13 > 0 && <Linha nome="1ª parcela do 13º" valor={reais(r.adiantamento13)} />}
          <Linha nome="INSS" valor={`− ${reais(r.inss.total)}`} />
          <Linha nome="Imposto de renda" valor={isento ? "Isento" : `− ${reais(r.irrf.imposto)}`} />
          {r.pensao > 0 && <Linha nome="Pensão alimentícia" valor={`− ${reais(r.pensao)}`} />}
          <Linha nome="Líquido das férias" valor={reais(r.liquido)} destaque />
        </dl>
      </div>

      <ul className="space-y-2 rounded-xl border border-border bg-white px-4 py-4 text-sm leading-6">
        {r.diasVendidos > 0 && (
          <li>
            A venda de {r.diasVendidos} dias põe <strong className="tabular-nums">{reais(r.ganhoDaVenda)}</strong>{" "}
            a mais no recibo, sem INSS. O abono não paga imposto; o 1/3 dele entra na conta do
            imposto das férias. Nos dias vendidos você trabalha e recebe o salário normal.
          </li>
        )}
        {comVenda && (
          <li>
            Se vender {comVenda.diasVendidos} dias, recebe{" "}
            <strong className="tabular-nums">{reais(comVenda.ganhoDaVenda)}</strong> de abono com
            1/3, sem INSS, descansa {comVenda.diasDeDescanso} dias e trabalha os outros{" "}
            {comVenda.diasVendidos} com o salário normal. O recibo das férias fica em{" "}
            {reais(comVenda.liquido)}.
          </li>
        )}
        {r.datas && (
          <li>
            Férias de {formatarData(r.datas.inicio)} a {formatarData(r.datas.ultimoDia)}; volta ao
            trabalho em {formatarData(r.datas.volta)}. O pagamento vence em{" "}
            {formatarData(r.datas.pagamentoAte)}, 2 dias antes do início.
          </li>
        )}
        {r.diasQueSobram > 0 && (
          <li>Sobram {r.diasQueSobram} dias para tirar depois, com outro recibo e outro 1/3.</li>
        )}
        {r.irrf.reducao > 0 && (
          <li>
            O imposto já tem a redução de 2026 ({reais(r.irrf.reducao)}). Parte das folhas não
            aplica a redução às férias; nesse caso, o imposto seria {reais(r.irrf.impostoPelaTabela)}.
          </li>
        )}
        <li>
          No holerite do mês, o INSS pode ser recalculado junto com o salário dos dias
          trabalhados, e o valor final muda alguns reais.
        </li>
      </ul>

      <Memoria r={r} />
      <Compartilhar texto={resumo(r)} />
    </div>
  );
}

function Memoria({ r }: { r: ResultadoDasFerias }) {
  const ir = r.irrf;
  const passos: [string, string][] = [
    [
      "Remuneração",
      r.mediaVariavel
        ? `${reais(r.remuneracao - r.mediaVariavel)} de salário + ${reais(r.mediaVariavel)} de média = ${reais(r.remuneracao)}.`
        : `${reais(r.remuneracao)} de salário.`,
    ],
    [
      "Dias",
      `${r.diasDeDireito} de direito${r.diasVendidos ? `, ${r.diasVendidos} vendidos` : ""}; ${r.diasDeDescanso} de descanso agora.`,
    ],
    ["Férias", `${reais(r.remuneracao)} ÷ 30 × ${r.diasDeDescanso} = ${reais(r.ferias)}.`],
    ["1/3", `${reais(r.ferias)} ÷ 3 = ${reais(r.tercoDasFerias)}.`],
    ...(r.diasVendidos
      ? ([
          [
            "Abono",
            `${reais(r.remuneracao)} ÷ 30 × ${r.diasVendidos} = ${reais(r.abono)}, mais 1/3 de ${reais(r.tercoDoAbono)}. Sem INSS; o abono não paga imposto, mas o 1/3 dele paga (Receita, Solução de Consulta Cosit 209/2021).`,
          ],
        ] as [string, string][])
      : []),
    [
      "INSS",
      `Sobre férias + 1/3 (${reais(r.baseDoInss)}): ${r.inss.faixas.map((f) => `${percentualPorMil(f.aliquotaPorMil)} sobre ${reais(f.ate - f.de)}`).join(" + ")} = ${reais(r.inss.total)}${r.inss.acimaDoTeto ? " (limitado ao teto)" : ""}.`,
    ],
    [
      "Base do IR",
      `${reais(r.rendimentosDoIr)}${r.tercoDoAbono ? " (férias + 1/3 + 1/3 do abono)" : ""} − ${reais(ir.deducaoUsada)} (${ir.usaDescontoSimplificado ? "desconto simplificado, maior que as deduções" : "INSS, dependentes e pensão"}) = ${reais(ir.base)}, separada do salário do mês.`,
    ],
    [
      "IR pela tabela",
      ir.aliquotaPorMil === 0
        ? "Base na faixa isenta: R$ 0,00."
        : `${reais(ir.base)} × ${percentualPorMil(ir.aliquotaPorMil)} − ${reais(ir.parcelaADeduzir)} = ${reais(ir.impostoPelaTabela)}.`,
    ],
    [
      "Redução de 2026",
      ir.tipoDeReducao === "isencao"
        ? `Rendimento de até R$ 5 mil: a redução zera o imposto (− ${reais(ir.reducao)}).`
        : ir.tipoDeReducao === "parcial"
          ? `R$ 978,62 − 0,133145 × ${reais(r.rendimentosDoIr)} = − ${reais(ir.reducao)}.`
          : "Rendimento acima de R$ 7.350: sem redução.",
    ],
    ["Imposto", `${reais(ir.impostoPelaTabela)} − ${reais(ir.reducao)} = ${reais(ir.imposto)}.`],
    [
      "Líquido",
      `${reais(r.bruto)} − ${reais(r.inss.total)} − ${reais(ir.imposto)}${r.pensao ? ` − ${reais(r.pensao)}` : ""} = ${reais(r.liquido)}.`,
    ],
  ];
  return (
    <details className="group rounded-xl border border-border bg-white">
      <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
        Entenda como calculamos suas férias
        <span aria-hidden="true" className="text-muted transition-transform group-open:rotate-180 motion-reduce:transition-none">
          ▾
        </span>
      </summary>
      <ol className="list-decimal space-y-2 border-t border-border py-4 pl-9 pr-4 text-sm leading-6">
        {passos.map(([nome, texto]) => (
          <li key={nome}>
            <strong>{nome}:</strong> <span className="tabular-nums">{texto}</span>
          </li>
        ))}
      </ol>
      <p className="border-t border-border px-4 py-3 text-xs leading-5 text-muted">
        Cada etapa é arredondada ao centavo. O imposto das férias é calculado à parte do
        salário do mês, com as mesmas deduções (Receita Federal, Perguntas e Respostas do IRPF,
        pergunta 178).
      </p>
    </details>
  );
}

function resumo(r: ResultadoDasFerias) {
  return [
    "Simulação de férias (estimativa, tabelas de 2026)",
    `Férias (${r.diasDeDescanso} dias) + 1/3: ${reais(r.ferias + r.tercoDasFerias)}`,
    ...(r.diasVendidos ? [`Abono (${r.diasVendidos} dias) + 1/3: ${reais(r.ganhoDaVenda)}`] : []),
    ...(r.adiantamento13 ? [`1ª parcela do 13º: ${reais(r.adiantamento13)}`] : []),
    `INSS: ${reais(r.inss.total)} · Imposto de renda: ${reais(r.irrf.imposto)}`,
    `Líquido: ${reais(r.liquido)}`,
    "Valores estimados; o recibo pode variar.",
    "Calculado em https://direitodeverdade.com.br/artigos/como-calcular-ferias",
  ].join("\n");
}
