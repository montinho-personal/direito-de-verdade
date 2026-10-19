"use client";

import Link from "next/link";
import { useId } from "react";
import { Campo, Compartilhar, Escolha, Linha } from "@/components/partes-da-calculadora";
import { descreverDesconto, descreverVerba, resumoEmTexto } from "@/components/rescisao/descricao";
import {
  type Formulario,
  lerFormulario,
  mudarFormulario,
  useFormulario,
} from "@/components/rescisao/formulario";
import { reais } from "@/lib/dinheiro";
import { formatarData } from "@/lib/trabalhista/datas.ts";
import { REGRAS_DA_RESCISAO } from "@/lib/trabalhista/parametros.ts";
import {
  calcularRescisao,
  type Motivo,
  type ResultadoDaRescisao,
} from "@/lib/trabalhista/rescisao.ts";

const MOTIVOS: { valor: Motivo; nome: string }[] = [
  { valor: "sem-justa-causa", nome: "Demissão sem justa causa" },
  { valor: "pedido", nome: "Pedido de demissão" },
  { valor: "acordo", nome: "Acordo com a empresa" },
  { valor: "justa-causa", nome: "Demissão por justa causa" },
];

const AVISO_DA_EMPRESA: { valor: Formulario["avisoEmpresa"]; nome: string }[] = [
  { valor: "indenizado", nome: "Indenizado (dispensado de trabalhar)" },
  { valor: "trabalhado", nome: "Trabalhado" },
];

const AVISO_DO_PEDIDO: { valor: Formulario["avisoPedido"]; nome: string }[] = [
  { valor: "trabalhado", nome: "Cumpri os 30 dias" },
  { valor: "parcial", nome: "Cumpri só uma parte" },
  { valor: "nao-cumprido", nome: "Não cumpri" },
  { valor: "dispensado", nome: "A empresa me dispensou de cumprir" },
];

const FERIAS_VENCIDAS: { valor: string; nome: string }[] = [
  { valor: "0", nome: "Nenhum" },
  { valor: "1", nome: "1 período" },
  { valor: "2", nome: "2 períodos" },
];

