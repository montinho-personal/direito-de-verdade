"use client";

import Link from "next/link";
import { useId } from "react";
import {
  lerFormulario13,
  mudarFormulario13,
  NOMES_DOS_MESES,
  useFormulario13,
} from "@/components/decimo/formulario";
import { Campo, Compartilhar, Escolha, Linha } from "@/components/partes-da-calculadora";
import { percentualPorMil, reais } from "@/lib/dinheiro";
import { formatarData, lerData } from "@/lib/trabalhista/datas.ts";
import { calcular13, type ResultadoDo13 } from "@/lib/trabalhista/decimo-terceiro.ts";
import { DECIMO_TERCEIRO_2026 as P } from "@/lib/trabalhista/parametros.ts";

const MESES = Array.from({ length: 12 }, (_, i) => {
  const n = 12 - i;
  return { valor: String(n), nome: n === 12 ? "12 (o ano todo)" : String(n) };
});
const MESES_DO_ADIANTAMENTO = NOMES_DOS_MESES.slice(1, 11).map((nome, i) => ({ valor: String(i + 2), nome }));
const MESES_DO_REAJUSTE = [
  { valor: "", nome: "Sem reajuste em 2026" },
  ...NOMES_DOS_MESES.map((nome, i) => ({ valor: String(i + 1), nome: `A partir de ${nome}` })),
];
const data = (texto: string) => formatarData(lerData(texto)!);

