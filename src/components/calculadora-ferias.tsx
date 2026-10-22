"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useId, useState } from "react";
import { Campo, Compartilhar, Escolha, estiloDoBotao, Linha } from "@/components/partes-da-calculadora";
import { lerQuantidade, lerReais, percentualPorMil, reais } from "@/lib/dinheiro";
import { formatarData, lerData, somarDias } from "@/lib/trabalhista/datas.ts";
import {
  calcularFerias,
  type ComparacaoDaVenda,
  compararVenda,
  diasPelasFaltas,
  type EntradaDasFerias,
  periodosCompletos,
  type ResultadoDasFerias,
} from "@/lib/trabalhista/ferias.ts";

type Nivel = "h3" | "h4";

const FALTAS = [
  { valor: "0", nome: "Até 5 (30 dias de férias)" },
  { valor: "6", nome: "De 6 a 14 (24 dias)" },
  { valor: "15", nome: "De 15 a 23 (18 dias)" },
  { valor: "24", nome: "De 24 a 32 (12 dias)" },
];

type Formulario = {
  // Férias durante o contrato ou saída da empresa (aí a conta é a da rescisão)
  situacao: "ferias" | "saida";
  salario: string;
  media: string;
  faltas: string;
  descanso: string; // "" = todos os que sobram
  vendidos: string;
  dependentes: string;
  pensao: string;
  adiantar13: boolean;
  inicio: string;
  admissao: string;
  periodo: string; // "" = o último período completo antes do início
};

const INICIAL: Formulario = {
  situacao: "ferias",
  salario: "",
  media: "",
  faltas: "0",
  descanso: "",
  vendidos: "0",
  dependentes: "",
  pensao: "",
  adiantar13: false,
  inicio: "",
  admissao: "",
  periodo: "",
};

const SITUACOES = [
  { valor: "ferias", nome: "Vou sair de férias" },
  { valor: "saida", nome: "Estou saindo da empresa" },
] as const;

// Férias de quem tem carteira assinada e recebe por mês: o recibo pago antes das férias
export function CalculadoraFerias({ nivelDoTitulo = 3 }: { nivelDoTitulo?: 2 | 3 }) {
  const id = useId();
  const Titulo = nivelDoTitulo === 2 ? "h2" : "h3";
  const Sub: Nivel = nivelDoTitulo === 2 ? "h3" : "h4";
  const endereco = `https://direitodeverdade.com.br${usePathname() ?? "/calculadoras/ferias"}`;
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

  // Períodos aquisitivos completos até o início das férias, para escolher a que período
  // elas se referem
  const admissao = f.admissao ? lerData(f.admissao) : null;
  const inicio = f.inicio ? lerData(f.inicio) : null;
  const periodos = admissao && inicio ? periodosCompletos(admissao, inicio) : [];
  const opcoesDePeriodo = [
    { valor: "", nome: "O último período completo" },
    ...periodos.map((p) => ({
      valor: String(p.numero),
      nome: `${p.numero}º período: ${formatarData(p.inicio)} a ${formatarData(p.fim)}`,
    })),
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
          admissao: f.admissao || undefined,
          periodo: f.periodo && periodos.length >= Number(f.periodo) ? Number(f.periodo) : undefined,
        }
      : null;
  const calculo = entrada ? calcularFerias(entrada) : null;
  const errosDoMotor = calculo && !calculo.ok ? calculo.erros : [];
  const erro = (campo: string) =>
    errosDeLeitura[campo] ?? errosDoMotor.find((e) => e.campo === campo)?.mensagem;
  const r = calculo?.ok ? calculo : null;
  // Tirar todos os dias ou vender 1/3, com os mesmos dados
  const comparacao = entrada && r ? compararVenda(entrada) : null;
  function refazer() {
    setF(INICIAL);
    document.getElementById(`${id}-salario`)?.focus();
  }

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

      <fieldset className="mt-6">
        <legend className="text-sm font-medium">Qual é a sua situação?</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {SITUACOES.map((item) => (
            <label
              key={item.valor}
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm has-[:checked]:border-gold has-[:checked]:bg-gold/10 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold/60"
            >
              <input
                type="radio"
                name={`${id}-situacao`}
                value={item.valor}
                checked={f.situacao === item.valor}
                onChange={() => mudar({ situacao: item.valor })}
                className="accent-[var(--accent)]"
              />
              {item.nome}
            </label>
          ))}
        </div>
      </fieldset>

      {f.situacao === "saida" ? (
        <div className="mt-6 space-y-3 rounded-xl border border-border bg-white px-4 py-5 text-sm leading-6">
          <p>
            Na saída da empresa, as <strong>férias vencidas</strong> e as{" "}
            <strong>proporcionais</strong> (1/12 por mês trabalhado, contando o mês com mais de 14
            dias) são pagas na <strong>rescisão</strong>, com 1/3, como indenização: sem INSS e sem
            imposto de renda. Na demissão por justa causa, as proporcionais não são pagas (CLT,
            artigo 146).
          </p>
          <p>
            Essa conta, com o aviso prévio e as outras verbas, está na{" "}
            <Link href="/calculadoras/rescisao" className="font-medium text-accent underline underline-offset-2">
              calculadora de rescisão
            </Link>
            .
          </p>
        </div>
      ) : (
      <>
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
            id={`${id}-admissao`}
            rotulo="Data de admissão"
            tipo="date"
            valor={f.admissao}
            aoMudar={(admissao) => mudar({ admissao, periodo: "" })}
            erro={erro("admissao")}
            dica="Com a admissão e o início, mostramos o período das férias e o prazo da empresa."
          />
          {periodos.length > 1 && (
            <Escolha
              id={`${id}-periodo`}
              rotulo="Estas férias são de qual período?"
              valor={f.periodo}
              opcoes={opcoesDePeriodo}
              aoMudar={(periodo) => mudar({ periodo })}
              dica="Se você tem férias vencidas de um período anterior, escolha esse período."
            />
          )}
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

      {erro("periodo") && <p className="mt-2 text-sm text-red-700">{erro("periodo")}</p>}

      <div className="mt-6">
        {r ? (
          <Resultado r={r} comparacao={comparacao} Sub={Sub} endereco={endereco} refazer={refazer} />
        ) : (
          <p className="rounded-xl border border-dashed border-border bg-white px-4 py-5 text-sm text-muted">
            Digite o seu salário bruto para ver o valor das férias.
          </p>
        )}
        <p aria-live="polite" className="sr-only">
          {r ? `Férias líquidas estimadas: ${reais(r.liquido)}.` : ""}
        </p>
      </div>
      </>
      )}

      <p className="mt-4 text-xs leading-5 text-muted">
        Estimativa do recibo de férias de quem tem carteira assinada e recebe por mês, com as
        tabelas de INSS e imposto de renda de 2026, revisadas em 21/10/2026. O valor pode
        variar com convenção coletiva e verbas que a calculadora não conhece.{" "}
        <Link href="/calculadoras/ferias#como-esta-calculadora-funciona" className="text-accent underline underline-offset-2">
          Como calculamos
        </Link>
      </p>
    </section>
  );
}

