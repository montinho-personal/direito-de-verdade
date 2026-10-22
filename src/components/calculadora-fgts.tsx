"use client";

// Central do FGTS: depósito do mês, saldo acumulado, conferência dos depósitos, multa
// rescisória e saque. Os dados ficam só na tela: nada é enviado nem guardado.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { Campo } from "@/components/partes-da-calculadora";
import { registrarEvento } from "@/lib/analitico";
import { lerReais } from "@/lib/dinheiro";
import { FGTS_2026 as P, type Vinculo } from "@/lib/fgts/parametros.ts";
import type { ResultadoDoSaldo } from "@/lib/fgts/saldo.ts";
import { type Data, formatarData, lerData, paraTexto } from "@/lib/trabalhista/datas.ts";
import { type Contrato, hojeEmBrasilia, link, type Nivel, NOME_DO_VINCULO, Pilulas } from "./fgts/comum";
import { ModoConferencia } from "./fgts/modo-conferencia";
import { ModoDeposito } from "./fgts/modo-deposito";
import { ModoMulta } from "./fgts/modo-multa";
import { ModoSaldo } from "./fgts/modo-saldo";
import { ModoSaque } from "./fgts/modo-saque";

type Modo = "deposito" | "saldo" | "conferencia" | "multa" | "saque";

const MODOS = [
  { valor: "deposito", nome: "Depósito do mês" },
  { valor: "saldo", nome: "Saldo acumulado" },
  { valor: "conferencia", nome: "Conferir depósitos" },
  { valor: "multa", nome: "Multa rescisória" },
  { valor: "saque", nome: "Posso sacar?" },
] as const;

const PERGUNTA: Record<Modo, string> = {
  deposito: "Quanto a empresa deve depositar?",
  saldo: "Quanto eu deveria ter acumulado de FGTS?",
  conferencia: "Minha empresa está depositando meu FGTS corretamente?",
  multa: "Quanto vou receber de multa do FGTS?",
  saque: "Posso sacar meu FGTS?",
};

const VINCULOS = (Object.keys(NOME_DO_VINCULO) as Vinculo[]).map((v) => ({ valor: v, nome: NOME_DO_VINCULO[v] }));

// Data de referência até o navegador informar a de hoje (a página é gerada antes)
const DATA_DA_REVISAO = lerData(P.revisadoEm)!;
const revisao = formatarData(DATA_DA_REVISAO);
const nadaParaOuvir = () => () => {};