// 13º salário de quem tem carteira assinada e recebe por mês, com as regras de 2026
export function Calculadora13Salario({ nivelDoTitulo = 3 }: { nivelDoTitulo?: 2 | 3 }) {
  const id = useId();
  const Titulo = nivelDoTitulo === 2 ? "h2" : "h3";
  const f = useFormulario13();
  const { entrada, erros } = lerFormulario13(f);
  const calculo = entrada ? calcular13(entrada) : null;
  const errosDoMotor = calculo && !calculo.ok ? calculo.erros : [];
  const erro = (campo: string) =>
    erros[campo as keyof typeof erros] ?? errosDoMotor.find((e) => e.campo === campo)?.mensagem;
  const r = calculo?.ok ? calculo : null;
  const usaDatas = Boolean(f.admissao || f.saida);

  return (
    <section
      id="calculadora-do-13"
      aria-labelledby={`${id}-titulo`}
      data-track="artigo:ferramenta-inline"
      className="my-10 scroll-mt-6 rounded-2xl border border-border bg-surface p-6 sm:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">Calculadora</p>
      <Titulo id={`${id}-titulo`} className="mt-2 font-serif text-2xl leading-snug">
        Calcule o seu 13º salário de 2026
      </Titulo>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Campo
          id={`${id}-salario`}
          rotulo="Salário bruto mensal (R$)"
          exemplo="Ex.: 3.000,00"
          valor={f.salario}
          aoMudar={(salario) => mudarFormulario13({ salario })}
          erro={erro("salario")}
        />
        {usaDatas ? (
          <p className="self-end rounded-lg border border-dashed border-border bg-white px-3 py-2.5 text-sm text-muted">
            Meses contados pelas datas do cálculo detalhado.
          </p>
        ) : (
          <Escolha
            id={`${id}-meses`}
            rotulo="Meses trabalhados em 2026"
            valor={f.meses}
            opcoes={MESES}
            aoMudar={(meses) => mudarFormulario13({ meses })}
            dica="Conta o mês com 15 dias ou mais de trabalho."
          />
        )}
        <Campo
          id={`${id}-media`}
          rotulo="Média mensal de horas extras, comissões e adicionais (R$)"
          exemplo="Opcional"
          valor={f.mediaVariaveis}
          aoMudar={(mediaVariaveis) => mudarFormulario13({ mediaVariaveis })}
          erro={erro("mediaVariaveis")}
          dica={
            f.usarMensais
              ? "Usando os valores mês a mês do cálculo detalhado."
              : "Some o que recebeu de variáveis habituais no ano e divida pelos meses trabalhados."
          }
        />
        <Campo
          id={`${id}-dependentes`}
          rotulo="Dependentes no imposto de renda"
          exemplo="0"
          modo="numeric"
          valor={f.dependentes}
          aoMudar={(dependentes) => mudarFormulario13({ dependentes })}
          erro={erro("dependentes")}
          dica="Só muda o 13º acima de R$ 5 mil."
        />
      </div>

      <details className="group mt-4 rounded-xl border border-border bg-white">
        <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
          Quero calcular com mais detalhes
          <span aria-hidden="true" className="text-muted transition-transform group-open:rotate-180 motion-reduce:transition-none">
            ▾
          </span>
        </summary>
        <div className="grid gap-4 border-t border-border px-4 py-4 sm:grid-cols-2">
          <Campo
            id={`${id}-admissao`}
            rotulo="Data de admissão, se foi em 2026"
            tipo="date"
            valor={f.admissao}
            aoMudar={(admissao) => mudarFormulario13({ admissao })}
            erro={erro("admissao")}
          />
          <Campo
            id={`${id}-saida`}
            rotulo="Data de saída, se saiu em 2026"
            tipo="date"
            valor={f.saida}
            aoMudar={(saida) => mudarFormulario13({ saida })}
            erro={erro("saida")}
            dica="Na saída, o 13º proporcional vem na rescisão."
          />
          <Escolha
            id={`${id}-mes-adiantamento`}
            rotulo="Mês da 1ª parcela"
            valor={f.mesDoAdiantamento}
            opcoes={MESES_DO_ADIANTAMENTO}
            aoMudar={(mesDoAdiantamento) => mudarFormulario13({ mesDoAdiantamento })}
            dica="A empresa pode pagar de fevereiro a novembro. Nas férias, escolha o mês delas."
          />
          <Campo
            id={`${id}-recebido`}
            rotulo="1ª parcela já recebida (R$)"
            exemplo="Se já recebeu"
            valor={f.adiantamentoRecebido}
            aoMudar={(adiantamentoRecebido) => mudarFormulario13({ adiantamentoRecebido })}
            erro={erro("adiantamentoRecebido")}
            dica="O valor que veio no holerite, inclusive se veio nas férias."
          />
          <Escolha
            id={`${id}-mes-reajuste`}
            rotulo="Reajuste de salário em 2026"
            valor={f.mesDoReajuste}
            opcoes={MESES_DO_REAJUSTE}
            aoMudar={(mesDoReajuste) => mudarFormulario13({ mesDoReajuste })}
          />
          {f.mesDoReajuste && (
            <Campo
              id={`${id}-novo`}
              rotulo="Salário depois do reajuste (R$)"
              exemplo="Ex.: 3.300,00"
              valor={f.novoSalario}
              aoMudar={(novoSalario) => mudarFormulario13({ novoSalario })}
              erro={erro("novoSalario") ?? erro("reajuste")}
            />
          )}
          <Campo
            id={`${id}-pensao`}
            rotulo="Pensão alimentícia descontada do 13º (R$)"
            exemplo="Opcional"
            valor={f.pensao}
            aoMudar={(pensao) => mudarFormulario13({ pensao })}
            erro={erro("pensao")}
            dica="A fixada pela Justiça ou em escritura; diminui o imposto."
          />
          <Campo
            id={`${id}-faltas`}
            rotulo="Meses com menos de 15 dias por faltas sem justificativa"
            exemplo="0"
            modo="numeric"
            valor={f.mesesComFaltas}
            aoMudar={(mesesComFaltas) => mudarFormulario13({ mesesComFaltas })}
            erro={erro("mesesComFaltas")}
            dica="Faltas justificadas, férias e licença-maternidade não tiram meses."
          />
          <Campo
            id={`${id}-inss`}
            rotulo="Meses afastado recebendo benefício do INSS"
            exemplo="0"
            modo="numeric"
            valor={f.mesesAfastadoPeloInss}
            aoMudar={(mesesAfastadoPeloInss) => mudarFormulario13({ mesesAfastadoPeloInss })}
            erro={erro("mesesAfastadoPeloInss")}
            dica="Por doença ou acidente, depois dos 15 primeiros dias. O INSS paga o abono anual dessa parte."
          />
          {Number(f.mesesAfastadoPeloInss) > 0 && (
            <Escolha
              id={`${id}-motivo`}
              rotulo="Motivo do afastamento"
              valor={f.motivoDoAfastamento}
              opcoes={[
                { valor: "doenca", nome: "Doença" },
                { valor: "acidente", nome: "Acidente de trabalho ou doença do trabalho" },
              ]}
              aoMudar={(motivoDoAfastamento) => mudarFormulario13({ motivoDoAfastamento })}
            />
          )}
          <label className="flex min-h-11 items-start gap-3 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={f.usarMensais}
              onChange={(evento) => mudarFormulario13({ usarMensais: evento.target.checked })}
              className="mt-1 h-5 w-5 accent-[var(--accent)]"
            />
            <span>
              Informar horas extras, comissões e adicionais mês a mês
              <span className="block text-xs leading-5 text-muted">
                A calculadora faz a média até novembro e, com dezembro, mostra o acerto de janeiro.
              </span>
            </span>
          </label>
          {f.usarMensais && (
            <fieldset className="grid grid-cols-2 gap-3 sm:col-span-2 sm:grid-cols-4">
              <legend className="mb-2 text-sm font-medium">Variáveis de cada mês (R$)</legend>
              {NOMES_DOS_MESES.map((nome, i) => (
                <Campo
                  key={nome}
                  id={`${id}-mensal-${i}`}
                  rotulo={nome[0].toUpperCase() + nome.slice(1)}
                  exemplo="0,00"
                  valor={f.mensais[i]}
                  aoMudar={(valor) =>
                    mudarFormulario13({ mensais: f.mensais.map((v, j) => (j === i ? valor : v)) })
                  }
                  erro={erro(`mensal-${i}`)}
                />
              ))}
            </fieldset>
          )}
        </div>
      </details>

      <div className="mt-6">
        {r ? (
          <Resultado r={r} />
        ) : (
          <p className="rounded-xl border border-dashed border-border bg-white px-4 py-5 text-sm text-muted">
            Digite o seu salário bruto para ver o 13º de 2026.
          </p>
        )}
        <p aria-live="polite" className="sr-only">
          {r ? `13º líquido estimado: ${reais(r.totalLiquido)}.` : ""}
        </p>
      </div>

      <div className="mt-4 space-y-2 text-xs leading-5 text-muted">
        <p>
          Estimativa detalhada do 13º salário líquido de quem tem carteira assinada e recebe
          por mês, com as tabelas de INSS e imposto de renda de 2026. O holerite pode variar
          com convenção coletiva, verbas e descontos que a calculadora não conhece.
        </p>
        <p>
          Regras revisadas em {data(P.revisadoEm)}.{" "}
          <Link
            href="/calculadoras/13-salario#como-calculamos-seu-13o-salario"
            className="text-accent underline underline-offset-2"
          >
            Como calculamos seu 13º salário
          </Link>
        </p>
      </div>
    </section>
  );
}