function Resultado({
  r,
  comparacao,
  Sub,
  endereco,
  refazer,
}: {
  r: ResultadoDasFerias;
  comparacao: ComparacaoDaVenda | null;
  Sub: Nivel;
  endereco: string;
  refazer: () => void;
}) {
  const isento = r.irrf.imposto === 0 && r.irrf.tipoDeReducao === "isencao";
  const extras = r.mediaVariavel;
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-white">
        <div className="px-4 pb-4 pt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Valor líquido estimado das férias
          </p>
          <p className="mt-1 font-serif text-4xl tabular-nums sm:text-5xl">{reais(r.liquido)}</p>
          <p className="mt-1 text-sm text-muted">
            {r.diasDeDescanso} dias de descanso
            {r.diasVendidos ? ` e ${r.diasVendidos} vendidos` : ""}
            {r.datas ? `, pagas até ${formatarData(r.datas.pagamentoAte)}` : ", pagas até 2 dias antes do início"}.
          </p>
        </div>
        <dl className="divide-y divide-border border-t border-border text-sm sm:text-base">
          <Linha
            nome={`Remuneração de férias (${r.diasDeDescanso} dias)`}
            valor={reais(r.ferias)}
          />
          <Linha nome="Adicional de 1/3" valor={reais(r.tercoDasFerias)} />
          {r.diasVendidos > 0 && (
            <>
              <Linha nome={`Abono pecuniário (${r.diasVendidos} dias vendidos)`} valor={reais(r.abono)} />
              <Linha nome="1/3 do abono" valor={reais(r.tercoDoAbono)} />
            </>
          )}
          {r.adiantamento13 > 0 && <Linha nome="1ª parcela do 13º" valor={reais(r.adiantamento13)} />}
          <Linha nome="Total bruto" valor={reais(r.bruto)} destaque />
          <Linha nome="INSS" valor={`− ${reais(r.inss.total)}`} />
          <Linha nome="Imposto de renda" valor={isento ? "Isento" : `− ${reais(r.irrf.imposto)}`} />
          {r.pensao > 0 && <Linha nome="Pensão alimentícia" valor={`− ${reais(r.pensao)}`} />}
          <Linha nome="Total de descontos" valor={`− ${reais(r.descontos)}`} />
          <Linha nome="Líquido estimado" valor={reais(r.liquido)} destaque />
        </dl>
        {extras > 0 && (
          <p className="border-t border-border px-4 py-3 text-xs leading-5 text-muted">
            A remuneração de férias já inclui a média de {reais(extras)} de horas extras,
            adicionais e comissões.
          </p>
        )}
      </div>

      <Avisos r={r} />

      <div className="rounded-xl border border-border bg-white px-4 py-4 text-sm leading-6">
        <Sub className="font-serif text-lg">Entenda o dinheiro que você vai receber</Sub>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>
            A <strong>remuneração de férias</strong> é o salário dos dias de descanso, pago{" "}
            <strong>adiantado</strong>. Por isso, o holerite do mês seguinte costuma vir menor: os
            dias de férias já foram pagos neste recibo.
          </li>
          <li>
            O que vem <strong>a mais</strong> é o <strong>1/3</strong> das férias
            {r.diasVendidos ? (
              <>
                {" "}
                e o <strong>abono</strong> dos {r.diasVendidos} dias vendidos, com o 1/3 dele. Nos
                dias vendidos, você trabalha e recebe também o salário normal, na folha do mês
              </>
            ) : null}
            .
          </li>
          <li>
            Quanto vai cair no salário do mês depende do calendário e do fechamento da folha da
            empresa: a calculadora não estima esse valor.
          </li>
        </ul>
      </div>

      {comparacao && <Comparador c={comparacao} Sub={Sub} />}

      <Memoria r={r} />
      <Compartilhar texto={resumo(r, endereco)} />
      <button type="button" onClick={refazer} className={`${estiloDoBotao} print:hidden`}>
        Refazer a simulação
      </button>

      <nav aria-label="Continue entendendo seus direitos" className="rounded-xl border border-border bg-white px-4 py-4 text-sm leading-6 print:hidden">
        <Sub className="font-serif text-lg">Continue entendendo seus direitos</Sub>
        <ul className="mt-2 space-y-1">
          {r.adiantamento13 === 0 && (
            <li>
              <Link href="/calculadoras/13-salario" className="text-accent underline underline-offset-2">
                Calculadora do 13º salário
              </Link>
              : quanto cai na 1ª e na 2ª parcela.
            </li>
          )}
          <li>
            <Link href="/calculadoras/imposto-de-renda" className="text-accent underline underline-offset-2">
              Calculadora de imposto de renda
            </Link>
            : o desconto do salário do mês.
          </li>
          <li>
            <Link href="/calculadoras/rescisao" className="text-accent underline underline-offset-2">
              Calculadora de rescisão
            </Link>
            : férias vencidas e proporcionais na saída da empresa.
          </li>
          <li>
            <Link href="/artigos/como-calcular-ferias" className="text-accent underline underline-offset-2">
              Como calcular férias
            </Link>
            : coletivas, faltas e quem pode vender dias.
          </li>
        </ul>
      </nav>
    </div>
  );
}

