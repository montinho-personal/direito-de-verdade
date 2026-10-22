"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { Campo, Compartilhar, Escolha, estiloDoBotao, Linha } from "@/components/partes-da-calculadora";
import { registrarEvento } from "@/lib/analitico";
import { lerQuantidade, lerReais, percentualPorMil, reais } from "@/lib/dinheiro";
import {
  calcularHorasExtras,
  conferirHolerite,
  diasDoMesParaODsr,
  divisorEhOficial,
  divisorSugerido,
  type EntradaDasHorasExtras,
  formatarHoras,
  HORAS_EXTRAS_2026 as P,
  type LancamentoDeHoras,
  lerHoras,
  type Regime,
  type ResultadoDaConferencia,
  type ResultadoDasHorasExtras,
  simularSalarioComHorasExtras,
} from "@/lib/trabalhista/horas-extras.ts";

type Modo = "rapido" | "completo" | "holerite";
type Nivel = "h3" | "h4";

const MODOS = [
  { valor: "rapido", nome: "Cálculo rápido" },
  { valor: "completo", nome: "Cálculo completo" },
  { valor: "holerite", nome: "Conferir holerite" },
] as const;

const JORNADAS = [
  { valor: "44", nome: "44 horas por semana (divisor 220)" },
  { valor: "42", nome: "42 horas por semana (divisor 210)" },
  { valor: "40", nome: "40 horas por semana (divisor 200)" },
  { valor: "36", nome: "36 horas por semana (divisor 180)" },
  { valor: "30", nome: "30 horas por semana (divisor 150)" },
  { valor: "outro", nome: "Outro divisor (da convenção ou do holerite)" },
];

const ADICIONAIS = [
  { valor: "500", nome: "50% (o mínimo da lei)" },
  { valor: "600", nome: "60%" },
  { valor: "700", nome: "70%" },
  { valor: "750", nome: "75%" },
  { valor: "1000", nome: "100%" },
  { valor: "outro", nome: "Outro percentual" },
];

const REGIMES = [
  { valor: "urbano", nome: "Empresa (CLT): 20%, hora de 52min30s" },
  { valor: "domestico", nome: "Doméstico: 20%, hora de 52min30s" },
  { valor: "rural", nome: "Rural: 25%, sem hora reduzida" },
];

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const ANOS = ["2021", "2022", "2023", "2024", "2025", "2026", "2027"];

type Formulario = {
  modo: Modo;
  salario: string;
  adicionaisFixos: string;
  jornada: string;
  divisor: string; // só com jornada "outro"
  horas: string;
  adicional: string;
  adicionalOutro: string;
  horasDomingo: string;
  folga: "nao" | "sim";
  horasNoturnas: string;
  adicionalNoturnas: string;
  regime: Regime;
  noturnoConvencao: string;
  habitual: boolean;
  mes: string;
  ano: string;
  feriados: string;
  dependentes: string;
  pagoHorasExtras: string;
  pagoDsr: string;
  horasPagas: string;
};

const INICIAL: Formulario = {
  modo: "rapido",
  salario: "",
  adicionaisFixos: "",
  jornada: "44",
  divisor: "",
  horas: "",
  adicional: "500",
  adicionalOutro: "",
  horasDomingo: "",
  folga: "nao",
  horasNoturnas: "",
  adicionalNoturnas: "500",
  regime: "urbano",
  noturnoConvencao: "",
  habitual: true,
  // Trocado pelo mês atual no navegador (o HTML da página é gerado antes)
  mes: "10",
  ano: "2026",
  feriados: "0",
  dependentes: "",
  pagoHorasExtras: "",
  pagoDsr: "",
  horasPagas: "",
};

// "60", "60%" ou "62,5" → décimos de ponto percentual (600, 625)
function lerPercentual(texto: string): number | null {
  const limpo = texto.replace(/%|\s/g, "").replace(",", ".");
  if (!/^\d{1,3}(\.\d)?$/.test(limpo)) return null;
  return Math.round(Number(limpo) * 10);
}

const link = "text-accent underline underline-offset-2";