function Etiqueta({ children }: { children: string }) {
  return (
    <span className="ml-1.5 inline-block rounded-full border border-border px-2 py-0.5 align-middle text-[0.6875rem] font-medium uppercase tracking-wide text-muted">
      {children}
    </span>
  );
}

function Resultado({ r }: { r: ResultadoDo13 }) {
  const isento = r.irrf.imposto === 0 && r.irrf.tipoDeReducao === "isencao";
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-white">
        <div className="px-4 pb-4 pt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Seu 13º salário líquido estimado
          </p>
          <p className="mt-1 font-serif text-4xl tabular-nums sm:text-5xl">{reais(r.totalLiquido)}</p>
          <p className="mt-1 text-sm text-muted">
            {r.avos === 12 ? "O ano todo" : `${r.avos}/12 avos`}, de um 13º bruto de {reais(r.bruto)}.
          </p>
        </div>
        <dl className="divide-y divide-border border-t border-border text-sm sm:text-base">
          <Linha
            nome={
              <>
                1ª parcela, {r.saiuNoAno ? "adiantamento" : `até ${data(P.primeiraParcelaAte)}`}
                <Etiqueta>{r.primeira.origem === "informado" ? "informada" : "projeção"}</Etiqueta>
              </>
            }
            valor={reais(r.primeira.valor)}
          />
          <Linha
            nome={r.saiuNoAno ? "13º na rescisão" : `2ª parcela, até ${data(P.segundaParcelaAte)}`}
            valor={reais(r.segunda)}
          />
          <Linha nome="Total líquido" valor={reais(r.totalLiquido)} destaque />
        </dl>
        <dl className="divide-y divide-border border-t border-border text-sm">
          <Linha nome="13º bruto" valor={reais(r.bruto)} />
          <Linha nome="INSS (sai da 2ª parcela)" valor={`− ${reais(r.inss.total)}`} />
          <Linha nome="Imposto de renda (sai da 2ª parcela)" valor={isento ? "Isento" : `− ${reais(r.irrf.imposto)}`} />
          {r.pensao > 0 && <Linha nome="Pensão alimentícia" valor={`− ${reais(r.pensao)}`} />}
        </dl>
      </div>

      {(r.ajusteDeJaneiro !== null || r.temVariavelSemAjuste || r.faltouDescontar > 0 || r.saiuNoAno || r.mesesDescontados.inss > 0) && (
        <ul className="space-y-2 rounded-xl border border-border bg-white px-4 py-4 text-sm leading-6">
          {r.ajusteDeJaneiro !== null && r.ajusteDeJaneiro !== 0 && (
            <li>
              <strong>Acerto de janeiro:</strong> com dezembro, a média dos variáveis muda e o 13º
              bruto {r.ajusteDeJaneiro > 0 ? "sobe" : "cai"} cerca de {reais(Math.abs(r.ajusteDeJaneiro))}.
              A empresa {r.ajusteDeJaneiro > 0 ? "paga" : "desconta"} a diferença até {data(P.ajusteDeVariaveisAte)}.
            </li>
          )}
          {r.temVariavelSemAjuste && (
            <li>
              <strong>Variáveis:</strong> o 13º de dezembro usa a média até novembro. Até{" "}
              {data(P.ajusteDeVariaveisAte)}, a empresa refaz a conta com o ano inteiro e paga ou
              desconta a diferença; este valor ainda não é o definitivo.
            </li>
          )}
          {r.faltouDescontar > 0 && (
            <li>
              A 1ª parcela e os descontos passam do 13º em {reais(r.faltouDescontar)}; a empresa
              pode compensar essa diferença.
            </li>
          )}
          {r.saiuNoAno && (
            <li>
              Quem sai no ano recebe o 13º proporcional na rescisão, menos o que já adiantou. Para
              as outras verbas, use a{" "}
              <Link href="/calculadoras/rescisao" className="text-accent underline underline-offset-2">
                calculadora de rescisão
              </Link>
              .
            </li>
          )}
          {r.afastamento && (
            <li>
              Os {r.mesesDescontados.inss} meses de afastamento ficam fora do 13º da empresa: o INSS
              paga o abono anual proporcional a eles, calculado sobre o valor do benefício. Pelo
              salário, esses meses valeriam{" "}
              <span className="tabular-nums">{reais(r.afastamento.valorDosMeses)}</span> de 13º bruto.
              {r.afastamento.motivo === "acidente" && (
                <>
                  {" "}No acidente de trabalho, a Súmula 46 do TST diz que as ausências não reduzem o
                  13º, e há orientação de que a empresa pague a diferença entre o abono e esse
                  valor. O tema não é pacífico: confira a convenção coletiva e, se precisar, procure
                  o sindicato.
                </>
              )}
            </li>
          )}
        </ul>
      )}

      <Memoria r={r} />
      <Compartilhar texto={resumo(r)} />
    </div>
  );
}