// Prazos e situações que mudam o valor ou exigem atenção
function Avisos({ r }: { r: ResultadoDasFerias }) {
  const itens: ReactNode[] = [];
  if (r.dobra > 0 && r.periodo) {
    itens.push(
      <>
        <strong>Férias fora do prazo:</strong> {r.diasForaDoPrazo} dia
        {r.diasForaDoPrazo > 1 ? "s caem" : " cai"} depois de {formatarData(r.periodo.concederAte)},
        o último dia para a empresa conceder as férias desse período. Esses dias devem ser pagos{" "}
        <strong>em dobro</strong> (CLT, artigo 137; Súmula 81 do TST): mais{" "}
        <strong className="tabular-nums">{reais(r.dobra)}</strong> brutos, com o 1/3, que{" "}
        <strong>não estão</strong> no líquido acima.
      </>,
    );
  }
  if (r.periodo && r.dobra === 0) {
    itens.push(
      <>
        Período aquisitivo de {formatarData(r.periodo.inicio)} a {formatarData(r.periodo.fim)}. A
        empresa tem até {formatarData(r.periodo.concederAte)} para conceder essas férias. O prazo
        para pedir a venda de dias desse período era {formatarData(r.periodo.pedirAbonoAte)}, 15
        dias antes do fim do período aquisitivo.
      </>,
    );
  }
  if (r.inicioAntesDoDomingo) {
    itens.push(
      <>
        <strong>Atenção ao início:</strong> se o seu descanso semanal é no domingo, as férias não
        podem começar na sexta nem no sábado. Também não podem começar nos 2 dias antes de um
        feriado (CLT, artigo 134, § 3º).
      </>,
    );
  }
  if (r.datas) {
    itens.push(
      <>
        Férias de {formatarData(r.datas.inicio)} a {formatarData(r.datas.ultimoDia)}; volta ao
        trabalho em {formatarData(r.datas.volta)}. A empresa deve avisar por escrito até{" "}
        {formatarData(somarDias(r.datas.inicio, -30))} (30 dias antes) e pagar até{" "}
        {formatarData(r.datas.pagamentoAte)} (2 dias antes).
      </>,
    );
  }
  if (r.diasQueSobram > 0) {
    itens.push(<>Sobram {r.diasQueSobram} dias para tirar depois, com outro recibo e outro 1/3.</>);
  }
  if (r.irrf.reducao > 0) {
    itens.push(
      <>
        O imposto já tem a redução de 2026 ({reais(r.irrf.reducao)}). Parte das folhas não aplica a
        redução às férias; nesse caso, o imposto seria {reais(r.irrf.impostoPelaTabela)}.
      </>,
    );
  }
  itens.push(
    <>
      No holerite, o INSS pode ser recalculado junto com o salário dos dias trabalhados no mês, e
      o valor final muda alguns reais.
    </>,
  );
  return (
    <ul className="space-y-2 rounded-xl border border-border bg-white px-4 py-4 text-sm leading-6">
      {itens.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

// Tirar todos os dias ou vender 1/3, no mesmo período de descanso de direito
function Comparador({ c, Sub }: { c: ComparacaoDaVenda; Sub: Nivel }) {
  const v = c.vendendo;
  const cenarios = [
    {
      nome: `Tirar ${c.integral.diasDeDescanso} dias`,
      recibo: c.integral.liquido,
      descanso: c.integral.diasDeDescanso,
      trabalhados: 0,
      salario: 0,
      bruto: c.brutoIntegral,
    },
    {
      nome: `Vender ${v.diasVendidos} e tirar ${v.diasDeDescanso}`,
      recibo: v.liquido,
      descanso: v.diasDeDescanso,
      trabalhados: v.diasVendidos,
      salario: c.salarioDosDiasTrabalhados,
      bruto: c.brutoVendendo,
    },
  ];
  return (
    <div className="rounded-xl border border-border bg-white px-4 py-4">
      <Sub className="font-serif text-lg">
        Vale mais a pena tirar {c.integral.diasDeDescanso} dias ou vender {v.diasVendidos}?
      </Sub>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {cenarios.map((s) => (
          <div key={s.nome} className="rounded-lg border border-border">
            <p className="border-b border-border px-3 py-2 text-sm font-semibold">{s.nome}</p>
            <dl className="divide-y divide-border text-sm">
              <Linha nome="Recibo antes das férias (líquido)" valor={reais(s.recibo)} />
              <Linha nome="Dias de descanso" valor={String(s.descanso)} />
              <Linha nome="Dias trabalhados no lugar" valor={String(s.trabalhados)} />
              <Linha nome="Salário desses dias (bruto, na folha)" valor={reais(s.salario)} />
              <Linha nome="Total bruto no período" valor={reais(s.bruto)} destaque />
            </dl>
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm leading-6">
        No mesmo período de {c.integral.diasDeDescanso} dias, vender {v.diasVendidos} dias rende{" "}
        <strong className="tabular-nums">{reais(c.diferencaBruta)}</strong> a mais em valores
        brutos, e você <strong>descansa {v.diasVendidos} dias a menos</strong>. O abono não tem INSS
        e não paga imposto, mas o 1/3 dele entra no imposto das férias; o salário dos dias
        trabalhados tem os descontos normais do mês. A venda é escolha sua: a empresa não pode
        obrigar.
      </p>
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

function resumo(r: ResultadoDasFerias, endereco: string) {
  return [
    "Simulação de férias (estimativa, tabelas de 2026)",
    `Férias (${r.diasDeDescanso} dias) + 1/3: ${reais(r.ferias + r.tercoDasFerias)}`,
    ...(r.diasVendidos ? [`Abono (${r.diasVendidos} dias) + 1/3: ${reais(r.ganhoDaVenda)}`] : []),
    ...(r.adiantamento13 ? [`1ª parcela do 13º: ${reais(r.adiantamento13)}`] : []),
    `INSS: ${reais(r.inss.total)} · Imposto de renda: ${reais(r.irrf.imposto)}`,
    `Líquido: ${reais(r.liquido)}`,
    "Valores estimados; o recibo pode variar.",
    `Calculado em ${endereco}`,
  ].join("\n");
}