// Horas extras de quem tem carteira assinada: valor, DSR, reflexos, quanto sobra no
// líquido e conferência do holerite
export function CalculadoraHorasExtras({ nivelDoTitulo = 3 }: { nivelDoTitulo?: 2 | 3 }) {
  const id = useId();
  const Titulo = nivelDoTitulo === 2 ? "h2" : "h3";
  const Sub: Nivel = nivelDoTitulo === 2 ? "h3" : "h4";
  const endereco = `https://direitodeverdade.com.br${usePathname() ?? "/calculadoras/horas-extras"}`;
  const [f, setF] = useState(INICIAL);
  const mexeuNoMes = useRef(false);
  const mudar = (mudanca: Partial<Formulario>) => setF((atual) => ({ ...atual, ...mudanca }));

  // Eventos do Analytics sem nenhum valor digitado: só que a ferramenta foi vista e usada
  const registrados = useRef(new Set<string>());
  const registrarUmaVez = (nome: string, parametros: Record<string, string> = {}) => {
    const chave = `${nome}:${JSON.stringify(parametros)}`;
    if (registrados.current.has(chave)) return;
    registrados.current.add(chave);
    registrarEvento(nome, parametros);
  };
  useEffect(() => {
    registrarUmaVez("horas_extras_calculadora_view");
    // Mês atual no horário de Brasília, se a pessoa ainda não escolheu outro
    const [ano, mes] = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit" })
      .format(new Date())
      .split("-");
    if (!mexeuNoMes.current && ANOS.includes(ano)) setF((atual) => ({ ...atual, ano, mes: String(Number(mes)) }));
  }, []);

  const completo = f.modo !== "rapido";
  const leituras = {
    salario: lerReais(f.salario),
    adicionaisFixos: completo ? lerReais(f.adicionaisFixos) : ({ tipo: "vazio" } as const),
    pagoHorasExtras: f.modo === "holerite" ? lerReais(f.pagoHorasExtras) : ({ tipo: "vazio" } as const),
    pagoDsr: f.modo === "holerite" ? lerReais(f.pagoDsr) : ({ tipo: "vazio" } as const),
  };
  const errosDeLeitura: Record<string, string> = {};
  for (const [campo, l] of Object.entries(leituras)) if (l.tipo === "invalido") errosDeLeitura[campo] = l.mensagem;
  const centavos = (l: (typeof leituras)["salario"]) => (l.tipo === "valido" ? l.centavos : 0);

  const minutos = (campo: "horas" | "horasDomingo" | "horasNoturnas" | "horasPagas") => {
    const texto = f[campo];
    if (!texto.trim()) return 0;
    const lido = lerHoras(texto);
    if (lido === null) errosDeLeitura[campo] = "Use horas e minutos, como 1h30, 1:30 ou 1,5.";
    return lido ?? 0;
  };
  const horasDiurnas = minutos("horas");
  const horasDomingo = completo ? minutos("horasDomingo") : 0;
  const horasNoturnas = completo ? minutos("horasNoturnas") : 0;
  const horasPagas = f.modo === "holerite" ? minutos("horasPagas") : 0;

  let adicional: number | null = f.adicional === "outro" ? lerPercentual(f.adicionalOutro) : Number(f.adicional);
  if (f.adicional === "outro" && f.adicionalOutro && adicional === null) errosDeLeitura.adicional = "Digite o percentual, como 60 ou 62,5.";
  if (f.adicional === "outro" && !f.adicionalOutro) adicional = null;
  const noturnoConvencao = completo && f.noturnoConvencao ? lerPercentual(f.noturnoConvencao) : null;
  if (completo && f.noturnoConvencao && noturnoConvencao === null) errosDeLeitura.noturnoConvencao = "Digite o percentual, como 30.";

  const horasSemanais = f.jornada === "outro" ? null : Number(f.jornada);
  const divisorDigitado = f.jornada === "outro" ? lerQuantidade(f.divisor, 300) : null;
  if (divisorDigitado?.tipo === "invalido") errosDeLeitura.divisor = divisorDigitado.mensagem;
  const divisor =
    horasSemanais !== null
      ? divisorSugerido(horasSemanais)
      : divisorDigitado?.tipo === "valido"
        ? divisorDigitado.quantidade
        : 0;

  const ano = Number(f.ano);
  const mes = Number(f.mes);
  const feriados = lerQuantidade(f.feriados, 10);
  if (feriados.tipo === "invalido") errosDeLeitura.feriados = feriados.mensagem;
  const dias = diasDoMesParaODsr(ano, mes, feriados.tipo === "valido" ? feriados.quantidade : 0);
  const dependentes = lerQuantidade(f.dependentes, 20);

  const lancamentos: LancamentoDeHoras[] = [];
  if (horasDiurnas && adicional !== null) lancamentos.push({ minutos: horasDiurnas, adicionalPorMil: adicional, rotulo: `Horas extras de ${percentualPorMil(adicional)}` });
  if (horasDomingo && f.folga === "nao") {
    lancamentos.push({ minutos: horasDomingo, adicionalPorMil: P.adicionalDomingoPorMil, rotulo: "Domingos e feriados sem folga (em dobro)" });
  }
  if (horasNoturnas) {
    const a = Number(f.adicionalNoturnas);
    lancamentos.push({ minutos: horasNoturnas, adicionalPorMil: a, noturna: true, rotulo: `Horas extras noturnas de ${percentualPorMil(a)}` });
  }

  const entrada: EntradaDasHorasExtras | null =
    leituras.salario.tipo === "valido" && !Object.keys(errosDeLeitura).length && (horasDiurnas || horasDomingo || horasNoturnas)
      ? {
          salario: leituras.salario.centavos,
          adicionaisFixos: centavos(leituras.adicionaisFixos),
          divisor,
          lancamentos,
          regime: f.regime,
          adicionalNoturnoPorMil: noturnoConvencao ? noturnoConvencao : undefined,
          dsr: f.habitual ? { diasUteis: dias.diasUteis, repousos: dias.repousos } : null,
          referencia: { ano, mes },
        }
      : null;
  const calculo = entrada && lancamentos.length ? calcularHorasExtras(entrada) : null;
  const errosDoMotor = calculo && !calculo.ok ? calculo.erros : [];
  const erro = (campo: string) => errosDeLeitura[campo] ?? errosDoMotor.find((e) => e.campo === campo)?.mensagem;
  const r = calculo?.ok ? calculo : null;
  const conferencia =
    r && f.modo === "holerite" && leituras.pagoHorasExtras.tipo === "valido"
      ? conferirHolerite(r, {
          pagoHorasExtras: leituras.pagoHorasExtras.centavos,
          pagoDsr: leituras.pagoDsr.tipo === "valido" ? leituras.pagoDsr.centavos : null,
          minutosPagos: horasPagas || null,
        })
      : null;

  useEffect(() => {
    if (r) registrarUmaVez("horas_extras_calculo_realizado", { modo: f.modo });
    if (conferencia) registrarUmaVez("horas_extras_conferencia_holerite");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(r), Boolean(conferencia), f.modo]);

  function trocarModo(modo: Modo) {
    mudar({ modo });
    if (modo === "completo") registrarUmaVez("horas_extras_modo_completo");
  }
  function refazer() {
    setF((atual) => ({ ...INICIAL, modo: atual.modo, mes: atual.mes, ano: atual.ano }));
    document.getElementById(`${id}-salario`)?.focus();
  }

  const avisos: ReactNode[] = [];
  if (horasSemanais !== null && !divisorEhOficial(horasSemanais, divisor)) {
    avisos.push(
      <>
        O divisor {divisor} sai da conta do TST (horas por semana ÷ 6 × 30), mas não está escrito em
        nenhuma súmula. {horasSemanais === 42 && "Para a etapa de 42 horas da Emenda 141, ainda não há divisor oficial. "}
        Se a convenção ou o holerite usam outro, escolha &quot;Outro divisor&quot;.
      </>,
    );
  }
  if (horasDomingo && f.folga === "sim") {
    avisos.push("Com folga compensatória, o trabalho no domingo ou feriado não é pago em dobro: essas horas ficaram fora da conta.");
  }
  if (horasNoturnas && f.regime === "rural") {
    avisos.push("No trabalho rural, o horário noturno é das 21h às 5h na lavoura e das 20h às 4h na pecuária, com adicional de 25%.");
  }
  if (r?.reflexos.regra === "transicao") {
    avisos.push("Em março de 2023 a regra dos reflexos mudou no dia 20: a conta abaixo usa a regra antiga para o mês inteiro.");
  }
  if (horasSemanais === 44 && ano * 12 + mes >= 2026 * 12 + 12) {
    avisos.push(
      <>
        Desde 16/12/2026, o limite da jornada é de 42 horas semanais (Emenda Constitucional 141): veja{" "}
        <Link href="/artigos/fim-da-escala-6x1" className={link}>
          o que muda com o fim da escala 6x1
        </Link>
        .
      </>,
    );
  }

  return (
    <section
      id="calculadora-de-horas-extras"
      aria-labelledby={`${id}-titulo`}
      data-track="artigo:ferramenta-inline"
      className="my-10 scroll-mt-6 rounded-2xl border border-border bg-surface p-6 sm:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">Calculadora</p>
      <Titulo id={`${id}-titulo`} className="mt-2 font-serif text-2xl leading-snug">
        Calcule as suas horas extras
      </Titulo>

      <fieldset className="mt-6 print:hidden">
        <legend className="text-sm font-medium">O que você quer fazer?</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {MODOS.map((item) => (
            <label
              key={item.valor}
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm has-[:checked]:border-gold has-[:checked]:bg-gold/10 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold/60"
            >
              <input
                type="radio"
                name={`${id}-modo`}
                value={item.valor}
                checked={f.modo === item.valor}
                onChange={() => trocarModo(item.valor)}
                className="accent-[var(--accent)]"
              />
              {item.nome}
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs leading-5 text-muted">
          {f.modo === "rapido" && "Salário, jornada e horas do mês. Para domingos, horas noturnas e convenção, use o cálculo completo."}
          {f.modo === "completo" && "Inclui domingos e feriados, horas noturnas, adicionais fixos e o adicional da convenção."}
          {f.modo === "holerite" && "Faça a conta e compare com o que veio no holerite."}
        </p>
      </fieldset>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Campo
          id={`${id}-salario`}
          rotulo="Salário bruto mensal (R$)"
          exemplo="Ex.: 2.200,00"
          valor={f.salario}
          aoMudar={(salario) => mudar({ salario })}
          erro={erro("salario")}
          dica="O da carteira, sem descontos."
        />
        <Escolha
          id={`${id}-jornada`}
          rotulo="Jornada do contrato"
          valor={f.jornada}
          opcoes={JORNADAS}
          aoMudar={(jornada) => mudar({ jornada })}
          dica="Quem trabalha 8 horas de segunda a sexta e 4 no sábado faz 44 horas."
        />
        {f.jornada === "outro" && (
          <Campo
            id={`${id}-divisor`}
            rotulo="Divisor"
            exemplo="Ex.: 220"
            modo="numeric"
            valor={f.divisor}
            aoMudar={(divisor) => mudar({ divisor })}
            erro={erro("divisor")}
            dica="Número de horas pelo qual o salário é dividido para achar a hora normal."
          />
        )}
        {completo && (
          <Campo
            id={`${id}-fixos`}
            rotulo="Adicionais fixos no salário (R$, opcional)"
            exemplo="Ex.: 660,00"
            valor={f.adicionaisFixos}
            aoMudar={(adicionaisFixos) => mudar({ adicionaisFixos })}
            erro={erro("adicionaisFixos")}
            dica="Periculosidade, insalubridade, gratificação: entram no valor da hora."
          />
        )}
        <Campo
          id={`${id}-horas`}
          rotulo={completo ? "Horas extras em dias úteis e sábados" : "Horas extras no mês"}
          exemplo="Ex.: 10h30"
          valor={f.horas}
          aoMudar={(horas) => mudar({ horas })}
          erro={erro("horas")}
          dica="Aceita minutos: 1h30, 1:30 ou 1,5 (uma hora e meia)."
        />
        <Escolha
          id={`${id}-adicional`}
          rotulo="Adicional da hora extra"
          valor={f.adicional}
          opcoes={ADICIONAIS}
          aoMudar={(adicional) => mudar({ adicional })}
          dica="A lei garante 50%; a convenção coletiva pode dar mais."
        />
        {f.adicional === "outro" && (
          <Campo
            id={`${id}-adicional-outro`}
            rotulo="Percentual do adicional (%)"
            exemplo="Ex.: 65"
            valor={f.adicionalOutro}
            aoMudar={(adicionalOutro) => mudar({ adicionalOutro })}
            erro={erro("adicional")}
          />
        )}
      </div>

      {completo && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Campo
            id={`${id}-domingo`}
            rotulo="Horas em domingos e feriados (opcional)"
            exemplo="Ex.: 8h"
            valor={f.horasDomingo}
            aoMudar={(horasDomingo) => mudar({ horasDomingo })}
            erro={erro("horasDomingo")}
            dica="Horas trabalhadas no dia de descanso."
          />
          <Escolha
            id={`${id}-folga`}
            rotulo="A empresa deu outro dia de folga no lugar?"
            valor={f.folga}
            opcoes={[
              { valor: "nao", nome: "Não: pago em dobro (100%)" },
              { valor: "sim", nome: "Sim: não há dobra" },
            ]}
            aoMudar={(folga) => mudar({ folga })}
          />
          <Campo
            id={`${id}-noturnas`}
            rotulo="Horas extras noturnas (opcional)"
            exemplo="Ex.: 2h"
            valor={f.horasNoturnas}
            aoMudar={(horasNoturnas) => mudar({ horasNoturnas })}
            erro={erro("horasNoturnas")}
            dica="Horas de relógio entre 22h e 5h, além da jornada."
          />
          <Escolha
            id={`${id}-adicional-noturnas`}
            rotulo="Adicional das horas extras noturnas"
            valor={f.adicionalNoturnas}
            opcoes={ADICIONAIS.filter((a) => a.valor !== "outro")}
            aoMudar={(adicionalNoturnas) => mudar({ adicionalNoturnas })}
          />
          {horasNoturnas > 0 && (
            <>
              <Escolha
                id={`${id}-regime`}
                rotulo="Tipo de trabalho"
                valor={f.regime}
                opcoes={REGIMES as { valor: Regime; nome: string }[]}
                aoMudar={(regime) => mudar({ regime })}
              />
              <Campo
                id={`${id}-noturno-convencao`}
                rotulo="Adicional noturno da convenção (%, opcional)"
                exemplo="Ex.: 30"
                valor={f.noturnoConvencao}
                aoMudar={(noturnoConvencao) => mudar({ noturnoConvencao })}
                erro={erro("noturnoConvencao")}
                dica="Só se for maior que o da lei."
              />
            </>
          )}
        </div>
      )}

      <fieldset className="mt-6 rounded-xl border border-border bg-white px-4 py-4">
        <legend className="px-1 text-sm font-medium">Descanso semanal remunerado (DSR)</legend>
        <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-6">
          <input
            type="checkbox"
            checked={f.habitual}
            onChange={(evento) => mudar({ habitual: evento.target.checked })}
            className="mt-1.5 size-4 accent-[var(--accent)]"
          />
          <span>Faço hora extra todo mês ou quase (horas habituais): somar o DSR</span>
        </label>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <Escolha
            id={`${id}-mes`}
            rotulo="Mês das horas"
            valor={f.mes}
            opcoes={MESES.map((nome, i) => ({ valor: String(i + 1), nome }))}
            aoMudar={(mes) => {
              mexeuNoMes.current = true;
              mudar({ mes });
            }}
          />
          <Escolha
            id={`${id}-ano`}
            rotulo="Ano"
            valor={f.ano}
            opcoes={ANOS.map((a) => ({ valor: a, nome: a }))}
            aoMudar={(ano) => {
              mexeuNoMes.current = true;
              mudar({ ano });
            }}
          />
          <Campo
            id={`${id}-feriados`}
            rotulo="Feriados de segunda a sábado"
            modo="numeric"
            valor={f.feriados}
            aoMudar={(feriados) => mudar({ feriados })}
            erro={erro("feriados")}
          />
        </div>
        <p className="mt-2 text-xs leading-5 text-muted">
          {MESES[mes - 1]} de {ano}: {dias.diasUteis} dias úteis (o sábado conta) e {dias.repousos} de descanso
          ({dias.domingos} domingos{dias.repousos > dias.domingos ? ` e ${dias.repousos - dias.domingos} feriado(s)` : ""}).
          Conte os feriados nacionais, estaduais e da sua cidade.
        </p>
      </fieldset>

      {f.modo === "holerite" && (
        <fieldset className="mt-6 rounded-xl border border-border bg-white px-4 py-4">
          <legend className="px-1 text-sm font-medium">O que veio no holerite</legend>
          <div className="grid gap-4 sm:grid-cols-3">
            <Campo
              id={`${id}-pago`}
              rotulo="Horas extras pagas (R$)"
              exemplo="Ex.: 150,00"
              valor={f.pagoHorasExtras}
              aoMudar={(pagoHorasExtras) => mudar({ pagoHorasExtras })}
              erro={erro("pagoHorasExtras")}
              dica="Some as linhas de hora extra."
            />
            <Campo
              id={`${id}-pago-dsr`}
              rotulo="DSR das horas extras (R$, opcional)"
              exemplo="Ex.: 45,65"
              valor={f.pagoDsr}
              aoMudar={(pagoDsr) => mudar({ pagoDsr })}
              erro={erro("pagoDsr")}
              dica="Se aparece em linha separada."
            />
            <Campo
              id={`${id}-horas-pagas`}
              rotulo="Horas pagas (opcional)"
              exemplo="Ex.: 10h"
              valor={f.horasPagas}
              aoMudar={(horasPagas) => mudar({ horasPagas })}
              erro={erro("horasPagas")}
              dica="A quantidade que aparece ao lado do valor."
            />
          </div>
        </fieldset>
      )}

      <div className="mt-6">
        {r ? (
          <Resultado
            r={r}
            f={f}
            avisos={avisos}
            conferencia={conferencia}
            dependentes={dependentes.tipo === "valido" ? dependentes.quantidade : 0}
            erroDependentes={dependentes.tipo === "invalido" ? dependentes.mensagem : undefined}
            mudarDependentes={(d) => mudar({ dependentes: d })}
            Sub={Sub}
            idBase={id}
            endereco={endereco}
            refazer={refazer}
            registrar={registrarUmaVez}
          />
        ) : (
          <p className="rounded-xl border border-dashed border-border bg-white px-4 py-5 text-sm text-muted">
            Digite o salário e as horas extras do mês para ver o valor.
          </p>
        )}
        <p aria-live="polite" className="sr-only">
          {r ? `Horas extras com DSR: ${reais(r.total)}.` : ""}
        </p>
      </div>

      <p className="mt-4 text-xs leading-5 text-muted">
        Estimativa para quem tem carteira assinada e salário mensal, com as regras revisadas em
        21/10/2026: Constituição, CLT, Lei 605/1949, súmulas do TST e tabelas de INSS e imposto
        de renda de 2026. Convenção coletiva, comissões, escalas especiais e o ponto de cada dia
        podem mudar o valor. A conta é feita no seu navegador: nada do que você digita é enviado
        ou guardado.{" "}
        <Link href="/calculadoras/horas-extras#como-esta-calculadora-funciona" className={link}>
          Como esta calculadora funciona
        </Link>
      </p>
    </section>
  );
}

function Resultado({
  r,
  f,
  avisos,
  conferencia,
  dependentes,
  erroDependentes,
  mudarDependentes,
  Sub,
  idBase,
  endereco,
  refazer,
  registrar,
}: {
  r: ResultadoDasHorasExtras;
  f: Formulario;
  avisos: ReactNode[];
  conferencia: ResultadoDaConferencia | null;
  dependentes: number;
  erroDependentes?: string;
  mudarDependentes: (d: string) => void;
  Sub: Nivel;
  idBase: string;
  endereco: string;
  refazer: () => void;
  registrar: (nome: string, parametros?: Record<string, string>) => void;
}) {
  const simulacao = simularSalarioComHorasExtras(r.base, r.total, dependentes);
  const mesAno = `${MESES[Number(f.mes) - 1]} de ${f.ano}`;
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-white">
        <div className="px-4 pb-4 pt-5">
          <p className="text-sm text-muted">Suas horas extras valem aproximadamente</p>
          <p className="mt-1 font-serif text-4xl tabular-nums sm:text-5xl">{reais(r.total)}</p>
          <p className="mt-1 text-sm text-muted">
            Valor bruto de {formatarHoras(r.minutosTotais)} em {mesAno}
            {r.dsr ? ", com o DSR" : ""}, antes do INSS e do imposto de renda.
          </p>
        </div>
        <dl className="divide-y divide-border border-t border-border text-sm sm:text-base">
          <Linha nome="Hora normal" valor={`${reais(r.horaNormal)} (÷ ${r.divisor})`} />
          {r.linhas.map((l) => (
            <Linha
              key={l.rotulo}
              nome={`${l.rotulo}: ${formatarHoras(l.minutos)} × ${reais(l.valorDaHora)}`}
              valor={reais(l.valor)}
            />
          ))}
          {r.diasUteis !== null && (
            <Linha nome={`DSR: ${reais(r.horasExtras)} ÷ ${r.diasUteis} dias úteis × ${r.repousos} de descanso`} valor={reais(r.dsr)} />
          )}
          <Linha nome="Total bruto" valor={reais(r.total)} destaque />
        </dl>
      </div>

      {avisos.length > 0 && (
        <ul className="space-y-2 rounded-xl border border-gold/50 bg-gold/10 px-4 py-4 text-sm leading-6">
          {avisos.map((aviso, i) => (
            <li key={i}>{aviso}</li>
          ))}
        </ul>
      )}

      {conferencia && <Conferencia c={conferencia} r={r} Sub={Sub} />}

      <details className="group rounded-xl border border-border bg-white">
        <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
          Como chegamos a esse valor?
          <span aria-hidden="true" className="text-muted transition-transform group-open:rotate-180 motion-reduce:transition-none">
            ▾
          </span>
        </summary>
        <ol className="list-decimal space-y-2 border-t border-border py-4 pl-9 pr-4 text-sm leading-6 tabular-nums">
          <li>
            <strong>Hora normal:</strong> {reais(r.base)}
            {f.modo !== "rapido" && f.adicionaisFixos.trim() ? " (salário + adicionais fixos)" : ""} ÷ {r.divisor} ={" "}
            {reais(r.horaNormal)}.
          </li>
          {r.linhas.map((l) => (
            <li key={l.rotulo}>
              <strong>{l.rotulo}:</strong> hora normal × {((1000 + l.adicionalPorMil) / 1000).toLocaleString("pt-BR")}
              {l.noturna ? ` × ${((1000 + r.adicionalNoturnoPorMil) / 1000).toLocaleString("pt-BR")} (adicional noturno)` : ""}{" "}
              = {reais(l.valorDaHora)} por hora. {formatarHoras(l.minutos)}
              {l.minutosConsiderados !== l.minutos
                ? ` de relógio valem ${formatarHoras(l.minutosConsiderados)} de hora noturna (de 52min30s)`
                : ` = ${(l.minutos / 60).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} h`}
              ; × {reais(l.valorDaHora)} = {reais(l.valor)}.
            </li>
          ))}
          {r.diasUteis !== null && (
            <li>
              <strong>DSR:</strong> {reais(r.horasExtras)} ÷ {r.diasUteis} dias úteis × {r.repousos} domingos e feriados ={" "}
              {reais(r.dsr)}.
            </li>
          )}
          <li>
            <strong>Total:</strong> {reais(r.horasExtras)}
            {r.dsr ? ` + ${reais(r.dsr)}` : ""} = {reais(r.total)}.
          </li>
        </ol>
        <p className="border-t border-border px-4 py-3 text-xs leading-5 text-muted">
          Minutos viram fração de hora (30 min = 0,5 h). Cada linha é arredondada ao centavo no fim; se a
          empresa arredonda a hora antes, o holerite pode diferir em centavos.
        </p>
      </details>

      <section aria-labelledby={`${idBase}-reflexos`} className="rounded-xl border border-border bg-white px-4 py-4">
        <Sub id={`${idBase}-reflexos`} className="font-serif text-lg">
          Reflexos: o que as horas extras habituais somam em outras verbas
        </Sub>
        <p className="mt-1 text-sm leading-6 text-muted">
          Não é dinheiro a receber agora: entra quando cada verba for paga, pela média das horas.
          Estimativa para um mês como este.
        </p>
        <dl className="mt-2 divide-y divide-border text-sm sm:text-base">
          <Linha nome="13º salário (1/12 por mês)" valor={`+ ${reais(r.reflexos.decimoTerceiro)}`} />
          <Linha nome="Férias com 1/3 (1/12 por mês)" valor={`+ ${reais(r.reflexos.feriasComUmTerco)}`} />
          <Linha nome="FGTS do mês (8%)" valor={`+ ${reais(r.reflexos.fgts)}`} />
        </dl>
        <p className="mt-2 text-xs leading-5 text-muted">
          {r.reflexos.regra === "nova"
            ? "Para horas trabalhadas desde 20/03/2023, o DSR das horas extras também entra nesses reflexos (OJ 394 do TST)."
            : "Para horas trabalhadas antes de 20/03/2023, só as horas extras entram nesses reflexos, sem o DSR (OJ 394 do TST, redação antiga)."}{" "}
          Na demissão com aviso prévio indenizado, a média também entra no aviso.
        </p>
      </section>

      <details
        className="group rounded-xl border border-border bg-white"
        onToggle={(evento) => {
          if ((evento.target as HTMLDetailsElement).open) registrar("horas_extras_comparacao_realizada");
        }}
      >
        <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
          Quanto meu salário aumenta fazendo horas extras?
          <span aria-hidden="true" className="text-muted transition-transform group-open:rotate-180 motion-reduce:transition-none">
            ▾
          </span>
        </summary>
        <div className="space-y-3 border-t border-border px-4 py-4">
          <div className="max-w-xs">
            <Campo
              id={`${idBase}-dependentes`}
              rotulo="Dependentes no imposto de renda"
              modo="numeric"
              valor={f.dependentes}
              aoMudar={mudarDependentes}
              erro={erroDependentes}
            />
          </div>
          <dl className="divide-y divide-border rounded-lg border border-border text-sm sm:text-base">
            <Linha nome="Salário bruto sem horas extras" valor={reais(simulacao.atual.bruto)} />
            <Linha nome="Salário bruto com horas extras" valor={reais(simulacao.novo.bruto)} />
            <Linha nome="INSS a mais" valor={`− ${reais(simulacao.diferencaInss)}`} />
            <Linha nome="Imposto de renda a mais" valor={`− ${reais(simulacao.diferencaIrrf)}`} />
            <Linha nome="Líquido sem horas extras" valor={reais(simulacao.atual.liquidoAntesDaPensao)} />
            <Linha nome="Líquido com horas extras" valor={reais(simulacao.novo.liquidoAntesDaPensao)} />
            <Linha nome="Aumento no líquido" valor={`+ ${reais(simulacao.aumentoLiquido)}`} destaque />
          </dl>
          <p className="text-sm leading-6">
            Dos {reais(simulacao.aumentoBruto)} brutos, ficam cerca de {reais(simulacao.aumentoLiquido)}
            {simulacao.percentualQueFicaPorMil !== null ? ` (${percentualPorMil(simulacao.percentualQueFicaPorMil)})` : ""} depois do INSS
            e do imposto de renda, com as tabelas de 2026. Outros descontos do holerite (vale-transporte,
            plano de saúde, pensão) não entram aqui.
          </p>
        </div>
      </details>

      <Compartilhar texto={resumo(r, f, conferencia, endereco)} aoCompartilhar={(canal) => registrar("horas_extras_compartilhamento", { canal })} />
      <button type="button" onClick={refazer} className={`${estiloDoBotao} print:hidden`}>
        Refazer a simulação
      </button>

      <nav aria-label="Continue entendendo seus direitos" className="rounded-xl border border-border bg-white px-4 py-4 text-sm leading-6 print:hidden">
        <Sub className="font-serif text-lg">Continue entendendo seus direitos</Sub>
        <ul className="mt-2 space-y-1">
          {[
            { href: "/artigos/horas-extras-banco-de-horas", nome: "Hora extra e banco de horas", texto: ": limites, banco de horas e o que acontece na demissão." },
            { href: "/calculadoras/ferias", nome: "Calculadora de férias", texto: ": a média das horas extras entra nas férias." },
            { href: "/calculadoras/13-salario", nome: "Calculadora do 13º salário", texto: ": com a média das horas extras." },
            { href: "/calculadoras/rescisao", nome: "Calculadora de rescisão", texto: ": horas extras e banco de horas na saída." },
            { href: "/calculadoras/imposto-de-renda", nome: "Calculadora de imposto de renda", texto: ": o desconto do salário do mês." },
          ].map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => registrar("horas_extras_link_relacionado", { destino: item.href })}
                className={link}
              >
                {item.nome}
              </Link>
              {item.texto}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

const DIVISORES_CONHECIDOS = [150, 180, 200, 210, 220, 240];

function Conferencia({ c, r, Sub }: { c: ResultadoDaConferencia; r: ResultadoDasHorasExtras; Sub: Nivel }) {
  const divisorProvavel =
    c.situacao !== "confere" && c.divisorDoHolerite !== null
      ? DIVISORES_CONHECIDOS.find((d) => d !== r.divisor && Math.abs(d - c.divisorDoHolerite!) <= 1)
      : undefined;
  const titulo = {
    confere: "O holerite bate com a conta",
    abaixo: "O holerite pagou menos que a conta",
    acima: "O holerite pagou mais que a conta",
  }[c.situacao];
  return (
    <section className="rounded-xl border border-border bg-white px-4 py-4 text-sm leading-6">
      <Sub className="font-serif text-lg">{titulo}</Sub>
      <dl className="mt-2 divide-y divide-border rounded-lg border border-border text-sm sm:text-base">
        <Linha nome={c.dsrConferido ? "Calculado (horas extras + DSR)" : "Calculado (horas extras, sem DSR)"} valor={reais(c.calculado)} />
        <Linha nome="Pago no holerite" valor={reais(c.pago)} />
        <Linha nome="Diferença" valor={`${c.diferenca > 0 ? "+ " : c.diferenca < 0 ? "− " : ""}${reais(Math.abs(c.diferenca))}`} destaque />
      </dl>
      <ul className="mt-3 list-disc space-y-1 pl-5">
        {c.situacao === "confere" && <li>Diferença de até R$ 1,00 cabe em arredondamentos.</li>}
        {!c.dsrConferido && r.dsr > 0 && (
          <li>
            O DSR das horas extras ({reais(r.dsr)} pela conta) não foi conferido: informe o valor se ele aparece em
            linha separada no holerite. Se não aparece, pergunte ao RH se ele foi pago.
          </li>
        )}
        {c.horasDiferentes && <li>As horas pagas no holerite são diferentes das que você digitou: confira o ponto do mês.</li>}
        {divisorProvavel && (
          <li>
            O valor pago bate com o divisor {divisorProvavel}, e a conta usou {r.divisor}. Veja qual divisor a sua
            convenção coletiva prevê.
          </li>
        )}
      </ul>
      {c.situacao !== "confere" && (
        <>
          <p className="mt-3">
            Uma diferença não quer dizer, sozinha, que o pagamento está errado. Motivos comuns:
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>horas de outro período (muitas empresas fecham o ponto antes do fim do mês);</li>
            <li>adicional ou divisor da convenção coletiva diferentes;</li>
            <li>horas que foram para o banco de horas em vez de serem pagas;</li>
            <li>adicionais fixos (periculosidade, insalubridade) dentro ou fora da conta;</li>
            <li>minutos de tolerância: até 5 na entrada ou na saída, no máximo 10 por dia, não contam.</li>
          </ul>
          <p className="mt-3">
            Peça ao RH o espelho do ponto e a explicação da conta. Se a dúvida continuar, o sindicato da
            categoria, a Defensoria Pública ou um advogado trabalhista podem analisar os documentos.
          </p>
        </>
      )}
    </section>
  );
}

function resumo(r: ResultadoDasHorasExtras, f: Formulario, c: ResultadoDaConferencia | null, endereco: string) {
  const linhas = [
    `Demonstrativo de horas extras (estimativa), ${MESES[Number(f.mes) - 1]} de ${f.ano}`,
    `Base: ${reais(r.base)} ÷ divisor ${r.divisor} = hora normal de ${reais(r.horaNormal)}`,
    ...r.linhas.map((l) => `${l.rotulo}: ${formatarHoras(l.minutos)} × ${reais(l.valorDaHora)} = ${reais(l.valor)}`),
    r.diasUteis !== null
      ? `DSR: ${reais(r.horasExtras)} ÷ ${r.diasUteis} dias úteis × ${r.repousos} domingos e feriados = ${reais(r.dsr)}`
      : "DSR: não incluído (horas extras não habituais)",
    `Total bruto: ${reais(r.total)}`,
    `Reflexos por mês (não somados): 13º ${reais(r.reflexos.decimoTerceiro)}; férias + 1/3 ${reais(r.reflexos.feriasComUmTerco)}; FGTS ${reais(r.reflexos.fgts)}`,
  ];
  if (c) linhas.push(`Holerite: pago ${reais(c.pago)}; calculado ${reais(c.calculado)}; diferença ${reais(c.diferenca)}`);
  linhas.push(
    `Regras revisadas em ${P.revisadoEm.split("-").reverse().join("/")}: CF art. 7º, XVI; CLT arts. 59 e 73; Lei 605/1949; Súmulas 172 e 264 e OJ 394 do TST. Convenção coletiva pode mudar o valor.`,
    `Calculado em ${endereco}`,
  );
  return linhas.join("\n");
}