function Memoria({ r }: { r: ResultadoDo13 }) {
  const ir = r.irrf;
  const passos: [string, string][] = [
    [
      "Remuneração-base",
      `${reais(r.salarioDeDezembro)} de salário ${r.saiuNoAno ? "no mês da saída" : "em dezembro"}: o 13º usa o salário de dezembro, já com reajustes do ano.`,
    ],
    [
      "Média variável",
      r.origemDaMedia === "nenhuma"
        ? "Nenhuma."
        : `${reais(r.mediaVariavel)} por mês (${r.origemDaMedia === "mensal" ? "média dos meses trabalhados até novembro" : "informada"}).`,
    ],
    [
      "Meses computados",
      `${r.avosDoPeriodo} ${r.avosDoPeriodo === 1 ? "mês" : "meses"} com 15 dias ou mais de trabalho${
        r.mesesDescontados.faltas || r.mesesDescontados.inss
          ? `, menos ${r.mesesDescontados.faltas + r.mesesDescontados.inss} (faltas ou afastamento)`
          : ""
      }.`,
    ],
    ["Avos devidos", `${r.avos}/12.`],
    ["13º bruto", `(${reais(r.salarioDeDezembro)} + ${reais(r.mediaVariavel)}) ÷ 12 × ${r.avos} = ${reais(r.bruto)}.`],
    [
      "1ª parcela",
      r.primeira.origem === "informado"
        ? `${reais(r.primeira.valor)}, informada por você.`
        : r.primeira.regra === "metade-do-salario"
          ? `Metade do salário do mês anterior ao pagamento (${NOMES_DOS_MESES[r.primeira.mes - 2]}): ${reais(r.primeira.base)} ÷ 2 = ${reais(r.primeira.valor)}. Sem descontos.`
          : `Metade de 1/12 por mês de serviço até ${NOMES_DOS_MESES[r.primeira.mes - 1]}: ${reais(r.primeira.base)} ÷ 12 × ${r.primeira.avos} ÷ 2 = ${reais(r.primeira.valor)}. Sem descontos.`,
    ],
    ["Base do INSS", `O 13º bruto, separado do salário do mês: ${reais(r.bruto)}.`],
    [
      "INSS",
      `${r.inss.faixas.map((f) => `${percentualPorMil(f.aliquotaPorMil)} sobre ${reais(f.ate - f.de)}`).join(" + ")} = ${reais(r.inss.total)}${r.inss.acimaDoTeto ? " (limitado ao teto)" : ""}.`,
    ],
    [
      "Base do IR",
      `${reais(r.bruto)} − ${reais(ir.deducaoUsada)} (${ir.usaDescontoSimplificado ? "desconto simplificado, maior que as deduções" : "INSS, dependentes e pensão"}) = ${reais(ir.base)}.`,
    ],
    [
      "IR antes da redução",
      ir.aliquotaPorMil === 0
        ? "Base na faixa isenta: R$ 0,00."
        : `${reais(ir.base)} × ${percentualPorMil(ir.aliquotaPorMil)} − ${reais(ir.parcelaADeduzir)} = ${reais(ir.impostoPelaTabela)}.`,
    ],
    [
      "Redução de 2026",
      ir.tipoDeReducao === "isencao"
        ? `13º de até R$ 5 mil: a redução zera o imposto (− ${reais(ir.reducao)}).`
        : ir.tipoDeReducao === "parcial"
          ? `R$ 978,62 − 0,133145 × ${reais(r.bruto)} = − ${reais(ir.reducao)} (calculada sobre o 13º bruto).`
          : "13º acima de R$ 7.350: sem redução.",
    ],
    ["IRRF final", `${reais(ir.impostoPelaTabela)} − ${reais(ir.reducao)} = ${reais(ir.imposto)}.`],
    [
      r.saiuNoAno ? "13º na rescisão" : "2ª parcela",
      `${reais(r.bruto)} − ${reais(r.primeira.valor)} − ${reais(r.inss.total)} − ${reais(ir.imposto)}${r.pensao ? ` − ${reais(r.pensao)}` : ""} = ${reais(r.segunda)}.`,
    ],
    ["Total líquido", `${reais(r.primeira.valor)} + ${reais(r.segunda)} = ${reais(r.totalLiquido)}.`],
  ];
  return (
    <details className="group rounded-xl border border-border bg-white">
      <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
        Entenda como calculamos seu 13º
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
        Cada etapa é arredondada ao centavo. O imposto do 13º é calculado à parte do salário, com
        as mesmas deduções, o desconto simplificado e a redução da Lei 15.270/2025.
      </p>
    </details>
  );
}

function resumo(r: ResultadoDo13) {
  return [
    "Simulação do 13º salário de 2026 (estimativa)",
    `13º bruto: ${reais(r.bruto)} (${r.avos}/12)`,
    `1ª parcela: ${reais(r.primeira.valor)}${r.primeira.origem === "projetado" ? " (projeção)" : ""}`,
    `INSS: ${reais(r.inss.total)} · Imposto de renda: ${reais(r.irrf.imposto)}`,
    `2ª parcela: ${reais(r.segunda)}`,
    `Total líquido: ${reais(r.totalLiquido)}`,
    "Valores estimados; o holerite pode variar.",
    "Calculado em https://direitodeverdade.com.br/calculadoras/13-salario",
  ].join("\n");
}