export function CalculadoraFgts({ nivelDoTitulo = 3 }: { nivelDoTitulo?: 2 | 3 }) {
  const id = useId();
  const Titulo = nivelDoTitulo === 2 ? "h2" : "h3";
  const Sub: Nivel = nivelDoTitulo === 2 ? "h3" : "h4";
  const endereco = `https://direitodeverdade.com.br${usePathname() ?? "/calculadoras/fgts"}`;
  const [modo, setModo] = useState<Modo>("deposito");
  const [vinculo, setVinculo] = useState<Vinculo>("clt");
  const [salario, setSalario] = useState("");
  const [admissao, setAdmissao] = useState("");
  // Hoje em Brasília no navegador; no HTML gerado antes, a data da revisão
  const hojeEmTexto = useSyncExternalStore(
    nadaParaOuvir,
    () => paraTexto(hojeEmBrasilia()),
    () => P.revisadoEm,
  );
  const hoje: Data = lerData(hojeEmTexto) ?? DATA_DA_REVISAO;
  const [estimativa, setEstimativa] = useState<{ r: ResultadoDoSaldo | null; fim: string; encerrado: boolean }>({
    r: null,
    fim: "",
    encerrado: false,
  });

  // Eventos do Analytics só com categorias fixas, nunca com valores digitados
  const registrados = useRef(new Set<string>());
  const registrar = (nome: string, parametros: Record<string, string> = {}) => {
    const chave = `${nome}:${JSON.stringify(parametros)}`;
    if (registrados.current.has(chave)) return;
    registrados.current.add(chave);
    registrarEvento(nome, parametros);
  };
  useEffect(() => {
    registrar("fgts_calculadora_view");
  }, []);

  const leitura = lerReais(salario);
  const dataDeAdmissao = admissao ? lerData(admissao) : null;
  const erroDaAdmissao =
    admissao && !dataDeAdmissao
      ? "Data inválida."
      : dataDeAdmissao && (dataDeAdmissao.ano < 1990 || dataDeAdmissao.ano > hoje.ano + 1)
        ? "Use uma data entre 1990 e o ano que vem."
        : undefined;
  const contrato: Contrato = {
    vinculo,
    salario: leitura.tipo === "valido" ? leitura.centavos : 0,
    admissao: dataDeAdmissao && !erroDaAdmissao ? admissao : "",
    hoje,
  };
  const primeiroAno = Math.min(dataDeAdmissao && !erroDaAdmissao ? dataDeAdmissao.ano : hoje.ano - 5, hoje.ano - 5);
  const anos = Array.from({ length: hoje.ano + 2 - primeiroAno }, (_, i) => primeiroAno + i);

  // Demonstrativo comum: período e números vêm de cada modalidade; aqui, data, regras e limites
  const resumoBase = (linhas: string[]) =>
    [
      ...linhas,
      `Simulação feita em ${formatarData(hoje)}. Estimativa, não é extrato oficial: o valor exato está no app FGTS.`,
      `Regras conferidas em ${revisao}: Lei 8.036/1990, LC 150/2015, CLT art. 484-A, FGTS Digital.`,
      `Calculado em ${endereco}`,
    ].join("\n");

  return (
    <section
      id="calculadora-de-fgts"
      aria-labelledby={`${id}-titulo`}
      data-track="artigo:ferramenta-inline"
      className="my-10 scroll-mt-6 rounded-2xl border border-border bg-surface p-6 sm:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">Calculadora</p>
      <Titulo id={`${id}-titulo`} className="mt-2 font-serif text-2xl leading-snug">
        Calcule o seu FGTS
      </Titulo>

      <div className="mt-6 space-y-4">
        <Pilulas nome={`${id}-vinculo`} legenda="Tipo de vínculo" valor={vinculo} opcoes={VINCULOS} aoMudar={setVinculo} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            id={`${id}-salario`}
            rotulo="Salário bruto mensal (R$)"
            exemplo="Ex.: 2.500,00"
            valor={salario}
            aoMudar={setSalario}
            erro={leitura.tipo === "invalido" ? leitura.mensagem : undefined}
            dica="O da carteira, sem descontos."
          />
          <Campo
            id={`${id}-admissao`}
            rotulo="Data de admissão"
            tipo="date"
            valor={admissao}
            aoMudar={setAdmissao}
            erro={erroDaAdmissao}
            dica="Para o saldo, a conferência e a multa."
          />
        </div>
      </div>

      <fieldset className="mt-6 print:hidden">
        <legend className="text-sm font-medium">O que você quer saber?</legend>
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
                checked={modo === item.valor}
                onChange={() => setModo(item.valor)}
                className="accent-[var(--accent)]"
              />
              {item.nome}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-6" aria-live="off">
        <Sub className="mb-4 font-serif text-xl">{PERGUNTA[modo]}</Sub>
        {modo === "deposito" && (
          <ModoDeposito
            idBase={id}
            contrato={contrato}
            competenciaInicial={{ ano: hoje.ano, mes: hoje.mes }}
            anos={anos}
            registrar={registrar}
            resumoBase={resumoBase}
          />
        )}
        {modo === "saldo" && (
          <ModoSaldo
            idBase={id}
            contrato={contrato}
            anos={anos}
            Sub="h4"
            registrar={registrar}
            resumoBase={resumoBase}
            aoCalcular={(r, fim, encerrado) => setEstimativa({ r, fim, encerrado })}
          />
        )}
        {modo === "conferencia" && (
          <ModoConferencia idBase={id} contrato={contrato} anos={anos} Sub="h4" registrar={registrar} resumoBase={resumoBase} />
        )}
        {modo === "multa" && <ModoMulta idBase={id} contrato={contrato} estimativa={estimativa} registrar={registrar} resumoBase={resumoBase} />}
        {modo === "saque" && <ModoSaque idBase={id} contrato={contrato} registrar={registrar} resumoBase={resumoBase} />}
      </div>

      <nav aria-label="Outras calculadoras" className="mt-6 rounded-xl border border-border bg-white px-4 py-4 text-sm leading-6 print:hidden">
        <p className="font-medium">Continue a conta</p>
        <ul className="mt-1 space-y-1">
          {[
            { href: "/calculadoras/rescisao", nome: "Calculadora de rescisão", texto: ": aviso, 13º, férias e a multa juntos." },
            { href: "/calculadoras/ferias", nome: "Calculadora de férias", texto: ": o 1/3 das férias também tem FGTS." },
            { href: "/calculadoras/13-salario", nome: "Calculadora do 13º salário", texto: ": as duas parcelas do ano." },
            { href: "/calculadoras/horas-extras", nome: "Calculadora de horas extras", texto: ": horas extras entram no FGTS do mês." },
          ].map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={link} onClick={() => registrar("fgts_link_relacionado", { destino: item.href })}>
                {item.nome}
              </Link>
              {item.texto}
            </li>
          ))}
        </ul>
      </nav>

      <p className="mt-4 text-xs leading-5 text-muted">
        Estimativa com as regras do FGTS conferidas em {revisao} (Lei 8.036/1990, LC 150/2015, CLT e FGTS Digital). Não é
        extrato: os valores oficiais estão no app FGTS. A conta é feita no seu navegador e nada do que você digita é
        enviado ou guardado.{" "}
        <Link href="/calculadoras/fgts#como-esta-calculadora-funciona" className={link}>
          Como esta calculadora funciona
        </Link>
      </p>
    </section>
  );
}