// Rescisão de quem tem carteira assinada e contrato sem prazo, com as regras de 2026
export function CalculadoraRescisao({ nivelDoTitulo = 3 }: { nivelDoTitulo?: 2 | 3 }) {
  const id = useId();
  const Titulo = nivelDoTitulo === 2 ? "h2" : "h3";
  const f = useFormulario();
  const { entrada, erros } = lerFormulario(f);
  const calculo = entrada ? calcularRescisao(entrada) : null;
  const errosDoMotor = calculo && !calculo.ok ? calculo.erros : [];
  const erro = (campo: string) =>
    erros[campo as keyof Formulario] ?? errosDoMotor.find((e) => e.campo === campo)?.mensagem;
  const resultado = calculo?.ok ? calculo : null;

  const empresaEncerrou = f.motivo === "sem-justa-causa" || f.motivo === "acordo";
  const rotuloDaSaida =
    f.motivo === "justa-causa"
      ? "Último dia trabalhado"
      : empresaEncerrou && f.avisoEmpresa === "indenizado"
        ? "Data da dispensa (último dia trabalhado)"
        : "Último dia trabalhado (fim do aviso)";

  return (
    <section
      id="calculadora-de-rescisao"
      aria-labelledby={`${id}-titulo`}
      data-track="artigo:ferramenta-inline"
      className="my-10 scroll-mt-6 rounded-2xl border border-border bg-surface p-6 sm:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">Calculadora</p>
      <Titulo id={`${id}-titulo`} className="mt-2 font-serif text-2xl leading-snug">
        Calcule a sua rescisão
      </Titulo>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Escolha
          id={`${id}-motivo`}
          rotulo="Motivo da saída"
          valor={f.motivo}
          opcoes={MOTIVOS}
          aoMudar={(motivo) => mudarFormulario({ motivo })}
        />
        <Campo
          id={`${id}-salario`}
          rotulo="Salário bruto mensal (R$)"
          exemplo="Ex.: 2.500,00"
          valor={f.salario}
          aoMudar={(salario) => mudarFormulario({ salario })}
          erro={erro("salario")}
        />
        <Campo
          id={`${id}-admissao`}
          rotulo="Data de admissão"
          tipo="date"
          valor={f.admissao}
          aoMudar={(admissao) => mudarFormulario({ admissao })}
          erro={erro("admissao")}
        />
        <Campo
          id={`${id}-saida`}
          rotulo={rotuloDaSaida}
          tipo="date"
          valor={f.saida}
          aoMudar={(saida) => mudarFormulario({ saida })}
          erro={erro("saida")}
          dica={
            empresaEncerrou && f.avisoEmpresa === "indenizado"
              ? "O dia em que a empresa comunicou a dispensa e você parou de trabalhar."
              : undefined
          }
        />
        {empresaEncerrou && (
          <Escolha
            id={`${id}-aviso`}
            rotulo="Aviso prévio"
            valor={f.avisoEmpresa}
            opcoes={AVISO_DA_EMPRESA}
            aoMudar={(avisoEmpresa) => mudarFormulario({ avisoEmpresa })}
          />
        )}
        {f.motivo === "pedido" && (
          <Escolha
            id={`${id}-aviso-pedido`}
            rotulo="Aviso prévio de 30 dias"
            valor={f.avisoPedido}
            opcoes={AVISO_DO_PEDIDO}
            aoMudar={(avisoPedido) => mudarFormulario({ avisoPedido })}
          />
        )}
        {f.motivo === "pedido" && f.avisoPedido === "parcial" && (
          <Campo
            id={`${id}-dias`}
            rotulo="Dias de aviso cumpridos"
            modo="numeric"
            exemplo="Ex.: 15"
            valor={f.diasCumpridos}
            aoMudar={(diasCumpridos) => mudarFormulario({ diasCumpridos })}
            erro={erro("diasCumpridos") ?? erro("diasDeAvisoCumpridos")}
          />
        )}
        <Escolha
          id={`${id}-vencidas`}
          rotulo="Férias vencidas sem tirar"
          valor={f.feriasVencidas}
          opcoes={FERIAS_VENCIDAS}
          aoMudar={(feriasVencidas) => mudarFormulario({ feriasVencidas })}
          dica={
            erro("feriasVencidas") ? (
              <span className="text-sm text-red-700">{erro("feriasVencidas")}</span>
            ) : (
              "Cada período de 12 meses completos em que você não tirou férias. A calculadora vê sozinha se alguma é em dobro."
            )
          }
        />
        {empresaEncerrou && (
          <Campo
            id={`${id}-fgts`}
            rotulo="FGTS para fins rescisórios (R$, opcional)"
            exemplo="Ex.: 9.000,00"
            valor={f.fgts}
            aoMudar={(fgts) => mudarFormulario({ fgts })}
            erro={erro("fgts")}
            dica="Tudo o que a empresa depositou neste emprego, com correção, mesmo o que você já sacou. Veja no extrato do aplicativo FGTS. Sem ele, a multa é estimada."
          />
        )}
      </div>

      <details className="group mt-4 rounded-xl border border-border bg-white">
        <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
          Quero fazer um cálculo mais detalhado
          <span aria-hidden="true" className="text-muted transition-transform group-open:rotate-180 motion-reduce:transition-none">
            ▾
          </span>
        </summary>
        <div className="grid gap-4 border-t border-border px-4 py-4 sm:grid-cols-2">
          <Campo
            id={`${id}-media`}
            rotulo="Média mensal de horas extras, comissões e adicionais (R$)"
            exemplo="Ex.: 450,00"
            valor={f.mediaVariaveis}
            aoMudar={(mediaVariaveis) => mudarFormulario({ mediaVariaveis })}
            erro={erro("mediaVariaveis")}
            dica="Só o que é habitual. Entra no aviso, no 13º e nas férias."
          />
          <Campo
            id={`${id}-adiantamento`}
            rotulo="1ª parcela do 13º já recebida neste ano (R$)"
            exemplo="Ex.: 1.500,00"
            valor={f.adiantamento13}
            aoMudar={(adiantamento13) => mudarFormulario({ adiantamento13 })}
            erro={erro("adiantamento13")}
            dica="A empresa desconta o que já pagou do 13º."
          />
          <Campo
            id={`${id}-outros`}
            rotulo="Outros descontos autorizados (R$)"
            exemplo="Ex.: 300,00"
            valor={f.outrosDescontos}
            aoMudar={(outrosDescontos) => mudarFormulario({ outrosDescontos })}
            erro={erro("outrosDescontos")}
            dica="Adiantamentos de salário, vales e outros descontos que você autorizou."
          />
          <Campo
            id={`${id}-dependentes`}
            rotulo="Dependentes no imposto de renda"
            exemplo="0"
            modo="numeric"
            valor={f.dependentes}
            aoMudar={(dependentes) => mudarFormulario({ dependentes })}
            erro={erro("dependentes")}
          />
          {f.motivo === "sem-justa-causa" && (
            <>
              <Campo
                id={`${id}-saldo-fgts`}
                rotulo="Saldo disponível hoje na conta do FGTS deste emprego (R$)"
                exemplo="Ex.: 8.500,00"
                valor={f.saldoAtualDoFgts}
                aoMudar={(saldoAtualDoFgts) => mudarFormulario({ saldoAtualDoFgts })}
                erro={erro("saldoAtualDoFgts")}
                dica="Para estimar quanto você saca. Não é a base da multa."
              />
              <label className="flex min-h-11 items-start gap-3 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={f.saqueAniversario}
                  onChange={(evento) => mudarFormulario({ saqueAniversario: evento.target.checked })}
                  className="mt-1 h-5 w-5 accent-[var(--accent)]"
                />
                <span>
                  Optei pelo saque-aniversário do FGTS
                  <span className="block text-xs leading-5 text-muted">
                    Quem optou recebe a multa, mas o saldo fica retido.
                  </span>
                </span>
              </label>
            </>
          )}
        </div>
      </details>

      <div className="mt-6">
        {resultado ? (
          <Resultado r={resultado} />
        ) : (
          <p className="rounded-xl border border-dashed border-border bg-white px-4 py-5 text-sm text-muted">
            Preencha o salário e as datas para ver a sua rescisão.
          </p>
        )}
        <p aria-live="polite" className="sr-only">
          {resultado ? `Rescisão líquida estimada: ${reais(resultado.liquido)}.` : ""}
        </p>
      </div>

      <AvisoJuridico />
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

function Resultado({ r }: { r: ResultadoDaRescisao }) {
  const percentual = r.fgts.percentualDaMultaPorMil / 10;
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-white">
        <div className="px-4 pb-4 pt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Quanto você deve receber de rescisão?
          </p>
          <p className="mt-1 font-serif text-4xl tabular-nums sm:text-5xl">{reais(r.liquido)}</p>
          <p className="mt-1 text-sm text-muted">
            Valor líquido estimado a ser pago pela empresa até{" "}
            <strong className="text-foreground">{formatarData(r.datas.prazoDePagamento)}</strong>.
          </p>
        </div>
        <dl className="divide-y divide-border border-t border-border text-sm sm:text-base">
          <Linha nome="Total das verbas" valor={reais(r.bruto)} />
          <Linha nome="Descontos" valor={`− ${reais(r.totalDeDescontos)}`} />
          <Linha nome="Líquido a receber da empresa" valor={reais(r.liquido)} destaque />
        </dl>
        {r.descontoQueSobrou > 0 && (
          <p className="border-t border-border px-4 py-3 text-sm leading-6">
            Os descontos passam do valor das verbas em {reais(r.descontoQueSobrou)}. A
            conta não deixa a rescisão negativa; confira com a empresa como fica essa
            diferença.
          </p>
        )}
      </div>

      {r.fgts.percentualDaMultaPorMil > 0 || r.fgts.saque !== "nao" ? (
        <div className="rounded-xl border border-border bg-white">
          <p className="px-4 pt-4 text-sm font-semibold">
            FGTS: vai para a sua conta do FGTS, fora do pagamento da empresa
          </p>
          <dl className="mt-2 divide-y divide-border border-t border-border text-sm sm:text-base">
            <Linha
              nome={
                <>
                  Multa de {percentual}% do FGTS
                  <Etiqueta>{r.fgts.origemDaBase === "estimado" ? "estimada" : "sobre o valor informado"}</Etiqueta>
                </>
              }
              valor={reais(r.fgts.multa)}
              destaque
            />
            <Linha nome="Depósito de 8% sobre as verbas da rescisão" valor={reais(r.fgts.depositosDaRescisao)} />
            {r.fgts.saqueEstimado !== null && (
              <Linha
                nome={
                  <>
                    {r.fgts.saque === "so-multa" ? "Você pode sacar (só a multa)" : "Você pode sacar, somando tudo"}
                    <Etiqueta>estimado</Etiqueta>
                  </>
                }
                valor={reais(r.fgts.saqueEstimado)}
              />
            )}
          </dl>
          <p className="border-t border-border px-4 py-3 text-sm leading-6 text-muted">
            {r.fgts.saque === "tudo" &&
              "Na demissão sem justa causa, você saca o saldo da conta deste emprego, os depósitos da rescisão e a multa."}
            {r.fgts.saque === "so-multa" &&
              "Com o saque-aniversário, você saca a multa; o saldo da conta continua retido (Lei 8.036/1990, art. 20-D, § 7º)."}
            {r.fgts.saque === "ate-80" &&
              "No acordo, você pode sacar até 80% do valor depositado na conta (CLT, art. 484-A, § 1º)."}
            {r.fgts.origemDaBase === "estimado" &&
              " Sem o valor do FGTS para fins rescisórios, a multa foi estimada pelo salário atual, sem correção; o valor real costuma ser diferente."}
          </p>
        </div>
      ) : (
        <p className="rounded-xl border border-border bg-white px-4 py-4 text-sm leading-6">
          {r.motivo === "pedido"
            ? "No pedido de demissão não há multa do FGTS, e o saldo fica na conta (não dá para sacar agora)."
            : "Na justa causa não há multa do FGTS, e o saldo fica na conta (não dá para sacar agora)."}
        </p>
      )}

      <p className="rounded-xl border border-border bg-white px-4 py-4 text-sm leading-6">
        {r.podeTerSeguroDesemprego ? (
          <>
            <strong>Seguro-desemprego:</strong> você pode ter direito se cumprir o tempo
            mínimo de trabalho. Ele é pago pelo governo, não pela empresa. Veja{" "}
            <Link href="/calculadoras/seguro-desemprego" className="text-accent underline underline-offset-2">
              quanto você receberia de seguro-desemprego
            </Link>
            .
          </>
        ) : (
          <>
            <strong>Seguro-desemprego:</strong> não é devido{" "}
            {r.motivo === "acordo" ? "no acordo (CLT, art. 484-A, § 2º)" : r.motivo === "pedido" ? "no pedido de demissão" : "na justa causa"}.
          </>
        )}
      </p>

      <Memoria r={r} />
      <Compartilhar texto={resumoEmTexto(r)} />
    </div>
  );
}

function Memoria({ r }: { r: ResultadoDaRescisao }) {
  return (
    <details className="group rounded-xl border border-border bg-white">
      <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
        Veja como calculamos sua rescisão
        <span aria-hidden="true" className="text-muted transition-transform group-open:rotate-180 motion-reduce:transition-none">
          ▾
        </span>
      </summary>
      <div className="space-y-5 border-t border-border px-4 py-4 text-sm leading-6">
        <div>
          <p className="font-semibold">Datas</p>
          <ul className="mt-1 space-y-0.5 text-muted">
            <li>
              Admissão: {formatarData(r.datas.admissao)} · saída: {formatarData(r.datas.saida)} ·{" "}
              {r.datas.anosDeServico} {r.datas.anosDeServico === 1 ? "ano completo" : "anos completos"}
            </li>
            {r.datas.diasDeAviso > 0 && <li>Aviso prévio: {r.datas.diasDeAviso} dias</li>}
            {r.datas.fimProjetado && (
              <li>
                Fim do contrato com a projeção do aviso: {formatarData(r.datas.fimProjetado)} (usado
                no 13º e nas férias)
              </li>
            )}
            <li>
              Prazo para pagar: até {formatarData(r.datas.prazoDePagamento)}, 10 dias depois do
              último dia trabalhado (CLT, art. 477, § 6º)
            </li>
          </ul>
        </div>

        <div>
          <p className="font-semibold">Verbas</p>
          <ul className="mt-1 divide-y divide-border">
            {r.verbas.map((v) => {
              const d = descreverVerba(v, r);
              return (
                <li key={v.id} className="py-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 font-medium">
                      {d.nome} <span className="font-normal text-muted">({d.quantidade})</span>
                    </span>
                    <span className="shrink-0 tabular-nums">{reais(d.valor)}</span>
                  </div>
                  <p className="text-muted tabular-nums">{d.formula}</p>
                  <p className="text-muted">{d.explicacao}</p>
                </li>
              );
            })}
          </ul>
          <p className="mt-1 flex justify-between border-t border-border pt-2 font-semibold">
            <span>Total bruto</span>
            <span className="tabular-nums">{reais(r.bruto)}</span>
          </p>
        </div>

        <div>
          <p className="font-semibold">Descontos</p>
          {r.descontos.length ? (
            <ul className="mt-1 divide-y divide-border">
              {r.descontos.map((desconto) => {
                const d = descreverDesconto(desconto);
                return (
                  <li key={desconto.id} className="py-2">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0 font-medium">
                        {d.nome}
                        {desconto.origem === "informado" && <Etiqueta>informado</Etiqueta>}
                      </span>
                      <span className="shrink-0 tabular-nums">− {reais(desconto.valor)}</span>
                    </div>
                    <p className="text-muted">{d.explicacao}</p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-muted">Nenhum desconto nesta simulação.</p>
          )}
          <p className="mt-1 flex justify-between border-t border-border pt-2 font-semibold">
            <span>Líquido</span>
            <span className="tabular-nums">{reais(r.liquido)}</span>
          </p>
        </div>

        <p className="text-xs text-muted">
          Valores calculados com o salário e as datas que você informou
          {r.usouMediaVariaveis ? ", a média de variáveis informada" : ""}
          {r.fgts.origemDaBase === "estimado" && r.fgts.percentualDaMultaPorMil > 0 ? " e a multa do FGTS estimada" : ""}.
          Cada verba é arredondada ao centavo. Aviso indenizado e férias indenizadas não
          têm INSS nem imposto de renda.
        </p>
      </div>
    </details>
  );
}

const dataDaRevisao = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
}).format(new Date(`${REGRAS_DA_RESCISAO.revisadoEm}T00:00:00Z`));

function AvisoJuridico() {
  return (
    <div className="mt-4 space-y-2 text-xs leading-5 text-muted">
      <p>
        Os resultados são estimativas baseadas nas informações fornecidas e nas regras
        trabalhistas aplicáveis. Valores efetivos podem variar conforme documentos,
        convenções coletivas e particularidades contratuais. Esta ferramenta não substitui
        a análise individualizada de um profissional habilitado.
      </p>
      <p>
        Para contrato sem prazo, com as tabelas de INSS e imposto de renda de 2026. Regras
        revisadas em {dataDaRevisao}.{" "}
        <Link
          href="/calculadoras/rescisao#como-esta-calculadora-funciona"
          className="text-accent underline underline-offset-2"
        >
          Como esta calculadora funciona
        </Link>
      </p>
    </div>
  );
}
